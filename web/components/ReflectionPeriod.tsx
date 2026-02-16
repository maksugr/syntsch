"use client";

import { useLanguage } from "./LanguageProvider";
import { formatDate, tUi } from "@/lib/translations";

export default function ReflectionPeriod({
  periodStart,
  periodEnd,
  articleCount,
}: {
  periodStart: string;
  periodEnd: string;
  articleCount: number;
}) {
  const { lang } = useLanguage();

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm font-mono mt-4" style={{ color: "#999" }}>
      <span>
        {tUi(lang, "periodCovered")}: {formatDate(lang, periodStart)} — {formatDate(lang, periodEnd)}
      </span>
      <span>
        {articleCount} {tUi(lang, "articlesAnalyzed")}
      </span>
    </div>
  );
}
