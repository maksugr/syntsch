"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";
import PtytschIcon from "./PtytschIcon";

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="border-t-4 border-black px-6 md:px-10 lg:px-16 py-6 mt-16 flex items-end justify-between">
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
      <span
        className="flex items-center gap-1.5 text-base md:text-lg tracking-widest uppercase"
        style={{ fontFamily: "var(--font-bebas, var(--font-display))", color: "#999999" }}
      >
        <PtytschIcon className="w-4 md:w-5" color="#999999" />
        PTYTSCH
      </span>
    </footer>
  );
}
