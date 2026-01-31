'use server';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Helper function to create an XML response
function xmlResponse(twiml: twilio.twiml.VoiceResponse) {
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const formData = await req.formData();

  const From = formData.get('From') as string;
  const To = formData.get('To') as string;
  
  console.log('Twilio Voice Request Received:', { From, To });

  // ============================
  // 📤 OUTBOUND FROM WEB APP
  // ============================
  // If the call comes from a 'client:' (our web app) and is going TO a real number ('+...')
  if (From && From.startsWith('client:')) {
    console.log('Handling OUTBOUND call to PSTN:', To);
    
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373',
      record: 'record-from-answer-dual',
    });

    // We only need to dial a number here, not a client.
    dial.number({}, To);
    
    return xmlResponse(twiml);
  }
  
  // ============================
  // 📥 INBOUND FROM REAL PHONE (PSTN)
  // ============================
  // Any other call pattern is treated as an inbound call from a customer.
  console.log('Handling INBOUND call from PSTN:', From);
  
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
