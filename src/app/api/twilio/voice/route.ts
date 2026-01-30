import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const to = formData.get('To');
  const from = formData.get('From');

  let twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>`;

  // OUTBOUND: agente llamando a cliente
  if (to && to.toString().startsWith('+')) {
    twiml += `
      <Dial callerId="+18324005373">
        <Number>${to}</Number>
      </Dial>
    `;
  }

  // FALLBACK seguro
  twiml += `
    <Hangup/>
  </Response>`;

  return new NextResponse(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
