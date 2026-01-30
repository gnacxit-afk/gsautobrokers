
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

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
    const callData = Object.fromEntries(formData.entries());
    console.log('After-call callback recibido:', callData);

    const from = callData.From as string;
    const to = callData.To as string;
    const dialCallTo = callData.DialCallTo as string; // This is present on inbound calls that are dialed to a client
    const callStatus = callData.DialCallStatus as string; // e.g., 'completed', 'busy', 'no-answer'

    let leadPhoneNumber: string | undefined;
    let agentIdentity: string | undefined;

    // Distinguish between inbound and outbound calls
    if (from && from.startsWith('client:')) {
        // This is an OUTBOUND call initiated by an agent from the app
        agentIdentity = from.replace('client:', '');
        leadPhoneNumber = to;
    } else if (dialCallTo && dialCallTo.startsWith('client:')) {
        // This is an INBOUND call that was successfully dialed to an agent
        leadPhoneNumber = from;
        agentIdentity = dialCallTo.replace('client:', '');
    }

    if (leadPhoneNumber && agentIdentity && callStatus === 'completed' && callData.RecordingUrl) {
        const leadsRef = db.collection('leads');
        const q = leadsRef.where('phone', '==', leadPhoneNumber).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
            const leadDoc = snapshot.docs[0];
            const leadId = leadDoc.id;
            const leadData = leadDoc.data();
            
            const callLogRef = db.collection('leads').doc(leadId).collection('calls');
            await callLogRef.add({
                leadId: leadId,
                leadName: leadData.name,
                agentId: agentIdentity,
                startTime: new Date(), // This is the end time, but close enough for logging
                durationInSeconds: parseInt(callData.DialCallDuration as string, 10) || 0,
                status: callStatus,
                recordingUrl: callData.RecordingUrl,
                notes: 'Call automatically logged from Twilio.'
            });
            console.log(`Call logged for lead ${leadId}`);
        } else {
             console.log(`No lead found for phone number: ${leadPhoneNumber}`);
        }
    } else {
        console.log('Call not logged. Conditions not met:', { leadPhoneNumber, agentIdentity, callStatus });
    }

    // Acknowledge the callback to Twilio successfully.
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error en after-call:', error);
    // Still respond with 204 to prevent Twilio from logging a warning.
    return new NextResponse(null, { status: 204 });
  }
}
