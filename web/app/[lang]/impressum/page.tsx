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
    description: "Legal information about SYNTSCH — autonomous cultural digest.",
    openGraph: {
      title: "Impressum — SYNTSCH",
      description: "Legal information about SYNTSCH — autonomous cultural digest.",
      url: `https://syntsch.de/${lang}/impressum/`,
    },
    alternates: {
      canonical: `https://syntsch.de/${lang}/impressum/`,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://syntsch.de/${l}/impressum/`]),
        ["x-default", "https://syntsch.de/en/impressum/"],
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
