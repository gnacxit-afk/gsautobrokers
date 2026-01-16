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
