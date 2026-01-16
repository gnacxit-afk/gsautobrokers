'use server';
/**
 * @fileOverview This file defines a Genkit flow to score a candidate's application.
 *
 * @exported
 * - `scoreApplication`: A function that takes application data and returns a score and analysis.
 * - `ScoreApplicationInput`: The input type for the `scoreApplication` function.
 * - `ScoreApplicationOutput`: The output type for the `scoreApplication` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const ScoreApplicationInputSchema = z.object({
  paymentModel: z.string(),
  motivation: z.string(),
  timeDedication: z.string(),
  timeManagement: z.string(),
  salesExperience: z.string(),
  closingComfort: z.string(),
  tools: z.object({
    smartphone: z.boolean(),
    internet: z.boolean(),
    whatsapp: z.boolean(),
    facebook: z.boolean(),
  }),
  crmExperience: z.string(),
  incomeModelAgreement: z.string(),
  fitReason: z.string(),
});
export type ScoreApplicationInput = z.infer<typeof ScoreApplicationInputSchema>;

export const ScoreApplicationOutputSchema = z.object({
  score: z.number().describe('The final calculated score from 0 to 100.'),
  status: z.enum(['Premium', 'Apto', 'Descartado']).describe('The final status classification of the candidate.'),
  reasoning: z.string().describe('A brief explanation of how the score was calculated, mentioning key factors.'),
  semanticAnalysis: z.string().describe('The analysis of the open-ended question about why the candidate fits the model.'),
});
export type ScoreApplicationOutput = z.infer<typeof ScoreApplicationOutputSchema>;


export async function scoreApplication(input: ScoreApplicationInput): Promise<ScoreApplicationOutput> {
  return scoreApplicationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'scoreApplicationPrompt',
  input: { schema: ScoreApplicationInputSchema },
  output: { schema: ScoreApplicationOutputSchema },
  prompt: `You are an expert HR AI responsible for scoring candidates for a fully independent, commission-based sales role. Your task is to analyze the candidate's answers and provide a score from 0-100.

First, check for IMMEDIATE DISQUALIFICATION criteria. If any of the following are true, you MUST assign a score below 60 and set the status to "Descartado":
- 'motivation' is "Busco un empleo tradicional".
- 'salesExperience' is "No y no me interesa vender".
- 'crmExperience' is "No y no me interesa".
- 'incomeModelAgreement' is "No, prefiero algo seguro".
- Any of the 'tools' (smartphone, internet, whatsapp, facebook) is 'false'.

If none of the disqualification criteria are met, calculate the score using this table:
- paymentModel: "Sí, me siento cómodo ganando según resultados" -> 15 points
- motivation: "Desarrollarme en ventas y aumentar ingresos" -> 15 points
- timeDedication: "Más de 4 horas" -> 15 points; "2–4 horas" -> 10 points
- timeManagement: "Soy freelancer / independiente" or "Tengo horarios flexibles" -> 15 points
- closingComfort: "Muy cómodo" -> 15 points; "Cómodo" -> 10 points
- salesExperience: "Sí" -> 10 points
- tools: All four are true -> 15 points
- crmExperience: "Sí" or "No, pero puedo aprender" -> 0 points (This is not a positive scoring factor, only a disqualifier)
- incomeModelAgreement: "Sí, lo entiendo y estoy de acuerdo" -> 0 points (This is not a positive scoring factor, only a disqualifier)


Next, perform a SEMANTIC ANALYSIS on the 'fitReason' text ("En una frase corta, dinos por qué consideras que encajas en este modelo de trabajo:").
- Analyze the text for keywords like "metas", "ambición", "crecimiento", "proactivo", "resultados", "emprender", "independencia", "ganar".
- If the phrase is negative, very short (e.g., "necesito dinero"), or shows a lack of real interest, SUBTRACT 10 points from the total score.
- If the phrase demonstrates strong commercial ambition and proactivity, ADD 5 points to the total score.
- Briefly summarize your semantic analysis in the 'semanticAnalysis' output field.

Finally, calculate the total score and determine the final status:
- 80-100: "Premium"
- 60-79: "Apto"
- 0-59: "Descartado"

Provide a brief 'reasoning' for the final score, mentioning the key factors.

Candidate's Answers:
- Payment Model: {{{paymentModel}}}
- Motivation: {{{motivation}}}
- Time Dedication: {{{timeDedication}}}
- Time Management: {{{timeManagement}}}
- Sales Experience: {{{salesExperience}}}
- Closing Comfort: {{{closingComfort}}}
- Tools: smartphone: {{{tools.smartphone}}}, internet: {{{tools.internet}}}, whatsapp: {{{tools.whatsapp}}}, facebook: {{{tools.facebook}}}
- CRM Experience: {{{crmExperience}}}
- Income Model Agreement: {{{incomeModelAgreement}}}
- Fit Reason: "{{{fitReason}}}"
`,
});

const scoreApplicationFlow = ai.defineFlow(
  {
    name: 'scoreApplicationFlow',
    inputSchema: ScoreApplicationInputSchema,
    outputSchema: ScoreApplicationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
