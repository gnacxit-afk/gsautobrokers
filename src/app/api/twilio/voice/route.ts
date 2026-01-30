import { NextRequest, NextResponse } from 'next/server';

function xmlResponse(body: string, status = 200) {
  const fullXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
${body.trim()}
</Response>`;

  return new NextResponse(fullXml, {
    status,
    headers: {
      'Content-Type': 'text/xml',
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const To = formData.get('To') as string | null;
    const From = formData.get('From') as string | null;
    
    // Log para un debug más fácil y completo
    console.log('Twilio webhook request received:', {
        To,
        From,
        Direction: formData.get('Direction'),
        CallStatus: formData.get('CallStatus'),
        CallSid: formData.get('CallSid')
    });

    const MY_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18324005373';

    // Lógica para outbound: si la llamada va a un número que NO es nuestro número de Twilio,
    // es una llamada saliente iniciada desde nuestra app.
    if (To && To !== MY_TWILIO_NUMBER && !To.startsWith('client:')) {
      // Validación básica del número de destino
      if (!To.startsWith('+') || To.length < 10) {
        return xmlResponse(`
          <Say voice="alice">Error: Invalid destination number.</Say>
          <Hangup/>
        `);
      }

      const dialBody = `
        <Dial 
          callerId="${MY_TWILIO_NUMBER}" 
          action="/api/twilio/voice/after-call" 
          method="POST"
          record="record-from-answer"
          timeout="30"
        >
          <Number>${To}</Number>
        </Dial>
      `;
      return xmlResponse(dialBody);
    }
    
    // Lógica para inbound: si la llamada es A nuestro número de Twilio, presentamos el IVR.
    const ivrBody = `
      <Gather input="speech dtmf" timeout="5" numDigits="1" action="/api/twilio/voice/handle-gather" method="POST">
        <Say voice="alice">
          Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent.
        </Say>
      </Gather>
      <Say voice="alice">We did not receive any input. Goodbye.</Say>
      <Hangup/>
    `;
    return xmlResponse(ivrBody);

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return xmlResponse(`
      <Say voice="alice">We are sorry, but there was an internal error.</Say>
      <Hangup/>
    `, 500);
  }
}

export async function GET() {
  return new NextResponse('This endpoint only accepts POST from Twilio.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain' },
  });
}
