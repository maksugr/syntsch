"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaTelegram } from "react-icons/fa";
import { useLanguage } from "./LanguageProvider";
import { LANGUAGES } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

function buildLangUrl(pathname: string, currentLang: Lang, targetLang: Lang, alternates: Record<string, string>): string | null {
  const articleMatch = pathname.match(/^\/[a-z]{2}\/article\/([^/]+)/);
  if (articleMatch) {
    const altSlug = alternates[targetLang];
    if (!altSlug) return null;
    return `/${targetLang}/article/${altSlug}/`;
  }
  return pathname.replace(/^\/[a-z]{2}(\/|$)/, `/${targetLang}$1`);
}

export default function LanguageSelector() {
  const { lang, alternates } = useLanguage();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-3 font-mono text-sm" style={{ width: "fit-content" }}>
      {LANGUAGES.map((l) => {
        const url = buildLangUrl(pathname, lang, l, alternates);
        const disabled = url === null;

        if (disabled || l === lang) {
          return (
            <span
              key={l}
              className="lowercase tracking-wide"
              style={{
                color: disabled ? "#dddddd" : "#000000",
                fontWeight: l === lang ? 700 : 400,
                cursor: disabled ? "default" : "default",
              }}
            >
              {l}
            </span>
          );
        }

        return (
          <Link
            key={l}
            href={url}
            className="lowercase tracking-wide transition-colors duration-100 no-underline"
            style={{
              color: "#999999",
              fontWeight: 400,
              textDecoration: "none",
            }}
          >
            {l}
          </Link>
        );
      })}
      {lang === "ru" && (
        <>
          <span style={{ color: "#999999" }}>·</span>
          <a
            href="https://t.me/ptytsch"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-100"
            style={{ color: "#999999", display: "flex", alignItems: "center" }}
          >
            <FaTelegram size={15} />
          </a>
        </>
      )}
    </div>
  );
}
