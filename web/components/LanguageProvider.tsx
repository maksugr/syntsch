"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Lang } from "@/lib/i18n";

interface LanguageContextValue {
  lang: Lang;
  alternates: Record<string, string>;
  setAlternates: (alts: Record<string, string>) => void;
  articleCategory: string | null;
  setArticleCategory: (cat: string | null) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  alternates: {},
  setAlternates: () => {},
  articleCategory: null,
  setArticleCategory: () => {},
});

const COOKIE_NAME = "syntsch_lang";

function setCookie(name: string, value: string, maxAgeDays: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 86400}; SameSite=Lax`;
}

export function LanguageProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const [alternates, setAlternates] = useState<Record<string, string>>({});
  const [articleCategory, setArticleCategory] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.lang = lang;
    const font = lang === "ru"
      ? "var(--font-russo), sans-serif"
      : "var(--font-bebas), sans-serif";
    document.documentElement.style.setProperty("--font-display", font);
    setCookie(COOKIE_NAME, lang, 365);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, alternates, setAlternates, articleCategory, setArticleCategory }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
