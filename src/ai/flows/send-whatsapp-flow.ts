'use server';
/**
 * @fileOverview A Genkit flow to send a WhatsApp message via the Meta API.
 *
 * @exported
 * - `sendWhatsappMessage`: A function to send a message.
 */

import { ai } from '@/ai/genkit';
import { 
    SendWhatsappMessageInputSchema,
    type SendWhatsappMessageInput,
    SendWhatsappMessageOutputSchema,
    type SendWhatsappMessageOutput
} from './send-whatsapp-types';

export async function sendWhatsappMessage(input: SendWhatsappMessageInput): Promise<SendWhatsappMessageOutput> {
  return sendWhatsappMessageFlow(input);
}

const sendWhatsappMessageFlow = ai.defineFlow(
  {
    name: 'sendWhatsappMessageFlow',
    inputSchema: SendWhatsappMessageInputSchema,
    outputSchema: SendWhatsappMessageOutputSchema,
  },
  async ({ to, text }) => {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp credentials are not set in environment variables.');
      return {
        success: false,
        message: 'WhatsApp API credentials are not configured on the server.',
      };
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          type: 'text',
          text: {
            body: text,
          },
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error?.message || 'An unknown error occurred.';
        console.error('WhatsApp API Error:', responseData.error);
        return {
          success: false,
          message: `Failed to send message: ${errorMessage}`,
        };
      }

      return {
        success: true,
        message: 'Message sent successfully!',
      };
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        message: error.message || 'An unexpected error occurred.',
      };
    }
  }
);
