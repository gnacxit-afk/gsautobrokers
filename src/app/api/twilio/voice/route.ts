import { NextRerequest, NextResponse } from 'next/server';
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
    const Direction = formData.get('Direction') as string;
    
    // Detailed logging
    console.log('Twilio Webhook Received:', {
      To,
      From,
      Direction,
      CallStatus: formData.get('CallStatus'),
    });

    // --- OUTBOUND CALL: From SDK to an external number ---
    // The `To` parameter is passed from device.connect() and is the customer's number.
    // The `From` is the client identity (e.g., 'client:user_xyz').
    if (To && To !== MY_TWILIO_NUMBER && From?.startsWith('client:')) {
      console.log(`Handling OUTBOUND call to: ${To}`);
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
    
    // --- INBOUND CALL: From an external number to our Twilio number ---
    // The `To` is our Twilio number.
    // The `From` is the customer's number.
    console.log(`Handling INBOUND call from: ${From}`);
    
    const agentsSnapshot = await db.collection('staff')
        .where('canReceiveIncomingCalls', '==', true)
        .limit(1)
        .get();

    if (agentsSnapshot.empty) {
        console.log('No agents available for inbound call.');
        const say = `<Say>We're sorry, but no agents are available at the moment. Please try again later.</Say><Hangup/>`;
        return xmlResponse(say);
    }

    const agent = agentsSnapshot.docs[0];
    const agentId = agent.id;
    console.log(`Routing inbound call to agent: ${agentId}`);

    const dial = `
        <Dial action="/api/twilio/voice/after-call" record="record-from-answer">
            <Client>${agentId}</Client>
        </Dial>
    `;
    return xmlResponse(dial);

  } catch (error) {
    console.error('Error in Twilio voice webhook:', error);
    const say = `<Say>We are sorry, but an internal error occurred.</Say><Hangup/>`;
    return xmlResponse(say, 500);
  }
}

export async function GET(req: NextRequest) {
  return new NextResponse('This endpoint only accepts POST from Twilio.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain' },
  });
}
