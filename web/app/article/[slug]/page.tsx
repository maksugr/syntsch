import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticleSlugs, getArticleBySlug, getAlternateSlugs } from "@/lib/db";
import ArticleBody from "@/components/ArticleBody";
import ArticleLead from "@/components/ArticleLead";
import ArticleMeta from "@/components/ArticleMeta";
import CopyLinkButton from "@/components/CopyLinkButton";
import EventSidebar from "@/components/EventSidebar";
import SetAlternates from "@/components/SetAlternates";
import ArticleHero from "@/components/ArticleHero";
import { CATEGORY_COLORS } from "@/lib/types";

export function generateStaticParams() {
  const slugs = getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};

  const description = article.lead || article.body.slice(0, 160) + "...";

  return {
    title: article.title,
    description,
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url: `https://ptytsch.de/article/${slug}`,
      publishedTime: article.written_at,
      locale: article.language === "de" ? "de_DE" : article.language === "ru" ? "ru_RU" : "en_GB",
      siteName: "PTYTSCH",
    },
    twitter: {
      card: "summary",
      title: article.title,
      description,
    },
    alternates: {
      canonical: `https://ptytsch.de/article/${slug}`,
      languages: (() => {
        const alts = getAlternateSlugs(article.event_id);
        const entries = Object.entries(alts).map(([lang, s]) => [lang, `https://ptytsch.de/article/${s}`]);
        if (alts["en"]) entries.push(["x-default", `https://ptytsch.de/article/${alts["en"]}`]);
        return Object.fromEntries(entries);
      })(),
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.lead || article.body.slice(0, 160),
    datePublished: article.written_at,
    inLanguage: article.language,
    author: { "@type": "Organization", name: "PTYTSCH", email: "hi@ptytsch.de" },
    publisher: { "@type": "Organization", name: "PTYTSCH", url: "https://ptytsch.de", email: "hi@ptytsch.de" },
    mainEntityOfPage: `https://ptytsch.de/article/${slug}`,
    ...(article.event.name && {
      about: {
        "@type": "Event",
        name: article.event.name,
        ...(article.event.start_date && { startDate: article.event.start_date }),
        ...(article.event.end_date && { endDate: article.event.end_date }),
        ...(article.event.venue && {
          location: {
            "@type": "Place",
            name: article.event.venue,
            ...(article.event.city && { address: { "@type": "PostalAddress", addressLocality: article.event.city } }),
          },
        }),
      },
    }),
  };

  const alternates = getAlternateSlugs(article.event_id);
  const catColor = CATEGORY_COLORS[article.event.category || ""] || "#666666";

  return (
    <div className="relative flex flex-col lg:flex-row gap-12 lg:gap-16">
      <ArticleHero seed={article.event_id + article.title} color={catColor} />
      <SetAlternates alternates={alternates} articleLang={article.language} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="lg:w-[60%] relative" style={{ zIndex: 1 }}>
        <h1
          className="text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {article.title}
        </h1>

        <ArticleMeta writtenAt={article.written_at} wordCount={article.word_count} />

        {article.lead && (
          <ArticleLead text={article.lead} />
        )}

        <ArticleBody body={article.body} />

        <div className="mt-12">
          <CopyLinkButton />
        </div>
      </article>

      <div className="lg:w-[40%] relative" style={{ zIndex: 1 }}>
        <EventSidebar event={article.event} />
      </div>
    </div>
  );
}
