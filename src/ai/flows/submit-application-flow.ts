
'use server';
/**
 * @fileOverview This file defines a secure Genkit flow for submitting a candidate application.
 * It acts as a backend guardian, validating data, scoring the application via AI,
 * and then writing the final candidate document to Firestore.
 *
 * @exported
 * - `submitApplication`: The public-facing server action to be called from the client.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { scoreApplication } from './score-application-flow';
import {
  ScoreApplicationInputSchema,
} from './score-application-types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// This is a server-side file, so we can initialize Firebase Admin SDK
// to bypass security rules for writing. In a managed environment like App Hosting,
// initializeApp() with no arguments automatically uses the service account.
if (getApps().length === 0) {
  initializeApp();
}
// We get the admin instance of Firestore
const adminFirestore = getFirestore();

// We need a schema that represents the full application data from the form.
// It extends the existing ScoreApplicationInputSchema to avoid duplication.
const ApplicationDataSchema = ScoreApplicationInputSchema.extend({
  fullName: z.string(),
  email: z.string().email(),
  whatsappNumber: z.string(),
  country: z.string(),
  city: z.string(),
});
export type ApplicationData = z.infer<typeof ApplicationDataSchema>;

// The public-facing server action, which will now expect the full application data.
export async function submitApplication(
  input: ApplicationData
): Promise<{ success: boolean; message: string }> {
  return submitApplicationFlow(input);
}

const submitApplicationFlow = ai.defineFlow(
  {
    name: 'submitApplicationFlow',
    inputSchema: ApplicationDataSchema, // Use the new, complete schema.
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (applicationData) => {
    // 1. Score the application. scoreApplication expects ScoreApplicationInput,
    // and our ApplicationData is a superset, so we can pass it directly.
    const scoreResult = await scoreApplication(applicationData);

    // 2. Determine pipeline status based on score
    const pipelineStatus =
      scoreResult.score < 60 ? 'Rejected' : 'New Applicant';

    // 3. Prepare the complete candidate document for Firestore.
    // Now `applicationData` contains all the necessary fields.
    const candidateData = {
      ...applicationData,
      source: 'Organic',
      appliedDate: FieldValue.serverTimestamp(),
      lastStatusChangeDate: FieldValue.serverTimestamp(),
      pipelineStatus,
      score: scoreResult.score,
      aiAnalysis: scoreResult.reasoning,
      statusReason: scoreResult.status,
    };

    // 4. Use the Admin Firestore instance to write to the 'candidates' collection,
    // bypassing client-side security rules.
    try {
      const candidatesCollection = adminFirestore.collection('candidates');
      await candidatesCollection.add(candidateData);

      // 5. If new applicant, notify admins using the correct admin SDK syntax.
      if (pipelineStatus === 'New Applicant') {
          const staffRef = adminFirestore.collection('staff');
          // Use the correct query syntax for the Admin SDK
          const adminSnapshot = await staffRef.where('role', '==', 'Admin').get();

          if (!adminSnapshot.empty) {
              // Use the batch method from the adminFirestore instance
              const batch = adminFirestore.batch();
              const notificationsCollection = adminFirestore.collection('notifications');

              adminSnapshot.forEach(adminDoc => {
                  const notificationRef = notificationsCollection.doc(); // Auto-generate ID
                  const newNotification = {
                      userId: adminDoc.id,
                      content: `New candidate "${candidateData.fullName}" has applied and is ready for review in the "New Applicants" pipeline.`,
                      author: 'System',
                      createdAt: FieldValue.serverTimestamp(),
                      read: false,
                  };
                  batch.set(notificationRef, newNotification);
              });
              
              await batch.commit();
          }
      }

      return {
        success: true,
        message: 'Application submitted successfully.',
      };
    } catch (error: any) {
        console.error("Error writing to Firestore with Admin SDK:", error);
        // Throw a more specific error to the client if something goes wrong.
        throw new Error("Failed to save application to the database. " + error.message);
    }
  }
);
