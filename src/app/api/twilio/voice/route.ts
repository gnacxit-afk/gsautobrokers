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
 * It follows the logic provided to distinguish between call flows.
 */
export async function POST(req: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse();
  const formData = await req.formData();

  const From = formData.get('From') as string;
  const To = formData.get('To') as string;

  console.log('Unified Twilio Voice Request:', { From, To });

  // 🔹 LLAMADA SALIENTE DESDE EL BROWSER (Agente marca)
  // When calling from the client SDK, `From` is the client identity and `To` is the PSTN number being dialed.
  if (From?.startsWith('client:')) {
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373',
      record: 'record-from-answer-dual',
    });

    // The `To` parameter for an outbound call is passed in the request body from Twilio,
    // which it gets from the `device.connect({ params: { To: number }})` call.
    if (To && To.startsWith('+')) {
        dial.number(To);
    } else {
        twiml.say('Invalid number format for outbound call.');
    }
    
    return xmlResponse(twiml);
  }

  // 🔹 LLAMADA ENTRANTE REAL (cliente)
  // For inbound calls, `From` is the customer's number and `To` is your Twilio number.
  // This block will execute as the fallback.
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

  // If the user provides no input after the gather, Twilio will continue here.
  twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
  twiml.hangup();

  return xmlResponse(twiml);
}
