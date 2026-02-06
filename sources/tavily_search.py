from datetime import datetime, timedelta

from tavily import AsyncTavilyClient

from models import EventCandidate
from sources.base import EventSource


class TavilyEventSource(EventSource):
    def __init__(self, api_key: str):
        self.client = AsyncTavilyClient(api_key=api_key)

    async def fetch_events(self, city: str, days_ahead: int) -> list[EventCandidate]:
        tomorrow = datetime.now() + timedelta(days=1)
        end_date = tomorrow + timedelta(days=days_ahead)
        date_range = f"{tomorrow.strftime('%B %d')} to {end_date.strftime('%B %d %Y')}"

        queries = [
            f"{city} cultural events {date_range} concerts exhibitions theater",
            f"{city} what to do this week art music cinema",
            f"{city} upcoming events {tomorrow.strftime('%B %Y')} gallery performance lecture",
            f"{city} Veranstaltungen Konzerte Ausstellung Theater {tomorrow.strftime('%B %Y')}",
            f"{city} underground alternative events {date_range} club night festival",
        ]

        raw_results = []
        for query in queries:
            try:
                response = await self.client.search(
                    query=query,
                    max_results=7,
                    search_depth="advanced",
                    include_raw_content=False,
                )
                raw_results.extend(response.get("results", []))
            except Exception:
                continue

        seen_urls = set()
        candidates = []
        for result in raw_results:
            url = result.get("url", "")
            if url in seen_urls:
                continue
            seen_urls.add(url)

            candidates.append(
                EventCandidate(
                    name=result.get("title", ""),
                    start_date="",
                    end_date="",
                    venue="",
                    city=city,
                    category="",
                    description=result.get("content", "")[:500],
                    source_url=url,
                    raw_snippet=result.get("content", "")[:1000],
                )
            )

        return candidates
