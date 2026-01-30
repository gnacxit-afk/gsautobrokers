
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
  const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${body.trim()}
</Response>`;

  return new NextResponse(fullXml, {
    status,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    
    console.log('Twilio Webhook Payload:', Object.fromEntries(formData));

    const leadPhone = formData.get('lead_phone') as string | null;

    if (leadPhone) {
      console.log(`Detected outbound call to: ${leadPhone}`);
      const dialBody = `
        <Dial 
          callerId="${process.env.TWILIO_PHONE_NUMBER || '+18324005373'}" 
          action="/api/twilio/voice/after-call" 
          method="POST"
          record="record-from-answer"
        >
          <Number>${leadPhone}</Number>
        </Dial>
      `;
      return xmlResponse(dialBody);
    }
    
    console.log('Detected inbound call.');
    
    try {
        const agentsSnapshot = await db.collection('staff')
            .where('canReceiveIncomingCalls', '==', true)
            .limit(1)
            .get();

        if (agentsSnapshot.empty) {
            return xmlResponse(`<Say>We're sorry, but no agents are available at the moment. Please try again later.</Say><Hangup/>`);
        }

        const agent = agentsSnapshot.docs[0];
        const agentId = agent.id;

        return xmlResponse(`
            <Dial action="/api/twilio/voice/after-call" record="record-from-answer">
                <Client>${agentId}</Client>
            </Dial>
        `);

    } catch (error) {
        console.error("Error routing inbound call:", error);
        return xmlResponse(`<Say>We are sorry, but there was an error connecting your call.</Say><Hangup/>`, 500);
    }

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return xmlResponse(`
      <Say voice="alice">We are sorry, but there was an internal error.</Say>
      <Hangup/>
    `, 500);
  }
}

export async function GET() {
  return new NextResponse('This endpoint only accepts POST from Twilio.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain' },
  });
}
