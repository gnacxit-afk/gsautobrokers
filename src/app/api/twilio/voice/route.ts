
'use server';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({ credential: applicationDefault() });
} else {
  adminApp = getApps()[0];
}
const db = getFirestore(adminApp);


// Helper function to create an XML response
function xmlResponse(twiml: twilio.twiml.VoiceResponse) {
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const formData = await req.formData();

  const Direction = formData.get('Direction') as string;
  const From = formData.get('From') as string;
  const To = formData.get('To') as string;

  console.log('Twilio Voice Request:', {
    Direction,
    From,
    To
  });

  // ===============================================
  // 📤 OUTBOUND CALL (From CRM client to a number)
  // ===============================================
  if (From && From.startsWith('client:')) {
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373',
      action: "/api/twilio/voice/after-call",
      method: "POST"
    });
    // The 'To' field will contain the lead's number passed from the client
    dial.number({}, To);

    return xmlResponse(twiml);
  }

  // =======================================================
  // 📥 INBOUND CALL (From external number to Twilio number)
  // =======================================================
  if (Direction === 'inbound') {
    const gather = twiml.gather({
      input: 'speech dtmf',
      timeout: 5,
      numDigits: 1,
      action: '/api/twilio/voice/handle-gather',
      method: 'POST'
    });

    gather.say({ voice: 'alice' },
      'Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent.'
    );

    // If the user doesn't enter anything, loop or hang up.
    twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
    twiml.hangup();

    return xmlResponse(twiml);
  }

  // =========================
  // 🧯 SAFETY FALLBACK
  // =========================
  twiml.say('An application error has occurred. Goodbye.');
  twiml.hangup();

  return xmlResponse(twiml);
};

