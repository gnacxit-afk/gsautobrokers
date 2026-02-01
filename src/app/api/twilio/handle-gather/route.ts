import { NextRequest } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const params = new URLSearchParams(body);

  const digits = params.get("Digits");
  const callSid = params.get("CallSid");
  const from = params.get("From");

  const twiml = new VoiceResponse();

  /**
   * 🧠 CONTROL DE SEGURIDAD
   */
  if (!digits) {
    twiml.say(
      { language: "es-US", voice: "Polly.Mia" },
      "No recibimos ninguna selección."
    );
    twiml.redirect("/api/twilio/inbound");
    return new Response(twiml.toString(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  /**
   * 🎯 ROUTING DEL IVR
   */
  switch (digits) {
    case "1":
      // Ventas
      twiml.say(
        { language: "es-US", voice: "Polly.Mia" },
        "Te conectaremos con el departamento de ventas."
      );
       const dialSales = twiml.dial({
        record: 'record-from-answer-dual',
        answerOnBridge: true,
      });
      dialSales.client({
        statusCallback: '/api/twilio/call-events',
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['answered', 'completed'],
      }, 'agent_sales');
      break;

    case "2":
      // Soporte
      twiml.say(
        { language: "es-US", voice: "Polly.Mia" },
        "Te conectaremos con soporte."
      );
      const dialSupport = twiml.dial({
        record: 'record-from-answer-dual',
        answerOnBridge: true,
      });
      dialSupport.client({
        statusCallback: '/api/twilio/call-events',
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['answered', 'completed'],
      }, 'agent_support');
      break;

    case "3":
      // Horarios / Info
      twiml.say(
        { language: "es-US", voice: "Polly.Mia" },
        "Nuestro horario es de lunes a viernes de nueve a seis."
      );
      twiml.hangup();
      break;

    default:
      // Entrada inválida
      twiml.say(
        { language: "es-US", voice: "Polly.Mia" },
        "La opción seleccionada no es válida."
      );
      twiml.redirect("/api/twilio/inbound");
      break;
  }

  /**
   * ⚠️ NO JSON, NO REDIRECT HTTP
   * SOLO TwiML
   */
  return new Response(twiml.toString(), {
    headers: { "Content-Type": "text/xml" },
  });
}
