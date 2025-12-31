"use client";

import React, { useState, useEffect, useTransition } from 'react';
import type { Article } from '@/lib/types';
import { Search, Plus, Save, X, Edit2, Trash2, BookOpen, Wand2, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { summarizeArticle } from "@/ai/flows/summarize-knowledge-base-articles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth, useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';

function SummaryDisplay({ content }: { content: string }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (content) {
      startTransition(async () => {
        try {
          const result = await summarizeArticle({ articleContent: content });
          setSummary(result.summary);
        } catch (error) {
          console.error("Failed to generate summary:", error);
          setSummary("Could not generate summary.");
        }
      });
    }
  }, [content]);

  return (
    <Card className="my-6 bg-blue-50 border-blue-100">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base text-blue-800">
          <Wand2 className="h-5 w-5 text-blue-600" />
          AI Generated Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : (
          <p className="text-sm text-blue-700">{summary}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function KnowledgeBaseClient({ initialArticles, loading }: { initialArticles: Article[], loading: boolean }) {
  const { user } = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [articles, setArticles] = useState(initialArticles);
  const [selected, setSelected] = useState<Article | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Omit<Article, 'id' | 'author' | 'date' | 'tags'>>({ title: '', category: '', content: '' });
  
  useEffect(() => {
    setArticles(initialArticles);
  }, [initialArticles]);

  const filteredKB = articles.filter(i => 
    i.title?.toLowerCase().includes(search.toLowerCase()) || 
    i.category?.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    // If the selected article is deleted from the main list, deselect it.
    if (selected && !articles.find(a => a.id === selected.id)) {
      setSelected(null);
    }
  }, [articles, selected]);
  

  const handleSaveArticle = async () => {
    if (!draft.title || !draft.content || !draft.category) {
        toast({ title: "Missing Fields", description: "Please fill out title, category, and content.", variant: "destructive" });
        return;
    }

    if (!firestore || !user) return;

    if (selected && editing) { // Editing existing article
      const articleRef = doc(firestore, 'articles', selected.id);
      await updateDoc(articleRef, { ...draft });
      setSelected({ ...selected, ...draft });
      toast({ title: "Article Updated", description: "Your changes have been saved." });
    } else { // Creating new article
      const newArticleData = {
        ...draft,
        author: user.name,
        date: serverTimestamp(),
        tags: [],
      };
      await addDoc(collection(firestore, 'articles'), newArticleData);
      toast({ title: "Article Created", description: "The new article has been added." });
    }
    setEditing(false);
  };

  const handleDeleteArticle = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this article?') && firestore) {
        await deleteDoc(doc(firestore, 'articles', id));
        setSelected(null);
        setEditing(false);
        toast({ title: "Article Deleted", variant: "destructive" });
    }
  }

  const startNew = () => {
    setSelected(null);
    setDraft({ title: '', category: 'Sales', content: '' });
    setEditing(true);
  };

  const startEdit = () => {
      if (!selected) return;
      setDraft({ title: selected.title, category: selected.category, content: selected.content });
      setEditing(true);
  }

  const renderDate = (date: Article['date']) => {
    if (!date) return 'N/A';
    if (date instanceof Date) return date.toLocaleDateString();
    if (typeof date === 'string') return new Date(date).toLocaleDateString();
    // It's a Timestamp
    return (date as any).toDate().toLocaleDateString();
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 h-[calc(100vh-8rem)]">
      <div className="w-full md:w-1/3 lg:w-1/4 space-y-4 flex flex-col">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16}/>
          <Input 
            type="text" placeholder="Search guides..." 
            className="pl-10"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        {user?.role === 'Admin' && (
          <Button 
            onClick={startNew}
            variant="outline"
            className="w-full bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white border-emerald-600"
          >
            <Plus size={16}/> New Article
          </Button>
        )}
        <div className="bg-white border rounded-2xl divide-y flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            filteredKB.map(item => (
              <button 
                key={item.id}
                onClick={() => { setSelected(item); setEditing(false); }}
                className={cn(
                  "w-full p-4 text-left hover:bg-blue-50 transition-colors flex justify-between items-center group",
                  selected?.id === item.id && !editing ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                )}
              >
                <div>
                  <p className="font-bold text-slate-700 line-clamp-1">{item.title}</p>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">{item.category}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-blue-500" />
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 bg-white rounded-3xl border shadow-sm p-6 md:p-8 overflow-y-auto">
        {editing ? (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">Content Editor</h3>
              <div className="flex gap-2">
                <Button onClick={() => setEditing(false)} variant="ghost"><X size={16} /> Cancel</Button>
                <Button onClick={handleSaveArticle}><Save size={16}/> Save</Button>
              </div>
            </div>
            <Input 
              placeholder="Article Title" 
              className="text-xl font-bold h-12"
              value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})}
            />
            <Input 
              placeholder="Category" 
              value={draft.category} onChange={e => setDraft({...draft, category: e.target.value})}
            />
            <Textarea 
              placeholder="Write content here..." 
              className="h-96 font-mono text-sm"
              value={draft.content} onChange={e => setDraft({...draft, content: e.target.value})}
            />
          </div>
        ) : selected ? (
          <div className="prose prose-slate max-w-none">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest not-prose px-3 py-1">{selected.category}</span>
                <h2 className="mt-3">{selected.title}</h2>
                <p className="text-sm text-muted-foreground">By {selected.author} on {renderDate(selected.date)}</p>
              </div>
              {user?.role === 'Admin' && (
                <div className="flex gap-2 not-prose">
                  <Button onClick={startEdit} variant="outline" size="icon"><Edit2 size={16}/></Button>
                  <Button onClick={() => handleDeleteArticle(selected.id)} variant="destructive" size="icon"><Trash2 size={16}/></Button>
                </div>
              )}
            </div>
            <SummaryDisplay content={selected.content} />
            <p className="whitespace-pre-wrap">{selected.content}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-4">
            <BookOpen size={64} strokeWidth={1}/>
            <h3 className="text-lg font-semibold">Welcome to the Knowledge Base</h3>
            <p className="max-w-xs">Select an article from the list to read, or create a new one if you're an admin.</p>
          </div>
        )}
      </div>
    </div>
  );
}
