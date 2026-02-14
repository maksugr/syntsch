import asyncio
import logging
import random
from collections import Counter
from datetime import datetime, timedelta

from tavily import AsyncTavilyClient

import config
from models import EventCandidate
from sources.base import EventSource

logger = logging.getLogger(__name__)


def _weighted_sample(items, weights, k):
    selected = []
    items = list(items)
    weights = list(weights)
    for _ in range(k):
        if not items:
            break
        total = sum(weights)
        r = random.uniform(0, total)
        cumulative = 0
        for i, w in enumerate(weights):
            cumulative += w
            if r <= cumulative:
                selected.append(items.pop(i))
                weights.pop(i)
                break
    return selected


class TavilyEventSource(EventSource):
    def __init__(self, api_key: str):
        self.client = AsyncTavilyClient(api_key=api_key)

    async def _search_one(self, query: str, include_domains: list[str] | None = None) -> list[dict]:
        kwargs = dict(
            query=query,
            max_results=7,
            search_depth="advanced",
            include_raw_content="markdown",
        )
        if include_domains:
            kwargs["include_domains"] = include_domains

        for attempt in range(3):
            try:
                response = await self.client.search(**kwargs)
                results = response.get("results", [])
                logger.debug("Query '%s': %d results", query[:80], len(results))
                return results
            except Exception as e:
                logger.warning("Tavily attempt %d/3 failed for '%s': %s", attempt + 1, query[:80], e)
                if attempt < 2:
                    await asyncio.sleep(1.0 * (attempt + 1))

        logger.error("All retries exhausted for query '%s'", query[:80])
        return []

    async def fetch_events(
        self,
        city: str,
        days_ahead: int,
        pool_categories: list[str] | None = None,
    ) -> list[EventCandidate]:
        tomorrow = datetime.now() + timedelta(days=1)
        end_date = tomorrow + timedelta(days=days_ahead)
        date_range = f"{tomorrow.strftime('%B %d')} to {end_date.strftime('%B %d %Y')}"
        month_year = tomorrow.strftime('%B %Y')

        core_queries = [
            f"{city} cultural events {date_range} concerts exhibitions theater",
            f"{city} what to do this week art music cinema",
            f"{city} upcoming events {month_year} gallery performance lecture",
        ]

        extra_queries = [
            {"query": f"{city} Veranstaltungen Konzerte Ausstellung Theater {month_year}", "cats": ["music", "theater", "exhibition"]},
            {"query": f"{city} Kulturprogramm Lesung Performance Clubnacht {date_range}", "cats": ["lecture", "performance", "club"]},
            {"query": f"{city} underground alternative events {date_range} club night festival", "cats": ["club", "festival"]},
            {"query": f"{city} DIY punk queer party warehouse rave {date_range}", "cats": ["club", "music"]},
            {"query": f"{city} experimental noise ambient drone live {date_range}", "cats": ["music", "performance"]},
            {"query": f"{city} new gallery openings performances {date_range}", "cats": ["exhibition", "performance"]},
            {"query": f"{city} art exhibition opening reception {month_year}", "cats": ["exhibition"]},
            {"query": f"{city} contemporary art installation vernissage {date_range}", "cats": ["exhibition"]},
            {"query": f"{city} photography exhibition museum show {month_year}", "cats": ["exhibition"]},
            {"query": f"{city} live music DJ sets club events {date_range}", "cats": ["music", "club"]},
            {"query": f"{city} jazz electronic techno concert {date_range}", "cats": ["music", "club"]},
            {"query": f"{city} indie band tour gig venue {month_year}", "cats": ["music"]},
            {"query": f"{city} independent film screening premiere cinema {date_range}", "cats": ["cinema"]},
            {"query": f"{city} theater dance performance spoken word {date_range}", "cats": ["theater", "performance"]},
            {"query": f"{city} documentary film festival short film {month_year}", "cats": ["cinema", "festival"]},
            {"query": f"{city} fashion pop-up design market {date_range}", "cats": ["festival"]},
            {"query": f"{city} book launch reading poetry zine fair {date_range}", "cats": ["lecture"]},
            {"query": f"{city} sound art media art digital culture {month_year}", "cats": ["performance", "exhibition"]},
            {"query": f"{city} события культура концерты выставки {month_year}", "cats": ["music", "exhibition"]},
        ]

        cat_counts = Counter(pool_categories or [])
        weights = []
        for eq in extra_queries:
            w = sum(1.0 / (cat_counts.get(c, 0) + 1) for c in eq["cats"])
            weights.append(w)

        sampled = _weighted_sample(extra_queries, weights, 4)

        targeted = self._build_targeted_queries(city, date_range, cat_counts)

        tasks = []
        for q in core_queries:
            tasks.append(self._search_one(q))
        for eq in sampled:
            tasks.append(self._search_one(eq["query"]))
        for q, domains in targeted:
            tasks.append(self._search_one(q, include_domains=domains))

        batches = await asyncio.gather(*tasks)

        seen_urls = set()
        candidates = []
        for batch in batches:
            for result in batch:
                url = result.get("url", "")
                if url in seen_urls:
                    continue
                seen_urls.add(url)

                raw_content = result.get("raw_content") or ""
                snippet = result.get("content") or ""

                candidates.append(
                    EventCandidate(
                        name=result.get("title", ""),
                        start_date="",
                        end_date="",
                        venue="",
                        city=city,
                        category="",
                        description=snippet[:500],
                        source_url=url,
                        raw_snippet=(raw_content[:3000] if raw_content else snippet[:1000]),
                    )
                )

        return candidates

    def _build_targeted_queries(
        self,
        city: str,
        date_range: str,
        cat_counts: Counter,
    ) -> list[tuple[str, list[str]]]:
        all_cats = list(config.CATEGORY_SOURCES.keys())
        underrepresented = sorted(all_cats, key=lambda c: cat_counts.get(c, 0))[:2]

        targeted = []
        for cat in underrepresented:
            domains = config.CATEGORY_SOURCES.get(cat, []) + config.GENERAL_SOURCES
            query = f"{city} {cat} events {date_range}"
            targeted.append((query, domains))

        return targeted
