import { cookies, headers } from "next/headers";
import type { Lang } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/i18n";
import { LanguageProvider } from "@/components/LanguageProvider";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NotFoundContent from "@/components/NotFoundContent";

function detectLang(cookieLang: string | undefined, acceptLang: string | null): Lang {
  if (cookieLang && LANGUAGES.includes(cookieLang as Lang)) return cookieLang as Lang;
  if (acceptLang) {
    for (const l of LANGUAGES) {
      if (acceptLang.includes(l)) return l;
    }
  }
  return "en";
}

export default async function NotFound() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const lang = detectLang(
    cookieStore.get("syntsch_lang")?.value,
    headerStore.get("accept-language"),
  );

  const fontDisplay = lang === "ru"
    ? "var(--font-russo), sans-serif"
    : "var(--font-bebas), sans-serif";

  return (
    <LanguageProvider lang={lang}>
      <div style={{ "--font-display": fontDisplay } as React.CSSProperties}>
        <Header />
        <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
          <NotFoundContent />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
