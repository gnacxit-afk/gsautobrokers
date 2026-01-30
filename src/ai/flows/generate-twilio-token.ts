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
      throw new Error('Twilio credentials are not configured on the server. Please check your .env file.');
    }

    // Create a new Access Token
    const accessToken = new AccessToken(accountSid, apiKey, apiSecret);

    // Set the identity of the token
    accessToken.identity = identity;

    // Create a VoiceGrant for the token
    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true, // Allow incoming calls
    });

    // Add the grant to the token
    accessToken.addGrant(voiceGrant);
    
    // Serialize the token to a JWT and return it
    return {
      token: accessToken.toJwt(),
    };
  }
);
