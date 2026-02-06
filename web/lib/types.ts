export interface Event {
  id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  venue: string | null;
  city: string | null;
  category: string | null;
  description: string | null;
  source_url: string | null;
  event_url: string | null;
  scouted_at: string;
}

export interface Article {
  id: string;
  event_id: string;
  title: string;
  slug: string;
  lead: string;
  body: string;
  language: string;
  word_count: number | null;
  model_used: string | null;
  written_at: string;
}

export interface ArticleWithEvent extends Article {
  event: Event;
}

export const CATEGORY_COLORS: Record<string, string> = {
  music: "#B91C1C",
  cinema: "#92600A",
  theater: "#6B2164",
  exhibition: "#1A6B3C",
  lecture: "#1E4D7B",
  festival: "#9C4A1A",
  performance: "#2D2D2D",
  club: "#4A1942",
};
