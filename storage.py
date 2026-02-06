import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

from models import EventCandidate, EssayOutput


class EventStorage:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self):
        with self._connect() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id INTEGER NOT NULL REFERENCES events(id),
                    title TEXT NOT NULL,
                    lead TEXT NOT NULL DEFAULT '',
                    body TEXT NOT NULL,
                    language TEXT NOT NULL,
                    word_count INTEGER,
                    model_used TEXT,
                    written_at TEXT NOT NULL
                )
            """)

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def save_event(self, event: EventCandidate) -> int:
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO events (name, start_date, end_date, venue, city, category, description, source_url, event_url, scouted_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
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
            return cursor.lastrowid

    def save_essay(self, event_id: int, essay: EssayOutput) -> int:
        with self._connect() as conn:
            cursor = conn.execute(
                """
                INSERT INTO essays (event_id, title, lead, body, language, word_count, model_used, written_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    event_id,
                    essay.title,
                    essay.lead,
                    essay.body,
                    essay.language,
                    essay.word_count,
                    essay.model_used,
                    datetime.now().isoformat(),
                ),
            )
            return cursor.lastrowid

    def is_already_covered(self, name: str, venue: str, start_date: str) -> bool:
        with self._connect() as conn:
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

    def get_available_events(self, today: str | None = None) -> list[dict]:
        today = today or datetime.now().strftime("%Y-%m-%d")
        with self._connect() as conn:
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

    def get_event(self, event_id: int) -> dict | None:
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
