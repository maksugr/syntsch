import fs from "fs";
import path from "path";
import type { ArticleWithEvent } from "./types";

const DATA_DIR = path.resolve(process.cwd(), "../data");

function readAllArticleFiles(): ArticleWithEvent[] {
  const articlesDir = path.join(DATA_DIR, "articles");
  if (!fs.existsSync(articlesDir)) return [];

  const files = fs.readdirSync(articlesDir).filter((f) => f.endsWith(".json"));
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

export function getAllArticleSlugs(): string[] {
  const articlesDir = path.join(DATA_DIR, "articles");
  if (!fs.existsSync(articlesDir)) return [];

  return fs
    .readdirSync(articlesDir)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}
