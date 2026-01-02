
"use client";

import React, { useState, useEffect, useRef } from 'react';
import type { Article } from '@/lib/types';
import { Search, Plus, Save, X, Edit2, Trash2, BookOpen, ChevronRight, Bold, Italic, Code, List, AlignCenter, AlignLeft, AlignRight, Smile, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { useAuthContext } from '@/lib/auth';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

function EmojiPicker({ onEmojiInsert }: { onEmojiInsert: (emoji: string) => void }) {
  const emojis = ['😀', '😂', '👍', '🚀', '💡', '🎉', '❤️', '🔥', '🤔', '💯', '🙏', '✍️'];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" title="Insert Emoji">
          <Smile size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-4 gap-2">
          {emojis.map(emoji => (
            <Button
              key={emoji}
              variant="ghost"
              size="icon"
              onClick={() => onEmojiInsert(emoji)}
              className="text-lg"
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}


function MarkdownToolbar({ textareaRef, onContentChange, onAlignChange, onEmojiInsert }: { textareaRef: React.RefObject<HTMLTextAreaElement>, onContentChange: (value: string) => void, onAlignChange: (align: 'left' | 'center' | 'right') => void, onEmojiInsert: (emoji: string) => void }) {
  const insertMarkdown = (syntax: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    let newText;
    const placeholder = 'text';

    if (syntax === '\n- ') { // for lists
       newText = `${textarea.value.substring(0, start)}${syntax}${selectedText || placeholder}${textarea.value.substring(end)}`;
    } else if (syntax === '\n---\n') { // for horizontal line
      newText = `${textarea.value.substring(0, start)}${syntax}${selectedText}${textarea.value.substring(end)}`;
    } else {
       newText = `${textarea.value.substring(0, start)}${syntax}${selectedText || placeholder}${syntax}${textarea.value.substring(end)}`;
    }

    onContentChange(newText);

    // After updating, focus and adjust cursor position
    setTimeout(() => {
        textarea.focus();
        if (selectedText) {
          textarea.setSelectionRange(start + syntax.length, end + syntax.length);
        } else if (syntax === '\n---\n') {
          textarea.setSelectionRange(start + syntax.length, start + syntax.length);
        } else {
          textarea.setSelectionRange(start + syntax.length, start + syntax.length + placeholder.length);
        }
    }, 0);
  };
  
  const handleEmojiInsert = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newText = `${textarea.value.substring(0, start)}${emoji}${textarea.value.substring(end)}`;
    onEmojiInsert(newText);
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  return (
    <div className="flex items-center gap-1 rounded-t-md border border-b-0 bg-gray-50 p-2 flex-wrap">
      <Button variant="ghost" size="icon" onClick={() => insertMarkdown('**')} title="Bold"><Bold size={16} /></Button>
      <Button variant="ghost" size="icon" onClick={() => insertMarkdown('*')} title="Italic"><Italic size={16} /></Button>
      <Button variant="ghost" size="icon" onClick={() => insertMarkdown('`')} title="Code"><Code size={16} /></Button>
      <Button variant="ghost" size="icon" onClick={() => insertMarkdown('\n- ')} title="List"><List size={16} /></Button>
      <Button variant="ghost" size="icon" onClick={() => insertMarkdown('\n---\n')} title="Horizontal Line"><Minus size={16} /></Button>
      <div className="h-6 w-px bg-gray-200 mx-2"></div>
      <Button variant="ghost" size="icon" onClick={() => onAlignChange('left')} title="Align Left"><AlignLeft size={16} /></Button>
      <Button variant="ghost" size="icon" onClick={() => onAlignChange('center')} title="Align Center"><AlignCenter size={16} /></Button>
      <Button variant="ghost" size="icon" onClick={() => onAlignChange('right')} title="Align Right"><AlignRight size={16} /></Button>
       <div className="h-6 w-px bg-gray-200 mx-2"></div>
       <EmojiPicker onEmojiInsert={handleEmojiInsert} />
    </div>
  );
}

function SimpleMarkdownRenderer({ content, align }: { content: string, align?: 'left' | 'center' | 'right' }) {
  const renderLine = (line: string, index: number) => {
    // Must process bold first, then italic
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    line = line.replace(/`(.*?)`/g, '<code class="bg-gray-100 p-1 rounded text-sm font-mono">$1</code>');
    
    if (line.trim() === '---') {
      return <hr key={index} className="my-4" />;
    }
    if (line.startsWith('- ')) {
      return <li key={index} className="ml-5 list-disc">{line.substring(2)}</li>;
    }
    
    return <p key={index} dangerouslySetInnerHTML={{ __html: line }} />;
  };

  return (
    <div className={cn("prose prose-slate max-w-none whitespace-pre-wrap space-y-2", {
        'text-center': align === 'center',
        'text-right': align === 'right',
        'text-left': align === 'left' || !align,
    })}>
      {content.split('\n').map(renderLine)}
    </div>
  );
}


export function KnowledgeBaseClient({ initialArticles, loading }: { initialArticles: Article[], loading: boolean }) {
  const { user } = useAuthContext();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [articles, setArticles] = useState(initialArticles);
  const [selected, setSelected] = useState<Article | null>(null);
  const [editing, setEditing] = useState(false);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<Omit<Article, 'id' | 'author' | 'date' | 'tags'>>({ title: '', category: '', content: '', align: 'left' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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

    try {
      if (selected && editing) { // Editing existing article
        const articleRef = doc(firestore, 'articles', selected.id);
        await updateDoc(articleRef, { ...draft });
        toast({ title: "Article Updated", description: "Your changes have been saved." });
      } else { // Creating new article
        const articlesCollection = collection(firestore, 'articles');
        const newArticleData = {
          ...draft,
          author: user.name,
          date: serverTimestamp(),
          tags: [],
        };
        await addDoc(articlesCollection, newArticleData);
        toast({ title: "Article Created", description: "The new article has been added." });
      }
      setEditing(false);
      // The useCollection hook will automatically refresh the data, so no need to set `selected` here.
    } catch (e: any) {
        toast({ title: "Error Saving Article", description: e.message, variant: "destructive"});
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if(window.confirm('Are you sure you want to delete this article?') && firestore) {
        const articleRef = doc(firestore, 'articles', id);
        await deleteDoc(articleRef);
        setSelected(null);
        setEditing(false);
        toast({ title: "Article Deleted", variant: "destructive" });
    }
  }

  const startNew = () => {
    setSelected(null);
    setDraft({ title: '', category: 'Sales', content: '', align: 'left' });
    setEditing(true);
  };

  const startEdit = () => {
      if (!selected) return;
      setDraft({ title: selected.title, category: selected.category, content: selected.content, align: selected.align || 'left' });
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
            <div>
              <MarkdownToolbar 
                textareaRef={textareaRef} 
                onContentChange={(value) => setDraft({...draft, content: value})} 
                onAlignChange={(align) => setDraft({...draft, align: align})}
                onEmojiInsert={(value) => setDraft({...draft, content: value})}
              />
              <Textarea 
                ref={textareaRef}
                placeholder="Write content here... You can use the toolbar above to add basic formatting." 
                className={cn("h-96 font-mono text-sm rounded-t-none", {
                    'text-center': draft.align === 'center',
                    'text-right': draft.align === 'right',
                    'text-left': draft.align === 'left' || !draft.align,
                })}
                value={draft.content} 
                onChange={e => setDraft({...draft, content: e.target.value})}
              />
            </div>
          </div>
        ) : selected ? (
          <div className="max-w-none">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-widest not-prose px-3 py-1">{selected.category}</span>
                <h2 className="mt-3 text-3xl font-bold">{selected.title}</h2>
                <p className="text-sm text-muted-foreground">By {selected.author} on {renderDate(selected.date)}</p>
              </div>
              {user?.role === 'Admin' && (
                <div className="flex gap-2 not-prose">
                  <Button onClick={startEdit} variant="outline" size="icon"><Edit2 size={16}/></Button>
                  <Button onClick={() => handleDeleteArticle(selected.id)} variant="destructive" size="icon"><Trash2 size={16}/></Button>
                </div>
              )}
            </div>
            <SimpleMarkdownRenderer content={selected.content} align={selected.align} />
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
