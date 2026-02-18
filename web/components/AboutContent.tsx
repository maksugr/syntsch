"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";
import SubscribeForm from "./SubscribeForm";

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

                <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed">
                    {tUi(lang, "aboutText3")}
                </p>

                <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed">
                    {tUi(lang, "aboutText4")}
                </p>

                <p className="text-xl md:text-2xl lg:text-3xl leading-relaxed">
                    {tUi(lang, "aboutText5")} (
                    <a
                        href="https://github.com/maksugr/syntsch"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="no-underline transition-colors duration-100 lowercase"
                        style={{ color: "#000000", textDecoration: "none" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#666666")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#000000")}
                    >
                        github
                    </a>
                    ).
                </p>
            </div>

            <div className="mt-10 md:mt-14 py-8 border-t border-b border-[#cccccc]">
                <h2
                    className="text-4xl md:text-6xl leading-[0.85] mb-4"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    {tUi(lang, "subscribeTitle")}
                </h2>
                <p className="text-lg md:text-xl leading-relaxed mb-6" style={{ color: "#666666" }}>
                    {tUi(lang, "subscribeText")}
                </p>
                <SubscribeForm />
            </div>

            <div className="mt-8">
                <p className="font-mono text-sm mb-6" style={{ color: "#999999" }}>
                    {tUi(lang, "weAreClose")}{" — "}
                    <a
                        href="mailto:hi@syntsch.de"
                        className="no-underline transition-colors duration-100"
                        style={{ color: "#999999", textDecoration: "none" }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.color = "#000000")
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.color = "#999999")
                        }
                    >
                        hi@syntsch.de
                    </a>
                </p>
                <Link
                    href={`/${lang}/`}
                    className="font-mono text-sm tracking-wide no-underline transition-colors duration-100"
                    style={{ color: "#999999", textDecoration: "none" }}
                    onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#000000")
                    }
                    onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#999999")
                    }
                >
                    ← SYNTSCH
                </Link>
            </div>
        </div>
    );
}
