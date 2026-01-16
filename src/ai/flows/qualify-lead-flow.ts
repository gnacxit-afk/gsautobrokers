
'use server';

/**
 * @fileOverview This file defines a Genkit flow to qualify a lead based on BANT criteria.
 *
 * @exported
 * - `qualifyLead`: A function that takes lead data and conversation history to produce a qualification analysis.
 * - `QualifyLeadInput`: The input type for the `qualifyLead` function.
 * - `QualifyLeadOutput`: The output type for the `qualifyLead` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const QualifyLeadInputSchema = z.object({
  leadDetails: z.string().describe('A JSON string containing the lead\'s CRM data (name, email, phone, stage, etc.).'),
  conversationHistory: z.string().describe('A JSON string of the full conversation history with the lead, including all notes and interactions.'),
});
export type QualifyLeadInput = z.infer<typeof QualifyLeadInputSchema>;

const QualifyLeadOutputSchema = z.object({
  leadStatus: z.enum(["Hot", "Warm", "In Nurturing", "Cold"]).describe("Clasificación del lead."),
  totalScore: z.number().describe("Puntaje total del lead (0-100)."),
  budget: z.string().describe("Análisis y puntaje del Presupuesto (Budget)."),
  authority: z.string().describe("Análisis y puntaje de la Autoridad (Authority)."),
  need: z.string().describe("Análisis y puntaje de la Necesidad (Need)."),
  timing: z.string().describe("Análisis y puntaje del Momento (Timing)."),
  qualificationDecision: z.enum(["Qualified", "Not Qualified"]).describe("Decisión final de calificación."),
  salesRecommendation: z.string().describe("La siguiente acción clara y recomendada para el equipo de ventas."),
});
export type QualifyLeadOutput = z.infer<typeof QualifyLeadOutputSchema>;

export async function qualifyLead(input: QualifyLeadInput): Promise<QualifyLeadOutput> {
  return qualifyLeadFlow(input);
}

const prompt = ai.definePrompt({
  name: 'qualifyLeadPrompt',
  input: { schema: QualifyLeadInputSchema },
  output: { schema: QualifyLeadOutputSchema },
  prompt: `You are a senior used cars sales qualification AI working for a performance-driven company. Your task is to analyze a lead based on conversation data and CRM inputs and determine their status. You must strictly follow the rules below and return your answer in Spanish.

========================
REQUIRED OPERATIVE CONDITIONS
========================
First, verify if the lead meets ALL minimum requirements:
1.  Valid phone number or direct contact method exists.
2.  There has been at least one two-way interaction (the lead has replied or engaged in conversation).
3.  There is clear interest expressed in a specific product or service (e.g., a specific car model, financing options).

If ANY of these are missing, you MUST automatically classify the lead as "Cold Lead" and set the total score to 0. Do NOT proceed to BANT scoring.

========================
BANT SCORING (ONLY IF OPERATIVE CONDITIONS ARE MET)
========================
Evaluate the lead using the four BANT criteria:

1.  BUDGET (0–25 points)
    - 25: Budget confirmed, accepts the vehicle's price range, or actively asks about financing options.
    - 15: Budget is probable (e.g., mentions having savings) but is not fully confirmed.
    - 0: Avoids discussing money, explicitly rejects the price, or states they are “just looking.”

2.  AUTHORITY (0–20 points)
    - 20: The lead is the final decision-maker (e.g., "I'm buying it for myself," uses "I" statements about the purchase).
    - 10: The lead is a strong influencer but needs to consult someone else (e.g., "I need to check with my partner").
    - 0: The lead has no decision-making power (e.g., "I'm asking for a friend").

3.  NEED (0–30 points)
    - 30: Expresses an urgent or strong need (e.g., "My current car broke down," "I need a car for my new job next week").
    - 20: Expresses a clear, non-urgent need (e.g., "I'm looking to upgrade my car," "We need a bigger family vehicle").
    - 5: Expresses a weak or purely exploratory interest (e.g., "What models do you have?").
    - 0: Expresses curiosity only, with no stated need.

4.  TIMING (0–25 points)
    - 25: Intends to purchase within the next 7 days.
    - 15: Intends to purchase within 8 to 30 days.
    - 0: Timing is longer than 30 days or is completely undefined.

========================
QUALIFICATION & CLASSIFICATION
========================
A lead is considered "Qualified" ONLY IF:
- It meets ALL operative conditions.
- It satisfies at least 3 out of 4 BANT criteria (a criterion is satisfied if its score is greater than 0).

Calculate the total score (0–100) and classify the lead as follows:
- 80–100 → Hot Lead
- 60–79 → Warm Lead
- 40–59 → In Nurturing
- Below 40 → Cold Lead

A lead is NOT qualified simply because they sent a message. A lead is qualified only if they show real buying intent and progress in the buying process.

========================
LEAD DATA FOR ANALYSIS
========================
- CRM Details: {{{leadDetails}}}
- Conversation History & Notes: {{{conversationHistory}}}

Provide your final analysis based on the rules above.
`,
});

const qualifyLeadFlow = ai.defineFlow(
  {
    name: 'qualifyLeadFlow',
    inputSchema: QualifyLeadInputSchema,
    outputSchema: QualifyLeadOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
