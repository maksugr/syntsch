import logging
import re
from collections import Counter
from datetime import datetime, timedelta

import anthropic

import config
from models import ReflectionOutput
from storage import EventStorage

logger = logging.getLogger(__name__)

LANGUAGE_NOTES = {
    "en": "Write in English. Use British English spelling (colour, centre, programme).",
    "de": "Schreibe auf Deutsch. Modernes, lebendiges Deutsch. Eigennamen immer exakt wie im Original belassen.",
    "ru": "Пиши на русском. Живой, современный русский. Имена, названия мест, клубов — ВСЕГДА латиницей как в оригинале.",
}


async def write_reflection(
    storage: EventStorage,
    language: str,
    days_back: int = 7,
) -> ReflectionOutput:
    end_date = datetime.now().strftime("%Y-%m-%d")
    start_date = (datetime.now() - timedelta(days=days_back)).strftime("%Y-%m-%d")

    articles = storage.get_articles_in_period(start_date, end_date, language)

    if not articles:
        raise ValueError(f"No articles found for {language} in period {start_date} — {end_date}")

    analysis = _compute_analysis(articles)

    previous = storage.get_latest_reflection(language)

    system_prompt = _load_reflector_prompt(language)
    user_message = _build_user_message(articles, analysis, start_date, end_date, language, previous)

    client = anthropic.Anthropic(max_retries=3)

    logger.info("Writing reflection for %s (%d articles, %s — %s)", language, len(articles), start_date, end_date)
    body_response = client.messages.create(
        model=config.AUTHOR_MODEL,
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    body = _strip_leading_heading(body_response.content[0].text)

    title = _generate_title(client, body, language, start_date, end_date)

    word_count = len(body.split())
    logger.info("Reflection complete: '%s' (%d words)", title, word_count)

    return ReflectionOutput(
        title=title,
        body=body,
        language=language,
        period_start=start_date,
        period_end=end_date,
        analysis=analysis,
        word_count=word_count,
        model_used=config.AUTHOR_MODEL,
        generated_at=datetime.now(),
    )


def _compute_analysis(articles: list[dict]) -> dict:
    categories = Counter()
    venues = Counter()
    total_words = 0

    for a in articles:
        event = a.get("event", {})
        cat = event.get("category", "unknown")
        categories[cat] += 1
        venue = event.get("venue", "")
        if venue:
            venues[venue] += 1
        total_words += a.get("word_count", 0) or 0

    return {
        "article_count": len(articles),
        "total_words": total_words,
        "avg_words": round(total_words / len(articles)) if articles else 0,
        "categories": dict(categories.most_common()),
        "venues": dict(venues.most_common(10)),
    }


def _load_reflector_prompt(language: str) -> str:
    prompt_path = config.PROMPTS_DIR / "reflector_system.md"
    template = prompt_path.read_text(encoding="utf-8")

    lang_notes = LANGUAGE_NOTES.get(language, LANGUAGE_NOTES["en"])
    lang_names = {"en": "English", "de": "German", "ru": "Russian"}
    lang_name = lang_names.get(language, "English")

    return (
        template.replace("{language}", lang_name)
        .replace("{language_specific_notes}", lang_notes)
    )


def _build_user_message(
    articles: list[dict],
    analysis: dict,
    start_date: str,
    end_date: str,
    language: str,
    previous: dict | None = None,
) -> str:
    parts = [
        f"Analyze your output for the period {start_date} to {end_date}.",
        "",
        "## Statistics",
        f"Articles written: {analysis['article_count']}",
        f"Total words: {analysis['total_words']}",
        f"Average words per article: {analysis['avg_words']}",
        "",
        "### Category breakdown",
    ]

    for cat, count in analysis["categories"].items():
        parts.append(f"  {cat}: {count}")

    parts.append("")
    parts.append("### Top venues")
    for venue, count in analysis["venues"].items():
        parts.append(f"  {venue}: {count}")

    parts.append("")
    parts.append("## Articles written")
    parts.append("")

    for a in articles:
        event = a.get("event", {})
        parts.append(f"### {a.get('title', 'Untitled')}")
        parts.append(f"Event: {event.get('name', '')} @ {event.get('venue', '')}")
        parts.append(f"Category: {event.get('category', '')}")
        parts.append(f"Date: {event.get('start_date', '')}")
        lead = a.get("lead", "")
        if lead:
            parts.append(f"Lead: {lead}")
        body = a.get("body", "")
        parts.append(f"Opening: {body[:500]}")
        parts.append("")

    if previous:
        prev_period = f"{previous.get('period_start', '?')} to {previous.get('period_end', '?')}"
        parts.append("## Your previous reflection")
        parts.append(f"Period: {prev_period}")
        parts.append(f"Title: {previous.get('title', '')}")
        parts.append("")
        parts.append(previous.get("body", "")[:2000])
        parts.append("")

    return "\n".join(parts)


def _strip_leading_heading(text: str) -> str:
    return re.sub(r"^#{1,3}\s+.+\n+", "", text.lstrip())


def _generate_title(
    client: anthropic.Anthropic,
    body: str,
    language: str,
    start_date: str,
    end_date: str,
) -> str:
    lang_names = {"en": "English", "de": "German", "ru": "Russian"}
    lang_name = lang_names.get(language, "English")

    response = client.messages.create(
        model=config.LEAD_MODEL,
        max_tokens=128,
        system=(
            "You write headlines for SYNTSCH, an AI-native cultural publication. "
            "This is a self-reflection essay where the AI examines its own coverage. "
            "Rules:\n"
            "- One short, punchy headline. No subtitle.\n"
            "- Same language as the essay.\n"
            "- No quotes around the title.\n"
            "- No period at the end.\n"
            "- Return ONLY the title text, nothing else."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Write a title in {lang_name} for this self-reflection essay "
                    f"covering the period {start_date} to {end_date}.\n\n"
                    f"Essay:\n{body[:2000]}"
                ),
            }
        ],
    )
    return response.content[0].text.strip().strip('"').strip("'")
