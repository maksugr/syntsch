import type { MetadataRoute } from "next";
import { getAllArticleSlugsWithLang, getAllReflectionSlugsWithLang } from "@/lib/db";
import { LANGUAGES } from "@/lib/i18n";

export const dynamic = "force-static";

const BASE = "https://syntsch.de";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: "/", changeFrequency: "daily" as const, priority: 1 },
    { path: "/about/", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/impressum/", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/privacy/", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/reflections/", changeFrequency: "weekly" as const, priority: 0.6 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    LANGUAGES.map((lang) => ({
      url: `${BASE}/${lang}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          ...Object.fromEntries(LANGUAGES.map((l) => [l, `${BASE}/${l}${page.path}`])),
          "x-default": `${BASE}/en${page.path}`,
        },
      },
    }))
  );

  const articleSlugs = getAllArticleSlugsWithLang();
  const byEvent = new Map<string, { lang: string; slug: string }[]>();
  for (const { lang, slug, eventId } of articleSlugs) {
    if (!byEvent.has(eventId)) byEvent.set(eventId, []);
    byEvent.get(eventId)!.push({ lang, slug });
  }

  const articleEntries: MetadataRoute.Sitemap = [];
  for (const siblings of byEvent.values()) {
    const languages: Record<string, string> = {};
    for (const s of siblings) {
      languages[s.lang] = `${BASE}/${s.lang}/article/${s.slug}/`;
    }
    if (languages["en"]) languages["x-default"] = languages["en"];

    for (const { lang, slug } of siblings) {
      articleEntries.push({
        url: `${BASE}/${lang}/article/${slug}/`,
        changeFrequency: "never",
        priority: 0.8,
        alternates: siblings.length > 1 ? { languages } : undefined,
      });
    }
  }

  const reflectionSlugs = getAllReflectionSlugsWithLang();
  const byPeriod = new Map<string, { lang: string; slug: string }[]>();
  for (const { lang, slug, periodKey } of reflectionSlugs) {
    if (!byPeriod.has(periodKey)) byPeriod.set(periodKey, []);
    byPeriod.get(periodKey)!.push({ lang, slug });
  }

  const reflectionEntries: MetadataRoute.Sitemap = [];
  for (const siblings of byPeriod.values()) {
    const languages: Record<string, string> = {};
    for (const s of siblings) {
      languages[s.lang] = `${BASE}/${s.lang}/reflections/${s.slug}/`;
    }
    if (languages["en"]) languages["x-default"] = languages["en"];

    for (const { lang, slug } of siblings) {
      reflectionEntries.push({
        url: `${BASE}/${lang}/reflections/${slug}/`,
        changeFrequency: "never",
        priority: 0.7,
        alternates: siblings.length > 1 ? { languages } : undefined,
      });
    }
  }

  return [...staticEntries, ...articleEntries, ...reflectionEntries];
}
