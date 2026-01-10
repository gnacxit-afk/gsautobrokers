
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection } from "@/firebase";
import { KnowledgeBaseClient } from "./components/knowledge-base-client";
import type { Article } from "@/lib/types";
import { collection, orderBy, query, onSnapshot } from "firebase/firestore";

export default function KnowledgeBasePage() {
  const firestore = useFirestore();
  
  const articlesQuery = useMemo(() => 
    firestore 
      ? query(collection(firestore, "articles"), orderBy("date", "asc"))
      : null
  , [firestore]);

  const { data: articles, loading } = useCollection<Article>(articlesQuery);

  return (
    <main className="flex-1 h-full">
      <KnowledgeBaseClient initialArticles={articles || []} loading={loading} />
    </main>
  );
}
