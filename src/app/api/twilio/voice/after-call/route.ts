
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


function xmlResponse(body: string) {
  return new Response(
`<?xml version="1.0" encoding="UTF-8"?>
<Response>
${body}
</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

export async function POST(request: Request) {
  const data = await request.formData();
  const callData = Object.fromEntries(data.entries());
  console.log('Call ended:', callData);

  try {
    const fromNumber = callData.From as string;
    const agentIdentity = (callData.To as string)?.replace('client:', '');
    const callStatus = callData.DialCallStatus as string;
    
    if (fromNumber && agentIdentity && callStatus === 'completed') {
        // Find lead by phone number
        const leadsRef = db.collection('leads');
        const q = leadsRef.where('phone', '==', fromNumber).limit(1);
        const snapshot = await q.get();

        if (!snapshot.empty) {
            const leadDoc = snapshot.docs[0];
            const leadId = leadDoc.id;
            const leadData = leadDoc.data();
            
            // Log the call to the lead's subcollection
            const callLogRef = db.collection('leads').doc(leadId).collection('calls');
            await callLogRef.add({
                leadId: leadId,
                leadName: leadData.name,
                agentId: agentIdentity,
                startTime: new Date(), // This is actually end time, but it's the best we have from this webhook
                durationInSeconds: parseInt(callData.DialCallDuration as string, 10),
                status: callData.DialCallStatus,
                recordingUrl: callData.RecordingUrl,
                notes: 'Call logged from Twilio webhook.'
            });
        } else {
             console.log(`No lead found for phone number: ${fromNumber}`);
        }
    }

  } catch (error) {
      console.error("Error logging call to Firestore:", error);
      // Don't let a logging error break the TwiML response
  }


  return xmlResponse(`
    <Say voice="alice">Thank you for calling GS Autobrokers. Goodbye!</Say>
    <Hangup/>
  `);
}
