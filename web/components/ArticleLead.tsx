"use client";

import { useLanguage } from "./LanguageProvider";
import { typograph } from "@/lib/translations";

export default function ArticleLead({ text }: { text: string }) {
  const { lang } = useLanguage();

  return (
    <p
      className="text-xl md:text-2xl leading-relaxed mb-10"
      style={{ color: "#666666" }}
    >
      {typograph(text, lang)}
    </p>
  );
}
