"use client";

import { CATEGORY_COLORS } from "@/lib/types";
import { tCategory } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";

export default function CategoryTag({
  category,
}: {
  category: string | null;
}) {
  const { lang } = useLanguage();

  if (!category) return null;

  const color = CATEGORY_COLORS[category] || "#8C8478";

  return (
    <span
      className="inline-block px-3 py-1 text-xs font-mono font-bold uppercase tracking-[0.2em]"
      style={{ background: color, color: "#F2EDE8" }}
    >
      {tCategory(lang, category)}
    </span>
  );
}
