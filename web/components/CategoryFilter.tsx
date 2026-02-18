"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORY_COLORS } from "@/lib/types";
import { tCategory } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";

const CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function CategoryFilter() {
  const { lang, articleCategory } = useLanguage();
  const searchParams = useSearchParams();

  const categoryFromUrl = searchParams.get("cat");
  const category = categoryFromUrl && CATEGORIES.includes(categoryFromUrl) ? categoryFromUrl : null;
  const highlighted = category || articleCategory;

  return (
    <>
      {CATEGORIES.map((c) => {
        const isHighlighted = highlighted === c;
        const href = category === c ? `/${lang}/` : `/${lang}/?cat=${c}`;

        return (
          <Link
            key={c}
            href={href}
            className="lowercase tracking-wide font-mono text-sm transition-colors duration-100 no-underline"
            style={{
              color: isHighlighted ? "#000000" : "#999999",
              fontWeight: isHighlighted ? 700 : 400,
              textDecoration: "none",
            }}
            scroll={false}
          >
            {tCategory(lang, c)}
          </Link>
        );
      })}
    </>
  );
}
