import { NextRequest, NextResponse } from "next/server";
import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    to,              // Número del cliente
    agentNumber,     // Número del agente (opcional)
    metadata,        // Lead ID, campaign, etc
  } = body;

  if (!to) {
    return NextResponse.json(
      { error: "Missing destination number" },
      { status: 400 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    return NextResponse.json(
      { error: "Site URL is not configured." },
      { status: 500 }
    );
  }

  try {
    const call = await client.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER!,
      url: `${siteUrl}/api/twilio/voice?direction=outbound`,
      method: "POST",

      statusCallback: `${siteUrl}/api/twilio/call-events`,
      statusCallbackMethod: "POST",
      statusCallbackEvent: [
        "initiated",
        "ringing",
        "answered",
        "completed",
      ],

      // Opcional pero recomendable
      record: true,
    });

    return NextResponse.json({
      success: true,
      callSid: call.sid,
    });

  } catch (error: any) {
    console.error("OUTBOUND ERROR", error);

    return NextResponse.json(
      { error: "Failed to create outbound call" },
      { status: 500 }
    );
  }
}
