"use client";

import { useLanguage } from "./LanguageProvider";
import { typograph } from "@/lib/translations";

export default function ReflectionBody({ body }: { body: string }) {
  const { lang } = useLanguage();
  const paragraphs = body.split("\n\n").filter((p) => p.trim());

  let firstTextIdx = -1;

  return (
    <div className="space-y-6">
      {paragraphs.map((p, i) => {
        if (p.trim() === "---" || p.trim() === "***" || p.trim() === "___") {
          return <hr key={i} className="border-t border-black/20 my-4" />;
        }

        if (firstTextIdx === -1) firstTextIdx = i;

        return (
          <p
            key={i}
            className={`text-lg md:text-xl leading-[1.75] ${
              i === firstTextIdx ? "first-letter:text-5xl first-letter:font-bold first-letter:leading-[0.8] first-letter:float-left first-letter:mr-2 first-letter:mt-1" : ""
            }`}
            style={{ fontFamily: "var(--font-body)" }}
          >
            {typograph(p, lang)}
          </p>
        );
      })}
    </div>
  );
}
