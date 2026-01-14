import type { User, EmploymentContract } from "@/lib/types";
import { collection, serverTimestamp, type WriteBatch, type Firestore, doc } from "firebase/firestore";

export const createContractEvent = async (
    batch: WriteBatch,
    firestore: Firestore,
    user: User, 
    contract: EmploymentContract, 
    eventType: 'Created' | 'Activated' | 'Archived'
) => {
    if (!firestore || !user) return;
    
    const eventsCollection = collection(firestore, 'contract_events');
    const eventRef = doc(eventsCollection);

    const eventData = {
        contractId: contract.id,
        contractTitle: contract.title,
        contractVersion: contract.version,
        userEmail: user.email,
        userName: user.name,
        eventType,
        timestamp: serverTimestamp(),
    };
    
    batch.set(eventRef, eventData);
};
