import type { Metadata } from "next";
import { getAllArticlesWithEvents } from "@/lib/db";
import ArticleFeed from "@/components/ArticleFeed";

export const metadata: Metadata = {
  alternates: { canonical: "https://ptytsch.de" },
};

export default function Home() {
  const articles = getAllArticlesWithEvents();

  return <ArticleFeed articles={articles} />;
}
