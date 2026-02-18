import json
import logging
import os
from datetime import datetime

import anthropic

import config
from models import EventCandidate, ScoutResult
from sources.tavily_search import TavilyEventSource
from storage import EventStorage
from utils import extract_tool_input

logger = logging.getLogger(__name__)

SCOUT_PROMPT = """\
You are a cultural scout for a publication with the sensibility of i-D and Dazed magazines. \
Your audience is culturally literate, 20-35, interested in music, art, cinema, performance, \
club culture, and the intersection of subculture and mainstream. They live in {city}.

You will receive a list of raw event data scraped from the web. Your job is to:

1. Parse the raw data and identify distinct cultural events.

2. Select exactly 5 events that would each make a good subject for a long-form essay-review. \
Pick events that a Dazed editor would greenlight — things that have a story behind them, \
cultural weight, a reason to exist beyond entertainment.

Each event should be independently interesting. Do NOT rank them or compare them to each other. \
Just pick 5 solid candidates from different categories if possible.

Quality bar for inclusion:
- CULTURAL SIGNIFICANCE: Is there a real story here? A debut, a comeback, a collision of scenes, \
a political dimension, a generational moment?
- DEPTH POTENTIAL: Can a writer spend 1000 words on this without padding?
- TIMELINESS: Happening within the next 1-2 weeks. Prefer events that haven't happened yet.
- NON-OBVIOUSNESS: Skip the most predictable picks.

Category guidance — "theater" vs "performance":
- "theater" = a staged production with a script, director, and actors. Plays, opera, musical theater, \
dramatizations, premieres at venues like Schaubühne, Gorki, Deutsches Theater, Volksbühne, HAU. \
Even experimental or devised theater is still "theater" if the core is a dramatic work performed for an audience.
- "performance" = performance art, dance, live art, multimedia installations, happenings, \
spoken word, body-based work. The distinction: theater tells a story through characters; \
performance uses the body/space/time as material.
- When in doubt between the two, prefer "theater".

Source credibility — prefer events found on authoritative cultural platforms \
(e.g. Resident Advisor for club/music, nachtkritik.de for theater, artforum/monopol-magazin for exhibitions, \
tip-berlin/exberliner/zitty for general Berlin culture) over generic blogs or aggregators. \
Events from known venues and institutions carry more weight.

IMPORTANT:
- If an entry is clearly not a cultural event (news article, restaurant listing), skip it.
- If you can find fewer than 5 worthy events, return fewer. Never pad with weak picks.
- Do NOT include events that are clearly duplicates of each other.
- If the event has no single specific venue (e.g. "Various locations", city-wide), set venue to empty string.
{existing_pool_block}
Submit your selected events using the provided tool.

Raw event data:
{events_json}
"""

SCOUT_TOOL = {
    "name": "submit_events",
    "description": "Submit the selected cultural events",
    "input_schema": {
        "type": "object",
        "properties": {
            "events": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "start_date": {
                            "type": "string",
                            "description": "YYYY-MM-DD or approximate",
                        },
                        "end_date": {
                            "type": "string",
                            "description": "YYYY-MM-DD, same as start for single-day, empty if unknown",
                        },
                        "venue": {
                            "type": "string",
                            "description": "Empty string if non-specific",
                        },
                        "city": {"type": "string"},
                        "category": {
                            "type": "string",
                            "enum": [
                                "music",
                                "cinema",
                                "theater",
                                "exhibition",
                                "lecture",
                                "festival",
                                "performance",
                                "club",
                            ],
                        },
                        "description": {
                            "type": "string",
                            "description": "2-3 sentence description",
                        },
                        "source_url": {"type": "string"},
                        "event_url": {
                            "type": "string",
                            "description": "Official event page, empty if not found",
                        },
                    },
                    "required": [
                        "name",
                        "start_date",
                        "venue",
                        "city",
                        "category",
                        "description",
                        "source_url",
                    ],
                },
            }
        },
        "required": ["events"],
    },
}


async def scout_event(
    city: str | None = None,
    days_ahead: int | None = None,
) -> ScoutResult:
    city = city or config.CITY
    days_ahead = days_ahead or config.DAYS_AHEAD

    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    source = TavilyEventSource(api_key=tavily_key)
    storage = EventStorage(config.DATA_DIR)

    pool_categories = [
        ev.get("category", "")
        for ev in storage._load_all_events()
        if ev.get("category")
    ]
    candidates = await source.fetch_events(
        city, days_ahead, pool_categories=pool_categories
    )

    if not candidates:
        raise RuntimeError(f"No events found for {city}")

    filtered = [
        c
        for c in candidates
        if not storage.is_already_covered(c.name, c.venue, c.start_date)
        and not storage.event_exists(c.name)
    ]

    if not filtered:
        logger.warning(
            "All %d candidates already in pool, sending unfiltered", len(candidates)
        )
        filtered = candidates

    existing_names = storage.get_all_event_names()
    if existing_names:
        names_list = "\n".join(f"- {n}" for n in existing_names)
        existing_pool_block = (
            f"\nThese events are already in our pool — do NOT pick them again. "
            f"Find DIFFERENT events:\n{names_list}\n"
        )
    else:
        existing_pool_block = ""

    events_json = json.dumps(
        [c.model_dump() for c in filtered],
        indent=2,
        ensure_ascii=False,
    )

    prompt = SCOUT_PROMPT.format(
        city=city,
        events_json=events_json,
        existing_pool_block=existing_pool_block,
    )

    logger.info("Sending %d candidates to scout LLM", len(filtered))

    client = anthropic.Anthropic(max_retries=3)
    response = client.messages.create(
        model=config.SCOUT_MODEL,
        max_tokens=4096,
        tools=[SCOUT_TOOL],
        tool_choice={"type": "tool", "name": "submit_events"},
        messages=[{"role": "user", "content": prompt}],
    )

    tool_input = extract_tool_input(response, "submit_events")
    events = [EventCandidate(**e) for e in tool_input["events"]]

    logger.info("Scout selected %d events", len(events))

    return ScoutResult(
        events=events,
        searched_at=datetime.now(),
    )
