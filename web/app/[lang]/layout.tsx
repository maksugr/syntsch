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

  return (
    <LanguageProvider lang={lang as Lang}>
      <Header />
      <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
        {children}
      </main>
      <Footer />
    </LanguageProvider>
  );
}
