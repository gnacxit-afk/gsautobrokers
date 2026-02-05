import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

// Define types locally to avoid path issues during compilation
type LeadStage = "Nuevo" | "Calificado" | "Citado" | "En Seguimiento" | "Ganado" | "Perdido" | "No Show";
interface Lead {
  ownerId: string;
  name: string;
  stage: LeadStage;
  lastActivity: admin.firestore.Timestamp;
}

// Helper to send notifications to a user
async function sendPushNotification(
  userId: string,
  payload: admin.messaging.MessagingPayload
) {
  const userDoc = await db.collection("staff").doc(userId).get();
  const userData = userDoc.data();

  if (!userData || !userData.fcmTokens || userData.fcmTokens.length === 0) {
    console.log(`User ${userId} has no FCM tokens.`);
    return;
  }

  const tokens: string[] = userData.fcmTokens;

  try {
    const response = await admin.messaging().sendToDevice(tokens, payload);
    console.log(`Successfully sent message to user ${userId}`);
    // Cleanup invalid tokens
    const tokensToRemove: string[] = [];
    response.results.forEach((result, index) => {
        const error = result.error;
        if (error) {
            console.error('Failure sending notification to', tokens[index], error);
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                tokensToRemove.push(tokens[index]);
            }
        }
    });
    if (tokensToRemove.length > 0) {
        await userDoc.ref.update({
            fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove)
        });
    }

  } catch (error) {
    console.error(`Error sending message to user ${userId}:`, error);
  }
}

// 1. Lead & Sale Status Notifications
export const onLeadUpdate = functions.firestore
  .document("leads/{leadId}")
  .onUpdate(async (change) => {
    const before = change.before.data() as Lead;
    const after = change.after.data() as Lead;

    if (before.stage !== after.stage) {
      const { ownerId, name: leadName } = after;
      let message;

      switch (after.stage) {
        case "Ganado":
          message = `Congratulations! You have won the sale for lead: ${leadName}.`;
          break;
        case "Perdido":
          message = `The lead '${leadName}' has been marked as Lost.`;
          break;
        case "No Show":
          message = `Your appointment with '${leadName}' was marked as a No Show.`;
          break;
        default:
          message = `Lead '${leadName}' has moved to the '${after.stage}' stage.`;
      }

      const payload = {
        notification: {
          title: "Lead Status Updated",
          body: message,
          icon: "/icon-192x192.png",
        },
        webpush: {
          fcmOptions: {
            link: `/leads/${change.after.id}/notes`,
          },
        },
      };

      await sendPushNotification(ownerId, payload);
    }
  });


// 2. Stale Lead & Follow-Up Reminders
export const dailyStaleLeadCheck = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async () => {
    const now = admin.firestore.Timestamp.now();
    const twentyFourHoursAgo = admin.firestore.Timestamp.fromMillis(
      now.toMillis() - 24 * 60 * 60 * 1000
    );

    const staleLeadsQuery = db
      .collection("leads")
      .where("stage", "in", ["Nuevo", "Calificado", "Citado", "En Seguimiento"])
      .where("lastActivity", "<", twentyFourHoursAgo);

    const snapshot = await staleLeadsQuery.get();

    if (snapshot.empty) {
      console.log("No stale leads found.");
      return;
    }

    const leadsByOwner: { [key: string]: number } = {};
    snapshot.forEach((doc) => {
      const lead = doc.data() as Lead;
      leadsByOwner[lead.ownerId] = (leadsByOwner[lead.ownerId] || 0) + 1;
    });

    for (const ownerId in leadsByOwner) {
      const count = leadsByOwner[ownerId];
      const payload = {
        notification: {
          title: "Leads Require Attention",
          body: `You have ${count} lead(s) that have not been updated in over 24 hours. Follow up now!`,
          icon: "/icon-192x192.png",
        },
        webpush: {
          fcmOptions: {
            link: "/leads",
          },
        },
      };
      await sendPushNotification(ownerId, payload);
    }
  });

// 3. New Training Available
export const onCoursePublished = functions.firestore
  .document("courses/{courseId}")
  .onWrite(async (change) => {
    const beforeData = change.before.exists ? change.before.data() : null;
    const afterData = change.after.exists ? change.after.data() : null;

    if (afterData && afterData.published && (!beforeData || !beforeData.published)) {
      const staffSnapshot = await db.collection("staff").get();
      if (staffSnapshot.empty) return;

      const payload = {
        notification: {
          title: "New Training Available!",
          body: `A new course has been published: "${afterData.title}". Start learning now!`,
          icon: "/icon-192x192.png",
        },
         webpush: {
          fcmOptions: {
            link: "/training/dashboard",
          },
        },
      };

      const userIds = staffSnapshot.docs.map((doc) => doc.id);
      await Promise.all(
        userIds.map((userId) => sendPushNotification(userId, payload))
      );
    }
  });

// 4. Admin-Managed Notifications
export const sendManualNotification = functions.https.onCall(
  async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    const callerUid = context.auth.uid;
    const callerDoc = await db.collection("staff").doc(callerUid).get();
    const callerData = callerDoc.data();

    if (!callerData || callerData.role !== "Admin") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Only admins can send global notifications."
      );
    }

    const { target, content } = data;
    if (!content) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "The function must be called with a 'content' argument."
      );
    }

    const author = callerData.name || "Admin";
    const batch = db.batch();
    const notificationsCollection = db.collection("notifications");
    let recipients: { id: string }[] = [];

    if (target === "all") {
      const allStaffSnapshot = await db.collection("staff").get();
      recipients = allStaffSnapshot.docs.map((doc) => ({ id: doc.id }));
    } else if (typeof target === "string") {
      recipients = [{ id: target }];
    } else {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid 'target' specified."
      );
    }

    recipients.forEach((staffMember) => {
      const newNotification = {
        userId: staffMember.id,
        content,
        author,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      };
      batch.set(notificationsCollection.doc(), newNotification);
    });

    await batch.commit();

    const pushPayload = {
      notification: {
        title: `Message from ${author}`,
        body: content,
        icon: "/icon-192x192.png",
      },
       webpush: {
          fcmOptions: {
            link: "/todos",
          },
        },
    };

    await Promise.all(
      recipients.map((r) => sendPushNotification(r.id, pushPayload))
    );

    return {
      success: true,
      message: `Notification sent to ${recipients.length} user(s).`,
    };
  }
);
