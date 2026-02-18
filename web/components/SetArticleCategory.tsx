"use client";

import { useEffect } from "react";
import { useLanguage } from "./LanguageProvider";

export default function SetArticleCategory({ category }: { category: string | null }) {
  const { setArticleCategory } = useLanguage();

  useEffect(() => {
    setArticleCategory(category);
    return () => setArticleCategory(null);
  }, [category, setArticleCategory]);

  return null;
}
