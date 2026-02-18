import { NextRequest, NextResponse } from "next/server";

const SEGMENT_MAP: Record<string, string | undefined> = {
  en: process.env.RESEND_SEGMENT_EN,
  de: process.env.RESEND_SEGMENT_DE,
  ru: process.env.RESEND_SEGMENT_RU,
};

const VALID_LANGS = new Set(Object.keys(SEGMENT_MAP));

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_LOCAL_PART_LENGTH = 64;
const CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function validateEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;

  const email = normalizeEmail(raw);

  if (!email || email.length > MAX_EMAIL_LENGTH) return null;
  if (CONTROL_CHARS_RE.test(email)) return null;

  const atIndex = email.indexOf("@");
  if (atIndex < 0) return null;
  if (email.slice(0, atIndex).length > MAX_LOCAL_PART_LENGTH) return null;

  if (!EMAIL_RE.test(email)) return null;

  return email;
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type");
  if (!contentType?.includes("application/json")) {
    return NextResponse.json({ error: "Invalid content type" }, { status: 415 });
  }

  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const email = validateEmail(body.email);
  if (!email) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { lang } = body;
  if (typeof lang !== "string" || !VALID_LANGS.has(lang)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const segmentId = SEGMENT_MAP[lang];
  if (!segmentId) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
  }

  const res = await fetch("https://api.resend.com/contacts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      unsubscribed: false,
      segments: [{ id: segmentId }],
    }),
  });

  if (res.ok || res.status === 409) {
    return NextResponse.json({ ok: true });
  }

  const resBody = await res.text().catch(() => "");
  console.error("Resend error:", res.status, resBody);
  return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
}
