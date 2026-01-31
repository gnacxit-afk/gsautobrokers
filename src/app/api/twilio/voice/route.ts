
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

  const Direction = formData.get('Direction') as string;
  const From = formData.get('From') as string;
  const To = formData.get('To') as string;

  console.log('Twilio Voice Request:', {
    Direction,
    From,
    To
  });

  // =========================
  // 📥 INBOUND REAL CALL
  // =========================
  if (Direction === 'inbound' && !From.startsWith('client:')) {

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

    twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
    twiml.hangup();

    return xmlResponse(twiml);
  }

  // =========================
  // 📤 OUTBOUND REAL CALL
  // =========================
  if (From.startsWith('client:')) {

    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373', // Your Twilio number
      action: "/api/twilio/voice/after-call",
      method: "POST"
    });

    dial.number(To);

    return xmlResponse(twiml);
  }

  // =========================
  // 🧯 FALLBACK DE SEGURIDAD
  // =========================
  twiml.say('Invalid call flow.');
  twiml.hangup();

  return xmlResponse(twiml);
};
