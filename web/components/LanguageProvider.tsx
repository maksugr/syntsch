"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Lang } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
});

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return match ? decodeURIComponent(match[1]) : undefined;
}

function setCookie(name: string, value: string, maxAgeDays: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 86400}; SameSite=Lax`;
}

const VALID_LANGS: Lang[] = ["en", "de", "ru"];
const COOKIE_NAME = "ptytsch_lang";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = getCookie(COOKIE_NAME);
    if (saved && VALID_LANGS.includes(saved as Lang)) {
      setLangState(saved as Lang);
    }
  }, []);

  useEffect(() => {
    const font = lang === "ru"
      ? "var(--font-russo), sans-serif"
      : "var(--font-bebas), sans-serif";
    document.documentElement.style.setProperty("--font-display", font);
  }, [lang]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    setCookie(COOKIE_NAME, newLang, 365);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
