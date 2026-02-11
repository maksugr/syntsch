"use client";

import Link from "next/link";
import type { ArticleWithEvent } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { formatDate, tCategory, isDatePast, readingTime, tUi } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";

export default function ArticleCard({ article, featured }: { article: ArticleWithEvent; featured?: boolean }) {
  const { lang } = useLanguage();
  const rawDate = article.event.start_date || article.written_at.split("T")[0];
  const date = formatDate(lang, rawDate);
  const color = CATEGORY_COLORS[article.event.category || ""] || "#666666";

  if (featured) {
    return (
      <Link
        href={`/article/${article.slug}`}
        className="article-card block no-underline -mx-6 md:-mx-10 lg:-mx-16"
        style={{ '--cat-color': color } as React.CSSProperties}
      >
        <div className="p-6 md:p-12 lg:px-16">
          <span
            className="card-category text-sm font-mono font-bold uppercase tracking-[0.2em]"
            style={{ color }}
          >
            {tCategory(lang, article.event.category || "")}
          </span>

          <h2
            className="card-title text-5xl md:text-7xl lg:text-8xl leading-[0.85] mt-4 mb-6"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {article.title}
          </h2>

          {article.lead && (
            <p
              className="card-lead text-lg md:text-xl leading-relaxed mb-8 max-w-2xl"
              style={{ color: '#666666' }}
            >
              {article.lead}
            </p>
          )}

          <div
            className="card-meta flex flex-col md:flex-row md:items-center md:justify-between gap-1 max-w-2xl text-xs font-mono font-bold uppercase tracking-[0.2em]"
            style={{ color: '#999999' }}
          >
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
              {article.event.venue && <><span>{article.event.venue}</span><span className="hidden md:inline font-normal">/</span></>}
              {rawDate && <span style={isDatePast(rawDate) ? { textDecoration: "line-through" } : undefined}>{date}</span>}
            </div>
            <span className="text-[8px]">{readingTime(article.word_count)} {tUi(lang, "minRead")}</span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/article/${article.slug}`}
      className="article-card block no-underline p-6 md:p-8 -ml-6 md:-ml-8"
      style={{ '--cat-color': color } as React.CSSProperties}
    >
      <div className="mb-4">
        <span
          className="card-category text-sm font-mono font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {tCategory(lang, article.event.category || "")}
        </span>
      </div>

      <h2
        className="card-title text-4xl md:text-5xl lg:text-6xl leading-[0.85] mb-5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {article.title}
      </h2>

      {article.lead && (
        <p
          className="card-lead text-base leading-relaxed mb-5 max-w-xl"
          style={{ color: '#666666' }}
        >
          {article.lead}
        </p>
      )}

      <div
        className="card-meta flex flex-col md:flex-row md:items-center md:justify-between gap-1 text-xs font-mono font-bold uppercase tracking-[0.2em]"
        style={{ color: '#999999' }}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-1">
          {article.event.venue && <><span>{article.event.venue}</span><span className="hidden md:inline font-normal">/</span></>}
          {rawDate && <span style={isDatePast(rawDate) ? { textDecoration: "line-through" } : undefined}>{date}</span>}
        </div>
        <span className="text-[8px]">{readingTime(article.word_count)} {tUi(lang, "minRead")}</span>
      </div>
    </Link>
  );
}
