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

export interface CritiqueIssue {
  type: string;
  severity: string;
  location: string;
  fix: string;
}

export interface PipelineTrace {
  draft_text: string;
  draft_word_count: number;
  critique_assessment: string;
  critique_issues: CritiqueIssue[];
  revised_text: string;
  revision_changed: boolean;
  research_sources_count: number;
  expanded: boolean;
}

export interface Reflection {
  id: string;
  title: string;
  slug: string;
  body: string;
  language: string;
  period_start: string;
  period_end: string;
  analysis: {
    article_count: number;
    total_words: number;
    avg_words: number;
    categories: Record<string, number>;
    venues: Record<string, number>;
    longest_article?: { title: string; slug: string; word_count: number };
    shortest_article?: { title: string; slug: string; word_count: number };
    words_per_day?: number;
    median_words?: number;
    dominant_category?: { name: string; count: number; pct: number };
    missing_categories?: string[];
    unique_venues_count?: number;
    venue_concentration?: { name: string; count: number; pct: number };
    previous_comparison?: {
      articles_delta: number;
      words_delta: number;
      new_venues: string[];
      lost_venues: string[];
      category_shifts: Record<string, number>;
    };
    process_stats?: {
      avg_critique_issues: number;
      expanded_pct: number;
      avg_word_growth_pct: number;
      total_research_sources: number;
      articles_with_traces: number;
    };
  };
  word_count: number | null;
  model_used: string | null;
  written_at: string;
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
