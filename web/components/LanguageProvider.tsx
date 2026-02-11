"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Lang } from "@/lib/translations";

export type ViewMode = "single" | "grid";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  viewMode: "single",
  setViewMode: () => {},
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
const VIEW_COOKIE = "ptytsch_view";
const VALID_VIEWS: ViewMode[] = ["single", "grid"];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [viewMode, setViewModeState] = useState<ViewMode>("single");

  useEffect(() => {
    const savedLang = getCookie(COOKIE_NAME);
    if (savedLang && VALID_LANGS.includes(savedLang as Lang)) {
      setLangState(savedLang as Lang);
    }
    const savedView = getCookie(VIEW_COOKIE);
    if (savedView && VALID_VIEWS.includes(savedView as ViewMode)) {
      setViewModeState(savedView as ViewMode);
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

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    setCookie(VIEW_COOKIE, mode, 365);
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, viewMode, setViewMode }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
