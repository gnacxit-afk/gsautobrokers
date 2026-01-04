
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
    leadStatus: z.enum(["Hot Lead", "Warm Lead", "In Nurturing", "Cold Lead"]).describe('The final classification of the lead.'),
    totalScore: z.number().describe('The total BANT score from 0-100.'),
    bantBreakdown: z.object({
        budget: z.string().describe('The score and reasoning for the Budget criterion.'),
        authority: z.string().describe('The score and reasoning for the Authority criterion.'),
        need: z.string().describe('The score and reasoning for the Need criterion.'),
        timing: z.string().describe('The score and reasoning for the Timing criterion.'),
    }),
    qualificationDecision: z.enum(["Qualified", "Not Qualified"]).describe('The final qualification decision.'),
    salesRecommendation: z.string().describe('One clear next action for the sales team.'),
});
export type AnalyzeAndUpdateLeadOutput = z.infer<typeof AnalyzeAndUpdateLeadOutputSchema>;

export async function analyzeAndUpdateLead(input: AnalyzeAndUpdateLeadInput): Promise<AnalyzeAndUpdateLeadOutput> {
  return analyzeAndUpdateLeadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeAndUpdateLeadPrompt',
  input: {schema: AnalyzeAndUpdateLeadInputSchema},
  output: {schema: AnalyzeAndUpdateLeadOutputSchema},
  prompt: `You are a senior used cars sales qualification AI working for a performance-driven company.

Your task is to analyze a lead based on conversation data and CRM inputs, and determine whether the lead is:
- Hot Lead
- Warm Lead
- In Nurturing
- Cold Lead

You must strictly follow the rules below.

========================
1. REQUIRED OPERATIVE CONDITIONS
========================

First, verify if the lead meets ALL minimum requirements:

- Valid phone number or direct contact
- Two-way interaction (the lead responded)
- Clear interest in a specific product or service

If ANY of these are missing:
→ Automatically classify the lead as "Cold Lead"
→ Do NOT apply scoring

========================
2. BANT EVALUATION (EVOLVED)
========================

Evaluate the lead using the four BANT criteria:

BUDGET (0–25 points)
- 25: Budget confirmed, accepts price range, or asks about financing
- 15: Budget probable but not fully confirmed
- 0: Avoids money, price rejection, or “just looking”

AUTHORITY (0–20 points)
- 20: Final decision-maker
- 10: Influences the decision
- 0: No decision power

NEED (0–30 points)
- 30: Urgent or strong need (problem, pain, or strong desire)
- 20: Clear need
- 5: Weak or exploratory interest
- 0: Curiosity only

TIMING (0–25 points)
- 25: Purchase within 0–7 days
- 15: Purchase within 8–30 days
- 0: More than 30 days or undefined timing

========================
3. LEAD QUALIFICATION RULE
========================

A lead is considered "Qualified" ONLY IF:
- It meets the operative conditions
- It satisfies at least 3 out of 4 BANT criteria

========================
4. FINAL SCORING & CLASSIFICATION
========================

Calculate the total score (0–100) and classify as:

- 80–100 → Hot Lead
- 60–79 → Warm Lead
- 40–59 → In Nurturing
- Below 40 → Cold Lead

========================
5. OUTPUT FORMAT (MANDATORY)
========================

Return your answer in the following structure and show it in Spanish:

- Lead Status: [Hot / Warm / In Nurturing / Cold]
- Total Score: [0–100]
- BANT Breakdown:
  - Budget: [score + reason]
  - Authority: [score + reason]
  - Need: [score + reason]
  - Timing: [score + reason]
- Qualification Decision: [Qualified / Not Qualified]
- Sales Recommendation: One clear next action for the sales team

========================
IMPORTANT RULE
========================

A lead is NOT qualified because they sent a message.
A lead is qualified only if they show real buying intent and progress in the buying process.

========================

Lead Details: {{{leadDetails}}}
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
