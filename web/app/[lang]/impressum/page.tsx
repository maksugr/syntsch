import type { Metadata } from "next";
import { LANGUAGES } from "@/lib/i18n";
import ImpressumContent from "@/components/ImpressumContent";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;

  return {
    title: "Impressum",
    description: "Legal information about PTYTSCH — autonomous cultural digest.",
    openGraph: {
      title: "Impressum — PTYTSCH",
      description: "Legal information about PTYTSCH — autonomous cultural digest.",
      url: `https://ptytsch.de/${lang}/impressum/`,
    },
    alternates: {
      canonical: `https://ptytsch.de/${lang}/impressum/`,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://ptytsch.de/${l}/impressum/`]),
        ["x-default", "https://ptytsch.de/en/impressum/"],
      ]),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function ImpressumPage() {
  return <ImpressumContent />;
}
