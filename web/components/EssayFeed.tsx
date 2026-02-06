"use client";

import { useState } from "react";
import type { EssayWithEvent } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { tCategory, tUi } from "@/lib/translations";
import { useLanguage } from "./LanguageProvider";
import EssayCard from "./EssayCard";

const CATEGORIES = Object.keys(CATEGORY_COLORS);

export default function EssayFeed({ essays }: { essays: EssayWithEvent[] }) {
  const { lang } = useLanguage();
  const [category, setCategory] = useState<string | null>(null);

  const filtered = essays.filter((e) => {
    if (e.language.toLowerCase() !== lang) return false;
    if (category && e.event.category !== category) return false;
    return true;
  });

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
                onClick={() => setCategory(active ? null : c)}
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-0 pt-8">
          {filtered.map((essay) => (
            <EssayCard key={essay.id} essay={essay} />
          ))}
        </div>
      )}
    </div>
  );
}
