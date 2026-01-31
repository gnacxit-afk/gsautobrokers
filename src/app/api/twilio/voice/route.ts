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
 * This endpoint ONLY handles INBOUND calls from the PSTN (customers calling you).
 * It initiates the IVR flow.
 */
export async function POST(req: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const formData = await req.formData();

  const From = formData.get('From') as string;
  
  console.log('INBOUND Call Request from PSTN:', { From });

  // This is the IVR logic for incoming calls.
  const gather = twiml.gather({
    input: 'speech dtmf',
    timeout: 5,
    numDigits: 1,
    action: '/api/twilio/voice/handle-gather',
    method: 'POST'
  });

  gather.say({ voice: 'alice' },
    'Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent.'
  );

  // If the user does not enter anything, this will be executed.
  twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
  twiml.hangup();

  return xmlResponse(twiml);
};
