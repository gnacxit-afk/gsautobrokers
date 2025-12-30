'use server';

/**
 * @fileOverview Analyzes customer leads using GenAI, determines their fit for a car purchase,
 * and automatically updates the lead information.
 *
 * - analyzeAndUpdateLead - A function that handles the lead analysis and updating process.
 * - AnalyzeAndUpdateLeadInput - The input type for the analyzeAndUpdateLead function.
 * - AnalyzeAndUpdateLeadOutput - The return type for the analyzeAndUpdateLead function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeAndUpdateLeadInputSchema = z.object({
  leadDetails: z.string().describe('Detailed information about the customer lead, including contact details, preferences, and any previous interactions.'),
});
export type AnalyzeAndUpdateLeadInput = z.infer<typeof AnalyzeAndUpdateLeadInputSchema>;

const AnalyzeAndUpdateLeadOutputSchema = z.object({
  isGoodFit: z.boolean().describe('Whether the lead is a good fit for a car purchase based on the analysis.'),
  updatedLeadInformation: z.string().describe('Updated lead information, including recommendations and next steps.'),
  reasoning: z.string().describe('The reasoning behind the determination of whether the lead is a good fit.'),
});
export type AnalyzeAndUpdateLeadOutput = z.infer<typeof AnalyzeAndUpdateLeadOutputSchema>;

export async function analyzeAndUpdateLead(input: AnalyzeAndUpdateLeadInput): Promise<AnalyzeAndUpdateLeadOutput> {
  return analyzeAndUpdateLeadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAndUpdateLeadPrompt',
  input: {schema: AnalyzeAndUpdateLeadInputSchema},
  output: {schema: AnalyzeAndUpdateLeadOutputSchema},
  prompt: `You are an expert sales analyst specializing in determining the quality of customer leads for car purchases.

You will analyze the provided lead details and determine if the lead is a good fit for a car purchase. Provide reasoning for your determination and suggest updated lead information, including recommendations and next steps.

Lead Details: {{{leadDetails}}}

Consider factors such as the customer's expressed interests, financial situation, and past interactions.
Set the isGoodFit field appropriately based on your analysis.
Provide updated lead information in the updatedLeadInformation field, including personalized recommendations and suggested next steps for the sales team.
Explain your reasoning in the reasoning field.
`, 
});

const analyzeAndUpdateLeadFlow = ai.defineFlow(
  {
    name: 'analyzeAndUpdateLeadFlow',
    inputSchema: AnalyzeAndUpdateLeadInputSchema,
    outputSchema: AnalyzeAndUpdateLeadOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
