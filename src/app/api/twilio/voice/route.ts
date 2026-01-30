
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

    // These are the standard parameters sent by Twilio
    const twilioDirection = formData.get('Direction') as string | null;
    const twilioTo = formData.get('To') as string | null;
    const twilioFrom = formData.get('From') as string | null;

    // This is our *custom* parameter passed from the client-side SDK
    const customTo = formData.get('To') as string | null;

    console.log('Twilio webhook params:', {
      Direction: twilioDirection,
      To: twilioTo, // Twilio's To
      From: twilioFrom,
      CustomTo: customTo // Our custom param
    });
    
    // This is your Twilio number
    const MY_TWILIO_NUMBER = '+18324005373'; 

    // Logic for OUTBOUND call from web app:
    // A custom 'To' parameter will be present.
    if (customTo && customTo !== MY_TWILIO_NUMBER) {
      if (!customTo.startsWith('+') || customTo.length < 10) {
        return xmlResponse(`
          <Say voice="alice">Error: Invalid destination number provided.</Say>
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
          <Number>${customTo}</Number>
        </Dial>
      `;
      return xmlResponse(body);
    }

    // If it's not an outbound call, it's an INBOUND call to your Twilio number.
    // Show the IVR menu.
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

  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    return xmlResponse(`
      <Say voice="alice">We're sorry, an internal error occurred.</Say>
      <Hangup/>
    `, 500);
  }
}

// Block GET requests to avoid confusion
export async function GET() {
  return new NextResponse('This endpoint only accepts POST requests from Twilio.', {
    status: 405,
    headers: { 'Content-Type': 'text/plain' },
  });
}
