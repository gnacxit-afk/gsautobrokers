
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

    // ¡Clave! Twilio envía 'Direction' con mayúscula D, y para outbound desde SDK es 'outbound-api'
    const direction = formData.get('Direction') as string | null;

    console.log('Twilio params recibidos:', Object.fromEntries(formData)); // ← agrega esto para debug

    // OUTBOUND desde tu web app (device.connect)
    if (direction === 'outbound-api') {
      const to = formData.get('To') as string | null;

      if (!to) {
        return xmlResponse(`
          <Say voice="alice">Error: No se proporcionó número de destino.</Say>
          <Hangup/>
        `);
      }

      const body = `
        <Dial 
          callerId="+18324005373" 
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

    // Si NO es outbound-api → trata como inbound (tu IVR actual)
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

// Elimina o bloquea GET para evitar el mensaje de prueba
export async function GET() {
  return new NextResponse('Este endpoint solo acepta POST de Twilio.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain' },
  });
}
