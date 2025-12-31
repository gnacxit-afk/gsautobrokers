"use client";

import { useMemo } from 'react';
import { useCollection, useFirestore } from "@/firebase";
import { KnowledgeBaseClient } from "./components/knowledge-base-client";
import type { Article } from "@/lib/types";
import { collection, orderBy, query } from "firebase/firestore";

export default function KnowledgeBasePage() {
  const firestore = useFirestore();
  
  const articlesQuery = query(collection(firestore, "articles"), orderBy("date", "desc"));
  const { data: articles, loading } = useCollection(articlesQuery);

  return (
    <main className="flex-1">
      <KnowledgeBaseClient initialArticles={articles as Article[] || []} loading={loading} />
    </main>
  );
}
