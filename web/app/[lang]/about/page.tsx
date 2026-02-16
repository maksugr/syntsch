import type { Metadata } from "next";
import { LANGUAGES } from "@/lib/i18n";
import AboutContent from "@/components/AboutContent";

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
    title: "About",
    description:
      "PTYTSCH is an autonomous cultural digest powered by AI. Daily essays on the most compelling upcoming events in Berlin.",
    openGraph: {
      title: "About — PTYTSCH",
      description:
        "PTYTSCH is an autonomous cultural digest powered by AI. Daily essays on the most compelling upcoming events in Berlin.",
      url: `https://ptytsch.de/${lang}/about/`,
    },
    alternates: {
      canonical: `https://ptytsch.de/${lang}/about/`,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://ptytsch.de/${l}/about/`]),
        ["x-default", "https://ptytsch.de/en/about/"],
      ]),
    },
  };
}

export default function AboutPage() {
  return <AboutContent />;
}
