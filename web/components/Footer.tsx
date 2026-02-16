"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";
import PtytschIcon from "./PtytschIcon";

export default function Footer() {
  const { lang, triggerReset } = useLanguage();
  const router = useRouter();

  const handleLogoClick = () => {
    triggerReset();
    router.push("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-1.5 text-base md:text-lg tracking-widest uppercase cursor-pointer"
            style={{ fontFamily: "var(--font-bebas, var(--font-display))", color: "#999999", background: "none", border: "none", padding: 0 }}
          >
            <PtytschIcon className="w-4 md:w-5" color="#999999" />
            PTYTSCH
          </button>
          <a
            href="mailto:hi@ptytsch.de"
            className="font-mono text-[10px] tracking-wide no-underline transition-colors duration-100"
            style={{ color: "#999999", textDecoration: "none" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
          >
            hi@ptytsch.de
          </a>
          <div className="flex gap-2 font-mono text-[10px] tracking-wide">
            <Link
              href="/impressum"
              className="no-underline transition-colors duration-100"
              style={{ color: "#999999", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
            >
              {tUi(lang, "impressum")}
            </Link>
            <span style={{ color: "#cccccc" }}>·</span>
            <Link
              href="/privacy"
              className="no-underline transition-colors duration-100"
              style={{ color: "#999999", textDecoration: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#000000")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#999999")}
            >
              {tUi(lang, "privacy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
