'use server';
/**
 * @fileOverview A knowledge base resource summarization AI agent.
 *
 * - summarizeResource - A function that handles the summarization process.
 * - SummarizeResourceInput - The input type for the summarizeResource function.
 * - SummarizeResourceOutput - The return type for the summarizeResource function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeResourceInputSchema = z.object({
  resourceContent: z
    .string()
    .describe("The content of the knowledge base resource to be summarized."),
});
export type SummarizeResourceInput = z.infer<typeof SummarizeResourceInputSchema>;

const SummarizeResourceOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the knowledge base resource.'),
});
export type SummarizeResourceOutput = z.infer<typeof SummarizeResourceOutputSchema>;

export async function summarizeResource(input: SummarizeResourceInput): Promise<SummarizeResourceOutput> {
  return summarizeResourceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeResourcePrompt',
  input: {schema: SummarizeResourceInputSchema},
  output: {schema: SummarizeResourceOutputSchema},
  prompt: `You are an expert at summarizing knowledge base resources.

  Please provide a concise summary of the following resource content so that users can quickly understand the key information.

  Resource Content: {{{resourceContent}}}`,
});

const summarizeResourceFlow = ai.defineFlow(
  {
    name: 'summarizeResourceFlow',
    inputSchema: SummarizeResourceInputSchema,
    outputSchema: SummarizeResourceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
