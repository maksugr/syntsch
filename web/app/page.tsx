import { getAllArticlesWithEvents } from "@/lib/db";
import ArticleFeed from "@/components/ArticleFeed";

export default function Home() {
  const articles = getAllArticlesWithEvents();

  return <ArticleFeed articles={articles} />;
}
