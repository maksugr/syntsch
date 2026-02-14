import json
import logging
from datetime import datetime

import anthropic

import config
from models import CuratorResult
from storage import EventStorage
from utils import extract_tool_input

logger = logging.getLogger(__name__)

CURATOR_PROMPT = """\
You are a cultural curator for a publication with the editorial sensibility of i-D and Dazed magazines. \
Your audience is culturally literate, 20-35, living in {city}.

Today is {today}. You have a pool of upcoming cultural events that haven't been written about yet. \
Your job is to pick THE ONE event that deserves an essay today.

The recent categories we've already covered: [{recent_categories}]. \
Try to pick something different if possible, but never sacrifice quality for diversity.

Selection criteria (ranked by importance):

1. CULTURAL SIGNIFICANCE: Is there a real story here? A debut, a comeback, a collision of scenes, \
a political dimension, a generational moment? The event should have DEPTH — something a writer \
can spend 1000 words exploring without padding.

2. TIMELINESS: Events happening sooner should generally be preferred. An event next week beats \
one in two weeks, all else being equal. But a truly remarkable event in two weeks beats a mediocre one tomorrow.

3. NON-OBVIOUSNESS: The sweet spot between obscure and mainstream. A residency by an interesting DJ \
at a small club beats a stadium concert by a megastar. A retrospective of an underappreciated filmmaker \
beats the latest blockbuster premiere.

4. ESSAY POTENTIAL: Think about what the essay would actually contain. Is there enough material \
(artist history, venue context, genre evolution, scene dynamics, cultural moment) to build a compelling narrative?

5. DIVERSITY: Vary the categories. If we've done music three days in a row, pick something else if the quality is comparable.

Submit your choice using the provided tool. Be specific in your reasoning.

Available events:
{events_json}
"""

CURATOR_TOOL = {
    "name": "choose_event",
    "description": "Select the best event for today's essay",
    "input_schema": {
        "type": "object",
        "properties": {
            "chosen_event_id": {"type": "string", "description": "The UUID of the chosen event"},
            "why_chosen": {"type": "string", "description": "2-3 sentences explaining the choice"},
        },
        "required": ["chosen_event_id", "why_chosen"],
    },
}


async def curate_event(city: str | None = None, languages: list[str] | None = None) -> CuratorResult:
    city = city or config.CITY
    storage = EventStorage(config.DATA_DIR)

    if languages:
        seen = set()
        available = []
        for lang in languages:
            for ev in storage.get_available_events(language=lang):
                if ev["id"] not in seen:
                    seen.add(ev["id"])
                    available.append(ev)
    else:
        available = storage.get_available_events()
    if not available:
        raise RuntimeError("No available events. Run 'scout' first.")

    recent_categories = storage.get_recent_categories(days=7)
    recent_str = ", ".join(recent_categories) if recent_categories else "none yet"

    events_for_prompt = []
    for row in available:
        events_for_prompt.append({
            "id": row["id"],
            "name": row["name"],
            "start_date": row["start_date"],
            "end_date": row["end_date"],
            "venue": row["venue"],
            "city": row["city"],
            "category": row["category"],
            "description": row["description"],
        })

    events_json = json.dumps(events_for_prompt, indent=2, ensure_ascii=False)

    prompt = CURATOR_PROMPT.format(
        city=city,
        today=datetime.now().strftime("%Y-%m-%d"),
        recent_categories=recent_str,
        events_json=events_json,
    )

    logger.info("Curating from %d available events (recent: %s)", len(available), recent_str)

    client = anthropic.AsyncAnthropic(max_retries=3)
    response = await client.messages.create(
        model=config.CURATOR_MODEL,
        max_tokens=1024,
        tools=[CURATOR_TOOL],
        tool_choice={"type": "tool", "name": "choose_event"},
        messages=[{"role": "user", "content": prompt}],
    )

    tool_input = extract_tool_input(response, "choose_event")

    chosen_id = tool_input["chosen_event_id"]
    row = storage.get_event(chosen_id)
    if not row:
        raise RuntimeError(f"Curator chose event #{chosen_id} but it doesn't exist in storage")

    logger.info("Curator chose: %s (%s)", row["name"], row["category"])

    return CuratorResult(
        chosen_event_id=chosen_id,
        why_chosen=tool_input["why_chosen"],
        curated_at=datetime.now(),
    )


