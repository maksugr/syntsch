"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LanguageSelector from "./LanguageSelector";
import CategoryFilter from "./CategoryFilter";
import SyntschIcon from "./SyntschIcon";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";

export default function Header() {
  const { lang } = useLanguage();
  const pathname = usePathname();
  const onReflections = pathname.startsWith(`/${lang}/reflections`);

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
          SYNTSCH
        </h1>
        <SyntschIcon className="w-[6vw] md:w-[5vw] lg:w-[4vw] mb-[0.5vw]" color="#000" />
      </Link>
      <div className="mt-2">
        <LanguageSelector />
      </div>
      <Suspense>
        <div className="flex items-start justify-between gap-4 mt-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <CategoryFilter />
          </div>
          <Link
            href={`/${lang}/reflections/`}
            className="font-mono text-sm lowercase tracking-wide transition-colors duration-100 no-underline shrink-0"
            style={{
              color: onReflections ? "#000000" : "#999999",
              fontWeight: onReflections ? 700 : 400,
              textDecoration: "none",
            }}
          >
            {tUi(lang, "reflections")}
          </Link>
        </div>
      </Suspense>
    </header>
  );
}
