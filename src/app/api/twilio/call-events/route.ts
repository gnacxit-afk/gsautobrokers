
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Validación de firma Twilio (RECOMENDADA)
 */
function validateTwilioRequest(
  request: NextRequest,
  body: string
): boolean {
  const signature = request.headers.get("x-twilio-signature");
  if (!signature) return false;

  const url = process.env.TWILIO_CALL_EVENTS_URL!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;

  const params = new URLSearchParams(body);
  let base = url;

  const sortedParams = Array.from(params.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  
  for (const [key, value] of sortedParams) {
    base += key + value;
  }

  const expected = crypto
    .createHmac("sha1", authToken)
    .update(base)
    .digest("base64");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  // 🔐 Seguridad
  if (!validateTwilioRequest(req, rawBody)) {
    return NextResponse.json(
      { error: "Invalid Twilio signature" },
      { status: 403 }
    );
  }

  const params = new URLSearchParams(rawBody);

  // 📞 Datos de evento
  const callSid = params.get("CallSid");
  const parentCallSid = params.get("ParentCallSid"); // útil en transfers
  const callStatus = params.get("CallStatus");
  const from = params.get("From");
  const to = params.get("To");
  const direction = params.get("Direction"); // inbound / outbound-api
  const timestamp = new Date().toISOString();

  // 🔎 Evento crudo (útil para debugging)
  const event = {
    callSid,
    parentCallSid,
    callStatus,
    from,
    to,
    direction,
    timestamp,
  };

  /**
   * 🔧 AQUÍ VA TU LÓGICA REAL
   *
   * Ejemplos recomendados:
   * - Guardar evento en Firebase
   * - Actualizar estado del lead
   * - Detectar llamadas perdidas
   * - Activar alertas en tiempo real
   */

  console.log("CALL EVENT", event);

  // ⚠️ NO devuelvas TwiML
  // ⚠️ Responde rápido (Twilio espera < 15s)
  return NextResponse.json({ received: true });
}
