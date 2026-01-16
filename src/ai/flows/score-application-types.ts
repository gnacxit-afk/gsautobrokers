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
  score: z.number().describe('La puntuación final calculada de 0 a 100.'),
  status: z.enum(['Premium', 'Apto', 'Descartado']).describe('La clasificación de estado final del candidato.'),
  reasoning: z.string().describe('Una breve explicación de cómo se calculó la puntuación, mencionando los factores clave.'),
  semanticAnalysis: z.string().describe('El análisis de la pregunta abierta sobre por qué el candidato encaja en el modelo.'),
});
export type ScoreApplicationOutput = z.infer<typeof ScoreApplicationOutputSchema>;
