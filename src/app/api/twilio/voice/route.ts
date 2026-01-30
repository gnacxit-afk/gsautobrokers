'use server';

import { NextResponse } from 'next/server';
import { twiml } from 'twilio';

/**
 * This route handles POST requests from Twilio when an outbound call is initiated.
 * It generates TwiML instructions to dial the specified phone number.
 */
export async function POST(request: Request) {
  const formData = await request.formData();
  const to = formData.get('To') as string;

  const twilioNumber = process.env.TWILIO_CALLER_ID;

  if (!twilioNumber) {
    console.error("CRITICAL: TWILIO_CALLER_ID is not set in .env file.");
    const errorResponse = new twiml.VoiceResponse();
    errorResponse.say('Your application is not configured for outbound calls. The Caller ID is missing.');
    return new NextResponse(errorResponse.toString(), {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }

  const response = new twiml.VoiceResponse();
  const dial = response.dial({
    callerId: twilioNumber,
  });
  dial.number(to);

  return new NextResponse(response.toString(), {
    headers: { 'Content-Type': 'application/xml' },
  });
}
