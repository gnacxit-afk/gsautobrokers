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

export async function POST(request: Request) {
  const data = await request.formData();
  const digits = data.get('Digits')?.toString() || '';
  
  if (digits === '1') {
    return xmlResponse(`
      <Say voice="alice">Thank you! Your appointment is confirmed.</Say>
      <Hangup/>
    `);
  }

  if (digits === '2') {
    return xmlResponse(`
      <Say voice="alice">Connecting you to an agent.</Say>
      <Dial action="/api/twilio/voice/after-call" record="record-from-answer" callerId="+18324005373">
        <Client>AGENT_ID</Client>
      </Dial>
    `);
  }

  // Opción inválida
  return xmlResponse(`
    <Say voice="alice">Invalid input. Goodbye.</Say>
    <Hangup/>
  `);
}
