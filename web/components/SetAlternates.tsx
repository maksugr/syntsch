"use client";

import { useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

export default function SetAlternates({ alternates }: { alternates: Record<string, string> }) {
  const { setAlternates } = useLanguage();

  useEffect(() => {
    setAlternates(alternates);
    return () => setAlternates({});
  }, [alternates, setAlternates]);

  return null;
}
