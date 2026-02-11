import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllArticlesWithEvents } from "@/lib/db";
import ArticleFeed from "@/components/ArticleFeed";

export const metadata: Metadata = {
  alternates: { canonical: "https://ptytsch.de" },
};

export default function Home() {
  const articles = getAllArticlesWithEvents();

  return (
    <Suspense>
      <ArticleFeed articles={articles} />
    </Suspense>
  );
}
