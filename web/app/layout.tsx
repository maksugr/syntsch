import type { Metadata } from "next";
import { Bebas_Neue, Russo_One } from "next/font/google";
import Header from "@/components/Header";
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
  title: "PTYTSCH",
  description: "Berlin Cultural Digest",
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
        </LanguageProvider>
      </body>
    </html>
  );
}
