import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * OPCIONAL PERO RECOMENDADO:
 * Valida que el request venga realmente de Twilio
 */
function validateTwilioRequest(
  request: NextRequest,
  body: string
): boolean {
  const twilioSignature = request.headers.get("x-twilio-signature");
  if (!twilioSignature) return false;

  const url = process.env.TWILIO_AFTER_CALL_URL!;
  const authToken = process.env.TWILIO_AUTH_TOKEN!;

  const data = new URLSearchParams(body);
  let baseString = url;

  data.forEach((value, key) => {
    baseString += key + value;
  });

  const computedSignature = crypto
    .createHmac("sha1", authToken)
    .update(baseString)
    .digest("base64");

  return crypto.timingSafeEqual(
    Buffer.from(computedSignature),
    Buffer.from(twilioSignature)
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const params = new URLSearchParams(rawBody);

  // ⚠️ Seguridad básica
  const isValid = validateTwilioRequest(req, rawBody);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid Twilio signature" },
      { status: 403 }
    );
  }

  // 🔹 Datos clave de la llamada
  const callSid = params.get("CallSid");
  const callStatus = params.get("CallStatus");
  const from = params.get("From");
  const to = params.get("To");
  const duration = params.get("CallDuration");
  const recordingUrl = params.get("RecordingUrl");
  const recordingSid = params.get("RecordingSid");

  // 🔹 Aquí va TU lógica real
  // Ejemplos:
  // - Guardar en Firebase
  // - Actualizar lead en CRM
  // - Marcar llamada como cerrada
  // - Disparar follow-up SMS / WhatsApp

  console.log("AFTER CALL", {
    callSid,
    callStatus,
    from,
    to,
    duration,
    recordingUrl,
    recordingSid,
  });

  // ❗ Nunca devuelvas TwiML aquí
  // Twilio solo espera 200 OK
  return NextResponse.json({ success: true });
}
