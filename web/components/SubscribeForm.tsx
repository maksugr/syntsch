"use client";

import { useState, useRef, FormEvent } from "react";
import { useLanguage } from "./LanguageProvider";
import { tUi } from "@/lib/translations";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export default function SubscribeForm({ onSuccess }: { onSuccess?: () => void }) {
  const { lang } = useLanguage();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const lastSubmit = useRef(0);

  function validate(value: string): string | null {
    const normalized = normalizeEmail(value);
    if (!normalized) return tUi(lang, "subscribeInvalidEmail");
    if (normalized.length > MAX_EMAIL_LENGTH) return tUi(lang, "subscribeInvalidEmail");
    if (!EMAIL_RE.test(normalized)) return tUi(lang, "subscribeInvalidEmail");
    return null;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (state === "loading" || state === "success") return;

    const now = Date.now();
    if (now - lastSubmit.current < 3000) return;
    lastSubmit.current = now;

    const validationError = validate(email);
    if (validationError) {
      setErrorMsg(validationError);
      setState("error");
      return;
    }

    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/subscribe/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizeEmail(email), lang }),
      });
      const data = await res.json();
      if (data.ok) {
        setState("success");
        localStorage.setItem("syntsch_subscribed", "1");
        onSuccess?.();
      } else {
        setErrorMsg(data.error === "Invalid email"
          ? tUi(lang, "subscribeInvalidEmail")
          : tUi(lang, "subscribeError"));
        setState("error");
      }
    } catch {
      setErrorMsg(tUi(lang, "subscribeError"));
      setState("error");
    }
  }

  const loading = state === "loading";
  const disabled = loading || state === "success";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3">
      <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="flex flex-col md:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (state === "error") {
              setState("idle");
              setErrorMsg("");
            }
          }}
          placeholder={tUi(lang, "subscribePlaceholder")}
          required
          maxLength={MAX_EMAIL_LENGTH}
          autoComplete="email"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          className="w-full md:flex-1 border-4 border-black px-4 py-3 font-mono text-base bg-transparent outline-none placeholder:text-[#999999] disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={disabled}
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
      </div>
      {errorMsg && (
        <p className="text-sm font-mono" style={{ color: "#cc0000" }}>{errorMsg}</p>
      )}
    </form>
  );
}
