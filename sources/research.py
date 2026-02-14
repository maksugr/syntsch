import asyncio
import os

from tavily import AsyncTavilyClient

from models import EventCandidate, ResearchContext


async def _search_one(client: AsyncTavilyClient, query: str) -> dict:
    try:
        response = await client.search(
            query=query,
            max_results=5,
            search_depth="advanced",
            include_raw_content=False,
        )
        results = response.get("results", [])
        snippets = [r.get("content", "") for r in results]
        urls = [r.get("url", "") for r in results]
        return {"text": "\n\n".join(snippets[:3]), "urls": urls}
    except Exception:
        return {"text": "", "urls": []}


async def research_event(event: EventCandidate) -> ResearchContext:
    api_key = os.environ.get("TAVILY_API_KEY", "")
    if not api_key:
        return ResearchContext()

    client = AsyncTavilyClient(api_key=api_key)

    queries = _build_queries(event)
    fields = list(queries.keys())

    responses = await asyncio.gather(
        *(_search_one(client, queries[f]) for f in fields)
    )

    results = dict(zip(fields, responses))
    raw_sources = []
    for r in responses:
        raw_sources.extend(r["urls"])

    return ResearchContext(
        artist_background=results["artist"]["text"],
        venue_context=results["venue"]["text"],
        cultural_context=results["cultural"]["text"],
        related_works=results["related"]["text"],
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
