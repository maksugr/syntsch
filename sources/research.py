import os

from tavily import AsyncTavilyClient

from models import EventCandidate, ResearchContext


async def research_event(event: EventCandidate) -> ResearchContext:
    api_key = os.environ.get("TAVILY_API_KEY", "")
    if not api_key:
        return ResearchContext()

    client = AsyncTavilyClient(api_key=api_key)

    queries = _build_queries(event)
    results = {}
    raw_sources = []

    for field, query in queries.items():
        try:
            response = await client.search(
                query=query,
                max_results=5,
                search_depth="advanced",
                include_raw_content=False,
            )
            snippets = [r.get("content", "") for r in response.get("results", [])]
            urls = [r.get("url", "") for r in response.get("results", [])]
            results[field] = "\n\n".join(snippets[:3])
            raw_sources.extend(urls)
        except Exception:
            results[field] = ""

    return ResearchContext(
        artist_background=results.get("artist", ""),
        venue_context=results.get("venue", ""),
        cultural_context=results.get("cultural", ""),
        related_works=results.get("related", ""),
        raw_sources=[s for s in raw_sources if s],
    )


def _build_queries(event: EventCandidate) -> dict[str, str]:
    name_parts = event.name.split(" — ") if " — " in event.name else [event.name]
    artist_name = name_parts[0].strip()

    queries = {
        "artist": f"{artist_name} artist biography background career",
        "venue": f"{event.venue} {event.city} venue history significance",
        "cultural": f"{artist_name} {event.category} cultural context scene significance",
        "related": f"{artist_name} recent work reviews press {event.city}",
    }

    return queries
