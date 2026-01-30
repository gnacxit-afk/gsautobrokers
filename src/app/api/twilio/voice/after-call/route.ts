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
  // Aquí puedes recibir info de la llamada y guardar en Firebase CRM
  const data = await request.formData();
  console.log('Call ended:', Object.fromEntries(data.entries()));

  return xmlResponse(`
    <Say voice="alice">Thank you for calling GS Autobrokers. Goodbye!</Say>
    <Hangup/>
  `);
}
