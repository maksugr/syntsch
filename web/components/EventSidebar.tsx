"use client";

import type { Event } from "@/lib/types";
import { tUi, formatDate, isDatePast } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";
import CategoryTag from "./CategoryTag";

export default function EventSidebar({ event }: { event: Event }) {
  const { lang } = useLanguage();

  return (
    <aside className="border-4 border-black p-6 md:p-8 sticky top-8">
      <h3
        className="text-3xl md:text-4xl font-bold leading-tight mb-6"
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {event.name}
      </h3>

      <div className="border-t-2 border-black pt-5 space-y-5 font-mono text-sm">
        <div>
          <CategoryTag category={event.category} />
        </div>

        {event.start_date && (
          <div>
            <span className="block text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#666666' }}>
              {tUi(lang, "date")}
            </span>
            <span style={isDatePast(event.end_date || event.start_date) ? { textDecoration: "line-through" } : undefined}>
              {formatDate(lang, event.start_date)}
              {event.end_date && event.end_date !== event.start_date && (
                <> &mdash; {formatDate(lang, event.end_date)}</>
              )}
            </span>
          </div>
        )}

        {event.venue && (
          <div>
            <span className="block text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#666666' }}>
              {tUi(lang, "venue")}
            </span>
            <span>{event.venue}</span>
          </div>
        )}

        {event.city && (
          <div>
            <span className="block text-xs uppercase tracking-[0.2em] mb-1" style={{ color: '#666666' }}>
              {tUi(lang, "city")}
            </span>
            <span>{event.city}</span>
          </div>
        )}

        {event.event_url && (
          <div className="pt-2">
            <a
              href={event.event_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold"
              style={{ color: '#000000' }}
            >
              {tUi(lang, "eventLink")} &rarr;
            </a>
          </div>
        )}

      </div>
    </aside>
  );
}
