'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest relevant fields for capturing lead information using GenAI.
 *
 * @exported
 * - `suggestLeadFields`: A function that takes a description of a lead and returns suggested fields for capturing information about the lead.
 * - `LeadDescriptionInput`: The input type for the `suggestLeadFields` function.
 * - `SuggestedFieldsOutput`: The output type for the `suggestLeadFields` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LeadDescriptionInputSchema = z.object({
  leadDescription: z
    .string()
    .describe('A detailed description of the lead, including their needs and interests.'),
});
export type LeadDescriptionInput = z.infer<typeof LeadDescriptionInputSchema>;

const SuggestedFieldsOutputSchema = z.object({
  suggestedFields: z
    .array(z.string())
    .describe('An array of suggested fields for capturing information about the lead.'),
});
export type SuggestedFieldsOutput = z.infer<typeof SuggestedFieldsOutputSchema>;

export async function suggestLeadFields(input: LeadDescriptionInput): Promise<SuggestedFieldsOutput> {
  return suggestLeadFieldsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLeadFieldsPrompt',
  input: {schema: LeadDescriptionInputSchema},
  output: {schema: SuggestedFieldsOutputSchema},
  prompt: `Given the following lead description, suggest a list of relevant fields that would be helpful to capture for this lead. The fields should be specific and actionable.

Lead Description: {{{leadDescription}}}

Suggested Fields (as a JSON array of strings):`,
});

const suggestLeadFieldsFlow = ai.defineFlow(
  {
    name: 'suggestLeadFieldsFlow',
    inputSchema: LeadDescriptionInputSchema,
    outputSchema: SuggestedFieldsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
