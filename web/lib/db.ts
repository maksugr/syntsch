import fs from "fs";
import path from "path";
import type { ArticleWithEvent, PipelineTrace, Reflection } from "./types";
import type { Lang } from "./i18n";

const DATA_DIR = path.resolve(process.cwd(), "../data");

function readAllArticleFiles(): ArticleWithEvent[] {
  const articlesDir = path.join(DATA_DIR, "articles");
  if (!fs.existsSync(articlesDir)) return [];

  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".json") && !f.endsWith(".trace.json"));
  const articles: ArticleWithEvent[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(articlesDir, file), "utf-8");
    const data = JSON.parse(raw);
    articles.push({
      id: data.id,
      event_id: data.event_id,
      title: data.title,
      slug: data.slug,
      lead: data.lead,
      body: data.body,
      language: data.language,
      word_count: data.word_count ?? null,
      model_used: data.model_used ?? null,
      written_at: data.written_at,
      event: {
        id: data.event?.id ?? "",
        name: data.event?.name ?? "",
        start_date: data.event?.start_date ?? null,
        end_date: data.event?.end_date ?? null,
        venue: data.event?.venue ?? null,
        city: data.event?.city ?? null,
        category: data.event?.category ?? null,
        description: data.event?.description ?? null,
        source_url: data.event?.source_url ?? null,
        event_url: data.event?.event_url ?? null,
        scouted_at: data.event?.scouted_at ?? "",
      },
    });
  }

  return articles;
}

export function getAllArticlesWithEvents(): ArticleWithEvent[] {
  const articles = readAllArticleFiles();
  articles.sort(
    (a, b) => new Date(b.written_at).getTime() - new Date(a.written_at).getTime()
  );
  return articles;
}

export function getArticleBySlug(slug: string): ArticleWithEvent | null {
  const filePath = path.join(DATA_DIR, "articles", `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  return {
    id: data.id,
    event_id: data.event_id,
    title: data.title,
    slug: data.slug,
    lead: data.lead,
    body: data.body,
    language: data.language,
    word_count: data.word_count ?? null,
    model_used: data.model_used ?? null,
    written_at: data.written_at,
    event: {
      id: data.event?.id ?? "",
      name: data.event?.name ?? "",
      start_date: data.event?.start_date ?? null,
      end_date: data.event?.end_date ?? null,
      venue: data.event?.venue ?? null,
      city: data.event?.city ?? null,
      category: data.event?.category ?? null,
      description: data.event?.description ?? null,
      source_url: data.event?.source_url ?? null,
      event_url: data.event?.event_url ?? null,
      scouted_at: data.event?.scouted_at ?? "",
    },
  };
}

export function getAlternateSlugs(eventId: string): Record<string, string> {
  const articles = readAllArticleFiles();
  const result: Record<string, string> = {};
  for (const a of articles) {
    if (a.event_id === eventId) {
      result[a.language] = a.slug;
    }
  }
  return result;
}

export function getAllArticleSlugs(): string[] {
  const articlesDir = path.join(DATA_DIR, "articles");
  if (!fs.existsSync(articlesDir)) return [];

  return fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith(".json") && !f.endsWith(".trace.json"))
    .map((f) => f.replace(/\.json$/, ""));
}

export function getTraceBySlug(slug: string): PipelineTrace | null {
  const tracePath = path.join(DATA_DIR, "articles", `${slug}.trace.json`);
  if (!fs.existsSync(tracePath)) return null;

  const raw = fs.readFileSync(tracePath, "utf-8");
  const data = JSON.parse(raw);

  return {
    draft_text: data.draft_text ?? "",
    draft_word_count: data.draft_word_count ?? 0,
    critique_assessment: data.critique_assessment ?? "",
    critique_issues: (data.critique_issues ?? []).map((i: Record<string, string>) => ({
      type: i.type ?? "",
      severity: i.severity ?? "",
      location: i.location ?? "",
      fix: i.fix ?? "",
    })),
    revised_text: data.revised_text ?? "",
    revision_changed: data.revision_changed ?? false,
    research_sources_count: data.research_sources_count ?? 0,
    expanded: data.expanded ?? false,
  };
}

export function getArticlesByLanguage(lang: Lang): ArticleWithEvent[] {
  const articles = readAllArticleFiles();
  return articles
    .filter((a) => a.language.toLowerCase() === lang)
    .sort((a, b) => new Date(b.written_at).getTime() - new Date(a.written_at).getTime());
}

export function getAllArticleSlugsWithLang(): { lang: string; slug: string }[] {
  const articles = readAllArticleFiles();
  return articles.map((a) => ({ lang: a.language.toLowerCase(), slug: a.slug }));
}

function readAllReflectionFiles(): Reflection[] {
  const reflectionsDir = path.join(DATA_DIR, "reflections");
  if (!fs.existsSync(reflectionsDir)) return [];

  const files = fs.readdirSync(reflectionsDir).filter((f) => f.endsWith(".json"));
  const reflections: Reflection[] = [];

  for (const file of files) {
    const raw = fs.readFileSync(path.join(reflectionsDir, file), "utf-8");
    const data = JSON.parse(raw);
    reflections.push({
      id: data.id,
      title: data.title,
      slug: data.slug,
      body: data.body,
      language: data.language,
      period_start: data.period_start,
      period_end: data.period_end,
      analysis: data.analysis ?? { article_count: 0, total_words: 0, avg_words: 0, categories: {}, venues: {} },
      word_count: data.word_count ?? null,
      model_used: data.model_used ?? null,
      written_at: data.written_at,
    });
  }

  return reflections;
}

export function getReflectionsByLanguage(lang: Lang): Reflection[] {
  const reflections = readAllReflectionFiles();
  return reflections
    .filter((r) => r.language.toLowerCase() === lang)
    .sort((a, b) => new Date(b.written_at).getTime() - new Date(a.written_at).getTime());
}

export function getReflectionBySlug(slug: string): Reflection | null {
  const reflectionsDir = path.join(DATA_DIR, "reflections");
  const filePath = path.join(reflectionsDir, `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const data = JSON.parse(raw);

  return {
    id: data.id,
    title: data.title,
    slug: data.slug,
    body: data.body,
    language: data.language,
    period_start: data.period_start,
    period_end: data.period_end,
    analysis: data.analysis ?? { article_count: 0, total_words: 0, avg_words: 0, categories: {}, venues: {} },
    word_count: data.word_count ?? null,
    model_used: data.model_used ?? null,
    written_at: data.written_at,
  };
}

export function getAllReflectionSlugsWithLang(): { lang: string; slug: string }[] {
  const reflections = readAllReflectionFiles();
  return reflections.map((r) => ({ lang: r.language.toLowerCase(), slug: r.slug }));
}

export function getReflectionAlternates(periodStart: string, periodEnd: string): Record<string, string> {
  const reflections = readAllReflectionFiles();
  const result: Record<string, string> = {};
  for (const r of reflections) {
    if (r.period_start === periodStart && r.period_end === periodEnd) {
      result[r.language.toLowerCase()] = r.slug;
    }
  }
  return result;
}
