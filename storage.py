import json
import os
import re
import tempfile
import unicodedata
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from models import EventCandidate, ArticleOutput, ReflectionOutput


_CYRILLIC_TRANSLIT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo",
    "ж": "zh", "з": "z", "и": "i", "й": "y", "к": "k", "л": "l", "м": "m",
    "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u",
    "ф": "f", "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "shch",
    "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
}


def generate_slug(text: str) -> str:
    """Classic web slug: lowercase, ASCII Latin only, hyphens for spaces.
    Transliterates Cyrillic before stripping to ASCII."""
    text = text.lower()
    text = "".join(_CYRILLIC_TRANSLIT.get(ch, ch) for ch in text)
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


class EventStorage:
    def __init__(self, data_dir: Path):
        self.data_dir = data_dir
        self.events_dir = data_dir / "events"
        self.articles_dir = data_dir / "articles"
        self.reflections_dir = data_dir / "reflections"
        self.events_dir.mkdir(parents=True, exist_ok=True)
        self.articles_dir.mkdir(parents=True, exist_ok=True)
        self.reflections_dir.mkdir(parents=True, exist_ok=True)

    def _write_json(self, path: Path, data: dict):
        """Atomic write: temp file + os.replace."""
        content = json.dumps(data, indent=2, ensure_ascii=False, default=str)
        fd, tmp = tempfile.mkstemp(dir=path.parent, suffix=".tmp")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(content)
            os.replace(tmp, path)
        except:
            if os.path.exists(tmp):
                os.unlink(tmp)
            raise

    def _load_all_events(self) -> list[dict]:
        results = []
        for p in self.events_dir.glob("*.json"):
            results.append(json.loads(p.read_text(encoding="utf-8")))
        return results

    def _load_all_articles(self) -> list[dict]:
        results = []
        for p in self.articles_dir.glob("*.json"):
            results.append(json.loads(p.read_text(encoding="utf-8")))
        return results

    def find_existing_event(self, name: str, venue: str, start_date: str) -> str | None:
        """Return event_id of a matching event, or None."""
        name_norm = name.strip().lower()
        venue_norm = venue.strip().lower()
        for ev in self._load_all_events():
            if ev.get("name", "").strip().lower() == name_norm:
                return ev["id"]
            if venue_norm and start_date and ev.get("venue", "").strip().lower() == venue_norm and ev.get("start_date") == start_date:
                return ev["id"]
        return None

    def event_exists(self, name: str) -> bool:
        """Check if an event with this name already exists in the pool."""
        name_norm = name.strip().lower()
        for ev in self._load_all_events():
            if ev.get("name", "").strip().lower() == name_norm:
                return True
        return False

    def get_all_event_names(self) -> list[str]:
        """Return names of all events in the pool."""
        return [ev.get("name", "") for ev in self._load_all_events() if ev.get("name")]

    def save_event(self, event: EventCandidate) -> str:
        existing_id = self.find_existing_event(event.name, event.venue, event.start_date)
        if existing_id:
            return existing_id

        event_id = str(uuid.uuid4())
        data = {
            "id": event_id,
            "name": event.name,
            "start_date": event.start_date,
            "end_date": event.end_date,
            "venue": event.venue,
            "city": event.city,
            "category": event.category,
            "description": event.description,
            "source_url": event.source_url,
            "event_url": event.event_url,
            "scouted_at": datetime.now().isoformat(),
        }
        self._write_json(self.events_dir / f"{event_id}.json", data)
        return event_id

    def save_article(self, event_id: str, article: ArticleOutput) -> tuple[str, str]:
        article_id = str(uuid.uuid4())
        slug = self._unique_slug(generate_slug(article.title), article_id)
        event_data = self.get_event(event_id)
        data = {
            "id": article_id,
            "event_id": event_id,
            "title": article.title,
            "slug": slug,
            "lead": article.lead,
            "body": article.body,
            "language": article.language,
            "word_count": article.word_count,
            "model_used": article.model_used,
            "written_at": datetime.now().isoformat(),
            "event": event_data,
        }
        self._write_json(self.articles_dir / f"{slug}.json", data)

        if article.trace:
            trace_data = article.trace.model_dump(mode="json")
            if trace_data.get("research_context"):
                trace_data["research_context"] = {
                    k: v[:500] if isinstance(v, str) else v
                    for k, v in trace_data["research_context"].items()
                }
            self._write_json(self.articles_dir / f"{slug}.trace.json", trace_data)

        return article_id, slug

    def is_already_covered(self, name: str, venue: str, start_date: str, language: str = "") -> bool:
        for article in self._load_all_articles():
            if language and article.get("language") != language:
                continue
            event = article.get("event", {})
            name_match = event.get("name", "").lower() == name.lower()
            venue_date_match = (
                event.get("venue", "").lower() == venue.lower()
                and event.get("start_date") == start_date
            )
            if name_match or venue_date_match:
                return True
        return False

    def has_article_in_language(self, event_id: str, language: str) -> bool:
        for article in self._load_all_articles():
            if article.get("event_id") == event_id and article.get("language") == language:
                return True
        return False

    def get_available_events(self, today: str | None = None, language: str = "") -> list[dict]:
        today = today or datetime.now().strftime("%Y-%m-%d")
        all_events = self._load_all_events()
        all_articles = self._load_all_articles()

        # Build set of event_ids that already have articles (in given language)
        covered_ids = set()
        for article in all_articles:
            if language and article.get("language") != language:
                continue
            covered_ids.add(article.get("event_id"))

        results = []
        for ev in all_events:
            if ev["id"] in covered_ids:
                continue
            end = ev.get("end_date", "")
            start = ev.get("start_date", "")
            if end and end >= today:
                results.append(ev)
            elif start and start >= today:
                results.append(ev)
            elif not start and not end:
                results.append(ev)

        results.sort(key=lambda e: e.get("scouted_at", ""), reverse=True)
        return results

    def get_recent_categories(self, days: int = 7) -> list[str]:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        articles = self._load_all_articles()
        recent = [
            a for a in articles
            if a.get("written_at", "") > cutoff
        ]
        recent.sort(key=lambda a: a.get("written_at", ""), reverse=True)
        categories = []
        for a in recent:
            cat = a.get("event", {}).get("category", "")
            if cat:
                categories.append(cat)
        return categories

    def get_event(self, event_id: str) -> dict | None:
        path = self.events_dir / f"{event_id}.json"
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def event_to_candidate(self, row: dict) -> EventCandidate:
        return EventCandidate(
            name=row["name"],
            start_date=row["start_date"] or "",
            end_date=row["end_date"] or "",
            venue=row["venue"] or "",
            city=row["city"] or "Berlin",
            category=row["category"] or "",
            description=row["description"] or "",
            source_url=row["source_url"] or "",
            event_url=row["event_url"] or "",
        )

    def get_articles_in_period(self, start: str, end: str, language: str) -> list[dict]:
        articles = self._load_all_articles()
        return [
            a for a in articles
            if a.get("language") == language
            and start <= a.get("written_at", "")[:10] <= end
        ]

    def save_reflection(self, reflection: ReflectionOutput) -> tuple[str, str]:
        reflection_id = str(uuid.uuid4())
        slug = self._unique_reflection_slug(generate_slug(reflection.title), reflection_id)
        data = {
            "id": reflection_id,
            "title": reflection.title,
            "slug": slug,
            "body": reflection.body,
            "language": reflection.language,
            "period_start": reflection.period_start,
            "period_end": reflection.period_end,
            "analysis": reflection.analysis,
            "word_count": reflection.word_count,
            "model_used": reflection.model_used,
            "written_at": datetime.now().isoformat(),
        }
        self._write_json(self.reflections_dir / f"{slug}.json", data)
        return reflection_id, slug

    def get_latest_reflection(self, language: str) -> dict | None:
        reflections = [
            r for r in self._load_all_reflections()
            if r.get("language") == language
        ]
        if not reflections:
            return None
        reflections.sort(key=lambda r: r.get("written_at", ""), reverse=True)
        return reflections[0]

    def _load_all_reflections(self) -> list[dict]:
        results = []
        for p in self.reflections_dir.glob("*.json"):
            results.append(json.loads(p.read_text(encoding="utf-8")))
        return results

    def _unique_reflection_slug(self, base: str, reflection_id: str) -> str:
        if not base:
            base = f"reflection-{reflection_id}"
        existing = {p.stem for p in self.reflections_dir.glob("*.json")}
        slug = base
        n = 2
        while slug in existing:
            slug = f"{base}-{n}"
            n += 1
        return slug

    def get_trace(self, slug: str) -> dict | None:
        trace_path = self.articles_dir / f"{slug}.trace.json"
        if not trace_path.exists():
            return None
        return json.loads(trace_path.read_text(encoding="utf-8"))

    def _unique_slug(self, base: str, article_id: str) -> str:
        """Ensure slug is unique; fall back to id-based slug if base is empty."""
        if not base:
            base = f"article-{article_id}"
        existing = {p.stem for p in self.articles_dir.glob("*.json")}
        slug = base
        n = 2
        while slug in existing:
            slug = f"{base}-{n}"
            n += 1
        return slug
