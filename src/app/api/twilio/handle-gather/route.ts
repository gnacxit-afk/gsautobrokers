
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
  const digit = params.get('Digits');
  const twiml = new Twilio.twiml.VoiceResponse();

  let agentIdentity: string | null = null;
  let department: string | null = null;
  
  if (digit === '1') {
    agentIdentity = 'agent_sales';
    department = 'ventas';
  }
  if (digit === '2') {
    agentIdentity = 'agent_support';
    department = 'soporte';
  }

  if (!agentIdentity) {
    twiml.say({ language: 'es-MX' }, 'Opción no válida. Adiós.');
    twiml.hangup();
    return xml(twiml);
  }
  
  twiml.say({ voice: 'alice', language: 'es-MX' }, `Conectando con un agente de ${department}. Por favor espere.`);

  const dial = twiml.dial({
    record: 'record-from-answer-dual',
    answerOnBridge: true,
  });

  // Dial the hardcoded agent identity for the selected department
  dial.client({
    statusCallback: '/api/twilio/call-events',
    statusCallbackMethod: 'POST',
    statusCallbackEvent: ['answered', 'completed'],
  }, agentIdentity);

  return xml(twiml);
}
