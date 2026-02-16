"use client";

import Link from "next/link";
import LanguageSelector from "./LanguageSelector";
import PtytschIcon from "./PtytschIcon";
import { useLanguage } from "./LanguageProvider";

export default function Header() {
  const { lang } = useLanguage();

  return (
    <header className="border-b-4 border-black px-6 md:px-10 lg:px-16 pt-8 pb-4 md:pt-12 md:pb-6">
      <Link
        href={`/${lang}/`}
        className="flex items-end gap-3 md:gap-5 no-underline"
        style={{ width: "fit-content", lineHeight: 0, textDecoration: "none" }}
      >
        <h1
          className="text-[18vw] md:text-[14vw] lg:text-[12vw] leading-[0.85] tracking-tight"
          style={{ fontFamily: 'var(--font-bebas), sans-serif', color: '#000000' }}
        >
          PTYTSCH
        </h1>
        <PtytschIcon className="w-[6vw] md:w-[5vw] lg:w-[4vw] mb-[0.5vw]" color="#000" />
      </Link>
      <LanguageSelector />
    </header>
  );
}
