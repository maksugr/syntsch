import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllReflectionSlugsWithLang, getReflectionBySlug } from "@/lib/db";
import { LANGUAGES } from "@/lib/i18n";
import ReflectionBody from "@/components/ReflectionBody";
import ArticleMeta from "@/components/ArticleMeta";
import CopyLinkButton from "@/components/CopyLinkButton";
import ReflectionPeriod from "@/components/ReflectionPeriod";

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
      url: `https://ptytsch.de/${lang}/reflections/${slug}/`,
      publishedTime: reflection.written_at,
      siteName: "PTYTSCH",
    },
    alternates: {
      canonical: `https://ptytsch.de/${lang}/reflections/${slug}/`,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://ptytsch.de/${l}/reflections/${slug}/`]),
        ["x-default", `https://ptytsch.de/en/reflections/${slug}/`],
      ]),
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

  return (
    <div className="max-w-3xl">
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
    </div>
  );
}
