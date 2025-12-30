'use server';
/**
 * @fileOverview A knowledge base article summarization AI agent.
 *
 * - summarizeArticle - A function that handles the article summarization process.
 * - SummarizeArticleInput - The input type for the summarizeArticle function.
 * - SummarizeArticleOutput - The return type for the summarizeArticle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeArticleInputSchema = z.object({
  articleContent: z
    .string()
    .describe("The content of the knowledge base article to be summarized."),
});
export type SummarizeArticleInput = z.infer<typeof SummarizeArticleInputSchema>;

const SummarizeArticleOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the knowledge base article.'),
  progress: z.string().describe('Progress of article summarization')
});
export type SummarizeArticleOutput = z.infer<typeof SummarizeArticleOutputSchema>;

export async function summarizeArticle(input: SummarizeArticleInput): Promise<SummarizeArticleOutput> {
  return summarizeArticleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeArticlePrompt',
  input: {schema: SummarizeArticleInputSchema},
  output: {schema: SummarizeArticleOutputSchema},
  prompt: `You are an expert at summarizing knowledge base articles.

  Please provide a concise summary of the following article content so that users can quickly understand the key information. Also, indicate progress that summarization has started.

  Article Content: {{{articleContent}}}`,
});

const summarizeArticleFlow = ai.defineFlow(
  {
    name: 'summarizeArticleFlow',
    inputSchema: SummarizeArticleInputSchema,
    outputSchema: SummarizeArticleOutputSchema,
  },
  async input => {
    const {output} = await prompt({...input, progress: 'Summarization in progress.'});
    return {...output!, progress: 'Generated a short summary of the article.'};
  }
);
