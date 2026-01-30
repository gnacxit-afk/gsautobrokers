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
  const digits = formData.get('Digits');

  let body = '';

  switch (digits) {
    case '1':
      body = `
        <Say voice="alice">Your appointment is confirmed. Thank you for calling. Goodbye.</Say>
        <Hangup/>
      `;
      break;
    case '2':
      body = `
        <Say voice="alice">Connecting you to the next available agent. Please hold.</Say>
        <Dial>+18324005373</Dial>
      `;
      break;
    default:
      body = `
        <Say voice="alice">Sorry, I didn't understand that choice. Redirecting you to the main menu.</Say>
        <Redirect method="POST">/api/twilio/voice</Redirect>
      `;
      break;
  }

  return xmlResponse(body);
}
