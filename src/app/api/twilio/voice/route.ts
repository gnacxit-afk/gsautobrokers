
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
  const twiml = new twilio.twiml.VoiceResponse();
  const body = await req.text();
  const params = new URLSearchParams(body);

  const From = params.get('From');
  const To = params.get('To');

  // Case 1: Outbound call from the browser CRM (From = client:...)
  if (From?.startsWith('client:')) {
    // Validate the destination number exists and is in E.164 format
    if (To && To.startsWith('+')) {
      const dial = twiml.dial({
        callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373',
        record: 'record-from-answer-dual',
        answerOnBridge: true,
        action: '/api/twilio/voice/after-call',
      });
      dial.number(
        {
          statusCallback: '/api/twilio/voice/call-events',
          statusCallbackMethod: 'POST',
          statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        },
        To
      );
    } else {
      twiml.say('Invalid destination number.');
      twiml.hangup();
    }
    
    return xmlResponse(twiml);
  }

  // Case 2: Inbound call from a customer's phone (PSTN)
  // This is now the default behavior if it's not a client call.
  const gather = twiml.gather({
    input: 'speech dtmf',
    timeout: 3,
    numDigits: 1,
    action: '/api/twilio/voice/handle-gather',
    method: 'POST',
  });

  gather.say(
    { voice: 'alice' },
    'Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent.'
  );

  // If no input is received after gather, this part will execute.
  twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
  twiml.hangup();

  return xmlResponse(twiml);
}
