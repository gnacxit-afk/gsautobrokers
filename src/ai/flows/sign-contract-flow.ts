'use server';
/**
 * @fileOverview A Genkit flow for securely handling employment contract signatures.
 *
 * @exported
 * - `signContract`: A server-side function to record a user's contract signature.
 */

import { ai } from '@/ai/genkit';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc, collection } from 'firebase/firestore';
import { headers } from 'next/headers';
import { SignContractInputSchema, SignContractOutputSchema, type SignContractInput, type SignContractOutput } from '@/lib/types';


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
    const firestore = getFirestore();

    try {
      // Fetch the contract to get its version
      const contractRef = doc(firestore, "contracts", input.contractId);
      const contractSnap = await getDoc(contractRef);

      if (!contractSnap.exists()) {
        throw new Error("Contract not found.");
      }
      const contractData = contractSnap.data();

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
        contractVersion: contractData.version,
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
