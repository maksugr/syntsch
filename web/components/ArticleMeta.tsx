"use client";

import { useLanguage } from "./LanguageProvider";
import { readingTime, tUi } from "@/lib/translations";

export default function ArticleMeta({
    writtenAt,
    wordCount,
}: {
    writtenAt: string;
    wordCount: number | null;
}) {
    const { lang } = useLanguage();
    const mins = readingTime(wordCount);

    return (
        <div
            className="flex items-center gap-3 text-xs font-mono font-bold uppercase tracking-[0.2em] mb-8"
            style={{ color: "#999999" }}
        >
            <time dateTime={writtenAt} className="hidden" />
            <span>
                {mins} {tUi(lang, "minRead")}
            </span>
        </div>
    );
}
