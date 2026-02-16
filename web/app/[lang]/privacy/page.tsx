import type { Metadata } from "next";
import { LANGUAGES } from "@/lib/i18n";
import PrivacyContent from "@/components/PrivacyContent";

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
    title: "Privacy Policy",
    description: "Privacy policy for SYNTSCH — how we handle your data.",
    openGraph: {
      title: "Privacy Policy — SYNTSCH",
      description: "Privacy policy for SYNTSCH — how we handle your data.",
      url: `https://syntsch.de/${lang}/privacy/`,
    },
    alternates: {
      canonical: `https://syntsch.de/${lang}/privacy/`,
      languages: Object.fromEntries([
        ...LANGUAGES.map((l) => [l, `https://syntsch.de/${l}/privacy/`]),
        ["x-default", "https://syntsch.de/en/privacy/"],
      ]),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function PrivacyPage() {
  return <PrivacyContent />;
}
