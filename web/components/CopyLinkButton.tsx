"use client";

import { useState } from "react";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";

export default function CopyLinkButton() {
    const { lang } = useLanguage();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="font-mono text-sm tracking-wide transition-colors duration-100 cursor-pointer"
            style={{
                color: copied ? "#000000" : "#999999",
                background: "none",
                border: "none",
                padding: 0,
            }}
        >
            {copied ? tUi(lang, "copied") : tUi(lang, "copyLink")} →
        </button>
    );
}
