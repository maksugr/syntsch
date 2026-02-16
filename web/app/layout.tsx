import type { Metadata } from "next";
import { Bebas_Neue, Russo_One } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

const russoOne = Russo_One({
  weight: "400",
  subsets: ["cyrillic", "latin"],
  variable: "--font-russo",
  display: "swap",
});

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: {
    default: "SYNTSCH",
    template: "%s — SYNTSCH",
  },
  description:
    "AI-powered daily cultural digest for Berlin. Essays on the most compelling upcoming events — exhibitions, concerts, performances, lectures, club nights.",
  keywords: [
    "Berlin",
    "culture",
    "events",
    "exhibitions",
    "concerts",
    "performances",
    "AI",
    "digest",
    "Kultur",
    "Berlin Veranstaltungen",
  ],
  authors: [{ name: "SYNTSCH", url: "mailto:hi@syntsch.de" }],
  creator: "SYNTSCH",
  metadataBase: new URL("https://syntsch.de"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    alternateLocale: ["de_DE", "ru_RU"],
    siteName: "SYNTSCH",
    title: "SYNTSCH",
    description:
      "AI-powered daily essays on the most compelling upcoming cultural events in Berlin.",
    images: [{ url: "https://syntsch.de/og.png", width: 1200, height: 630, alt: "SYNTSCH" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SYNTSCH",
    description:
      "AI-powered daily essays on the most compelling upcoming cultural events in Berlin.",
    images: ["https://syntsch.de/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://syntsch.de",
    types: {
      "application/rss+xml": "/en/feed.xml",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bebasNeue.variable} ${russoOne.variable}`}>
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
