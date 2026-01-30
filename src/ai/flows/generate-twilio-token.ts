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
  identity: z.string().describe('The unique identity of the agent, typically their user ID.'),
});
export type GenerateTokenInput = z.infer<typeof GenerateTokenInputSchema>;

const GenerateTokenOutputSchema = z.object({
  token: z.string(),
});
export type GenerateTokenOutput = z.infer<typeof GenerateTokenOutputSchema>;

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
      throw new Error('Twilio credentials are not configured on the server.');
    }

    const accessToken = new AccessToken(accountSid, apiKey, apiSecret, { identity });
    
    accessToken.identity = identity;

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
