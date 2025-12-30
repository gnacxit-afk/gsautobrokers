import { getArticles } from "@/lib/mock-data";
import { KnowledgeBaseClient } from "./components/knowledge-base-client";

export default function KnowledgeBasePage() {
  const articles = getArticles();

  return (
    <main className="flex-1">
      <KnowledgeBaseClient initialArticles={articles} />
    </main>
  );
}
