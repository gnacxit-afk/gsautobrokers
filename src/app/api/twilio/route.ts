
import { NextResponse } from 'next/server';
import Twilio from 'twilio';

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
  const twiml = new Twilio.twiml.VoiceResponse();

  // Hard validation: This endpoint is ONLY for inbound calls from real numbers
  if (!From || From.startsWith('client:')) {
    twiml.say({ language: 'es-MX' }, 'Llamada entrante no válida.');
    twiml.hangup();
    return xml(twiml);
  }

  twiml.say(
    { voice: 'alice', language: 'es-MX' },
    'Gracias por llamar a GS Autobrokers.'
  );

  // IVR to gather user input
  const gather = twiml.gather({
    input: 'dtmf',
    numDigits: 1,
    timeout: 5,
    action: '/api/twilio/handle-gather',
    method: 'POST',
  });
  gather.say(
    { voice: 'alice', language: 'es-MX' },
    'Presione 1 para ventas. Presione 2 para soporte.'
  );

  // Fallback if no input is received
  twiml.say({ voice: 'alice', language: 'es-MX' }, 'No recibimos su selección. Adiós.');
  twiml.hangup();

  return xml(twiml);
}
