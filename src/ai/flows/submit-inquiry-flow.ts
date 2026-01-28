'use server';
/**
 * @fileOverview A secure flow to handle public lead inquiries.
 *
 * - submitInquiry - A function that processes a new lead from the public website,
 *   finds a default owner, and saves it to the database.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { applicationDefault } from 'firebase-admin/app';

// Initialize Firebase Admin SDK if not already done.
if (!getApps().length) {
    initializeApp({
        credential: applicationDefault(),
    });
}
const adminFirestore = getFirestore();

const SubmitInquiryInputSchema = z.object({
  name: z.string(),
  phone: z.string(),
  interest: z.string(),
  message: z.string(),
});
export type SubmitInquiryInput = z.infer<typeof SubmitInquiryInputSchema>;

const SubmitInquiryOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SubmitInquiryOutput = z.infer<typeof SubmitInquiryOutputSchema>;

export async function submitInquiry(input: SubmitInquiryInput): Promise<SubmitInquiryOutput> {
  return submitInquiryFlow(input);
}

const submitInquiryFlow = ai.defineFlow(
  {
    name: 'submitInquiryFlow',
    inputSchema: SubmitInquiryInputSchema,
    outputSchema: SubmitInquiryOutputSchema,
  },
  async ({ name, phone, interest, message }) => {
    try {
      const batch = adminFirestore.batch();

      // 1. Find default owner (an Admin)
      const ownerSnapshot = await adminFirestore.collection('staff').where('role', '==', 'Admin').limit(1).get();
      if (ownerSnapshot.empty) {
        throw new Error('No default owner (Admin) found to assign the lead.');
      }
      const defaultOwner = { id: ownerSnapshot.docs[0].id, ...ownerSnapshot.docs[0].data() };

      // 2. Find default dealership
      const dealershipSnapshot = await adminFirestore.collection('dealerships').limit(1).get();
      if (dealershipSnapshot.empty) {
        throw new Error('No default dealership found to assign the lead.');
      }
      const defaultDealership = { id: dealershipSnapshot.docs[0].id, ...dealershipSnapshot.docs[0].data() };

      // 3. Create the new lead document
      const newLeadRef = adminFirestore.collection('leads').doc();
      batch.set(newLeadRef, {
        name,
        phone,
        channel: 'Website Inquiry',
        stage: 'Nuevo',
        language: 'English',
        ownerId: defaultOwner.id,
        ownerName: defaultOwner.name,
        dealershipId: defaultDealership.id,
        dealershipName: defaultDealership.name,
        createdAt: new Date(),
        lastActivity: new Date(),
      });

      // 4. Create the initial note
      const noteHistoryRef = newLeadRef.collection('noteHistory').doc();
      const initialNote = `Inquiry from website.\nInterest: ${interest}.\nMessage: ${message}`;
      batch.set(noteHistoryRef, {
        content: initialNote,
        author: 'System',
        date: new Date(),
        type: 'System',
      });
      
      // 5. Commit batch
      await batch.commit();

      return {
        success: true,
        message: 'Inquiry submitted successfully!',
      };
    } catch (error: any) {
      console.error('Error in submitInquiryFlow:', error);
      return {
        success: false,
        message: error.message || 'An unexpected server error occurred.',
      };
    }
  }
);
