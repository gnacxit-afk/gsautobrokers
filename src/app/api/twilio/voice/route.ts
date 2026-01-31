
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
 * This is the dedicated voice endpoint for handling INBOUND calls.
 * It always assumes the call is from an external customer and initiates the IVR.
 */
export async function POST(req: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse();
  
  // 🔹 LLAMADA ENTRANTE REAL (cliente)
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
