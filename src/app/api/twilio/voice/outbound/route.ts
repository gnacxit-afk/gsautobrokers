'use server';
import { NextRequest, NextResponse } from 'next/server';

function xmlResponse(body: string) {
  const fullXml = `<?xml version="1.0" encoding="UTF-8"?>\n<Response>${body.trim()}</Response>`;
  return new NextResponse(fullXml, {
    status: 200,
    headers: { 'Content-Type': 'text/xml' },
  });
}

const MY_TWILIO_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+18324005373';

/**
 * This webhook is specifically for handling OUTGOING calls initiated from the client-side SDK.
 * It is called by the TwiML App associated with the agent's Access Token.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const to = formData.get('To') as string;

    if (!to) {
      console.error('Outbound webhook called without a "To" parameter.');
      return xmlResponse('<Say>We could not process your call, the destination number is missing.</Say>');
    }

    console.log(`OUTBOUND HANDLER: Creating call to: ${to}`);

    // This TwiML dials the number passed from the client SDK.
    const dial = `
      <Dial 
        callerId="${MY_TWILIO_NUMBER}"
        action="/api/twilio/voice/after-call" 
        method="POST"
        record="record-from-answer"
      >
        <Number>${to}</Number>
      </Dial>
    `;
    return xmlResponse(dial);

  } catch (error) {
    console.error('CRITICAL ERROR in Twilio outbound voice webhook:', error);
    const say = `<Say>An internal error occurred while attempting to place your call.</Say>`;
    return xmlResponse(say, 500);
  }
}
