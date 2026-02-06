"use client";

import Link from "next/link";
import type { EssayWithEvent } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { formatDate, tCategory } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";

export default function EssayCard({ essay }: { essay: EssayWithEvent }) {
  const { lang } = useLanguage();
  const rawDate = essay.event.start_date || essay.written_at.split("T")[0];
  const date = formatDate(lang, rawDate);
  const color = CATEGORY_COLORS[essay.event.category || ""] || "#666666";

  return (
    <Link
      href={`/article/${essay.id}`}
      className="essay-card block no-underline p-6 md:p-8 -ml-6 md:-ml-8"
      style={{ '--cat-color': color } as React.CSSProperties}
    >
      <div className="mb-4">
        <span
          className="card-category text-sm font-mono font-bold uppercase tracking-[0.2em]"
          style={{ color }}
        >
          {tCategory(lang, essay.event.category || "")}
        </span>
      </div>

      <h2
        className="card-title text-4xl md:text-5xl lg:text-6xl leading-[0.85] mb-5"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {essay.title}
      </h2>

      {essay.lead && (
        <p
          className="card-lead text-base leading-relaxed mb-5 max-w-xl"
          style={{ color: '#666666' }}
        >
          {essay.lead}
        </p>
      )}

      <div
        className="card-meta flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-[0.2em]"
        style={{ color: '#999999' }}
      >
        {essay.event.venue && <span>{essay.event.venue}</span>}
        {essay.event.venue && rawDate && <span>/</span>}
        {rawDate && <span>{date}</span>}
      </div>
    </Link>
  );
}
