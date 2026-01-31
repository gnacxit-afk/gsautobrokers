import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
  adminApp = initializeApp({ credential: applicationDefault() });
} else {
  adminApp = getApps()[0];
}
const db = getFirestore(adminApp);

function xmlResponse(body: string, status = 200) {
  const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body.trim()}</Response>`;
  return new NextResponse(fullXml, {
    status,
    headers: { 'Content-Type': 'text/xml' },
  });
}

/**
 * This webhook is for ALL voice calls.
 * It handles both INBOUND calls to your Twilio number
 * and OUTBOUND calls from your web client.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;

    // CHECK IF THIS IS AN OUTBOUND CALL FROM ONE OF OUR AGENTS
    if (from && from.startsWith('client:')) {
        // This is an outbound call from the browser client.
        // 'to' is the PSTN number we want to dial.
        const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
        
        if (!twilioPhoneNumber) {
            console.error('CRITICAL: TWILIO_PHONE_NUMBER environment variable is not set for outbound call.');
            return xmlResponse('<Say>We are sorry, an application error has occurred. The system is missing a valid caller ID.</Say>');
        }
        
        const dial = `
            <Dial callerId="${twilioPhoneNumber}" action="/api/twilio/voice/after-call" record="record-from-answer">
                <Number>${to}</Number>
            </Dial>
        `;
        return xmlResponse(dial);
    }

    // --- IF NOT OUTBOUND, IT'S AN INBOUND CALL ---
    // Find an available agent and route the call to them.
    const agentsSnapshot = await db.collection('staff')
        .where('canReceiveIncomingCalls', '==', true)
        .limit(1)
        .get();

    if (agentsSnapshot.empty) {
        console.log('INBOUND LOGIC: No agents available. Hanging up.');
        const say = `<Say>We're sorry, but no agents are available at the moment. Please try again later.</Say><Hangup/>`;
        return xmlResponse(say);
    }

    const agent = agentsSnapshot.docs[0];
    const agentId = agent.id;
    console.log(`INBOUND LOGIC: Routing call from ${from} to available agent: ${agentId}`);

    const dialToAgent = `
        <Dial action="/api/twilio/voice/after-call" record="record-from-answer">
            <Client>${agentId}</Client>
        </Dial>
    `;
    return xmlResponse(dialToAgent);

  } catch (error) {
    console.error('CRITICAL ERROR in Twilio voice webhook:', error);
    const say = `<Say>We are sorry, but an internal error occurred.</Say><Hangup/>`;
    return xmlResponse(say, 500);
  }
}

export async function GET(req: NextRequest) {
  return new NextResponse('This endpoint only accepts POST requests from Twilio.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain' },
  });
}
