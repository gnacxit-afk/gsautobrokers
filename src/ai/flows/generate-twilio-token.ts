'use server';
/**
 * @fileOverview Generates a Twilio Voice Access Token for an authenticated agent.
 */
import twilio from 'twilio';

export async function generateTwilioToken(identity: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const apiKey = process.env.TWILIO_API_KEY!;
  const apiSecret = process.env.TWILIO_API_SECRET!;
  const twimlAppSid = process.env.TWIML_APP_SID!;

  if (!identity) {
    throw new Error('Identity is required to generate Twilio token');
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  // ✅ Identity MUST be passed here
  const accessToken = new AccessToken(
    accountSid,
    apiKey,
    apiSecret,
    { identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: twimlAppSid,
    incomingAllow: true,
  });

  accessToken.addGrant(voiceGrant);

  return accessToken.toJwt();
}
