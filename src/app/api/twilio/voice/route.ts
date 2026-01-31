'use server';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Helper function to create an XML response
function xmlResponse(twiml: twilio.twiml.VoiceResponse) {
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

/**
 * This is the unified voice endpoint for handling both inbound and outbound calls.
 */
export async function POST(req: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse();
  const formData = await req.formData();

  const From = formData.get('From') as string;
  const To = formData.get('To') as string; // For outbound calls from client

  console.log('Unified Twilio Voice Request:', { From, To });

  // ===============================================
  // 📤 OUTBOUND Call from Web App (via Client SDK)
  // ===============================================
  // If the 'From' parameter is a client identity, it's an outbound call.
  if (From?.startsWith('client:')) {
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373',
      record: 'record-from-answer-dual',
    });

    // The 'To' parameter is passed from device.connect({ params: { To: number }})
    if (To) {
      dial.number(To);
    } else {
      twiml.say("Sorry, no number was provided to dial.");
    }

    return xmlResponse(twiml);
  }

  // ===============================================
  // 📥 INBOUND Call from PSTN (customer calls you)
  // ===============================================
  // Otherwise, treat it as an inbound call and start the IVR.
  const gather = twiml.gather({
    input: 'speech dtmf',
    timeout: 5,
    numDigits: 1,
    action: '/api/twilio/voice/handle-gather',
    method: 'POST',
  });
  
  gather.say(
    { voice: 'alice' },
    'Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent.'
  );
  
  // If the user provides no input, Twilio will execute the TwiML below.
  twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
  twiml.hangup();

  return xmlResponse(twiml);
}
