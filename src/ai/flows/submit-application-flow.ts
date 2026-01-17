
'use server';
/**
 * @fileOverview This file defines a secure Genkit flow for processing a candidate application.
 * It acts as a backend service, validating data and scoring the application via AI.
 * It returns the fully formed candidate data to the client for final submission.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { scoreApplication } from './score-application-flow';
import {
  ScoreApplicationInputSchema,
} from './score-application-types';

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
// It does not include timestamps, as those will be generated on the client during the write.
const CandidateDataOutputSchema = ApplicationDataSchema.extend({
    source: z.string(),
    pipelineStatus: z.string(),
    score: z.number(),
    aiAnalysis: z.string(),
    statusReason: z.string(),
});

// The final output schema for the entire flow's response.
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
      // We no longer add timestamps here.
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
        console.error("CRITICAL ERROR in submitApplicationFlow:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            detail: error.details
        });
        // We re-throw the error so the client knows something went wrong.
        throw new Error("Failed to process application on the server. Details: " + error.message);
    }
  }
);
