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
    const body = Object.fromEntries(formData);

    // Log para un debug más fácil y completo
    console.log('Twilio webhook request received:', body);
    
    const from = body.From as string | null;
    const to = body.To as string | null;
    
    const MY_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18324005373';

    // Lógica para outbound: si la llamada viene de un 'client' (nuestra app)
    if (from?.startsWith('client:')) {
      const dialTo = body.lead_phone as string | null;

      if (!dialTo) {
          return xmlResponse(`
            <Say voice="alice">Error: No se proporcionó un número de destino para la llamada saliente.</Say>
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
          <Number>${dialTo}</Number>
        </Dial>
      `;
      return xmlResponse(dialBody);
    }
    
    // Si llega aquí, es una llamada entrante a nuestro número de Twilio.
    const ivrBody = `
      <Gather input="speech dtmf" timeout="5" numDigits="1" action="/api/twilio/voice/handle-gather" method="POST">
        <Say voice="alice">
          Bienvenido a GS Autobrokers. Presione 1 para confirmar su cita. Presione 2 para hablar con un agente.
        </Say>
      </Gather>
      <Say voice="alice">No recibimos ninguna entrada. Adiós.</Say>
      <Hangup/>
    `;
    return xmlResponse(ivrBody);

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
