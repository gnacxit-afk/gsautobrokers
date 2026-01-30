
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
    const from = callData.From as string;
    const to = callData.To as string;
    const dialCallTo = callData.DialCallTo as string;
    
    let leadPhoneNumber: string;
    let agentIdentity: string;

    // Distinguish between inbound and outbound calls
    if (from.startsWith('client:')) {
        // OUTBOUND: Agent called a customer. Parent call `From` is the agent's client ID.
        agentIdentity = from.replace('client:', '');
        leadPhoneNumber = to; // The 'To' field in the main request is the customer number
    } else {
        // INBOUND: Customer called and was connected to an agent. Parent call `From` is the customer.
        leadPhoneNumber = from;
        agentIdentity = dialCallTo?.replace('client:', ''); // The agent was the destination of the <Dial>
    }
    
    const callStatus = callData.DialCallStatus as string;

    if (leadPhoneNumber && agentIdentity && callStatus === 'completed') {
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
                startTime: new Date(),
                durationInSeconds: parseInt(callData.DialCallDuration as string, 10) || 0,
                status: callData.DialCallStatus,
                recordingUrl: callData.RecordingUrl,
                notes: 'Call automatically logged from Twilio.'
            });
        } else {
             console.log(`No lead found for phone number: ${leadPhoneNumber}`);
        }
    }

  } catch (error) {
      console.error("Error logging call to Firestore:", error);
  }


  return xmlResponse(`
    <Say voice="alice">Thank you for calling GS Autobrokers. Goodbye!</Say>
    <Hangup/>
  `);
}
