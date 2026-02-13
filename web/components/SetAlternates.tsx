"use client";

import { useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import type { Lang } from "@/lib/translations";

export default function SetAlternates({ alternates, articleLang }: { alternates: Record<string, string>; articleLang?: string }) {
  const { setAlternates, setTempLang, restoreLang } = useLanguage();

  useEffect(() => {
    setAlternates(alternates);
    return () => setAlternates({});
  }, [alternates, setAlternates]);

  useEffect(() => {
    if (articleLang) {
      setTempLang(articleLang as Lang);
      return () => restoreLang();
    }
  }, [articleLang, setTempLang, restoreLang]);

  return null;
}
