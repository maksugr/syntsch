import json
from datetime import datetime

import anthropic

import config
from models import CuratorResult
from storage import EventStorage

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

Return your choice as JSON:
{{
    "chosen_event_id": <the id number of your chosen event>,
    "why_chosen": "2-3 sentences explaining why this is the best pick for today's essay. Be specific."
}}

Available events:
{events_json}
"""


def curate_event(city: str | None = None, language: str = "") -> CuratorResult:
    city = city or config.CITY
    storage = EventStorage(config.DB_PATH)

    available = storage.get_available_events(language=language)
    if not available:
        raise RuntimeError("No available events in DB. Run 'scout' first.")

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

    client = anthropic.Anthropic()
    response = client.messages.create(
        model=config.CURATOR_MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw_text = response.content[0].text
    start = raw_text.find("{")
    end = raw_text.rfind("}") + 1
    parsed = json.loads(raw_text[start:end])

    chosen_id = parsed["chosen_event_id"]
    row = storage.get_event(chosen_id)
    if not row:
        raise RuntimeError(f"Curator chose event #{chosen_id} but it doesn't exist in DB")

    return CuratorResult(
        chosen_event_id=chosen_id,
        why_chosen=parsed["why_chosen"],
        curated_at=datetime.now(),
    )
