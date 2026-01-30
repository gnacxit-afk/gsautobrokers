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
    
    // Log all received parameters for easier debugging
    console.log('Twilio Webhook Payload:', Object.fromEntries(formData));

    // --- OUTBOUND CALLS (Initiated from our application via SDK) ---
    // The most reliable way to check for an outbound call made from the SDK
    // is to look for our custom parameter.
    const leadPhone = formData.get('lead_phone') as string | null;

    if (leadPhone) {
      console.log(`Detected outbound call to: ${leadPhone}`);
      const dialBody = `
        <Dial 
          callerId="${process.env.TWILIO_PHONE_NUMBER || '+18324005373'}" 
          action="/api/twilio/voice/after-call" 
          method="POST"
          record="record-from-answer"
        >
          <Number>${leadPhone}</Number>
        </Dial>
      `;
      return xmlResponse(dialBody);
    }
    
    // --- INBOUND CALLS (A customer calls our Twilio number) ---
    // If it's not an outbound call with our custom parameter, treat it as inbound.
    console.log('Detected inbound call.');
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
