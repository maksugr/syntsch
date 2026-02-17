"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";
import SubscribeForm from "./SubscribeForm";

export default function SubscribeCard() {
  const { lang } = useLanguage();
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (localStorage.getItem("syntsch_subscribed") !== "1") {
      setHidden(false);
    }
  }, []);

  if (hidden) return null;

  return (
    <div className="p-6 md:p-8 -ml-6 md:-ml-8">
      <div className="mb-4 h-5" />
      <h2
        className="text-4xl md:text-5xl lg:text-6xl leading-[0.85] mb-5"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {tUi(lang, "subscribeTitle")}
      </h2>

      <p
        className="text-base leading-relaxed mb-5 max-w-xl"
        style={{ color: "#666666" }}
      >
        {tUi(lang, "subscribeText")}
      </p>

      <SubscribeForm />
    </div>
  );
}
