
'use server';
/**
 * @fileOverview Generates a Twilio Voice Access Token for an authenticated agent.
 */
import twilio from 'twilio';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';

if (!getApps().length) {
    initializeApp({ credential: applicationDefault() });
}
const db = getFirestore();

export async function generateTwilioToken(identity: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const apiKey = process.env.TWILIO_API_KEY!;
  const apiSecret = process.env.TWILIO_API_SECRET!;

  if (!identity) {
    throw new Error('Identity is required to generate Twilio token');
  }

  // Fetch user's profile to check incoming call permission
  let canReceiveCalls = false;
  try {
      const userDoc = await db.collection('staff').doc(identity).get();
      if (userDoc.exists) {
          canReceiveCalls = userDoc.data()?.canReceiveIncomingCalls === true;
      }
  } catch (e) {
      console.error("Could not fetch user profile for Twilio token generation", e);
      // Default to false for safety
      canReceiveCalls = false;
  }

  const AccessToken = twilio.jwt.AccessToken;
  const VoiceGrant = AccessToken.VoiceGrant;

  const accessToken = new AccessToken(
    accountSid,
    apiKey,
    apiSecret,
    { identity }
  );

  const voiceGrant = new VoiceGrant({
    outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID!,
    incomingAllow: canReceiveCalls,
  });

  accessToken.addGrant(voiceGrant);

  return accessToken.toJwt();
}
