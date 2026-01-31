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

const MY_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18324005373';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const To = formData.get('To') as string;
    const From = formData.get('From') as string;
    
    // Detailed logging for every request
    console.log('Twilio Webhook Received:', {
      To,
      From,
      CallStatus: formData.get('CallStatus'),
      Direction: formData.get('Direction'),
      ClientIdentity: formData.get('From')?.toString().startsWith('client:') ? formData.get('From') : 'N/A (PSTN Call)',
      IsClientCall: formData.get('From')?.toString().startsWith('client:')
    });

    // If the 'From' parameter starts with 'client:', it's an outbound call from our app.
    if (From?.startsWith('client:')) {
      console.log(`OUTBOUND LOGIC: Initiating call from agent ${From} to ${To}`);
      
      const dial = `
        <Dial 
          callerId="${MY_TWILIO_NUMBER}"
          action="/api/twilio/voice/after-call" 
          method="POST"
          record="record-from-answer"
        >
          <Number>${To}</Number>
        </Dial>
      `;
      return xmlResponse(dial);
    }
    
    // Otherwise, it's an inbound call from an external number to our Twilio number.
    console.log(`INBOUND LOGIC: Receiving call from ${From} to ${To}`);
    
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
    console.log(`INBOUND LOGIC: Routing call to available agent: ${agentId}`);

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
