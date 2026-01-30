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

// IVR básico + grabación + confirmación
export async function POST() {
  const body = `
  <!-- IVR inicial -->
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
