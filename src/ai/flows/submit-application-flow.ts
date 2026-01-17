
'use server';
/**
 * @fileOverview This file defines two Genkit flows for candidate applications:
 * 1. `submitApplication`: A secure "guardian" flow that processes and scores an application via AI,
 *    returning the data to the client for final database submission.
 * 2. `notifyAdminsOfNewCandidate`: A flow to send notifications to all admins about a new candidate.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { scoreApplication } from './score-application-flow';
import {
  ScoreApplicationInputSchema,
} from './score-application-types';

// Admin SDK imports
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { applicationDefault } from 'firebase-admin/app';

// Secure initialization for Firebase Admin SDK in a server environment.
if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}
const adminFirestore = getFirestore();


// The input schema, representing the full application data from the form.
const ApplicationDataSchema = ScoreApplicationInputSchema.extend({
  fullName: z.string(),
  email: z.string().email(),
  whatsappNumber: z.string(),
  country: z.string(),
  city: z.string(),
});
export type ApplicationData = z.infer<typeof ApplicationDataSchema>;

// The output schema for the data that will be returned to the client.
const CandidateDataOutputSchema = ApplicationDataSchema.extend({
    source: z.string(),
    pipelineStatus: z.string(),
    score: z.number(),
    aiAnalysis: z.string(),
    statusReason: z.string(),
});

// The final output schema for the main submission flow.
const SubmitApplicationOutputSchema = z.object({
    success: z.boolean(),
    message: z.string(),
    candidateData: CandidateDataOutputSchema.optional(),
});


// The public-facing server action, which will now expect the full application data.
export async function submitApplication(
  input: ApplicationData
): Promise<z.infer<typeof SubmitApplicationOutputSchema>> {
  return submitApplicationFlow(input);
}

const submitApplicationFlow = ai.defineFlow(
  {
    name: 'submitApplicationFlow',
    inputSchema: ApplicationDataSchema,
    outputSchema: SubmitApplicationOutputSchema,
  },
  async (applicationData) => {
    try {
      // 1. Score the application using the existing AI flow.
      const scoreResult = await scoreApplication(applicationData);

      // 2. Determine pipeline status based on the AI score.
      const pipelineStatus =
        scoreResult.score < 60 ? 'Rejected' : 'New Applicant';

      // 3. Prepare the complete candidate document to be returned to the client.
      const candidateDataToReturn = {
        ...applicationData,
        source: 'Organic', // Set by the server for tracking
        pipelineStatus,
        score: scoreResult.score,
        aiAnalysis: scoreResult.reasoning,
        statusReason: scoreResult.status,
      };

      // 4. Return the processed data to the client for the final database write.
      return {
        success: true,
        message: 'Application processed successfully by the server.',
        candidateData: candidateDataToReturn,
      };
    } catch (error: any) {
        // Log the full error on the server for debugging
        console.error("CRITICAL ERROR in submitApplicationFlow:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            detail: error.details
        });
        // Throw a more specific error to the client if something goes wrong.
        throw new Error("Failed to process application on the server. Details: " + error.message);
    }
  }
);


// --- NEW NOTIFICATION FLOW ---

const NotifyAdminsInputSchema = z.object({
    candidateName: z.string(),
    status: z.string(),
});

export async function notifyAdminsOfNewCandidate(
  input: z.infer<typeof NotifyAdminsInputSchema>
): Promise<void> {
  // This is a fire-and-forget flow. We'll run it without wrapping in an AI flow for simplicity.
  try {
    const adminsSnapshot = await adminFirestore.collection('staff').where('role', '==', 'Admin').get();
    if (adminsSnapshot.empty) {
      console.log("No admin users found to notify.");
      return;
    }

    const batch = adminFirestore.batch();
    const notificationsCollection = adminFirestore.collection('notifications');
    const notificationContent = `New candidate "${input.candidateName}" has been added to the '${input.status}' pipeline.`;

    adminsSnapshot.docs.forEach(adminDoc => {
      const notificationRef = notificationsCollection.doc();
      batch.set(notificationRef, {
        userId: adminDoc.id,
        content: notificationContent,
        author: 'System',
        leadName: input.candidateName, // Using leadName to store candidate name for context
        createdAt: new Date(),
        read: false,
      });
    });

    await batch.commit();
    console.log(`Successfully queued notifications for ${adminsSnapshot.size} admin(s).`);
  } catch (error: any) {
    // Log the error server-side, but don't block the client.
    console.error("Failed to send admin notifications:", {
      message: error.message,
      stack: error.stack
    });
  }
}
