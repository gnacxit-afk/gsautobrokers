
'use server';
/**
 * @fileOverview Generates a Twilio Voice Access Token for an authenticated agent.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import twilio from 'twilio';

const { AccessToken } = twilio.jwt;
const { VoiceGrant } = AccessToken;

const GenerateTokenInputSchema = z.object({
  identity: z.string().min(1, { message: "Identity cannot be empty." }).describe('The unique identity of the agent, typically their user ID.'),
});
export type GenerateTokenInput = z.infer<typeof GenerateTokenInputSchema>;

const GenerateTokenOutputSchema = z.object({
  token: z.string(),
});
export type GenerateTokenOutput = z.infer<typeof GenerateTokenOutputSchema>;

/**
 * Generates a Twilio Access Token. This function is a simple wrapper around the Genkit flow.
 * It will throw an error if the flow fails, which should be caught by the caller.
 */
export async function generateTwilioToken(input: GenerateTokenInput): Promise<GenerateTokenOutput> {
  return generateTokenFlow(input);
}

const generateTokenFlow = ai.defineFlow(
  {
    name: 'generateTokenFlow',
    inputSchema: GenerateTokenInputSchema,
    outputSchema: GenerateTokenOutputSchema,
  },
  async ({ identity }) => {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      throw new Error('Twilio credentials are not configured on the server. Please check the .env file.');
    }

    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600, // Explicitly set Time-To-Live to 1 hour (3600 seconds)
    });

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, // Allow incoming calls
    });

    accessToken.addGrant(voiceGrant);
    
    return {
      token: accessToken.toJwt(),
    };
  }
);
