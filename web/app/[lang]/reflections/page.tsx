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
    en: "Reflections — PTYTSCH",
    de: "Reflexionen — PTYTSCH",
    ru: "Рефлексия — PTYTSCH",
  };

  return {
    title: titles[lang] || titles.en,
    alternates: {
      canonical: `https://ptytsch.de/${lang}/reflections/`,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://ptytsch.de/${l}/reflections/`]),
        ["x-default", "https://ptytsch.de/en/reflections/"],
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
