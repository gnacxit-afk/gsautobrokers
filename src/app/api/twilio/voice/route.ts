'use server';
import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

// Helper function to create an XML response
function xmlResponse(twiml: twilio.twiml.VoiceResponse) {
  return new NextResponse(twiml.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}

export async function POST(req: NextRequest) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();
  const formData = await req.formData();

  // Get parameters from Twilio's request
  const Direction = formData.get('Direction') as string;
  const From = formData.get('From') as string;
  const To = formData.get('To') as string;

  console.log('Twilio Voice Request Received:', { Direction, From, To });

  // =======================================================
  // 📤 OUTBOUND CALL: Initiated from the CRM web client
  // =======================================================
  // This is the correct way to identify an outbound call from the Voice SDK.
  if (From && From.startsWith('client:')) {
    console.log('Handling OUTBOUND call to:', To);

    const dial = twiml.dial({
      // Use your actual Twilio number from environment variables
      callerId: process.env.TWILIO_PHONE_NUMBER || '+18324005373',
      // The action webhook will be called after the outbound call ends.
      action: "/api/twilio/voice/after-call", 
      method: "POST"
    });
    
    // The 'To' field contains the lead's phone number.
    // We use <Number> for a real PSTN call.
    dial.number(To);

    return xmlResponse(twiml);
  }

  // =======================================================
  // 📥 INBOUND CALL: A customer calls your Twilio number
  // =======================================================
  if (Direction === 'inbound') {
    console.log('Handling INBOUND call from:', From);
    
    const gather = twiml.gather({
      input: 'speech dtmf',
      timeout: 5,
      numDigits: 1,
      action: '/api/twilio/voice/handle-gather', // Separate endpoint to handle user input
      method: 'POST'
    });

    gather.say({ voice: 'alice' },
      'Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent.'
    );

    // If the user doesn't enter anything, say this and hang up.
    twiml.say({ voice: 'alice' }, 'We did not receive any input. Goodbye.');
    twiml.hangup();

    return xmlResponse(twiml);
  }

  // =======================================================
  // 🧯 SAFETY FALLBACK: Should not be reached in normal operation
  // =======================================================
  console.log('Call did not match any flow. Hanging up.');
  twiml.say('An application error has occurred. Goodbye.');
  twiml.hangup();

  return xmlResponse(twiml);
};