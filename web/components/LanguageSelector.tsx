"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import type { Lang } from "@/lib/translations";

const LANGS: Lang[] = ["en", "de", "ru"];

export default function LanguageSelector() {
  const { lang, setLang, alternates } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const handleLangSwitch = (newLang: Lang) => {
    setLang(newLang);
    if (alternates[newLang]) {
      router.push(`/article/${alternates[newLang]}`);
    }
  };

  return (
    <div className="flex items-center gap-3 font-mono text-sm mt-2">
      {LANGS.map((l) => {
        const hasAlt = pathname.startsWith("/article/") && !alternates[l] && l !== lang;
        return (
          <button
            key={l}
            onClick={() => handleLangSwitch(l)}
            disabled={hasAlt}
            className="lowercase tracking-wide transition-colors duration-100"
            style={{
              color: hasAlt ? "#dddddd" : lang === l ? "#000000" : "#999999",
              fontWeight: lang === l ? 700 : 400,
              background: "none",
              border: "none",
              padding: 0,
              cursor: hasAlt ? "default" : "pointer",
            }}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}
