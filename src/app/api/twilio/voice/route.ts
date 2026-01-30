import { NextRequest } from 'next/server';

function xmlResponse(body: string) {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${body}
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

export async function POST(req: NextRequest) {
  // Twilio envía x-www-form-urlencoded
  const formData = await req.formData().catch(() => null);
  const from = formData?.get('From')?.toString() || '';
  const to = formData?.get('To')?.toString() || '';

  // Outbound calls from browser client
  if (from.startsWith('client:') && to) {
    const body = `
      <Dial callerId="+18324005373" record="record-from-answer">
        <Number>${to}</Number>
      </Dial>
    `;
    return xmlResponse(body);
  }

  // Incoming calls
  const body = `
    <Gather input="speech dtmf" timeout="5" numDigits="1" action="/api/twilio/voice/handle-gather" method="POST">
      <Say voice="alice">
        Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent.
      </Say>
    </Gather>
    <Say voice="alice">We did not receive any input. Goodbye.</Say>
    <Hangup/>
  `;
  return xmlResponse(body);
}

export async function GET() {
  return xmlResponse('<Say voice="alice">Twilio voice endpoint is working.</Say>');
}

