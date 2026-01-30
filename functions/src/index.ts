import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as twilio from "twilio";
import * as admin from "firebase-admin";

admin.initializeApp();

const TWILIO_NUMBER = "+18324005373"; // tu número Twilio
const BASE_URL = "https://studio--studio-7674486159-b9551.us-central1.hosted.app"; // tu URL pública

// ---------------------------
// Endpoint principal: llamadas entrantes
// ---------------------------
export const handleIncomingCall = onRequest(async (req, res) => {
  logger.info("Incoming call", req.body);

  const from = req.body.From;

  res.set("Content-Type", "text/xml");

  // Llamadas salientes desde la app (Twilio Client)
  if (from && from.startsWith("client:")) {
    const twiml = new twilio.twiml.VoiceResponse();
    const to = req.body.To;
    twiml.dial({ callerId: TWILIO_NUMBER, record: "record-from-answer", action: `${BASE_URL}/afterCall` }, (dial) => {
      dial.number(to);
    });
    res.send(twiml.toString());
    return;
  }

  // Llamadas entrantes externas
  const twiml = new twilio.twiml.VoiceResponse();

  const gather = twiml.gather({
    input: "dtmf speech",
    timeout: 5,
    numDigits: 1,
    action: `${BASE_URL}/handleGather`, // endpoint que procesa la opción
    method: "POST",
  });

  gather.say(
    { voice: "alice" },
    "Welcome to GS Autobrokers. Press 1 to confirm your appointment. Press 2 to speak to an agent."
  );

  twiml.say("We did not receive any input. Goodbye.");
  twiml.hangup();

  res.send(twiml.toString());
});

// ---------------------------
// Endpoint para procesar Gather
// ---------------------------
export const handleGather = onRequest(async (req, res) => {
  const digit = req.body.Digits;
  const from = req.body.From;

  // Guardar registro en Firestore
  await admin.firestore().collection("calls").add({
    from,
    digit,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  const twiml = new twilio.twiml.VoiceResponse();

  if (digit === "1") {
    twiml.say({ voice: "alice" }, "Thank you for confirming your appointment. Goodbye.");
    twiml.hangup();
  } else if (digit === "2") {
    twiml.say({ voice: "alice" }, "Connecting you to an agent.");
    twiml.dial(TWILIO_NUMBER);
  } else {
    twiml.say({ voice: "alice" }, "Invalid option. Goodbye.");
    twiml.hangup();
  }

  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});

// ---------------------------
// Endpoint para después de la llamada
// ---------------------------
export const afterCall = onRequest(async (req, res) => {
  logger.info("Call completed:", req.body);
  await admin.firestore().collection("callLogs").add({
    data: req.body,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  const twiml = new twilio.twiml.VoiceResponse();
  twiml.hangup();

  res.set("Content-Type", "text/xml");
  res.send(twiml.toString());
});
