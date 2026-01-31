
'use server';
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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const direction = formData.get('Direction') as string;
    
    // Scenario 1: Outbound call initiated from our web application via Twilio.Device
    if (direction === 'outbound-dial') {
      const to = formData.get('To') as string;
      const MY_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER;

      if (!MY_TWILIO_NUMBER) {
        console.error('CRITICAL: TWILIO_PHONE_NUMBER env var not set for outbound call.');
        return xmlResponse('<Say>Application error: Caller ID is not configured.</Say>');
      }

      if (!to) {
        console.error('Outbound call missing "To" parameter.');
        return xmlResponse('<Say>Error: Destination number is missing.</Say>');
      }

      console.log(`OUTBOUND call detected. Routing to PSTN number: ${to}`);
      
      // Use <Dial> with a <Number> noun to connect to a real phone number.
      // The 'callerId' is your Twilio number.
      const dial = `
        <Dial 
          callerId="${MY_TWILIO_NUMBER}"
          action="/api/twilio/voice/after-call" 
          method="POST"
          record="record-from-answer"
        >
          <Number>${to}</Number>
        </Dial>
      `;
      return xmlResponse(dial);
    }
    // Scenario 2: Inbound call from a customer to our Twilio number
    else if (direction === 'inbound') {
      console.log(`INBOUND call detected. Finding an available agent.`);

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
      console.log(`INBOUND HANDLER: Routing call to agent client: ${agentId}`);

      // Use <Dial> with a <Client> noun to connect to our web app softphone.
      const dialToAgent = `
          <Dial action="/api/twilio/voice/after-call" record="record-from-answer">
              <Client>${agentId}</Client>
          </Dial>
      `;
      return xmlResponse(dialToAgent);
    }
    // Fallback Scenario: Should not happen in normal operation
    else {
        console.warn(`Unhandled call direction: ${direction}. Hanging up.`);
        return xmlResponse('<Say>Could not determine call direction. Goodbye.</Say><Hangup/>');
    }

  } catch (error) {
    console.error('CRITICAL ERROR in Twilio voice webhook:', error);
    const say = `<Say>We are sorry, but an internal error occurred.</Say><Hangup/>`;
    return xmlResponse(say, 500);
  }
}
