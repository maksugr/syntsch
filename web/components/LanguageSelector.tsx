"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import type { Lang } from "@/lib/translations";

const LANGS: Lang[] = ["en", "de", "ru"];

export default function LanguageSelector() {
  const { lang, setLang } = useLanguage();
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
    </div>
  );
}
