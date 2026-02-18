"use client";

import { useState, Fragment } from "react";
import { useSearchParams } from "next/navigation";
import type { ArticleWithEvent } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { tUi } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";
import ArticleCard from "./ArticleCard";
import SubscribeCard from "./SubscribeCard";

const CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function ArticleFeed({ articles }: { articles: ArticleWithEvent[] }) {
  const { lang } = useLanguage();
  const searchParams = useSearchParams();

  const categoryFromUrl = searchParams.get("cat");
  const category = categoryFromUrl && CATEGORIES.includes(categoryFromUrl) ? categoryFromUrl : null;
  const [visible, setVisible] = useState(10);

  const filtered = category ? articles.filter((a) => a.event.category === category) : articles;

  const shown = filtered.slice(0, visible);
  const hasMore = filtered.length > visible;

  return (
    <div>
      {filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p
            className="text-6xl md:text-8xl lg:text-[10rem] leading-[0.85]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {tUi(lang, "nothingYet")}
          </p>
        </div>
      ) : (
        <div>
          <ArticleCard article={shown[0]} featured />
          {shown.length > 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0 mt-4">
              {shown.slice(1).map((article, i) => (
                i === 1
                  ? <Fragment key={article.id}><SubscribeCard /><ArticleCard article={article} /></Fragment>
                  : <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
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
