import Database from "better-sqlite3";
import path from "path";
import type { EssayWithEvent } from "./types";

function getDb(): Database.Database {
  const dbPath =
    process.env.PTYTSCH_DB_PATH ||
    path.resolve(process.cwd(), "../data/events.db");
  return new Database(dbPath, { readonly: true });
}

export function getAllEssaysWithEvents(): EssayWithEvent[] {
  const db = getDb();
  try {
    const rows = db
      .prepare(
        `SELECT
          e.id, e.event_id, e.title, e.lead, e.body, e.language,
          e.word_count, e.model_used, e.written_at,
          ev.id as ev_id, ev.name, ev.start_date, ev.end_date,
          ev.venue, ev.city, ev.category, ev.description,
          ev.source_url, ev.event_url, ev.scouted_at
        FROM essays e
        JOIN events ev ON ev.id = e.event_id
        ORDER BY e.written_at DESC`
      )
      .all() as Record<string, unknown>[];

    return rows.map(mapRow);
  } finally {
    db.close();
  }
}

export function getEssayWithEvent(id: number): EssayWithEvent | null {
  const db = getDb();
  try {
    const row = db
      .prepare(
        `SELECT
          e.id, e.event_id, e.title, e.lead, e.body, e.language,
          e.word_count, e.model_used, e.written_at,
          ev.id as ev_id, ev.name, ev.start_date, ev.end_date,
          ev.venue, ev.city, ev.category, ev.description,
          ev.source_url, ev.event_url, ev.scouted_at
        FROM essays e
        JOIN events ev ON ev.id = e.event_id
        WHERE e.id = ?`
      )
      .get(id) as Record<string, unknown> | undefined;

    return row ? mapRow(row) : null;
  } finally {
    db.close();
  }
}

export function getAllEssayIds(): number[] {
  const db = getDb();
  try {
    const rows = db
      .prepare("SELECT id FROM essays")
      .all() as { id: number }[];
    return rows.map((r) => r.id);
  } finally {
    db.close();
  }
}

function mapRow(row: Record<string, unknown>): EssayWithEvent {
  return {
    id: row.id as number,
    event_id: row.event_id as number,
    title: row.title as string,
    lead: row.lead as string,
    body: row.body as string,
    language: row.language as string,
    word_count: row.word_count as number | null,
    model_used: row.model_used as string | null,
    written_at: row.written_at as string,
    event: {
      id: row.ev_id as number,
      name: row.name as string,
      start_date: row.start_date as string | null,
      end_date: row.end_date as string | null,
      venue: row.venue as string | null,
      city: row.city as string | null,
      category: row.category as string | null,
      description: row.description as string | null,
      source_url: row.source_url as string | null,
      event_url: row.event_url as string | null,
      scouted_at: row.scouted_at as string,
    },
  };
}
