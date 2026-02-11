"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";
import PtytschIcon from "./PtytschIcon";

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="border-t-4 border-black px-6 md:px-10 lg:px-16 py-6 mt-16">
      <div className="flex items-center justify-between">
        <Link
          href="/about"
          className="no-underline"
          style={{ textDecoration: "none" }}
        >
          <span
            className="text-[9vw] md:text-[7vw] lg:text-[6vw] leading-[0.85] tracking-tight uppercase"
            style={{ fontFamily: "var(--font-display)", color: "#000000" }}
          >
            {tUi(lang, "aboutTitle")}
          </span>
        </Link>
        <div className="flex flex-col items-end gap-1">
          <span
            className="flex items-center gap-1.5 text-base md:text-lg tracking-widest uppercase"
            style={{ fontFamily: "var(--font-bebas, var(--font-display))", color: "#999999" }}
          >
            <PtytschIcon className="w-4 md:w-5" color="#999999" />
            PTYTSCH
          </span>
          <a
            href="mailto:hi@ptytsch.de"
            className="font-mono text-[10px] tracking-wide no-underline transition-colors duration-100"
            style={{ color: "#999999", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
          >
            hi@ptytsch.de
          </a>
        </div>
      </div>
    </footer>
  );
}
