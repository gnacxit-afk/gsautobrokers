'use server';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Helper function to create an XML response
function xmlResponse(twiml: twilio.twiml.VoiceResponse) {
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

/**
 * This endpoint handles OUTBOUND calls initiated from the web app's client.
 * Its only job is to dial a PSTN number.
 */
export async function POST(req: NextRequest) {
  const twiml = new twilio.twiml.VoiceResponse();
  const formData = await req.formData();

  const To = formData.get('To') as string;

  console.log('OUTBOUND Call Request to:', To);
  
  // The 'To' parameter is expected to be passed from the device.connect() params
  if (To) {
    const dial = twiml.dial({
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373',
      record: 'record-from-answer-dual',
    });
    dial.number({}, To);
  } else {
    twiml.say('Sorry, we could not find a number to dial for this outbound call.');
    twiml.hangup();
  }

  return xmlResponse(twiml);
}
