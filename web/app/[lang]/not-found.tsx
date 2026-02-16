"use client";

import Link from "next/link";
import { useLanguage } from "@/components/LanguageProvider";
import { tUi } from "@/lib/translations";

export default function NotFound() {
  const { lang } = useLanguage();

  return (
    <div className="py-24 text-center">
      <h1
        className="text-6xl md:text-8xl lg:text-[10rem] leading-[0.85] mb-12"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {tUi(lang, "notFound")}
      </h1>
      <Link
        href={`/${lang}/`}
        className="font-mono text-sm tracking-wide no-underline transition-colors duration-100"
        style={{ color: "#999999", textDecoration: "none" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
      >
        ← {tUi(lang, "backHome")}
      </Link>
    </div>
  );
}
