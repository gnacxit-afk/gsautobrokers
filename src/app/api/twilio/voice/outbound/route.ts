'use server';
import { NextResponse } from 'next/server';
import Twilio from 'twilio';

// helper
function xml(twiml: Twilio.twiml.VoiceResponse) {
  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: Request) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const From = params.get('From');
  const To = params.get('To');

  const twiml = new Twilio.twiml.VoiceResponse();

  // 🔒 HARD VALIDATIONS (non-negotiable)
  if (!From?.startsWith('client:')) {
    twiml.say('Invalid outbound caller.');
    twiml.hangup();
    return xml(twiml);
  }

  if (!To || !To.startsWith('+')) {
    twiml.say('Invalid destination number.');
    twiml.hangup();
    return xml(twiml);
  }

  // 📞 REAL DIAL
  const dial = twiml.dial({
    callerId: process.env.TWILIO_PHONE_NUMBER,
    record: 'record-from-answer-dual',
    answerOnBridge: true,
  });

  dial.number({
    statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
    statusCallback: '/api/twilio/voice/call-events',
    statusCallbackMethod: 'POST',
  }, To);

  return xml(twiml);
}
