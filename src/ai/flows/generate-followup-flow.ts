'use server';
/**
 * @fileOverview Defines a Genkit flow that acts as a sales copilot, generating a contextual WhatsApp follow-up message.
 *
 * @exported
 * - `generateFollowup`: A function that takes lead, notes, and vehicle data to produce a ready-to-send message.
 * - `GenerateFollowupInput`: The input type for the `generateFollowup` function.
 * - `GenerateFollowupOutput`: The output type for the `generateFollowup` function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateFollowupInputSchema = z.object({
  leadDetails: z.string().describe("A JSON string containing the lead's CRM data (name, stage, etc.)."),
  conversationHistory: z.string().describe('A JSON string of the full conversation history with the lead.'),
  vehicleDetails: z.string().optional().describe('Optional. A JSON string of the vehicle the lead is interested in.'),
});
export type GenerateFollowupInput = z.infer<typeof GenerateFollowupInputSchema>;

const GenerateFollowupOutputSchema = z.object({
  whatsappMessage: z.string().describe('The drafted, ready-to-send WhatsApp message in Spanish.'),
});
export type GenerateFollowupOutput = z.infer<typeof GenerateFollowupOutputSchema>;


export async function generateFollowup(input: GenerateFollowupInput): Promise<GenerateFollowupOutput> {
  return generateFollowupFlow(input);
}


const prompt = ai.definePrompt({
  name: 'generateFollowupPrompt',
  input: { schema: GenerateFollowupInputSchema },
  output: { schema: GenerateFollowupOutputSchema },
  prompt: `You are an expert car sales assistant AI. Your task is to analyze the provided lead data and generate a concise, professional, and friendly WhatsApp follow-up message in Spanish.

Your goal is to move the sales process forward.

Analyze the context:
1.  **Lead Stage:** What is the current stage? ("Nuevo", "Citado", "En Seguimiento", etc.).
2.  **History:** What was the last interaction? Was it a system note, an AI analysis, or a manual note from the broker?
3.  **Vehicle:** Is there a specific vehicle of interest?

Based on your analysis, determine the single best next action and draft a message to execute it.

**RULES:**
- The message MUST be in Spanish.
- The message should be friendly and conversational, not robotic.
- The message should be short and to the point, suitable for WhatsApp.
- Start the message with "Hola [Lead Name], te saluda [Broker Name] de GS Auto Brokers."
- Your recommendation should be logical. If a meeting was just scheduled, confirm it. If they showed interest in a car, ask about a test drive. If it's been a while, send a gentle reminder.

**LEAD DATA:**
- Lead Details: {{{leadDetails}}}
- Conversation History: {{{conversationHistory}}}
- Vehicle of Interest: {{{vehicleDetails}}}

Draft the WhatsApp message now.
`,
});

const generateFollowupFlow = ai.defineFlow(
  {
    name: 'generateFollowupFlow',
    inputSchema: GenerateFollowupInputSchema,
    outputSchema: GenerateFollowupOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
