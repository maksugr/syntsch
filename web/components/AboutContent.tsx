"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";

export default function AboutContent() {
    const { lang } = useLanguage();

    return (
        <div className="max-w-3xl mx-auto pt-4 md:pt-8">
            <h1
                className="text-6xl md:text-8xl lg:text-[10rem] leading-[0.85] mb-12 md:mb-16"
                style={{ fontFamily: "var(--font-display)" }}
            >
                {tUi(lang, "aboutTitle")}
            </h1>

            <div className="space-y-8 md:space-y-10">
                <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed">
                    {tUi(lang, "aboutText1")}
                </p>

                <p
                    className="text-2xl md:text-3xl lg:text-4xl leading-tight border-l-4 border-black pl-6 md:pl-8"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    {tUi(lang, "aboutText2")}
                </p>

                <div
                    className="text-lg md:text-xl leading-relaxed space-y-2"
                    style={{ color: "#666666" }}
                >
                    {tUi(lang, "aboutText3")
                        .split(". ")
                        .map((sentence, i, arr) => (
                            <p key={i}>
                                {sentence}
                                {i < arr.length - 1 ? "." : ""}
                            </p>
                        ))}
                </div>
            </div>

            <div className="mt-16 md:mt-24 pt-8 border-t-4 border-black">
                <p className="font-mono text-sm mb-6" style={{ color: "#999999" }}>
                    {tUi(lang, "weAreClose")}{" — "}
                    <a
                        href="mailto:hi@ptytsch.de"
                        className="no-underline transition-colors duration-100"
                        style={{ color: "#999999", textDecoration: "none" }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#000000")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#999999")
                        }
                    >
                        hi@ptytsch.de
                    </a>
                </p>
                <Link
                    href="/"
                    className="font-mono text-sm tracking-wide no-underline transition-colors duration-100"
                    style={{ color: "#999999", textDecoration: "none" }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#000000")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#999999")
                    }
                >
                    ← PTYTSCH
                </Link>
            </div>
        </div>
    );
}
