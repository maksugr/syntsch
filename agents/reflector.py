import logging
import re
import statistics
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
        raise ValueError(
            f"No articles found for {language} in period {start_date} — {end_date}"
        )

    previous = storage.get_latest_reflection(language)

    analysis = _compute_analysis(articles, storage, start_date, end_date, previous)

    system_prompt = _load_reflector_prompt(language)
    user_message = _build_user_message(
        articles, analysis, start_date, end_date, language, previous
    )

    client = anthropic.Anthropic(max_retries=3)

    logger.info(
        "Writing reflection for %s (%d articles, %s — %s)",
        language,
        len(articles),
        start_date,
        end_date,
    )
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


def _compute_analysis(
    articles: list[dict],
    storage: EventStorage,
    start_date: str,
    end_date: str,
    previous: dict | None = None,
) -> dict:
    categories = Counter()
    venues = Counter()
    total_words = 0
    word_counts: list[int] = []

    for a in articles:
        event = a.get("event", {})
        cat = event.get("category", "unknown")
        categories[cat] += 1
        venue = event.get("venue", "")
        if venue:
            venues[venue] += 1
        wc = a.get("word_count", 0) or 0
        total_words += wc
        word_counts.append(wc)

    n = len(articles)
    avg_words = round(total_words / n) if n else 0

    days_in_period = max(
        1,
        (
            datetime.strptime(end_date, "%Y-%m-%d")
            - datetime.strptime(start_date, "%Y-%m-%d")
        ).days,
    )
    words_per_day = round(total_words / days_in_period, 1)

    median_words = int(statistics.median(word_counts)) if word_counts else 0

    sorted_by_wc = sorted(articles, key=lambda a: a.get("word_count", 0) or 0)
    longest = sorted_by_wc[-1] if sorted_by_wc else None
    shortest = sorted_by_wc[0] if sorted_by_wc else None

    longest_article = None
    if longest:
        longest_article = {
            "title": longest.get("title", ""),
            "slug": longest.get("slug", ""),
            "word_count": longest.get("word_count", 0) or 0,
        }

    shortest_article = None
    if shortest:
        shortest_article = {
            "title": shortest.get("title", ""),
            "slug": shortest.get("slug", ""),
            "word_count": shortest.get("word_count", 0) or 0,
        }

    dominant_category = None
    if categories:
        top_cat, top_count = categories.most_common(1)[0]
        dominant_category = {
            "name": top_cat,
            "count": top_count,
            "pct": round(top_count / n * 100) if n else 0,
        }

    missing_categories = [c for c in config.CATEGORIES if c not in categories]

    unique_venues_count = len(venues)
    venue_concentration = None
    if venues:
        top_venue, top_venue_count = venues.most_common(1)[0]
        venue_concentration = {
            "name": top_venue,
            "count": top_venue_count,
            "pct": round(top_venue_count / n * 100) if n else 0,
        }

    previous_comparison = None
    if previous and previous.get("analysis"):
        prev_a = previous["analysis"]
        prev_venues = set(prev_a.get("venues", {}).keys())
        curr_venues = set(venues.keys())
        prev_cats = prev_a.get("categories", {})
        category_shifts = {}
        all_cats = set(list(categories.keys()) + list(prev_cats.keys()))
        for cat in all_cats:
            delta = categories.get(cat, 0) - prev_cats.get(cat, 0)
            if delta != 0:
                category_shifts[cat] = delta
        previous_comparison = {
            "articles_delta": n - prev_a.get("article_count", 0),
            "words_delta": total_words - prev_a.get("total_words", 0),
            "new_venues": sorted(curr_venues - prev_venues),
            "lost_venues": sorted(prev_venues - curr_venues),
            "category_shifts": category_shifts,
        }

    process_stats = _compute_process_stats(articles, storage)

    result = {
        "article_count": n,
        "total_words": total_words,
        "avg_words": avg_words,
        "categories": dict(categories.most_common()),
        "venues": dict(venues.most_common(10)),
        "longest_article": longest_article,
        "shortest_article": shortest_article,
        "words_per_day": words_per_day,
        "median_words": median_words,
        "dominant_category": dominant_category,
        "missing_categories": missing_categories,
        "unique_venues_count": unique_venues_count,
        "venue_concentration": venue_concentration,
    }

    if previous_comparison:
        result["previous_comparison"] = previous_comparison
    if process_stats:
        result["process_stats"] = process_stats

    return result


def _compute_process_stats(articles: list[dict], storage: EventStorage) -> dict | None:
    issues_counts = []
    expanded_count = 0
    word_growths = []
    total_sources = 0
    traced = 0

    for a in articles:
        slug = a.get("slug", "")
        if not slug:
            continue
        trace = storage.get_trace(slug)
        if not trace:
            continue
        traced += 1
        critique_issues = trace.get("critique_issues", [])
        issues_counts.append(len(critique_issues))
        if trace.get("expanded"):
            expanded_count += 1
        draft_wc = trace.get("draft_word_count", 0)
        final_wc = a.get("word_count", 0) or 0
        if draft_wc and final_wc:
            word_growths.append(round((final_wc - draft_wc) / draft_wc * 100, 1))
        total_sources += trace.get("research_sources_count", 0)

    if not traced:
        return None

    return {
        "avg_critique_issues": round(statistics.mean(issues_counts), 1)
        if issues_counts
        else 0,
        "expanded_pct": round(expanded_count / traced * 100) if traced else 0,
        "avg_word_growth_pct": round(statistics.mean(word_growths), 1)
        if word_growths
        else 0,
        "total_research_sources": total_sources,
        "articles_with_traces": traced,
    }


def _load_reflector_prompt(language: str) -> str:
    prompt_path = config.PROMPTS_DIR / "reflector_system.md"
    template = prompt_path.read_text(encoding="utf-8")

    lang_notes = LANGUAGE_NOTES.get(language, LANGUAGE_NOTES["en"])
    lang_names = {"en": "English", "de": "German", "ru": "Russian"}
    lang_name = lang_names.get(language, "English")

    return template.replace("{language}", lang_name).replace(
        "{language_specific_notes}", lang_notes
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
        prev_period = (
            f"{previous.get('period_start', '?')} to {previous.get('period_end', '?')}"
        )
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
