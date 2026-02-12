"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Lang } from "@/lib/translations";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  alternates: Record<string, string>;
  setAlternates: (alts: Record<string, string>) => void;
  resetKey: number;
  triggerReset: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  alternates: {},
  setAlternates: () => {},
  resetKey: 0,
  triggerReset: () => {},
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
  const [alternates, setAlternates] = useState<Record<string, string>>({});
  const [resetKey, setResetKey] = useState(0);
  const triggerReset = () => setResetKey((k) => k + 1);

  useEffect(() => {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang && VALID_LANGS.includes(urlLang as Lang)) {
      setLangState(urlLang as Lang);
      setCookie(COOKIE_NAME, urlLang, 365);
      return;
    }
    const savedLang = getCookie(COOKIE_NAME);
    if (savedLang && VALID_LANGS.includes(savedLang as Lang)) {
      setLangState(savedLang as Lang);
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
    <LanguageContext.Provider value={{ lang, setLang, alternates, setAlternates, resetKey, triggerReset }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
