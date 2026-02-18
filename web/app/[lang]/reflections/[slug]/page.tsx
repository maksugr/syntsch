import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllReflectionSlugsWithLang, getReflectionBySlug, getReflectionAlternates } from "@/lib/db";
import { LANGUAGES } from "@/lib/i18n";
import ReflectionBody from "@/components/ReflectionBody";
import ArticleMeta from "@/components/ArticleMeta";
import CopyLinkButton from "@/components/CopyLinkButton";
import ReflectionPeriod from "@/components/ReflectionPeriod";
import ReflectionSidebar from "@/components/ReflectionSidebar";
import SetAlternates from "@/components/SetAlternates";

export function generateStaticParams() {
  return getAllReflectionSlugsWithLang();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  const reflection = getReflectionBySlug(slug);
  if (!reflection) return {};

  const description = reflection.body.slice(0, 160) + "...";

  return {
    title: reflection.title,
    description,
    openGraph: {
      type: "article",
      title: reflection.title,
      description,
      url: `https://syntsch.de/${lang}/reflections/${slug}/`,
      publishedTime: reflection.written_at,
      locale: lang === "de" ? "de_DE" : lang === "ru" ? "ru_RU" : "en_GB",
      siteName: "SYNTSCH",
    },
    twitter: {
      card: "summary",
      title: reflection.title,
      description,
    },
    alternates: {
      canonical: `https://syntsch.de/${lang}/reflections/${slug}/`,
      languages: (() => {
        const alts = getReflectionAlternates(reflection.period_start, reflection.period_end);
        const entries = Object.entries(alts).map(([l, s]) => [l, `https://syntsch.de/${l}/reflections/${s}/`]);
        if (alts["en"]) entries.push(["x-default", `https://syntsch.de/en/reflections/${alts["en"]}/`]);
        return Object.fromEntries(entries);
      })(),
    },
  };
}

export default async function ReflectionPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { slug } = await params;
  const reflection = getReflectionBySlug(slug);

  if (!reflection) {
    notFound();
  }

  const alternates = getReflectionAlternates(reflection.period_start, reflection.period_end);

  return (
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
      <SetAlternates alternates={alternates} />
      <article className="lg:w-[60%]">
        <h1
          className="text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {reflection.title}
        </h1>

        <ArticleMeta writtenAt={reflection.written_at} wordCount={reflection.word_count} />

        <ReflectionPeriod
          periodStart={reflection.period_start}
          periodEnd={reflection.period_end}
          articleCount={reflection.analysis.article_count}
        />

        <div className="mt-10">
          <ReflectionBody body={reflection.body} />
        </div>

        <div className="mt-12">
          <CopyLinkButton />
        </div>
      </article>

      <div className="lg:w-[40%]">
        <ReflectionSidebar analysis={reflection.analysis} />
      </div>
    </div>
  );
}
