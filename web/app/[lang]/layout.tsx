import { notFound } from "next/navigation";
import { LANGUAGES } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import { LanguageProvider } from "@/components/LanguageProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export function generateStaticParams() {
  return LANGUAGES.map((lang) => ({ lang }));
}

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!LANGUAGES.includes(lang as Lang)) {
    notFound();
  }

  const fontDisplay = lang === "ru"
    ? "var(--font-russo), sans-serif"
    : "var(--font-bebas), sans-serif";

  return (
    <LanguageProvider lang={lang as Lang}>
      <div style={{ "--font-display": fontDisplay } as React.CSSProperties}>
        <Header />
        <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
          {children}
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
