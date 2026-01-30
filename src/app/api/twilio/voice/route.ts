
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
  const formData = await req.formData();
  
  // Twilio sends 'Direction' with a capital 'D'.
  // For calls initiated from the SDK, it's 'outbound-api'.
  const direction = formData.get('Direction');

  if (direction === 'outbound-api') {
    const to = formData.get('To') as string | null;

    if (!to) {
      return xmlResponse('<Say>Error: No destination number provided.</Say><Hangup/>');
    }

    const body = `
      <Dial 
        callerId="+18324005373" 
        action="/api/twilio/voice/after-call" 
        method="POST"
        record="record-from-answer"
      >
        <Number>${to}</Number>
      </Dial>
    `;
    return xmlResponse(body);
  }

  // INBOUND call from an external number (or any other case)
  const body = `
    <Say voice="alice">Welcome to GS Autobrokers.</Say>
    <Gather input="speech dtmf" timeout="5" numDigits="1" action="/api/twilio/voice/handle-gather" method="POST">
      <Say voice="alice">Press 1 to confirm your appointment. Press 2 to speak to an agent.</Say>
    </Gather>
    <Say voice="alice">We did not receive any input. Goodbye.</Say>
    <Hangup/>
  `;
  return xmlResponse(body);
}


export async function GET() {
  return new Response('This endpoint only accepts POST requests for Twilio webhooks.', {
    status: 405,  // Method Not Allowed
    headers: { 'Content-Type': 'text/plain' }
  });
}
