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
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// This is a server-side file, so we can initialize Firebase Admin SDK
// to bypass security rules for writing.
if (!getApps().length) {
    // In a real production environment, you would use applicationDefault()
    // or other secure credential mechanisms. For this context, we assume
    // service account credentials might be available as environment variables.
    try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);
        initializeApp({
            credential: cert(serviceAccount)
        });
    } catch (e) {
        // Fallback for environments where service account isn't set
        console.warn("Firebase Admin SDK not initialized. Firestore write might fail if not authenticated with sufficient permissions.");
    }
}
// We get the admin instance of Firestore
const adminFirestore = getFirestore();


// The flow will internally call the scoring flow.
// The input for this submission flow is the same as the scoring flow.
export async function submitApplication(
  input: ScoreApplicationInput
): Promise<{ success: boolean; message: string }> {
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
      appliedDate: serverTimestamp(),
      lastStatusChangeDate: serverTimestamp(),
      pipelineStatus,
      score: scoreResult.score,
      aiAnalysis: scoreResult.reasoning,
      statusReason: scoreResult.status,
    };

    // 4. Use the Admin Firestore instance to write to the 'candidates' collection,
    // bypassing client-side security rules.
    try {
      const candidatesCollection = collection(adminFirestore, 'candidates');
      await addDoc(candidatesCollection, candidateData);

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
