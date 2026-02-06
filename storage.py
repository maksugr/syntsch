import re
import sqlite3
import unicodedata
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from models import EventCandidate, EssayOutput


def generate_slug(text: str) -> str:
    """Classic web slug: lowercase, ASCII Latin only, hyphens for spaces."""
    text = unicodedata.normalize("NFKD", text.lower())
    text = text.encode("ascii", "ignore").decode("ascii")
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return text.strip("-")


class EventStorage:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    start_date TEXT,
                    end_date TEXT,
                    venue TEXT,
                    city TEXT,
                    category TEXT,
                    description TEXT,
                    source_url TEXT,
                    event_url TEXT,
                    scouted_at TEXT NOT NULL
                )
            """)
            conn.execute("""
                CREATE TABLE IF NOT EXISTS essays (
                    id TEXT PRIMARY KEY,
                    event_id TEXT NOT NULL REFERENCES events(id),
                    title TEXT NOT NULL,
                    slug TEXT NOT NULL DEFAULT '',
                    lead TEXT NOT NULL DEFAULT '',
                    body TEXT NOT NULL,
                    language TEXT NOT NULL,
                    word_count INTEGER,
                    model_used TEXT,
                    written_at TEXT NOT NULL
                )
            """)
            self._migrate_ids(conn)
            self._migrate_slugs(conn)

    def _migrate_ids(self, conn: sqlite3.Connection):
        """Migrate integer IDs to UUID text IDs if needed."""
        col_info = conn.execute("PRAGMA table_info(events)").fetchall()
        id_col = next(r for r in col_info if r[1] == "id")
        if id_col[2].upper() == "TEXT":
            return  # already migrated

        # Build mapping from old integer id → new UUID
        old_events = conn.execute("SELECT id FROM events").fetchall()
        event_id_map = {row[0]: str(uuid.uuid4()) for row in old_events}

        old_essays = conn.execute("SELECT id, event_id FROM essays").fetchall()
        essay_id_map = {row[0]: str(uuid.uuid4()) for row in old_essays}

        conn.execute("""
            CREATE TABLE events_new (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                start_date TEXT,
                end_date TEXT,
                venue TEXT,
                city TEXT,
                category TEXT,
                description TEXT,
                source_url TEXT,
                event_url TEXT,
                scouted_at TEXT NOT NULL
            )
        """)
        for old_id, new_id in event_id_map.items():
            conn.execute(
                """INSERT INTO events_new
                   SELECT ?, name, start_date, end_date, venue, city, category,
                          description, source_url, event_url, scouted_at
                   FROM events WHERE id = ?""",
                (new_id, old_id),
            )

        conn.execute("""
            CREATE TABLE essays_new (
                id TEXT PRIMARY KEY,
                event_id TEXT NOT NULL REFERENCES events_new(id),
                title TEXT NOT NULL,
                slug TEXT NOT NULL DEFAULT '',
                lead TEXT NOT NULL DEFAULT '',
                body TEXT NOT NULL,
                language TEXT NOT NULL,
                word_count INTEGER,
                model_used TEXT,
                written_at TEXT NOT NULL
            )
        """)
        for old_id, new_id in essay_id_map.items():
            old_event_id = next(r[1] for r in old_essays if r[0] == old_id)
            new_event_id = event_id_map[old_event_id]
            conn.execute(
                """INSERT INTO essays_new
                   SELECT ?, ?, title, slug, lead, body, language,
                          word_count, model_used, written_at
                   FROM essays WHERE id = ?""",
                (new_id, new_event_id, old_id),
            )

        conn.execute("DROP TABLE essays")
        conn.execute("DROP TABLE events")
        conn.execute("ALTER TABLE events_new RENAME TO events")
        conn.execute("ALTER TABLE essays_new RENAME TO essays")

    def _migrate_slugs(self, conn: sqlite3.Connection):
        """Add slug column if missing and backfill empty slugs."""
        cols = [r[1] for r in conn.execute("PRAGMA table_info(essays)").fetchall()]
        if "slug" not in cols:
            conn.execute("ALTER TABLE essays ADD COLUMN slug TEXT NOT NULL DEFAULT ''")
        # Backfill any rows with empty slug
        rows = conn.execute("SELECT id, title FROM essays WHERE slug = ''").fetchall()
        for row in rows:
            slug = self._unique_slug(conn, generate_slug(row["title"]), row["id"])
            conn.execute("UPDATE essays SET slug = ? WHERE id = ?", (slug, row["id"]))

    def _unique_slug(self, conn: sqlite3.Connection, base: str, essay_id: str) -> str:
        """Ensure slug is unique; fall back to id-based slug if base is empty."""
        if not base:
            base = f"essay-{essay_id}"
        slug = base
        n = 2
        while conn.execute(
            "SELECT 1 FROM essays WHERE slug = ? AND id != ?", (slug, essay_id)
        ).fetchone():
            slug = f"{base}-{n}"
            n += 1
        return slug

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def save_event(self, event: EventCandidate) -> str:
        event_id = str(uuid.uuid4())
        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO events (id, name, start_date, end_date, venue, city, category, description, source_url, event_url, scouted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    event.name,
                    event.start_date,
                    event.end_date,
                    event.venue,
                    event.city,
                    event.category,
                    event.description,
                    event.source_url,
                    event.event_url,
                    datetime.now().isoformat(),
                ),
            )
            return event_id

    def save_essay(self, event_id: str, essay: EssayOutput) -> str:
        essay_id = str(uuid.uuid4())
        with self._connect() as conn:
            slug = self._unique_slug(conn, generate_slug(essay.title), essay_id)
            conn.execute(
                """
                INSERT INTO essays (id, event_id, title, slug, lead, body, language, word_count, model_used, written_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    essay_id,
                    event_id,
                    essay.title,
                    slug,
                    essay.lead,
                    essay.body,
                    essay.language,
                    essay.word_count,
                    essay.model_used,
                    datetime.now().isoformat(),
                ),
            )
            return essay_id

    def is_already_covered(self, name: str, venue: str, start_date: str, language: str = "") -> bool:
        with self._connect() as conn:
            lang_clause = "AND a.language = ?" if language else ""
            params: list = [name, venue, start_date]
            if language:
                params.extend([language, language])
            else:
                params.extend([])
            # Build query with optional language filter
            if language:
                row = conn.execute(
                    """
                    SELECT 1 FROM events e
                    JOIN essays a ON a.event_id = e.id
                    WHERE (lower(e.name) = lower(?)
                       OR (lower(e.venue) = lower(?) AND e.start_date = ?))
                      AND a.language = ?
                    LIMIT 1
                    """,
                    (name, venue, start_date, language),
                ).fetchone()
            else:
                row = conn.execute(
                    """
                    SELECT 1 FROM events e
                    JOIN essays a ON a.event_id = e.id
                    WHERE lower(e.name) = lower(?)
                       OR (lower(e.venue) = lower(?) AND e.start_date = ?)
                    LIMIT 1
                    """,
                    (name, venue, start_date),
                ).fetchone()
            return row is not None

    def get_available_events(self, today: str | None = None, language: str = "") -> list[dict]:
        today = today or datetime.now().strftime("%Y-%m-%d")
        with self._connect() as conn:
            if language:
                rows = conn.execute(
                    """
                    SELECT e.* FROM events e
                    LEFT JOIN essays a ON a.event_id = e.id AND a.language = ?
                    WHERE a.id IS NULL
                      AND (
                        e.end_date >= ? OR e.start_date >= ?
                        OR (e.start_date = '' AND e.end_date = '')
                      )
                    ORDER BY e.scouted_at DESC
                    """,
                    (language, today, today),
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT e.* FROM events e
                    LEFT JOIN essays a ON a.event_id = e.id
                    WHERE a.id IS NULL
                      AND (
                        e.end_date >= ? OR e.start_date >= ?
                        OR (e.start_date = '' AND e.end_date = '')
                      )
                    ORDER BY e.scouted_at DESC
                    """,
                    (today, today),
                ).fetchall()
            return [dict(row) for row in rows]

    def get_recent_categories(self, days: int = 7) -> list[str]:
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        with self._connect() as conn:
            rows = conn.execute(
                """
                SELECT e.category FROM events e
                JOIN essays a ON a.event_id = e.id
                WHERE a.written_at > ? AND e.category != ''
                ORDER BY a.written_at DESC
                """,
                (cutoff,),
            ).fetchall()
            return [row[0] for row in rows]

    def get_event(self, event_id: str) -> dict | None:
        with self._connect() as conn:
            row = conn.execute(
                "SELECT * FROM events WHERE id = ?", (event_id,)
            ).fetchone()
            return dict(row) if row else None

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
