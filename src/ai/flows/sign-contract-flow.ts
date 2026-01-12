'use server';
/**
 * @fileOverview A Genkit flow for securely handling employment contract signatures.
 *
 * @exported
 * - `signContract`: a server-side function to record a user's contract signature.
 */

import { ai } from '@/ai/genkit';
import { getFirestore, doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { headers } from 'next/headers';
import { SignContractInputSchema, SignContractOutputSchema, type SignContractInput, type SignContractOutput } from '@/lib/types';
import { initializeApp, getApps } from 'firebase/app';
import { firebaseConfig } from '@/firebase/config';

export async function signContract(input: SignContractInput): Promise<SignContractOutput> {
  return signContractFlow(input);
}

const signContractFlow = ai.defineFlow(
  {
    name: 'signContractFlow',
    inputSchema: SignContractInputSchema,
    outputSchema: SignContractOutputSchema,
  },
  async (input) => {
    // Ensure Firebase is initialized on the server
    if (!getApps().length) {
      initializeApp(firebaseConfig);
    }
    const firestore = getFirestore();

    try {
      // Get user's IP Address from request headers
      const headersList = headers();
      const ipAddress = headersList.get('x-forwarded-for') ?? 'unknown';

      // Create a new signature document
      const signatureRef = doc(collection(firestore, "signatures"));
      const signatureData = {
        id: signatureRef.id,
        userId: input.userId,
        userName: input.userName,
        contractId: input.contractId,
        contractVersion: input.contractVersion, // Use version from input
        signedAt: serverTimestamp(),
        ipAddress: ipAddress,
      };

      await setDoc(signatureRef, signatureData);

      return {
        success: true,
        signatureId: signatureRef.id,
        message: "Contract signed successfully.",
      };
    } catch (error: any) {
      console.error("Error signing contract:", error);
      return {
        success: false,
        message: error.message || "An unexpected error occurred while signing the contract.",
      };
    }
  }
);
