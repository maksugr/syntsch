import argparse
import asyncio
import json
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

import config
from agents.author import write_essay
from agents.curator import curate_event
from agents.scout import scout_event
from models import EventCandidate
from storage import EventStorage


def _save_json(path: Path, data: dict):
    path.parent.mkdir(parents=True, exist_ok=True)

    path.write_text(
        json.dumps(data, indent=2, ensure_ascii=False, default=str),
        encoding="utf-8",
    )


def _timestamp() -> str:
    return datetime.now().strftime("%Y-%m-%d_%H%M%S")


def _get_storage() -> EventStorage:
    return EventStorage(config.DB_PATH)


async def cmd_scout(args):
    print(f"Scouting events in {args.city} for the next {args.days} days...")

    result = await scout_event(
        city=args.city,
        days_ahead=args.days,
    )

    storage = _get_storage()

    event_ids = []
    for event in result.events:
        eid = storage.save_event(event)
        event_ids.append(eid)

    print(f"\nFound {len(result.events)} events:")

    for eid, event in zip(event_ids, result.events):
        print(
            f"  #{eid} [{event.category}] {event.name} @ {event.venue} ({event.start_date})"
        )

    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = config.OUTPUT_DIR / f"scout_{_timestamp()}.json"

    _save_json(out_path, result.model_dump())

    print(f"\nSaved {len(event_ids)} events to DB and {out_path}")


def cmd_curate(args):
    print(f"Curating best event for today...")

    storage = _get_storage()

    available = storage.get_available_events(language=getattr(args, "language", ""))

    print(f"Available events in pool: {len(available)}")

    if not available:
        print("No available events. Run 'scout' first.", file=sys.stderr)
        sys.exit(1)

    result = curate_event(city=args.city, language=getattr(args, "language", ""))

    row = storage.get_event(result.chosen_event_id)

    print(f"\nChosen (event #{result.chosen_event_id}): {row['name']}")
    print(f"Category: {row['category']}")
    print(f"Venue: {row['venue']}")
    print(
        f"Date: {row['start_date']}{(' — ' + row['end_date']) if row['end_date'] and row['end_date'] != row['start_date'] else ''}"
    )
    print(f"\nWhy: {result.why_chosen}")


async def cmd_author(args):
    storage = _get_storage()

    if args.from_curator:
        available = storage.get_available_events(language=args.language)

        if not available:
            print("No available events. Run 'scout' first.", file=sys.stderr)
            sys.exit(1)

        result = curate_event(city=config.CITY, language=args.language)

        event_id = result.chosen_event_id

        print(f"Curator chose event #{event_id}: {result.why_chosen}\n")
    elif args.event_id:
        event_id = args.event_id
        row = storage.get_event(event_id)

        if not row:
            print(f"Event #{event_id} not found in DB.", file=sys.stderr)
            sys.exit(1)
    else:
        data = json.loads(Path(args.event).read_text(encoding="utf-8"))
        event = EventCandidate(**data)

        event_id = storage.save_event(event)

    row = storage.get_event(event_id)
    event = storage.event_to_candidate(row)

    print(f"Writing essay about (event #{event_id}): {event.name}")
    print(f"Language: {args.language}")
    print(f"Research: {'skipped' if args.skip_research else 'enabled'}")
    print()

    essay = await write_essay(
        event=event,
        language=args.language,
        skip_research=args.skip_research,
    )

    essay_db_id = storage.save_essay(event_id, essay)

    print(essay.body)
    print(f"\n---\nTitle: {essay.title}")
    print(f"Lead: {essay.lead}")
    print(f"Words: {essay.word_count}")
    print(f"Model: {essay.model_used}")

    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    ts = _timestamp()
    city = event.city.lower()
    lang = args.language

    essay_path = config.OUTPUT_DIR / f"essay_{city}_{lang}_{ts}.md"
    essay_path.write_text(essay.body, encoding="utf-8")

    _save_json(
        config.OUTPUT_DIR / f"essay_{city}_{lang}_{ts}_meta.json",
        essay.model_dump(),
    )

    print(f"\nSaved to DB (essay #{essay_db_id}) and {essay_path}")


async def cmd_pipeline(args):
    storage = _get_storage()

    print(f"=== SCOUT: {args.city}, {args.days} days ===")

    scout_result = await scout_event(
        city=args.city,
        days_ahead=args.days,
    )

    event_ids = []
    for event in scout_result.events:
        eid = storage.save_event(event)
        event_ids.append(eid)

    print(f"Scouted {len(event_ids)} events")

    print(f"\n=== CURATOR: selecting best event ===")

    curator_result = curate_event(city=args.city, language=args.language)

    event_id = curator_result.chosen_event_id

    row = storage.get_event(event_id)
    event = storage.event_to_candidate(row)

    print(f"Chosen (event #{event_id}): {event.name} @ {event.venue}")
    print(f"Why: {curator_result.why_chosen}")

    config.OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    _save_json(
        config.OUTPUT_DIR / f"scout_{_timestamp()}.json",
        scout_result.model_dump(),
    )

    print(f"\n=== AUTHOR: writing essay in {args.language} ===")

    essay = await write_essay(event=event, language=args.language)

    essay_db_id = storage.save_essay(event_id, essay)

    print(f"\n{essay.body}")
    print(f"\n---")
    print(f"Title: {essay.title}")
    print(f"Lead: {essay.lead}")
    print(f"Words: {essay.word_count}")

    ts = _timestamp()
    city = args.city.lower()
    lang = args.language
    essay_path = config.OUTPUT_DIR / f"essay_{city}_{lang}_{ts}.md"
    essay_path.write_text(essay.body, encoding="utf-8")

    _save_json(
        config.OUTPUT_DIR / f"essay_{city}_{lang}_{ts}_meta.json",
        essay.model_dump(),
    )

    print(f"\nSaved to DB (event #{event_id}, essay #{essay_db_id}) and {essay_path}")


def main():
    parser = argparse.ArgumentParser(description="ptytsch — autonomous cultural digest")
    sub = parser.add_subparsers(dest="command", required=True)

    p_scout = sub.add_parser("scout", help="Find cultural events and save to DB")
    p_scout.add_argument("--city", default=config.CITY)
    p_scout.add_argument("--days", type=int, default=config.DAYS_AHEAD)

    p_curate = sub.add_parser("curate", help="Pick the best event from the pool")
    p_curate.add_argument("--city", default=config.CITY)

    p_author = sub.add_parser("author", help="Write an essay about an event")
    source = p_author.add_mutually_exclusive_group(required=True)
    source.add_argument(
        "--from-curator", action="store_true", help="Let curator pick from DB"
    )
    source.add_argument("--event-id", help="Event ID from DB")
    source.add_argument("--event", type=str, help="Path to event JSON file")
    p_author.add_argument(
        "--language", default=config.ESSAY_LANGUAGE, choices=["en", "de", "ru"]
    )
    p_author.add_argument("--skip-research", action="store_true")

    p_pipeline = sub.add_parser(
        "pipeline", help="Full pipeline: scout → curate → author"
    )
    p_pipeline.add_argument("--city", default=config.CITY)
    p_pipeline.add_argument("--days", type=int, default=config.DAYS_AHEAD)
    p_pipeline.add_argument(
        "--language", default=config.ESSAY_LANGUAGE, choices=["en", "de", "ru"]
    )

    args = parser.parse_args()

    handlers = {
        "scout": lambda a: asyncio.run(cmd_scout(a)),
        "curate": lambda a: cmd_curate(a),
        "author": lambda a: asyncio.run(cmd_author(a)),
        "pipeline": lambda a: asyncio.run(cmd_pipeline(a)),
    }

    try:
        handlers[args.command](args)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
