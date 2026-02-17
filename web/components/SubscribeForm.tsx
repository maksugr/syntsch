"use client";

import { useState, FormEvent } from "react";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";

export default function SubscribeForm({ onSuccess }: { onSuccess?: () => void }) {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;

    setState("loading");
    try {
      const res = await fetch("/api/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("success");
        localStorage.setItem("syntsch_subscribed", "1");
        onSuccess?.();
      } else {
        setState("idle");
      }
    } catch {
      setState("idle");
    }
  }

  const loading = state === "loading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={tUi(lang, "subscribePlaceholder")}
        required
        disabled={loading || state === "success"}
        className="w-full md:flex-1 border-4 border-black px-4 py-3 font-mono text-base bg-transparent outline-none placeholder:text-[#999999] disabled:opacity-50 disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={loading || state === "success"}
        className="w-full md:w-auto border-4 border-black bg-black text-white px-6 text-lg tracking-tight cursor-pointer transition-opacity duration-100 hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed h-[54px] grid place-items-center"
        style={{ fontFamily: "var(--font-display)" }}
      >
        <span className="col-start-1 row-start-1" style={{ visibility: loading || state === "success" ? "hidden" : "visible" }}>
          {tUi(lang, "subscribeButton")}
        </span>
        <span className="col-start-1 row-start-1" style={{ visibility: state === "success" ? "visible" : "hidden" }}>
          {tUi(lang, "subscribeSuccess")}
        </span>
        {loading && (
          <span className="col-start-1 row-start-1 inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
      </button>
    </form>
  );
}
