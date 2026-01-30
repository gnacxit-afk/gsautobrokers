import { NextRequest } from 'next/server';

function xmlResponse(body: string) {
  return new Response(
`<?xml version="1.0" encoding="UTF-8"?>
<Response>
${body}
</Response>`,
    {
      headers: { "Content-Type": "text/xml" },
    }
  );
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const from = formData.get('From');
  const to = formData.get('To');

  // Handle outbound calls initiated from the browser client via device.connect()
  // 'From' will be 'client:agent_id'
  if (from && from.toString().startsWith('client:')) {
    const body = `
      <Dial callerId="+18324005373" record="record-from-answer" action="/api/twilio/voice/after-call">
        <Number>${to}</Number>
      </Dial>
    `;
    return xmlResponse(body);
  }

  // Handle incoming calls from external numbers
  // 'From' will be a phone number
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
