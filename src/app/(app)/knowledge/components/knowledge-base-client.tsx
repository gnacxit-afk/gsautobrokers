'use client';

import { useState, useMemo } from 'react';
import type { Article } from '@/lib/types';
import { useFirestore, useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FilePlus2, BookOpen, Bot, Edit, Trash2, Loader2, X, Search } from 'lucide-react';
import { NewArticleForm } from './new-article-form';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { doc, deleteDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { summarizeArticle } from '@/ai/flows/summarize-knowledge-base-articles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';


function MarkdownRenderer({ content }: { content: string }) {
    if (!content) return null;

    const renderMarkdown = (text: string) => {
        let html = text
            // Blockquotes
            .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 pl-4 italic">$1</blockquote>')
            // Headers
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold mt-4 mb-1">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold mt-5 mb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mt-6 mb-3">$1</h1>')
            // Bold & Italic & Strikethrough
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/~~(.*?)~~/g, '<del>$1</del>')
            // Links & Images
            .replace(/!\[([^\]]+)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto my-4 rounded-md shadow-sm" />')
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>')
            // HR
            .replace(/^(-{3,}|\*{3,})$/gm, '<hr class="my-6" />')
            // Lists
            .replace(/^\s*([*+-]) (.*)/gm, '<ul><li>$2</li></ul>')
            .replace(/^\s*(\d+\.) (.*)/gm, '<ol><li>$2</li></ol>')
            // Consolidate list tags
            .replace(/<\/ul>\s*<ul>/g, '')
            .replace(/<\/ol>\s*<ol>/g, '')
            // Paragraphs (any line that isn't a special tag)
            .replace(/^(?!<[h1-3|ul|ol|li|hr|blockquote|img]).*$/gm, (match) => {
                 if (match.trim() === '') return '';
                 return `<p class="text-slate-700 leading-relaxed">${match}</p>`;
            })
            // Cleanup empty paragraphs
            .replace(/<p><\/p>/g, '');
        
        return { __html: html };
    };

    return (
        <div 
            className="prose prose-slate max-w-none space-y-4"
            dangerouslySetInnerHTML={renderMarkdown(content)}
        />
    );
}


export function KnowledgeBaseClient({ initialArticles, loading }: KnowledgeBaseClientProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const filteredArticles = useMemo(() => {
    if (!searchTerm) {
      return initialArticles;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return initialArticles.filter(article =>
      article.title.toLowerCase().includes(lowercasedFilter) ||
      article.content.toLowerCase().includes(lowercasedFilter)
    );
  }, [initialArticles, searchTerm]);

  const articlesByCategory = useMemo(() => {
    return filteredArticles.reduce((acc, article) => {
      const category = article.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(article);
      return acc;
    }, {} as Record<string, Article[]>);
  }, [filteredArticles]);

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setIsCreating(false);
    setIsEditing(false);
    setSummary(null); // Reset summary when changing articles
  };

  const handleNewArticleClick = () => {
    setSelectedArticle(null);
    setIsCreating(true);
    setIsEditing(false);
    setSummary(null);
  };
  
  const handleGenerateSummary = async () => {
    if (!selectedArticle) return;
    setIsSummarizing(true);
    setSummary(null);
    try {
      const result = await summarizeArticle({ articleContent: selectedArticle.content });
      setSummary(result.summary);
    } catch (error) {
      toast({ title: 'Summary Failed', description: 'Could not generate AI summary.', variant: 'destructive'});
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDeleteArticle = async () => {
    if (!selectedArticle || !firestore) return;
    const articleRef = doc(firestore, 'articles', selectedArticle.id);
    try {
      await deleteDoc(articleRef);
      toast({ title: 'Article Deleted', description: `"${selectedArticle.title}" has been removed.` });
      setSelectedArticle(null);
      setIsEditing(false);
    } catch (error) {
      toast({ title: 'Deletion Failed', description: 'Could not delete the article.', variant: 'destructive'});
    }
  };

  const onArticleCreated = (newArticle: Article) => {
    setIsCreating(false);
    setSelectedArticle(newArticle);
  };

  const onArticleUpdated = (updatedArticle: Article) => {
    setSelectedArticle(updatedArticle);
    setIsEditing(false);
  };
  
  const displayedContent = isCreating || isEditing ? (
    <NewArticleForm 
        onArticleCreated={onArticleCreated} 
        editingArticle={isEditing ? selectedArticle : null}
        onArticleUpdated={onArticleUpdated}
        onCancel={() => setIsEditing(false)}
    />
  ) : selectedArticle;
  
  const renderDate = (date: any) => {
    if (!date) return 'No date';
    const jsDate = (date as any).toDate ? (date as any).toDate() : new Date(date);
    if (!isValid(jsDate)) return 'Invalid date';
    return format(jsDate, 'MMM d, yyyy');
  };

  return (
    <div className="flex flex-1 h-full">
      <aside className="w-1/3 max-w-sm border-r p-4 hidden md:flex flex-col">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
              />
          </div>
          {user?.role === 'Admin' && (
            <Button size="sm" onClick={handleNewArticleClick}>
              <FilePlus2 className="mr-2 h-4 w-4" /> New
            </Button>
          )}
        </div>
        <ScrollArea>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
             <Accordion type="multiple" defaultValue={Object.keys(articlesByCategory)} className="w-full">
              {Object.entries(articlesByCategory).map(([category, articles]) => (
                <AccordionItem value={category} key={category}>
                  <AccordionTrigger className="text-sm font-medium hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span>{category}</span>
                      <span className="text-xs text-muted-foreground">({articles.length})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-1 pl-1">
                      {articles.map((article) => (
                         <li key={article.id}>
                          <button
                            onClick={() => handleSelectArticle(article)}
                            className={cn(
                              "w-full text-left p-2.5 rounded-lg transition-colors text-sm",
                              selectedArticle?.id === article.id && !isEditing ? "bg-primary text-white" : "hover:bg-slate-100"
                            )}
                          >
                            <p className="font-medium">{article.title}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </ScrollArea>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        {loading && !selectedArticle ? (
           <Skeleton className="h-full w-full" />
        ) : displayedContent ? (
          <ScrollArea className="h-full pr-4">
            {isCreating || isEditing ? (
                 <NewArticleForm 
                    onArticleCreated={onArticleCreated} 
                    editingArticle={isEditing ? selectedArticle : null}
                    onArticleUpdated={onArticleUpdated}
                    onCancel={() => {
                        setIsCreating(false);
                        setIsEditing(false);
                    }}
                />
            ) : selectedArticle ? (
                <div>
                    <div className="mb-6 pb-6 border-b">
                        <h1 className="text-3xl font-extrabold text-slate-900">{selectedArticle.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                            <span>Category: <span className="font-semibold text-primary">{selectedArticle.category}</span></span>
                             <span>By: <span className="font-semibold">{selectedArticle.author}</span></span>
                            <span>Published on: <span className="font-semibold">{renderDate(selectedArticle.date)}</span></span>
                        </div>
                         <div className="flex items-center gap-2 mt-4">
                            {(user?.role === 'Admin' || user?.role === 'Supervisor' || user?.role === 'Broker') && (
                              <Button size="sm" variant="outline" onClick={handleGenerateSummary} disabled={isSummarizing}>
                                  {isSummarizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                                  AI Summary
                              </Button>
                            )}
                            {user?.role === 'Admin' && (
                                <>
                                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                                    <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="sm" variant="destructive">
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete the article "{selectedArticle.title}". This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDeleteArticle} className="bg-destructive hover:bg-destructive/90">Delete Article</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {(isSummarizing || summary) && (
                      <Card className="mb-6 bg-blue-50 border-blue-200">
                        <CardHeader>
                           <CardTitle className="text-lg flex items-center gap-2 text-blue-800"><Bot size={18}/> Resumen por IA</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {isSummarizing ? (
                             <div className="space-y-2">
                               <Skeleton className="h-4 w-5/6" />
                               <Skeleton className="h-4 w-full" />
                               <Skeleton className="h-4 w-3/4" />
                            </div>
                          ) : (
                            <p className="text-sm text-blue-900 leading-relaxed whitespace-pre-wrap">{summary}</p>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <MarkdownRenderer content={selectedArticle.content} />
                </div>
            ) : null}
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
             <BookOpen className="w-16 h-16 mb-4 text-slate-300" />
            <h3 className="text-lg font-semibold">Welcome to the Knowledge Base</h3>
            <p>Select an article from the list to view its content.</p>
          </div>
        )}
      </main>
    </div>
  );
}
