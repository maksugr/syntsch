import { NextRequest, NextResponse } from "next/server";

const SEGMENT_MAP: Record<string, string | undefined> = {
  en: process.env.RESEND_SEGMENT_EN,
  de: process.env.RESEND_SEGMENT_DE,
  ru: process.env.RESEND_SEGMENT_RU,
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const { email, lang } = body;

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
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
