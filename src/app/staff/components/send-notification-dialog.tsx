
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import React, { useState } from "react";
import type { Staff } from "@/lib/types";
import { useFirestore, useUser } from "@/firebase";
import { collection, serverTimestamp, addDoc, writeBatch, doc } from "firebase/firestore";
import { Label } from "@/components/ui/label";

interface SendNotificationDialogProps {
  children: React.ReactNode;
  allStaff: Staff[];
}

export function SendNotificationDialog({ children, allStaff }: SendNotificationDialogProps) {
    const [open, setOpen] = React.useState(false);
    const { toast } = useToast();
    const [recipient, setRecipient] = useState("all");
    const [message, setMessage] = useState("");
    const firestore = useFirestore();
    const { user: currentUser } = useUser();

    const handleSend = async () => {
        if (!firestore || !currentUser) {
             toast({ title: "Error", description: "Could not send notification. User not authenticated.", variant: "destructive" });
            return;
        }

        if (!message.trim()) {
             toast({ title: "Error", description: "Message cannot be empty.", variant: "destructive" });
            return;
        }
        
        try {
            if (recipient === 'all') {
                const batch = writeBatch(firestore);
                const notificationsCollection = collection(firestore, 'notifications');
                allStaff.forEach(staffMember => {
                    const newNotifRef = doc(notificationsCollection); // Correctly create a new doc ref for each notification
                    batch.set(newNotifRef, {
                        userId: staffMember.id,
                        content: message,
                        author: currentUser.name,
                        createdAt: serverTimestamp(),
                        read: false,
                    });
                });
                await batch.commit();
                toast({ title: "Notifications Sent", description: "Message sent to all staff members." });
            } else {
                const notificationsCollection = collection(firestore, 'notifications');
                await addDoc(notificationsCollection, {
                    userId: recipient,
                    content: message,
                    author: currentUser.name,
                    createdAt: serverTimestamp(),
                    read: false,
                });
                const recipientName = allStaff.find(s => s.id === recipient)?.name || 'the user';
                 toast({ title: "Notification Sent", description: `Message sent to ${recipientName}.` });
            }
            setOpen(false);
            setMessage("");
            setRecipient("all");

        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to send notification(s).", variant: "destructive" });
        }
    }
    
    return (
        <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
                setMessage("");
                setRecipient("all");
            }
        }}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Send a Notification</DialogTitle>
                <DialogDescription>
                    Send a direct message or a broadcast to the team.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="recipient" className="text-right">
                        Recipient
                    </Label>
                     <Select onValueChange={setRecipient} value={recipient}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a recipient" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Everyone</SelectItem>
                            {allStaff.map(staff => (
                                <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="message" className="text-right pt-2">
                        Message
                    </Label>
                    <Textarea 
                        id="message" 
                        value={message} 
                        onChange={(e) => setMessage(e.target.value)} 
                        className="col-span-3"
                        placeholder="Type your message here..."
                    />
                </div>
            </div>
            <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" onClick={handleSend}>Send Message</Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
    );
}
