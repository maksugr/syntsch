import type { MetadataRoute } from "next";
import { getAllArticleSlugsWithLang } from "@/lib/db";
import { LANGUAGES } from "@/lib/i18n";

export const dynamic = "force-static";

const BASE = "https://syntsch.de";

function langAlternates(path: string): Record<string, string> {
  const entries = LANGUAGES.map((l) => [l, `${BASE}/${l}${path}`]);
  entries.push(["x-default", `${BASE}/en${path}`]);
  return Object.fromEntries(entries);
}

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { path: "/", changeFrequency: "daily" as const, priority: 1 },
    { path: "/about/", changeFrequency: "monthly" as const, priority: 0.5 },
    { path: "/impressum/", changeFrequency: "yearly" as const, priority: 0.3 },
    { path: "/privacy/", changeFrequency: "yearly" as const, priority: 0.3 },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    LANGUAGES.map((lang) => ({
      url: `${BASE}/${lang}${page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: { languages: langAlternates(page.path) },
    }))
  );

  const articleSlugs = getAllArticleSlugsWithLang();
  const articleEntries: MetadataRoute.Sitemap = articleSlugs.map(({ lang, slug }) => ({
    url: `${BASE}/${lang}/article/${slug}/`,
    changeFrequency: "never",
    priority: 0.8,
  }));

  return [...staticEntries, ...articleEntries];
}
