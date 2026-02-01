import { NextRequest, NextResponse } from "next/server";
import { twiml } from "twilio";

export async function POST(req: NextRequest) {
  const response = new twiml.VoiceResponse();

  const body = await req.text();
  const params = new URLSearchParams(body);

  const direction =
    params.get("Direction") ||
    new URL(req.url).searchParams.get("direction");

  const dept =
    new URL(req.url).searchParams.get("dept") || "sales";

  /**
   * 📞 CONFIGURACIÓN DE AGENTES
   * (esto luego debe salir de DB / Firebase)
   */
  const AGENTS: Record<string, string[]> = {
    sales: ["+1XXXXXXXXXX"],
    followup: ["+1XXXXXXXXXX"],
  };

  const agents = AGENTS[dept] || AGENTS.sales;

  /**
   * 🔔 MENSAJE PREVIO
   */
  response.say(
    { language: "es-MX", voice: "alice" },
    "Por favor espere mientras conectamos su llamada."
  );

  /**
   * 📞 DIAL
   */
  const dial = response.dial({
    timeout: 20,
    record: "record-from-answer",
    action: "/api/twilio/after-call",
    method: "POST",
  });

  // 🔁 Ring en paralelo (primer agente que conteste gana)
  agents.forEach((number) => {
    dial.number(number);
  });

  /**
   * ❌ FALLBACK: nadie contestó
   */
  response.say(
    { language: "es-MX", voice: "alice" },
    "No hay agentes disponibles en este momento. Por favor intente más tarde."
  );

  response.hangup();

  return new NextResponse(response.toString(), {
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
