import { NextRequest, NextResponse } from "next/server";
import { twiml } from "twilio";

export async function POST(req: NextRequest) {
  const response = new twiml.VoiceResponse();

  /**
   * 🎙️ MENSAJE INICIAL
   */
  response.say(
    { language: "es-MX", voice: "alice" },
    "Gracias por llamar a G S Auto Brokers."
  );

  response.say(
    { language: "es-MX", voice: "alice" },
    "Por favor seleccione una de las siguientes opciones."
  );

  /**
   * ⌨️ IVR - GATHER
   */
  const gather = response.gather({
    input: "dtmf",
    numDigits: 1,
    timeout: 5,
    action: "/api/twilio/inbound/handle-gather",
    method: "POST",
  });

  gather.say(
    { language: "es-MX", voice: "alice" },
    "Para ventas, presione uno. Para seguimiento, presione dos. Para conocer nuestro horario, presione tres."
  );

  /**
   * ⚠️ FALLBACK SI NO PRESIONA NADA
   * Twilio continúa el flujo si Gather no recibe input
   */
  response.say(
    { language: "es-MX", voice: "alice" },
    "No hemos recibido ninguna selección."
  );

  response.redirect(
    { method: "POST" },
    "/api/twilio/inbound"
  );

  return new NextResponse(response.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
