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
    
    console.log('Twilio webhook request received:', Object.fromEntries(formData));

    // DETECT OUTBOUND CALL FROM BROWSER SDK
    // The `From` parameter will be `client:user_id`
    if (From && From.startsWith('client:')) {
      // This is an outbound call initiated from our app.
      // The number to dial is in the 'To' parameter we passed in device.connect()
      if (!To) {
        return xmlResponse(`<Say voice="alice">Error: Destination number not provided for outbound call.</Say><Hangup/>`);
      }

      const dialBody = `
        <Dial 
          callerId="${process.env.TWILIO_PHONE_NUMBER || '+18324005373'}" 
          action="/api/twilio/voice/after-call" 
          method="POST"
          record="record-from-answer"
        >
          <Number>${To}</Number>
        </Dial>
      `;
      return xmlResponse(dialBody);
    }

    // --- All other calls are treated as INBOUND to our Twilio number ---
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
