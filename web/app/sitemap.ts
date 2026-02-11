import type { MetadataRoute } from "next";
import { getAllArticleSlugs } from "@/lib/db";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
    const slugs = getAllArticleSlugs();

    const articles: MetadataRoute.Sitemap = slugs.map((slug) => ({
        url: `https://ptytsch.de/article/${slug}`,
        changeFrequency: "never",
        priority: 0.8,
    }));

    return [
        {
            url: "https://ptytsch.de",
            changeFrequency: "daily",
            priority: 1,
        },
        {
            url: "https://ptytsch.de/about",
            changeFrequency: "monthly",
            priority: 0.5,
        },
        ...articles,
    ];
}
