import { z } from 'genkit';

export const SendWhatsappMessageInputSchema = z.object({
  to: z.string().describe("The recipient's phone number, including country code."),
  text: z.string().describe('The text message to send.'),
});
export type SendWhatsappMessageInput = z.infer<typeof SendWhatsappMessageInputSchema>;

export const SendWhatsappMessageOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SendWhatsappMessageOutput = z.infer<typeof SendWhatsappMessageOutputSchema>;
