"use client";

import type { Reflection } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { tUi, tCategory } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";
import Link from "next/link";

const LABEL = "block text-xs uppercase tracking-[0.2em] mb-1";
const LABEL_STYLE = { color: "#666666" };
const SECTION_TITLE = "text-lg md:text-xl font-bold leading-tight mb-4 uppercase";
const SECTION_TITLE_STYLE = { fontFamily: "var(--font-display)" };

function StatRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className={LABEL} style={LABEL_STYLE}>{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </div>
  );
}

function DeltaValue({ value, suffix }: { value: number; suffix?: string }) {
  const sign = value > 0 ? "+" : "";
  return (
    <span className="font-bold tabular-nums">
      {sign}{value}{suffix}
    </span>
  );
}

function CategoryBar({ categories }: { categories: Record<string, number> }) {
  const entries = Object.entries(categories);
  if (!entries.length) return null;
  const max = Math.max(...entries.map(([, c]) => c));

  return (
    <div className="space-y-1.5 mt-2">
      {entries.map(([cat, count]) => (
        <div key={cat} className="flex items-center gap-2">
          <span className="w-20 text-xs truncate">{cat}</span>
          <div className="flex-1 h-3 bg-gray-100">
            <div
              className="h-full"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: CATEGORY_COLORS[cat] || "#666",
              }}
            />
          </div>
          <span className="text-xs tabular-nums w-4 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function ReflectionSidebar({ analysis }: { analysis: Reflection["analysis"] }) {
  const { lang } = useLanguage();

  return (
    <aside className="border-4 border-black p-6 md:p-8 sticky top-8 font-mono text-sm">
      <h3 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>
        {tUi(lang, "statScale")}
      </h3>

      <div className="space-y-3">
        <StatRow label={tUi(lang, "statArticles")} value={analysis.article_count} />
        <StatRow label={tUi(lang, "statTotalWords")} value={analysis.total_words.toLocaleString()} />
        {analysis.words_per_day != null && (
          <StatRow label={tUi(lang, "statWordsPerDay")} value={analysis.words_per_day} />
        )}
        <StatRow label={tUi(lang, "statAvgWords")} value={analysis.avg_words} />
        {analysis.median_words != null && (
          <StatRow label={tUi(lang, "statMedianWords")} value={analysis.median_words} />
        )}
      </div>

      <div className="border-t-2 border-black mt-6 pt-6">
        <h4 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>{tUi(lang, "statCoverage")}</h4>

        <CategoryBar categories={analysis.categories} />

        {analysis.dominant_category && (
          <div className="mt-4">
            <StatRow
              label={tUi(lang, "statDominant")}
              value={`${tCategory(lang, analysis.dominant_category.name)} (${analysis.dominant_category.pct}%)`}
            />
          </div>
        )}

        {analysis.missing_categories && analysis.missing_categories.length > 0 && (
          <div className="mt-3">
            <span className={LABEL} style={LABEL_STYLE}>{tUi(lang, "statMissing")}</span>
            <span className="block mt-1">
              {analysis.missing_categories.map((c) => tCategory(lang, c)).join(", ")}
            </span>
          </div>
        )}

        {analysis.unique_venues_count != null && (
          <div className="mt-3">
            <StatRow label={tUi(lang, "statUniqueVenues")} value={analysis.unique_venues_count} />
          </div>
        )}

        {analysis.venue_concentration && (
          <div className="mt-3">
            <StatRow
              label={tUi(lang, "statTopVenue")}
              value={`${analysis.venue_concentration.name} (${analysis.venue_concentration.pct}%)`}
            />
          </div>
        )}
      </div>

      {(analysis.longest_article || analysis.shortest_article) && (
        <div className="border-t-2 border-black mt-6 pt-6">
          <h4 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>{tUi(lang, "statExtremes")}</h4>
          <div className="space-y-3 mt-2">
            {analysis.longest_article && (
              <div>
                <span className={LABEL} style={LABEL_STYLE}>{tUi(lang, "statLongest")}</span>
                <Link
                  href={`/${lang}/article/${analysis.longest_article.slug}/`}
                  className="block hover:underline"
                >
                  {analysis.longest_article.title}
                </Link>
                <span className="text-xs" style={{ color: "#666" }}>
                  {analysis.longest_article.word_count} {tUi(lang, "processWords")}
                </span>
              </div>
            )}
            {analysis.shortest_article && (
              <div>
                <span className={LABEL} style={LABEL_STYLE}>{tUi(lang, "statShortest")}</span>
                <Link
                  href={`/${lang}/article/${analysis.shortest_article.slug}/`}
                  className="block hover:underline"
                >
                  {analysis.shortest_article.title}
                </Link>
                <span className="text-xs" style={{ color: "#666" }}>
                  {analysis.shortest_article.word_count} {tUi(lang, "processWords")}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {analysis.process_stats && (
        <div className="border-t-2 border-black mt-6 pt-6">
          <h4 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>{tUi(lang, "statProcess")}</h4>
          <div className="space-y-3 mt-2">
            <StatRow label={tUi(lang, "statAvgIssues")} value={analysis.process_stats.avg_critique_issues} />
            <StatRow label={tUi(lang, "statExpanded")} value={`${analysis.process_stats.expanded_pct}%`} />
            <StatRow label={tUi(lang, "statWordGrowth")} value={`${analysis.process_stats.avg_word_growth_pct > 0 ? "+" : ""}${analysis.process_stats.avg_word_growth_pct}%`} />
            <StatRow label={tUi(lang, "statSources")} value={analysis.process_stats.total_research_sources} />
          </div>
        </div>
      )}

      {analysis.previous_comparison && (
        <div className="border-t-2 border-black mt-6 pt-6">
          <h4 className={SECTION_TITLE} style={SECTION_TITLE_STYLE}>{tUi(lang, "statVsPrevious")}</h4>
          <div className="space-y-3 mt-2">
            <div className="flex justify-between items-baseline gap-2">
              <span className={LABEL} style={LABEL_STYLE}>{tUi(lang, "statArticles")}</span>
              <DeltaValue value={analysis.previous_comparison.articles_delta} />
            </div>
            <div className="flex justify-between items-baseline gap-2">
              <span className={LABEL} style={LABEL_STYLE}>{tUi(lang, "statTotalWords")}</span>
              <DeltaValue value={analysis.previous_comparison.words_delta} />
            </div>

            {analysis.previous_comparison.new_venues.length > 0 && (
              <div>
                <span className={LABEL} style={LABEL_STYLE}>{tUi(lang, "statNewVenues")}</span>
                <span className="block mt-1">{analysis.previous_comparison.new_venues.join(", ")}</span>
              </div>
            )}

            {analysis.previous_comparison.lost_venues.length > 0 && (
              <div>
                <span className={LABEL} style={LABEL_STYLE}>{tUi(lang, "statLostVenues")}</span>
                <span className="block mt-1">{analysis.previous_comparison.lost_venues.join(", ")}</span>
              </div>
            )}

            {Object.keys(analysis.previous_comparison.category_shifts).length > 0 && (
              <div className="space-y-1">
                {Object.entries(analysis.previous_comparison.category_shifts).map(([cat, delta]) => (
                  <div key={cat} className="flex justify-between items-baseline gap-2">
                    <span className="text-xs">{tCategory(lang, cat)}</span>
                    <DeltaValue value={delta} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
