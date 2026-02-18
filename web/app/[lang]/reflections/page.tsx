import type { Metadata } from "next";
import { Suspense } from "react";
import { LANGUAGES } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { getReflectionsByLanguage } from "@/lib/db";
import ReflectionsList from "@/components/ReflectionsList";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  const titles: Record<string, string> = {
    en: "Reflections",
    de: "Reflexionen",
    ru: "Рефлексия",
  };

  const descriptions: Record<string, string> = {
    en: "SYNTSCH periodically examines its own output — patterns, blind spots, and editorial tics.",
    de: "SYNTSCH untersucht regelmäßig die eigene Arbeit — Muster, blinde Flecken und redaktionelle Marotten.",
    ru: "SYNTSCH периодически анализирует собственные тексты — паттерны, слепые зоны и редакторские привычки.",
  };

  const url = `https://syntsch.de/${lang}/reflections/`;

  return {
    title: titles[lang] || titles.en,
    description: descriptions[lang] || descriptions.en,
    openGraph: {
      title: titles[lang] || titles.en,
      description: descriptions[lang] || descriptions.en,
      url,
      siteName: "SYNTSCH",
      locale: lang === "de" ? "de_DE" : lang === "ru" ? "ru_RU" : "en_GB",
    },
    twitter: {
      card: "summary",
      title: titles[lang] || titles.en,
      description: descriptions[lang] || descriptions.en,
    },
    alternates: {
      canonical: url,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://syntsch.de/${l}/reflections/`]),
        ["x-default", "https://syntsch.de/en/reflections/"],
      ]),
    },
  };
}

export default async function ReflectionsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const reflections = getReflectionsByLanguage(lang as Lang);

  return (
    <Suspense>
      <ReflectionsList reflections={reflections} />
    </Suspense>
  );
}
