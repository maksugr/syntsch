import argparse
import asyncio
import json
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

import config
from agents.author import write_article
from agents.curator import curate_event
from agents.scout import scout_event
from models import EventCandidate, ResearchContext
from sources.research import research_event
from notifiers.telegram import send_article_to_telegram
from storage import EventStorage

ALL_LANGUAGES = ["en", "de", "ru"]


def _get_storage() -> EventStorage:
    return EventStorage(config.DATA_DIR)


async def cmd_scout(args):
    print(f"Scouting events in {args.city} for the next {args.days} days...")

    result = await scout_event(
        city=args.city,
        days_ahead=args.days,
    )

    storage = _get_storage()

    new_count = 0
    event_ids = []
    for event in result.events:
        existed = storage.find_existing_event(event.name, event.venue, event.start_date)
        eid = storage.save_event(event)
        event_ids.append((eid, existed is not None))
        if existed is None:
            new_count += 1

    print(f"\nFound {len(result.events)} events ({new_count} new, {len(result.events) - new_count} already in pool):")

    for (eid, was_existing), event in zip(event_ids, result.events):
        tag = " (existing)" if was_existing else ""
        print(
            f"  [{event.category}] {event.name} @ {event.venue} ({event.start_date}){tag}"
        )

    print(f"\nSaved {new_count} new events to data/events/")


def cmd_curate(args):
    print(f"Curating best event for today...")

    storage = _get_storage()

    available = storage.get_available_events()

    print(f"Available events in pool: {len(available)}")

    if not available:
        print("No available events. Run 'scout' first.", file=sys.stderr)
        sys.exit(1)

    result = curate_event(city=args.city)

    row = storage.get_event(result.chosen_event_id)

    print(f"\nChosen (event #{result.chosen_event_id}): {row['name']}")
    print(f"Category: {row['category']}")
    print(f"Venue: {row['venue']}")
    print(
        f"Date: {row['start_date']}{(' — ' + row['end_date']) if row['end_date'] and row['end_date'] != row['start_date'] else ''}"
    )
    print(f"\nWhy: {result.why_chosen}")


async def _write_for_languages(
    storage: EventStorage,
    event_id: str,
    event: EventCandidate,
    languages: list[str],
    skip_research: bool = False,
):
    """Research once, then write articles for each language that doesn't exist yet."""
    if skip_research:
        context = ResearchContext()
    else:
        print("Researching event...")
        context = await research_event(event)

    for lang in languages:
        if storage.has_article_in_language(event_id, lang):
            print(f"  [{lang}] Already exists, skipping")
            continue

        print(f"  [{lang}] Writing article...")
        article = await write_article(
            event=event,
            language=lang,
            context=context,
        )
        article_id, slug = storage.save_article(event_id, article)
        print(f"  [{lang}] \"{article.title}\" ({article.word_count} words) → #{article_id}")

        if lang == "ru" and config.TELEGRAM_BOT_TOKEN:
            await send_article_to_telegram(article.title, article.lead, slug)


async def cmd_author(args):
    storage = _get_storage()
    languages = args.language

    if args.from_curator:
        result = curate_event(city=config.CITY, languages=languages)

        event_id = result.chosen_event_id

        row = storage.get_event(event_id)
        event = storage.event_to_candidate(row)

        print(f"Curator chose: {event.name}")
        print(f"Why: {result.why_chosen}")
        print(f"Languages: {', '.join(languages)}\n")

        await _write_for_languages(storage, event_id, event, languages, args.skip_research)

    elif args.event_id:
        event_id = args.event_id
        row = storage.get_event(event_id)

        if not row:
            print(f"Event #{event_id} not found.", file=sys.stderr)
            sys.exit(1)

        event = storage.event_to_candidate(row)

        print(f"Event: {event.name}")
        print(f"Languages: {', '.join(languages)}\n")

        await _write_for_languages(storage, event_id, event, languages, args.skip_research)

    else:
        data = json.loads(Path(args.event).read_text(encoding="utf-8"))
        event = EventCandidate(**data)

        event_id = storage.save_event(event)

        print(f"Event: {event.name} (saved as #{event_id})")
        print(f"Languages: {', '.join(languages)}\n")

        await _write_for_languages(storage, event_id, event, languages, args.skip_research)


async def cmd_pipeline(args):
    storage = _get_storage()
    languages = args.language

    print(f"=== SCOUT: {args.city}, {args.days} days ===")

    scout_result = await scout_event(
        city=args.city,
        days_ahead=args.days,
    )

    new_count = 0
    for event in scout_result.events:
        existed = storage.find_existing_event(event.name, event.venue, event.start_date)
        storage.save_event(event)
        if existed is None:
            new_count += 1

    print(f"Scouted {len(scout_result.events)} events ({new_count} new)")

    print(f"\n=== CURATOR: selecting best event ===")

    curator_result = curate_event(city=args.city, languages=languages)

    event_id = curator_result.chosen_event_id

    row = storage.get_event(event_id)
    event = storage.event_to_candidate(row)

    print(f"Chosen: {event.name} @ {event.venue}")
    print(f"Why: {curator_result.why_chosen}")

    print(f"\n=== AUTHOR: writing in {', '.join(languages)} ===")

    await _write_for_languages(storage, event_id, event, languages)

    print(f"\nDone.")


def main():
    parser = argparse.ArgumentParser(description="ptytsch — autonomous cultural digest")
    sub = parser.add_subparsers(dest="command", required=True)

    p_scout = sub.add_parser("scout", help="Find cultural events")
    p_scout.add_argument("--city", default=config.CITY)
    p_scout.add_argument("--days", type=int, default=config.DAYS_AHEAD)

    p_curate = sub.add_parser("curate", help="Pick the best event from the pool")
    p_curate.add_argument("--city", default=config.CITY)

    p_author = sub.add_parser("author", help="Write articles about an event")
    source = p_author.add_mutually_exclusive_group(required=True)
    source.add_argument(
        "--from-curator", action="store_true", help="Let curator pick from pool"
    )
    source.add_argument("--event-id", help="Event ID")
    source.add_argument("--event", type=str, help="Path to event JSON file")
    p_author.add_argument(
        "--language", nargs="+", default=ALL_LANGUAGES, choices=ALL_LANGUAGES,
        help="Languages to write (default: all)",
    )
    p_author.add_argument("--skip-research", action="store_true")

    p_pipeline = sub.add_parser(
        "pipeline", help="Full pipeline: scout → curate → author"
    )
    p_pipeline.add_argument("--city", default=config.CITY)
    p_pipeline.add_argument("--days", type=int, default=config.DAYS_AHEAD)
    p_pipeline.add_argument(
        "--language", nargs="+", default=ALL_LANGUAGES, choices=ALL_LANGUAGES,
        help="Languages to write (default: all)",
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
