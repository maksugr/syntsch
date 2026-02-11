import type { Metadata } from "next";
import { Bebas_Neue, Russo_One } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/components/LanguageProvider";
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
  title: {
    default: "PTYTSCH — Berlin Cultural Digest",
    template: "%s — PTYTSCH",
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
  authors: [{ name: "PTYTSCH" }],
  creator: "PTYTSCH",
  metadataBase: new URL("https://ptytsch.de"),
  openGraph: {
    type: "website",
    locale: "en_GB",
    alternateLocale: ["de_DE", "ru_RU"],
    siteName: "PTYTSCH",
    title: "PTYTSCH — Berlin Cultural Digest",
    description:
      "AI-powered daily essays on the most compelling upcoming cultural events in Berlin.",
  },
  twitter: {
    card: "summary",
    title: "PTYTSCH — Berlin Cultural Digest",
    description:
      "AI-powered daily essays on the most compelling upcoming cultural events in Berlin.",
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
    canonical: "https://ptytsch.de",
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
        <LanguageProvider>
          <Header />
          <main className="px-6 md:px-10 lg:px-16 py-10 md:py-14">
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
