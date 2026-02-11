import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticleSlugs, getArticleBySlug } from "@/lib/db";
import ArticleBody from "@/components/ArticleBody";
import ArticleMeta from "@/components/ArticleMeta";
import CopyLinkButton from "@/components/CopyLinkButton";
import EventSidebar from "@/components/EventSidebar";

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

  return (
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="lg:w-[60%]">
        <h1
          className="text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {article.title}
        </h1>

        <ArticleMeta writtenAt={article.written_at} wordCount={article.word_count} />

        {article.lead && (
          <p
            className="text-xl md:text-2xl leading-relaxed mb-10 border-l-4 border-black pl-6"
            style={{ color: '#666666' }}
          >
            {article.lead}
          </p>
        )}

        <ArticleBody body={article.body} />

        <div className="mt-12">
          <CopyLinkButton />
        </div>
      </article>

      <div className="lg:w-[40%]">
        <EventSidebar event={article.event} />
      </div>
    </div>
  );
}
