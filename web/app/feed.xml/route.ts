import { getAllArticlesWithEvents } from "@/lib/db";

export const dynamic = "force-static";

function escapeXml(s: string): string {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

export function GET() {
    const articles = getAllArticlesWithEvents();

    const items = articles
        .slice(0, 50)
        .map((a) => {
            const link = `https://ptytsch.de/article/${a.slug}`;
            const desc = a.lead || a.body.slice(0, 300);
            const pubDate = new Date(a.written_at).toUTCString();
            return `    <item>
      <title>${escapeXml(a.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escapeXml(desc)}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(a.event.category || "")}</category>
    </item>`;
        })
        .join("\n");

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>PTYTSCH</title>
    <link>https://ptytsch.de</link>
    <description>AI-powered daily essays on the most compelling upcoming cultural events in Berlin.</description>
    <language>en</language>
    <atom:link href="https://ptytsch.de/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

    return new Response(xml, {
        headers: { "Content-Type": "application/xml" },
    });
}
