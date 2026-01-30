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
  const digits = data.get('Digits')?.toString() || '';
  
  if (digits === '1') {
    return xmlResponse(`
      <Say voice="alice">Thank you! Your appointment is confirmed.</Say>
      <Hangup/>
    `);
  }

  if (digits === '2') {
    try {
        // Find an available agent by querying the 'staff' collection
        const staffRef = db.collection('staff');
        // We'll consider any Admin, Supervisor, or Broker as an available agent
        const q = staffRef.where('role', 'in', ['Admin', 'Supervisor', 'Broker']);
        const snapshot = await q.get();

        if (snapshot.empty) {
            return xmlResponse(`<Say voice="alice">Sorry, no agents are available at the moment. Please try again later.</Say><Hangup/>`);
        }

        // Pick a random agent from the available list to distribute calls
        const agents = snapshot.docs;
        const randomAgentDoc = agents[Math.floor(Math.random() * agents.length)];
        const agentId = randomAgentDoc.id; // The document ID is the user's UID (identity)

        return xmlResponse(`
            <Say voice="alice">Connecting you to an available agent.</Say>
            <Dial action="/api/twilio/voice/after-call" record="record-from-answer" callerId="+18324005373">
            <Client>${agentId}</Client>
            </Dial>
        `);

    } catch (error) {
        console.error("Error finding an agent:", error);
        return xmlResponse(`<Say voice="alice">We're sorry, but there was an error connecting your call. Please hang up and try again.</Say><Hangup/>`);
    }
  }

  // Handle invalid input
  return xmlResponse(`
    <Say voice="alice">Invalid input. Goodbye.</Say>
    <Hangup/>
  `);
}
