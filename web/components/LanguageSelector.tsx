"use client";

import { usePathname } from "next/navigation";
import { useLanguage, type ViewMode } from "./LanguageProvider";
import type { Lang } from "@/lib/translations";

const LANGS: Lang[] = ["en", "de", "ru"];

export default function LanguageSelector() {
  const { lang, setLang, viewMode, setViewMode } = useLanguage();
  const pathname = usePathname();

  if (pathname !== "/") {
    return <div className="mt-2 h-5" />;
  }

  return (
    <div className="flex items-center gap-3 font-mono text-sm mt-2">
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="lowercase tracking-wide transition-colors duration-100"
          style={{
            color: lang === l ? "#000000" : "#999999",
            fontWeight: lang === l ? 700 : 400,
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
        >
          {l}
        </button>
      ))}

      <span style={{ color: "#cccccc" }} className="select-none">·</span>

      <button
        onClick={() => setViewMode("single")}
        className="transition-colors duration-100"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        aria-label="Single article view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="2" y="1" width="12" height="14" rx="1" stroke={viewMode === "single" ? "#000000" : "#999999"} strokeWidth="1.5" />
          <line x1="5" y1="5" x2="11" y2="5" stroke={viewMode === "single" ? "#000000" : "#999999"} strokeWidth="1" />
          <line x1="5" y1="8" x2="11" y2="8" stroke={viewMode === "single" ? "#000000" : "#999999"} strokeWidth="1" />
          <line x1="5" y1="11" x2="9" y2="11" stroke={viewMode === "single" ? "#000000" : "#999999"} strokeWidth="1" />
        </svg>
      </button>

      <button
        onClick={() => setViewMode("grid")}
        className="transition-colors duration-100"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
        aria-label="Grid view"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <rect x="1" y="1" width="6" height="6" rx="0.5" stroke={viewMode === "grid" ? "#000000" : "#999999"} strokeWidth="1.5" />
          <rect x="9" y="1" width="6" height="6" rx="0.5" stroke={viewMode === "grid" ? "#000000" : "#999999"} strokeWidth="1.5" />
          <rect x="1" y="9" width="6" height="6" rx="0.5" stroke={viewMode === "grid" ? "#000000" : "#999999"} strokeWidth="1.5" />
          <rect x="9" y="9" width="6" height="6" rx="0.5" stroke={viewMode === "grid" ? "#000000" : "#999999"} strokeWidth="1.5" />
        </svg>
      </button>
    </div>
  );
}
