"use client";

import { useState } from "react";
import Link from "next/link";
import type { ArticleWithEvent } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { tCategory, tUi, formatDate, isDatePast, readingTime } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";
import ArticleCard from "./ArticleCard";
import ArticleBody from "./ArticleBody";
import CategoryTag from "./CategoryTag";

const CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function ArticleFeed({ articles }: { articles: ArticleWithEvent[] }) {
  const { lang, viewMode } = useLanguage();
  const [category, setCategory] = useState<string | null>(null);
  const [visible, setVisible] = useState(10);

  const filtered = articles.filter((a) => {
    if (a.language.toLowerCase() !== lang) return false;
    if (category && a.event.category !== category) return false;
    return true;
  });

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  return (
    <div>
      <div className="pb-6 mb-0">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const color = CATEGORY_COLORS[c];
            const active = category === c;
            return (
              <button
                key={c}
                onClick={() => { setCategory(active ? null : c); setVisible(10); }}
                className="pr-5 text-2xl md:text-3xl uppercase leading-none tracking-tight transition-all duration-100 cursor-pointer"
                style={{
                  fontFamily: 'var(--font-display)',
                  background: "none",
                  border: "none",
                  padding: 0,
                  paddingRight: "1.25rem",
                  color: active ? "#000000" : color,
                  opacity: active ? 1 : 0.6,
                  textDecorationLine: active ? "underline" : "none",
                  textDecorationStyle: "solid",
                  textUnderlineOffset: "6px",
                  textDecorationThickness: "4px",
                  textDecorationColor: color,
                }}
              >
                {tCategory(lang, c)}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p
            className="text-6xl md:text-8xl lg:text-[10rem] leading-[0.85]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tUi(lang, "nothingYet")}
          </p>
        </div>
      ) : viewMode === "single" ? (
        <LatestArticle article={filtered[0]} />
      ) : (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0 pt-8">
            {shown.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
          {hasMore && (
            <div className="pt-10 text-center">
              <button
                onClick={() => setVisible((v) => v + 10)}
                className="text-3xl md:text-5xl uppercase tracking-tight cursor-pointer"
                style={{
                  fontFamily: "var(--font-display)",
                  background: "none",
                  border: "none",
                  padding: 0,
                  color: "#999999",
                }}
              >
                {tUi(lang, "loadMore")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LatestArticle({ article }: { article: ArticleWithEvent }) {
  const { lang, setViewMode } = useLanguage();
  const rawDate = article.event.start_date || article.written_at.split("T")[0];
  const date = formatDate(lang, rawDate);
  const color = CATEGORY_COLORS[article.event.category || ""] || "#666666";

  return (
    <div className="max-w-3xl mx-auto pt-8">
      <div className="mb-6">
        <CategoryTag category={article.event.category} />
      </div>

      <h1
        className="text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {article.title}
      </h1>

      <div
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-3 text-xs font-mono font-bold uppercase tracking-[0.2em] mb-8"
        style={{ color: "#999999" }}
      >
        {article.event.venue && <span>{article.event.venue}</span>}
        {rawDate && <span style={isDatePast(rawDate) ? { textDecoration: "line-through" } : undefined}>{date}</span>}
        <span className="text-[8px]">{readingTime(article.word_count)} {tUi(lang, "minRead")}</span>
      </div>

      {article.lead && (
        <p
          className="text-xl md:text-2xl leading-relaxed mb-10"
          style={{ color: "#666666" }}
        >
          {article.lead}
        </p>
      )}

      <ArticleBody body={article.body} />

      <div className="mt-12 mb-8 flex gap-6">
        <Link
          href={`/article/${article.slug}`}
          className="font-mono text-sm tracking-wide no-underline transition-colors duration-100"
          style={{ color: "#999999" }}
        >
          {tUi(lang, "permalink")} →
        </Link>
        <button
          onClick={() => {
            setViewMode("grid");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="font-mono text-sm tracking-wide transition-colors duration-100 cursor-pointer"
          style={{ color: "#999999", background: "none", border: "none", padding: 0 }}
        >
          {tUi(lang, "allArticles")} ↑
        </button>
      </div>
    </div>
  );
}
