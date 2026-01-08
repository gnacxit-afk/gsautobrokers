
"use client";

import React, { useState, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, writeBatch, getDocs, onSnapshot, type Firestore } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuTrigger, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

async function markAllAsRead(firestore: Firestore, userId: string): Promise<void> {
    const q = query(
        collection(firestore, "notifications"),
        where("userId", "==", userId),
        where("read", "==", false)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) return;

    const batch = writeBatch(firestore);
    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
    });

    await batch.commit();
}


export function Notifications() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Listener for the unread count
  useEffect(() => {
    if (!firestore || !user) return;
    const q = query(
      collection(firestore, "notifications"),
      where("userId", "==", user.id),
      where("read", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [firestore, user]);

  // Listener for the notification data
  useEffect(() => {
    if (!firestore || !user || !open) {
        if (!open) setLoading(true); // Reset loading state when closed
        return;
    }
    
    setLoading(true);
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        setNotifications(newNotifications);
        setLoading(false);
    });
    return () => unsubscribe();
  }, [firestore, user, open]);
  
  const handleMarkAllReadClick = async () => {
      if (!firestore || !user) return;
      await markAllAsRead(firestore, user.id);
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!firestore || notification.read) {
        if(notification.leadId) router.push(`/leads/${notification.leadId}/notes`);
        return;
    }
    const notifRef = doc(firestore, 'notifications', notification.id);
    await updateDoc(notifRef, { read: true });
    if(notification.leadId) router.push(`/leads/${notification.leadId}/notes`);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative flex items-center gap-2 text-slate-400 hover:text-white transition-colors w-full justify-start text-sm p-2 h-auto"
        >
          <Bell size={16} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="absolute top-1 left-5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-screen max-w-sm sm:max-w-md" align="end">
        <div className="flex justify-between items-center px-2 py-1.5">
            <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
            {unreadCount > 0 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAllReadClick();
                    }}
                    className="flex items-center text-xs text-blue-600 hover:underline focus:outline-none"
                >
                    <CheckCheck size={14} className="mr-1" />
                    <span>Mark all as read</span>
                </button>
            )}
        </div>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {loading ? (
             <div className="space-y-2 p-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
             </div>
          ) : notifications.length > 0 ? (
            notifications.map(n => (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => handleNotificationClick(n)}
                className={cn(
                  "p-3 rounded-lg w-full cursor-pointer",
                  !n.read ? "bg-blue-50/50" : "",
                )}
              >
                <div className="flex items-start gap-3">
                   <div className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 mt-1">
                      <MessageSquare size={16} />
                  </div>
                  <div>
                      <p className="text-xs text-slate-800 leading-snug whitespace-normal">{n.content}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        <span className="font-semibold">{n.author}</span> - {n.createdAt ? formatDistanceToNow((n.createdAt as any)?.toDate() || new Date(), { addSuffix: true }) : ''}
                      </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="text-sm text-center text-slate-500 py-4 px-2">No notifications.</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
