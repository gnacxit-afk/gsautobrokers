
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
  type ScoreApplicationInput,
} from './score-application-types';
import { getFirestore, FieldValue, query, where, getDocs, writeBatch } from 'firebase-admin/firestore';
import { initializeApp, getApps } from 'firebase-admin/app';

// This is a server-side file, so we can initialize Firebase Admin SDK
// to bypass security rules for writing. In a managed environment like App Hosting,
// initializeApp() with no arguments automatically uses the service account.
if (getApps().length === 0) {
  initializeApp();
}
// We get the admin instance of Firestore
const adminFirestore = getFirestore();


// The flow will internally call the scoring flow.
// The input for this submission flow is the same as the scoring flow.
export async function submitApplication(
  input: ScoreApplicationInput
): Promise<{ success: boolean; message: string }> {
  // Directly calling the flow now, as this is a server action.
  return submitApplicationFlow(input);
}

const submitApplicationFlow = ai.defineFlow(
  {
    name: 'submitApplicationFlow',
    inputSchema: ScoreApplicationInputSchema,
    outputSchema: z.object({
      success: z.boolean(),
      message: z.string(),
    }),
  },
  async (applicationData) => {
    // 1. Score the application using the existing AI flow
    const scoreResult = await scoreApplication(applicationData);

    // 2. Determine pipeline status based on score
    const pipelineStatus =
      scoreResult.score < 60 ? 'Rejected' : 'New Applicant';

    // 3. Prepare the complete candidate document for Firestore
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

      // 5. If new applicant, notify admins.
      if (pipelineStatus === 'New Applicant') {
          const staffRef = adminFirestore.collection('staff');
          const q = query(staffRef, where('role', '==', 'Admin'));
          const adminSnapshot = await getDocs(q);

          if (!adminSnapshot.empty) {
              const batch = writeBatch(adminFirestore);
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
        throw new Error("Failed to save application to the database.");
    }
  }
);
