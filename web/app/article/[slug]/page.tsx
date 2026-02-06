import { notFound } from "next/navigation";
import { getAllArticleSlugs, getArticleBySlug } from "@/lib/db";
import ArticleBody from "@/components/ArticleBody";
import EventSidebar from "@/components/EventSidebar";

export function generateStaticParams() {
  const slugs = getAllArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
      <article className="lg:w-[60%]">
        <h1
          className="text-5xl md:text-7xl lg:text-8xl leading-[0.9] mb-8"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {article.title}
        </h1>

        {article.lead && (
          <p
            className="text-xl md:text-2xl leading-relaxed mb-10 border-l-4 border-black pl-6"
            style={{ color: '#666666' }}
          >
            {article.lead}
          </p>
        )}

        <ArticleBody body={article.body} />

      </article>

      <div className="lg:w-[40%]">
        <EventSidebar event={article.event} />
      </div>
    </div>
  );
}
