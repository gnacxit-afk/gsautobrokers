'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { Article } from '@/lib/types';
import { useEffect } from 'react';

const articleSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  category: z.string().min(2, 'Category is required.'),
  content: z.string().min(50, 'Article content must be at least 50 characters.'),
});

type ArticleFormValues = z.infer<typeof articleSchema>;

interface NewArticleFormProps {
  onArticleCreated: (newArticle: Article) => void;
  editingArticle?: Article | null;
  onArticleUpdated: (updatedArticle: Article) => void;
  onCancel: () => void;
}

export function NewArticleForm({ onArticleCreated, editingArticle, onArticleUpdated, onCancel }: NewArticleFormProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  
  const isEditing = !!editingArticle;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ArticleFormValues>({
    resolver: zodResolver(articleSchema),
  });

  useEffect(() => {
    if (isEditing && editingArticle) {
        reset({
            title: editingArticle.title,
            category: editingArticle.category,
            content: editingArticle.content,
        });
    } else {
        reset({ title: '', category: '', content: '' });
    }
  }, [isEditing, editingArticle, reset]);

  const onSubmit = async (data: ArticleFormValues) => {
    if (!firestore || !user) {
      toast({ title: 'Error', description: 'Authentication or database error.', variant: 'destructive' });
      return;
    }

    try {
        if (isEditing && editingArticle) {
            // Update existing article
            const articleRef = doc(firestore, 'articles', editingArticle.id);
            await updateDoc(articleRef, {
                ...data,
                tags: data.category.split(',').map(t => t.trim()),
            });

            const updatedArticle = { ...editingArticle, ...data };
            
            toast({
                title: 'Article Updated',
                description: `"${data.title}" has been successfully updated.`,
            });
            onArticleUpdated(updatedArticle);

        } else {
            // Create new article
            const articlesCollection = collection(firestore, 'articles');
            const newArticleData = {
                ...data,
                author: user.name,
                date: serverTimestamp(),
                tags: data.category.split(',').map(t => t.trim()),
            };
            const docRef = await addDoc(articlesCollection, newArticleData);
            
            const createdArticle = {
                id: docRef.id,
                ...newArticleData,
                date: new Date(),
            };

            toast({
                title: 'Article Created',
                description: `"${data.title}" has been added to the knowledge base.`,
            });
            reset();
            onArticleCreated(createdArticle as Article);
        }
    } catch (error: any) {
      toast({
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Article' : 'Create New Article'}</CardTitle>
        <CardDescription>
          {isEditing ? `You are editing "${editingArticle?.title}".` : 'Author a new knowledge base article. Use Markdown for formatting.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Article Title</Label>
              <Input id="title" {...register('title')} placeholder="e.g., How to Handle Objections" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" {...register('category')} placeholder="e.g., Sales, Products" />
              {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Use Markdown for formatting, e.g., # Heading, - List item..."
              rows={15}
            />
            {errors.content && <p className="text-xs text-red-500">{errors.content.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (isEditing ? 'Saving...' : 'Creating...') : (isEditing ? 'Save Changes' : 'Save Article')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
