
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

function xmlResponse(twiml: twilio.twiml.VoiceResponse) {
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse();
  const formData = await req.formData();
  const digits = formData.get('Digits') as string;

  console.log('Gather input received:', { digits });

  switch (digits) {
    case '1':
      twiml.say({ voice: 'alice' }, 'Your appointment has been confirmed. Thank you for calling GS Autobrokers.');
      twiml.hangup();
      break;
    case '2':
      try {
        const agentsSnapshot = await db.collection('staff')
          .where('canReceiveIncomingCalls', '==', true)
          .limit(1)
          .get();
        
        if (agentsSnapshot.empty) {
          twiml.say({ voice: 'alice' }, 'We are sorry, but all of our agents are currently busy. Please call back later.');
          twiml.hangup();
        } else {
          const agentId = agentsSnapshot.docs[0].id;
          twiml.say({ voice: 'alice' }, 'Connecting you to an available agent.');
          const dial = twiml.dial({
            action: "/api/twilio/voice/after-call",
            method: "POST"
          });
          dial.client(agentId);
        }
      } catch (error) {
        console.error("Error finding agent for gather:", error);
        twiml.say({ voice: 'alice' }, 'We encountered an error connecting you. Please try again.');
        twiml.hangup();
      }
      break;
    default:
      twiml.say({ voice: 'alice' }, 'We did not receive a valid selection. Please call back and try again. Goodbye.');
      twiml.hangup();
      break;
  }
  
  return xmlResponse(twiml);
}
