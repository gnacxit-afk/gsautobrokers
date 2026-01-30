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

    const direction = formData.get('Direction') as string | null;
    const to = formData.get('To') as string | null;
    const from = formData.get('From') as string | null;

    // Log para debug (revisa en Vercel/Netlify logs después de una llamada)
    console.log('Twilio webhook params:', {
      Direction: direction,
      To: to,
      From: from,
      // Agrega más si necesitas: CallSid: formData.get('CallSid'), etc.
    });

    const MY_TWILIO_NUMBER = '+18324005373'; // ← CAMBIA ESTO si tu número es diferente (o ponlo en .env)

    // Lógica para outbound desde web app: To NO es tu número Twilio y NO empieza con 'client:'
    if (to && to !== MY_TWILIO_NUMBER && !to.startsWith('client:')) {
      // Validación básica del número destino
      if (!to.startsWith('+') || to.length < 10) {
        return xmlResponse(`
          <Say voice="alice">Error: Número de destino inválido.</Say>
          <Hangup/>
        `);
      }

      const body = `
        <Dial 
          callerId="${MY_TWILIO_NUMBER}" 
          action="/api/twilio/voice/after-call" 
          method="POST"
          record="record-from-answer"
          timeout="30"
        >
          <Number>${to}</Number>
        </Dial>
      `;
      return xmlResponse(body);
    }

    // Si llega aquí: es inbound real (llamada entrante a tu Twilio number) → IVR
    const body = `
      <Gather input="speech dtmf" timeout="5" numDigits="1" action="/api/twilio/voice/handle-gather" method="POST">
        <Say voice="alice">
          Bienvenido a GS Autobrokers. Presione 1 para confirmar su cita. Presione 2 para hablar con un agente.
        </Say>
      </Gather>
      <Say voice="alice">No recibimos ninguna entrada. Adiós.</Say>
      <Hangup/>
    `;
    return xmlResponse(body);

  } catch (error) {
    console.error('Error procesando Twilio webhook:', error);
    return xmlResponse(`
      <Say voice="alice">Lo sentimos, hubo un error interno.</Say>
      <Hangup/>
    `, 500);
  }
}

export async function GET() {
  return new NextResponse('Este endpoint solo acepta POST de Twilio.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain' },
  });
}
