import random
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

        core_queries = [
            f"{city} cultural events {date_range} concerts exhibitions theater",
            f"{city} what to do this week art music cinema",
            f"{city} upcoming events {tomorrow.strftime('%B %Y')} gallery performance lecture",
        ]

        extra_queries = [
            # german-language
            f"{city} Veranstaltungen Konzerte Ausstellung Theater {tomorrow.strftime('%B %Y')}",
            f"{city} Kulturprogramm Lesung Performance Clubnacht {date_range}",
            # subculture / underground
            f"{city} underground alternative events {date_range} club night festival",
            f"{city} DIY punk queer party warehouse rave {date_range}",
            f"{city} experimental noise ambient drone live {date_range}",
            # visual arts
            f"{city} new gallery openings performances {date_range}",
            f"{city} art exhibition opening reception {tomorrow.strftime('%B %Y')}",
            f"{city} contemporary art installation vernissage {date_range}",
            f"{city} photography exhibition museum show {tomorrow.strftime('%B %Y')}",
            # music
            f"{city} live music DJ sets club events {date_range}",
            f"{city} jazz electronic techno concert {date_range}",
            f"{city} indie band tour gig venue {tomorrow.strftime('%B %Y')}",
            # cinema / theater / performance
            f"{city} independent film screening premiere cinema {date_range}",
            f"{city} theater dance performance spoken word {date_range}",
            f"{city} documentary film festival short film {tomorrow.strftime('%B %Y')}",
            # niche / cross-disciplinary
            f"{city} fashion pop-up design market {date_range}",
            f"{city} book launch reading poetry zine fair {date_range}",
            f"{city} sound art media art digital culture {tomorrow.strftime('%B %Y')}",
            # russian-language (for RU audience reach)
            f"{city} события культура концерты выставки {tomorrow.strftime('%B %Y')}",
        ]

        queries = core_queries + random.sample(extra_queries, min(4, len(extra_queries)))

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
