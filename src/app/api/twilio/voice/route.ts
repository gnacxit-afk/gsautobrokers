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
 * This webhook is for INBOUND calls to your Twilio number.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const from = formData.get('From') as string;

    // --- THIS IS AN INBOUND CALL ---
    // Find an available agent and route the call to them.
    const agentsSnapshot = await db.collection('staff')
        .where('canReceiveIncomingCalls', '==', true)
        .limit(1)
        .get();

    if (agentsSnapshot.empty) {
        console.log('INBOUND HANDLER: No agents available. Hanging up.');
        const say = `<Say>We're sorry, but no agents are available at the moment. Please try again later.</Say><Hangup/>`;
        return xmlResponse(say);
    }

    const agent = agentsSnapshot.docs[0];
    const agentId = agent.id;
    console.log(`INBOUND HANDLER: Routing call from ${from} to available agent: ${agentId}`);

    const dialToAgent = `
        <Dial action="/api/twilio/voice/after-call" record="record-from-answer">
            <Client>${agentId}</Client>
        </Dial>
    `;
    return xmlResponse(dialToAgent);

  } catch (error) {
    console.error('CRITICAL ERROR in Twilio inbound voice webhook:', error);
    const say = `<Say>We are sorry, but an internal error occurred.</Say><Hangup/>`;
    return xmlResponse(say, 500);
  }
}
