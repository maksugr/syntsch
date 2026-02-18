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

import config  # noqa: E402
from agents.author import write_article  # noqa: E402
from agents.curator import curate_event  # noqa: E402
from agents.reflector import write_reflection  # noqa: E402
from agents.scout import scout_event  # noqa: E402
from models import EventCandidate, ResearchContext  # noqa: E402
from sources.research import research_event  # noqa: E402
from notifiers.telegram import send_article_to_telegram  # noqa: E402
from notifiers.email import send_article_email  # noqa: E402
from storage import EventStorage  # noqa: E402

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

    print(
        f"\nFound {len(result.events)} events ({new_count} new, {len(result.events) - new_count} already in pool):"
    )

    for (eid, was_existing), event in zip(event_ids, result.events):
        tag = " (existing)" if was_existing else ""
        print(
            f"  [{event.category}] {event.name} @ {event.venue} ({event.start_date}){tag}"
        )

    print(f"\nSaved {new_count} new events to data/events/")


async def cmd_curate(args):
    print("Curating best event for today...")

    storage = _get_storage()

    available = storage.get_available_events()

    print(f"Available events in pool: {len(available)}")

    if not available:
        print("No available events. Run 'scout' first.", file=sys.stderr)
        sys.exit(1)

    result = await curate_event(city=args.city)

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
        print(
            f'  [{lang}] "{article.title}" ({article.word_count} words) → #{article_id}'
        )

        if lang == "ru" and config.TELEGRAM_BOT_TOKEN:
            await send_article_to_telegram(article.title, article.lead, slug)

        if config.RESEND_API_KEY:
            await send_article_email(
                title=article.title,
                lead=article.lead,
                slug=slug,
                language=lang,
                category=event.category,
                venue=event.venue,
                start_date=event.start_date,
            )


async def cmd_author(args):
    storage = _get_storage()
    languages = args.language

    if args.from_curator:
        result = await curate_event(city=config.CITY, languages=languages)

        event_id = result.chosen_event_id

        row = storage.get_event(event_id)
        event = storage.event_to_candidate(row)

        print(f"Curator chose: {event.name}")
        print(f"Why: {result.why_chosen}")
        print(f"Languages: {', '.join(languages)}\n")

        await _write_for_languages(
            storage, event_id, event, languages, args.skip_research
        )

    elif args.event_id:
        event_id = args.event_id
        row = storage.get_event(event_id)

        if not row:
            print(f"Event #{event_id} not found.", file=sys.stderr)
            sys.exit(1)

        event = storage.event_to_candidate(row)

        print(f"Event: {event.name}")
        print(f"Languages: {', '.join(languages)}\n")

        await _write_for_languages(
            storage, event_id, event, languages, args.skip_research
        )

    else:
        data = json.loads(Path(args.event).read_text(encoding="utf-8"))
        event = EventCandidate(**data)

        event_id = storage.save_event(event)

        print(f"Event: {event.name} (saved as #{event_id})")
        print(f"Languages: {', '.join(languages)}\n")

        await _write_for_languages(
            storage, event_id, event, languages, args.skip_research
        )


async def cmd_reflect(args):
    storage = _get_storage()
    languages = args.language

    for lang in languages:
        print(f"Writing reflection for [{lang}] (last {args.days} days)...")
        try:
            reflection = await write_reflection(storage, lang, days_back=args.days)
            reflection_id, slug = storage.save_reflection(reflection)
            print(
                f'  [{lang}] "{reflection.title}" ({reflection.word_count} words) → {slug}'
            )
        except ValueError as e:
            print(f"  [{lang}] Skipped: {e}")


async def cmd_notify(args):
    import httpx

    storage = _get_storage()
    slugs = args.slugs

    articles = []
    for slug in slugs:
        path = storage.articles_dir / f"{slug}.json"
        if not path.exists():
            print(f"Article not found: {slug}", file=sys.stderr)
            continue
        articles.append(json.loads(path.read_text(encoding="utf-8")))

    if not articles:
        print("No articles to notify about.", file=sys.stderr)
        sys.exit(1)

    if args.wait:
        print(f"Waiting for deploy (polling URLs, timeout {args.timeout}s)...")
        url = f"{config.SITE_URL}/{articles[0]['language']}/article/{articles[0]['slug']}/"
        async with httpx.AsyncClient() as client:
            for i in range(args.timeout // 5):
                try:
                    resp = await client.get(url, follow_redirects=True)
                    if resp.status_code == 200:
                        print(f"  Deploy live after ~{i * 5}s")
                        break
                except httpx.RequestError:
                    pass
                await asyncio.sleep(5)
            else:
                print(f"  Timeout after {args.timeout}s, sending anyway")

    for article in articles:
        lang = article["language"]
        event = article.get("event", {})

        if lang == "ru" and config.TELEGRAM_BOT_TOKEN:
            await send_article_to_telegram(
                article["title"], article["lead"], article["slug"]
            )
            print(f"  [{lang}] Telegram sent")

        if config.RESEND_API_KEY:
            await send_article_email(
                title=article["title"],
                lead=article["lead"],
                slug=article["slug"],
                language=lang,
                category=event.get("category", ""),
                venue=event.get("venue", ""),
                start_date=event.get("start_date", ""),
            )
            print(f"  [{lang}] Email sent")


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

    print("\n=== CURATOR: selecting best event ===")

    curator_result = await curate_event(city=args.city, languages=languages)

    event_id = curator_result.chosen_event_id

    row = storage.get_event(event_id)
    event = storage.event_to_candidate(row)

    print(f"Chosen: {event.name} @ {event.venue}")
    print(f"Why: {curator_result.why_chosen}")

    print(f"\n=== AUTHOR: writing in {', '.join(languages)} ===")

    await _write_for_languages(storage, event_id, event, languages)

    print("\nDone.")


def main():
    parser = argparse.ArgumentParser(description="syntsch — autonomous cultural digest")
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
        "--language",
        nargs="+",
        default=ALL_LANGUAGES,
        choices=ALL_LANGUAGES,
        help="Languages to write (default: all)",
    )
    p_author.add_argument("--skip-research", action="store_true")

    p_reflect = sub.add_parser("reflect", help="Write a reflection on recent coverage")
    p_reflect.add_argument("--days", type=int, default=7)
    p_reflect.add_argument(
        "--language",
        nargs="+",
        default=ALL_LANGUAGES,
        choices=ALL_LANGUAGES,
    )

    p_notify = sub.add_parser(
        "notify", help="Send notifications for published articles"
    )
    p_notify.add_argument("slugs", nargs="+", help="Article slugs to notify about")
    p_notify.add_argument(
        "--wait", action="store_true", help="Poll URL until deploy is live"
    )
    p_notify.add_argument(
        "--timeout", type=int, default=300, help="Max seconds to wait for deploy"
    )

    p_pipeline = sub.add_parser(
        "pipeline", help="Full pipeline: scout → curate → author"
    )
    p_pipeline.add_argument("--city", default=config.CITY)
    p_pipeline.add_argument("--days", type=int, default=config.DAYS_AHEAD)
    p_pipeline.add_argument(
        "--language",
        nargs="+",
        default=ALL_LANGUAGES,
        choices=ALL_LANGUAGES,
        help="Languages to write (default: all)",
    )

    args = parser.parse_args()

    handlers = {
        "scout": lambda a: asyncio.run(cmd_scout(a)),
        "curate": lambda a: asyncio.run(cmd_curate(a)),
        "author": lambda a: asyncio.run(cmd_author(a)),
        "reflect": lambda a: asyncio.run(cmd_reflect(a)),
        "notify": lambda a: asyncio.run(cmd_notify(a)),
        "pipeline": lambda a: asyncio.run(cmd_pipeline(a)),
    }

    try:
        handlers[args.command](args)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
