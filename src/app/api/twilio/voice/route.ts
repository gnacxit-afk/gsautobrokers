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
  const Direction = formData.get('Direction') as string;
  
  console.log('Twilio Voice Request Received:', { Direction, From, To });

  // ============================
  // 📤 OUTBOUND DESDE WEB APP
  // ============================
  // Si la llamada viene de un `client:` (nuestra web app), es una llamada SALIENTE.
  if (From && From.startsWith('client:')) {
    console.log('Handling OUTBOUND call to:', To);

    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373', // Tu número Twilio
      record: 'record-from-answer-dual' // Grabar la llamada
    });

    // Marcamos al número de teléfono real del lead.
    dial.number({}, To);

    return xmlResponse(twiml);
  }
  
  // ============================
  // 📥 INBOUND REAL (PSTN)
  // ============================
  // Si no viene de un `client:`, es una llamada ENTRANTE de un cliente.
  console.log('Handling INBOUND call from:', From);
  
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

  // Si el usuario no ingresa nada, esto se ejecuta.
  twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
  twiml.hangup();

  return xmlResponse(twiml);
};
