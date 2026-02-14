import logging
from datetime import datetime

import anthropic

import config
from models import EventCandidate, ArticleOutput, ResearchContext
from sources.research import research_event

logger = logging.getLogger(__name__)

LANGUAGE_NOTES = {
    "en": "Write in English. Use British English spelling (colour, centre, programme). The tone should feel like a London-based publication writing about Berlin — cosmopolitan, not provincial.",
    "de": "Schreibe auf Deutsch. Nicht steif oder bürokratisch — modernes, lebendiges Deutsch. Der Ton soll sich anfühlen wie ein junges, urbanes Magazin. Keine Behördensprache, kein Feuilleton-Deutsch. Eher wie Spex oder Groove auf Steroiden. ERINNERUNG: Eigennamen (Personen, Orte, Clubs, Galerien, Alben, Filme) immer exakt wie im Original belassen. Niemals eindeutschen oder anpassen.",
    "ru": "Пиши на русском. Живой, современный русский — не канцелярит, не переводческий язык. Тон как у лучших текстов Афиши или Сигмы. Можно использовать англицизмы там, где они органичны (сет, перформанс, саунд), но не злоупотреблять. НАПОМИНАНИЕ: имена людей, названия мест, клубов, галерей, альбомов, фильмов — ВСЕГДА латиницей как в оригинале. Никогда не транслитерируй. Пиши 'Ryoji Ikeda', а не 'Рёдзи Икэда'. Пиши 'Berghain', а не 'Бергхайн'.",
}

FEW_SHOT_PLACEHOLDER = "No example essays provided yet. Examples will be added here to anchor the style. For now, channel your inner Dazed/i-D writer."

CRITIC_TOOL = {
    "name": "submit_critique",
    "description": "Submit the editorial critique and revised essay",
    "input_schema": {
        "type": "object",
        "properties": {
            "overall_assessment": {"type": "string", "description": "One sentence: publishable, needs rework, or broken?"},
            "issues": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "type": {"type": "string", "enum": ["factual", "voice", "structure", "language", "depth"]},
                        "severity": {"type": "string", "enum": ["minor", "major", "critical"]},
                        "location": {"type": "string"},
                        "fix": {"type": "string"},
                    },
                    "required": ["type", "severity", "location", "fix"],
                },
            },
            "revised_text": {"type": "string", "description": "The full revised essay, complete and publishable"},
        },
        "required": ["overall_assessment", "issues", "revised_text"],
    },
}


async def write_article(
    event: EventCandidate,
    language: str | None = None,
    skip_research: bool = False,
    context: ResearchContext | None = None,
) -> ArticleOutput:
    language = language or config.ARTICLE_LANGUAGE

    if context is None:
        if skip_research:
            context = ResearchContext()
        else:
            context = await research_event(event)

    system_prompt = _load_author_prompt(language)
    user_message = _build_user_message(event, context)

    client = anthropic.Anthropic(max_retries=3)

    logger.info("Writing draft for '%s' [%s]", event.name, language)
    draft_response = client.messages.create(
        model=config.AUTHOR_MODEL,
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_message}],
    )
    draft = draft_response.content[0].text

    logger.info("Sending to critic (draft: %d words)", len(draft.split()))
    revised_text = _critique_and_revise(client, draft, event, context)

    title = _extract_title(revised_text)
    revised_text = _strip_title(revised_text)
    if title == "Untitled":
        title = _generate_title(client, event, revised_text, language)
    word_count = len(revised_text.split())

    if word_count < 400:
        logger.warning("Essay too short (%d words), requesting expansion", word_count)
        final_response = client.messages.create(
            model=config.AUTHOR_MODEL,
            max_tokens=4096,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": draft},
                {
                    "role": "user",
                    "content": "The essay is too short. Please expand it to 800-1200 words while maintaining the same voice and quality. Don't pad — add more depth, more context, more specific details.",
                },
            ],
        )
        revised_text = final_response.content[0].text
        word_count = len(revised_text.split())

    lead = _generate_lead(client, event, title, revised_text, language)

    logger.info("Article complete: '%s' (%d words)", title, word_count)

    return ArticleOutput(
        title=title,
        lead=lead,
        body=revised_text,
        event=event,
        language=language,
        word_count=word_count,
        model_used=config.AUTHOR_MODEL,
        generated_at=datetime.now(),
    )


def _critique_and_revise(
    client: anthropic.Anthropic,
    draft: str,
    event: EventCandidate,
    context: ResearchContext,
) -> str:
    critic_prompt = _load_critic_prompt()
    critic_message = _build_critic_message(draft, event, context)

    try:
        response = client.messages.create(
            model=config.CRITIC_MODEL,
            max_tokens=8192,
            system=critic_prompt,
            tools=[CRITIC_TOOL],
            tool_choice={"type": "tool", "name": "submit_critique"},
            messages=[{"role": "user", "content": critic_message}],
        )

        tool_input = _extract_tool_input(response, "submit_critique")

        issues = tool_input.get("issues", [])
        critical_count = sum(1 for i in issues if i.get("severity") == "critical")
        logger.info(
            "Critic: %s (%d issues, %d critical)",
            tool_input["overall_assessment"],
            len(issues),
            critical_count,
        )

        revised = tool_input["revised_text"]
        if len(revised) > 200:
            return revised

        logger.warning("Critic returned too-short revised_text (%d chars), using draft", len(revised))
        return draft

    except Exception as e:
        logger.error("Critic failed: %s — using original draft", e)
        return draft


def _build_critic_message(draft: str, event: EventCandidate, context: ResearchContext) -> str:
    parts = [
        "## Essay draft to review\n",
        draft,
        "\n\n## Source material for fact-checking\n",
        f"Event: {event.name}",
        f"Date: {event.start_date}",
        f"Venue: {event.venue}",
        f"City: {event.city}",
        f"Category: {event.category}",
        f"Description: {event.description}",
    ]

    if context.artist_background:
        parts.append(f"\nArtist background: {context.artist_background[:1000]}")
    if context.venue_context:
        parts.append(f"\nVenue context: {context.venue_context[:1000]}")
    if context.cultural_context:
        parts.append(f"\nCultural context: {context.cultural_context[:1000]}")

    return "\n".join(parts)


def _generate_lead(
    client: anthropic.Anthropic,
    event: EventCandidate,
    title: str,
    body: str,
    language: str,
) -> str:
    lang_names = {"en": "English", "de": "German", "ru": "Russian"}
    lang_name = lang_names.get(language, "English")

    response = client.messages.create(
        model=config.LEAD_MODEL,
        max_tokens=512,
        system=(
            "You write lede lines for a cultural publication with the voice of Dazed/i-D. "
            "A lede is 1-2 paragraphs that captures both the event and the mood of the essay. "
            "It goes on a card/preview, so it must hook the reader instantly.\n\n"
            "Rules:\n"
            "- 1-2 sentences.\n"
            "- Same language as the essay.\n"
            "- Never use: 'vibrant', 'iconic', 'legendary', 'must-see', 'unmissable', "
            "'breathtaking', 'innovative', 'thought-provoking', 'boundary-pushing', "
            "'compelling', 'remarkable', 'delve', 'tapestry', 'testament', 'realm'.\n"
            "- No exclamation marks.\n"
            "- No 'Whether you're...' or 'If you're looking for...' patterns.\n"
            "- Proper nouns stay in Latin script, always.\n"
            "- Return ONLY the lede text, nothing else."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Write a lede in {lang_name} for this essay.\n\n"
                    f"Event: {event.name} @ {event.venue}, {event.city}\n"
                    f"Category: {event.category}\n"
                    f"Date: {event.start_date}\n\n"
                    f"Title: {title}\n\n"
                    f"Essay:\n{body}"
                ),
            }
        ],
    )
    return response.content[0].text.strip()


def _generate_title(
    client: anthropic.Anthropic,
    event: EventCandidate,
    body: str,
    language: str,
) -> str:
    lang_names = {"en": "English", "de": "German", "ru": "Russian"}
    lang_name = lang_names.get(language, "English")

    response = client.messages.create(
        model=config.LEAD_MODEL,
        max_tokens=128,
        system=(
            "You write headlines for a cultural publication with the voice of Dazed/i-D. "
            "Rules:\n"
            "- One short, punchy headline. No subtitle.\n"
            "- Same language as the essay.\n"
            "- No quotes around the title.\n"
            "- No period at the end.\n"
            "- Proper nouns stay in Latin script, always.\n"
            "- Return ONLY the title text, nothing else."
        ),
        messages=[
            {
                "role": "user",
                "content": (
                    f"Write a title in {lang_name} for this essay.\n\n"
                    f"Event: {event.name} @ {event.venue}, {event.city}\n"
                    f"Category: {event.category}\n\n"
                    f"Essay:\n{body[:2000]}"
                ),
            }
        ],
    )
    return response.content[0].text.strip().strip('"').strip("'")


def _load_author_prompt(language: str) -> str:
    prompt_path = config.PROMPTS_DIR / "author_system.md"
    template = prompt_path.read_text(encoding="utf-8")

    lang_notes = LANGUAGE_NOTES.get(language, LANGUAGE_NOTES["en"])
    lang_names = {"en": "English", "de": "German", "ru": "Russian"}
    lang_name = lang_names.get(language, "English")

    return (
        template.replace("{language}", lang_name)
        .replace("{language_specific_notes}", lang_notes)
        .replace("{few_shot_placeholder}", FEW_SHOT_PLACEHOLDER)
    )


def _load_critic_prompt() -> str:
    prompt_path = config.PROMPTS_DIR / "critic_system.md"
    return prompt_path.read_text(encoding="utf-8")


def _build_user_message(event: EventCandidate, context: ResearchContext) -> str:
    parts = [
        "Write an essay about this upcoming cultural event.",
        "",
        "## Event details",
        f"Name: {event.name}",
        f"Starts: {event.start_date}",
    ]

    if event.end_date and event.end_date != event.start_date:
        parts.append(f"Ends: {event.end_date}")

    parts.extend([
        f"Venue: {event.venue}",
        f"City: {event.city}",
        f"Category: {event.category}",
        f"Description: {event.description}",
    ])

    if any(
        [
            context.artist_background,
            context.venue_context,
            context.cultural_context,
            context.related_works,
        ]
    ):
        parts.extend(
            [
                "",
                "## Research context (use as raw material, don't dump verbatim)",
            ]
        )
        if context.artist_background:
            parts.append(
                f"\n### Artist/creator background\n{context.artist_background}"
            )
        if context.venue_context:
            parts.append(f"\n### Venue context\n{context.venue_context}")
        if context.cultural_context:
            parts.append(f"\n### Cultural context\n{context.cultural_context}")
        if context.related_works:
            parts.append(f"\n### Related works and press\n{context.related_works}")

    return "\n".join(parts)


def _extract_tool_input(response, tool_name: str) -> dict:
    for block in response.content:
        if block.type == "tool_use" and block.name == tool_name:
            return block.input
    raise RuntimeError(f"LLM did not return expected tool call '{tool_name}'")


def _extract_title(text: str) -> str:
    lines = text.strip().split("\n")
    for line in lines[:5]:
        stripped = line.strip()
        if stripped.startswith("#"):
            return stripped.lstrip("#").strip()
        if stripped and len(stripped) < 120 and not stripped.endswith("."):
            return stripped
    return "Untitled"


def _strip_title(text: str) -> str:
    lines = text.strip().split("\n")
    for i, line in enumerate(lines[:5]):
        stripped = line.strip()
        if stripped.startswith("#"):
            rest = lines[i + 1 :]
            return "\n".join(rest).strip()
        if stripped and len(stripped) < 120 and not stripped.endswith("."):
            next_line = lines[i + 1].strip() if i + 1 < len(lines) else ""
            if not next_line:
                rest = lines[i + 2 :]
            else:
                rest = lines[i + 1 :]
            return "\n".join(rest).strip()
    return text.strip()
