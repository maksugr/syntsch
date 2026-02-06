import { getAllEssaysWithEvents } from "@/lib/db";
import EssayFeed from "@/components/EssayFeed";

export default function Home() {
  const essays = getAllEssaysWithEvents();

  return <EssayFeed essays={essays} />;
}
