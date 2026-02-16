import type { Metadata } from "next";
import { Suspense } from "react";
import { LANGUAGES } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { getArticlesByLanguage } from "@/lib/db";
import ArticleFeed from "@/components/ArticleFeed";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  const langMeta: Record<string, { locale: string; description: string }> = {
    en: {
      locale: "en_GB",
      description: "AI-powered daily essays on the most compelling upcoming cultural events in Berlin.",
    },
    de: {
      locale: "de_DE",
      description: "KI-gestützte tägliche Essays über die spannendsten kulturellen Veranstaltungen in Berlin.",
    },
    ru: {
      locale: "ru_RU",
      description: "Ежедневные эссе об интереснейших культурных событиях Берлина, написанные ИИ.",
    },
  };

  const meta = langMeta[lang] || langMeta.en;

  return {
    alternates: {
      canonical: `https://ptytsch.de/${lang}/`,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://ptytsch.de/${l}/`]),
        ["x-default", "https://ptytsch.de/en/"],
      ]),
    },
    openGraph: {
      locale: meta.locale,
      url: `https://ptytsch.de/${lang}/`,
      description: meta.description,
    },
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const articles = getArticlesByLanguage(lang as Lang);

  return (
    <Suspense>
      <ArticleFeed articles={articles} />
    </Suspense>
  );
}
