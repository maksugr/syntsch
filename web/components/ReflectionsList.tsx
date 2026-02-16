"use client";

import Link from "next/link";
import type { Reflection } from "@/lib/types";
import { useLanguage } from "./LanguageProvider";
import { formatDate, tUi, typograph } from "@/lib/translations";

export default function ReflectionsList({ reflections }: { reflections: Reflection[] }) {
  const { lang } = useLanguage();

  if (reflections.length === 0) {
    return (
      <div className="py-24 text-center">
        <p
          className="text-6xl md:text-8xl lg:text-[10rem] leading-[0.85]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tUi(lang, "nothingYet")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      <p
        className="font-mono text-xs leading-relaxed mb-10 max-w-2xl"
        style={{ color: "#999999" }}
      >
        {typograph(tUi(lang, "reflectionsAbout"), lang)}
      </p>
      {reflections.map((r) => (
        <Link
          key={r.id}
          href={`/${lang}/reflections/${r.slug}/`}
          className="block py-8 px-6 -mx-6 no-underline transition-colors duration-100 hover:bg-black/[0.02]"
          style={{ textDecoration: "none" }}
        >
          <h2
            className="text-3xl md:text-5xl leading-[0.9] mb-3"
            style={{ fontFamily: "var(--font-display)", color: "#000" }}
          >
            {r.title}
          </h2>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-mono" style={{ color: "#999" }}>
            <span>
              {formatDate(lang, r.period_start)} — {formatDate(lang, r.period_end)}
            </span>
            <span>
              {r.analysis.article_count} {tUi(lang, "articlesAnalyzed")}
            </span>
          </div>
          <p
            className="mt-4 text-lg leading-relaxed line-clamp-3"
            style={{ fontFamily: "var(--font-body)", color: "#333" }}
          >
            {r.body.split("\n\n")[0]?.slice(0, 300)}
          </p>
        </Link>
      ))}
    </div>
  );
}
