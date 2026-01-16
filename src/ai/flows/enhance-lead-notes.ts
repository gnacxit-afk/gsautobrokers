'use server';

/**
 * @fileOverview This file defines a Genkit flow to enhance lead notes using AI.
 *
 * @exported
 * - `enhanceLeadNotes`: A function that takes lead notes and returns enhanced notes with AI suggestions.
 * - `EnhanceLeadNotesInput`: The input type for the `enhanceLeadNotes` function.
 * - `EnhancedNotesOutput`: The output type for the `enhanceLeadNotes` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnhanceLeadNotesInputSchema = z.object({
  leadNotes: z
    .string()
    .describe('The original notes for a lead.'),
});
export type EnhanceLeadNotesInput = z.infer<typeof EnhanceLeadNotesInputSchema>;

const EnhancedNotesOutputSchema = z.object({
  enhancedNotes: z
    .string()
    .describe('The enhanced notes with AI suggestions and insights.'),
});
export type EnhancedNotesOutput = z.infer<typeof EnhancedNotesOutputSchema>;

export async function enhanceLeadNotes(input: EnhanceLeadNotesInput): Promise<EnhancedNotesOutput> {
  return enhanceLeadNotesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enhanceLeadNotesPrompt',
  input: {schema: EnhanceLeadNotesInputSchema},
  output: {schema: EnhancedNotesOutputSchema},
  prompt: `Given the following lead notes, provide enhanced notes with AI suggestions and insights to improve the salesperson\'s follow-up strategy. Focus on identifying key information and suggesting actionable steps.

Lead Notes: {{{leadNotes}}}

Enhanced Notes: `,
});

const enhanceLeadNotesFlow = ai.defineFlow(
  {
    name: 'enhanceLeadNotesFlow',
    inputSchema: EnhanceLeadNotesInputSchema,
    outputSchema: EnhancedNotesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
