
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, applicationDefault, App } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
let adminApp: App;
if (!getApps().length) {
    adminApp = initializeApp({ credential: applicationDefault() });
} else {
    adminApp = getApps()[0];
}
const db = getFirestore(adminApp);


export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const callData = Object.fromEntries(formData);
    console.log('Call Event Callback Received:', callData);

    const { CallSid, CallStatus } = callData;
    
    // This endpoint receives status updates from Twilio (e.g., 'ringing', 'answered').
    // A more robust implementation would save or update this in Firestore.
    // For now, we just log it to prevent a 404 error from Twilio.
    if (CallSid) {
        // Example for future implementation:
        // const callLogRef = db.collection('callLogs').doc(CallSid as string);
        // await callLogRef.set({ status: CallStatus, lastUpdated: new Date() }, { merge: true });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error in /api/twilio/voice/call-events:', error);
    // Respond with 200 to prevent Twilio from retrying, even if our processing fails.
    return new NextResponse(null, { status: 200 });
  }
}
