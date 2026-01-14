'use client';

import { useState, useMemo } from 'react';
import type { Article } from '@/lib/types';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { FilePlus2, BookOpen } from 'lucide-react';
import { NewArticleForm } from './new-article-form';
import { cn } from '@/lib/utils';
import { format, isValid } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface KnowledgeBaseClientProps {
  initialArticles: Article[];
  loading: boolean;
}

function MarkdownRenderer({ content }: { content: string }) {
  if (!content) return null;
  const renderLine = (line: string, index: number) => {
    if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold mt-6 mb-3">{line.substring(2)}</h1>;
    if (line.startsWith('## ')) return <h2 key={index} className="text-2xl font-semibold mt-5 mb-2">{line.substring(3)}</h2>;
    if (line.startsWith('### ')) return <h3 key={index} className="text-xl font-semibold mt-4 mb-1">{line.substring(4)}</h3>;
    if (line.trim() === '---') return <hr key={index} className="my-6" />;
    if (line.startsWith('- ')) return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
    return <p key={index} className="text-slate-700 leading-relaxed">{line}</p>;
  };

  return (
    <div className="prose prose-slate max-w-none whitespace-pre-wrap space-y-4">
      {content.split('\n').map(renderLine)}
    </div>
  );
}


export function KnowledgeBaseClient({ initialArticles, loading }: KnowledgeBaseClientProps) {
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useUser();

  const articlesByCategory = useMemo(() => {
    return initialArticles.reduce((acc, article) => {
      const category = article.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(article);
      return acc;
    }, {} as Record<string, Article[]>);
  }, [initialArticles]);

  const handleSelectArticle = (article: Article) => {
    setSelectedArticle(article);
    setIsCreating(false);
  };

  const handleNewArticleClick = () => {
    setSelectedArticle(null);
    setIsCreating(true);
  };

  const onArticleCreated = (newArticle: Article) => {
    setIsCreating(false);
    setSelectedArticle(newArticle);
  };
  
  const displayedContent = isCreating ? <NewArticleForm onArticleCreated={onArticleCreated} /> : selectedArticle;
  
  const renderDate = (date: any) => {
    if (!date) return 'No date';
    const jsDate = (date as any).toDate ? (date as any).toDate() : new Date(date);
    if (!isValid(jsDate)) return 'Invalid date';
    return format(jsDate, 'MMM d, yyyy');
  };

  return (
    <div className="flex flex-1 h-full">
      <aside className="w-1/3 max-w-sm border-r p-4 hidden md:flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Articles</h2>
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
                              selectedArticle?.id === article.id ? "bg-primary text-white" : "hover:bg-slate-100"
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
            {isCreating ? (
                <NewArticleForm onArticleCreated={onArticleCreated} />
            ) : selectedArticle ? (
                <div>
                    <h1 className="text-3xl font-extrabold mb-2 text-slate-900">{selectedArticle.title}</h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6 pb-6 border-b">
                        <span>Category: <span className="font-semibold text-primary">{selectedArticle.category}</span></span>
                         <span>Published on: <span className="font-semibold">{renderDate(selectedArticle.date)}</span></span>
                    </div>
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
