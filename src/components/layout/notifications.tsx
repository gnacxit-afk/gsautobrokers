
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { useCollection } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc, writeBatch, getDocs, onSnapshot } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Notifications() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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
    if (!firestore || !user) return;
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newNotifications = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Notification));
        setNotifications(newNotifications);
    });
    return () => unsubscribe();
  }, [firestore, user]);
  
  const handleNotificationClick = async (notification: Notification) => {
    if (!firestore) return;
    setOpen(false);

    if (!notification.read) {
      const notifRef = doc(firestore, 'notifications', notification.id);
      await updateDoc(notifRef, { read: true });
    }
    
    if (notification.leadId) {
      router.push(`/leads/${notification.leadId}/notes`);
    }
  };

  const markAllAsRead = async () => {
    if (!firestore || !user) return;
    const q = query(
        collection(firestore, "notifications"),
        where("userId", "==", user.id),
        where("read", "==", false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return;
    
    const batch = writeBatch(firestore);
    snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, { read: true });
    });
    await batch.commit();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-screen max-w-sm sm:max-w-md" align="end">
        <div className="flex flex-wrap justify-between items-center mb-2 gap-2">
            <h4 className="font-medium text-sm">Notifications</h4>
            {unreadCount > 0 && (
                 <button onClick={markAllAsRead} className="flex items-center text-xs text-blue-600 hover:underline focus:outline-none">
                    <CheckCheck size={14} className="mr-1" />
                    <span>Mark all as read</span>
                </button>
            )}
        </div>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {notifications && notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={cn("p-3 rounded-lg", !n.read ? "bg-blue-50/50" : "", {
                  "cursor-pointer hover:bg-slate-100 transition-colors": true,
                })}
              >
                <div className="flex items-start gap-3">
                   <div className="h-8 w-8 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-500 mt-1">
                      <MessageSquare size={16} />
                  </div>
                  <div>
                      <p className="text-xs text-slate-800 leading-snug">{n.content}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        <span className="font-semibold">{n.author}</span> - {n.createdAt ? formatDistanceToNow((n.createdAt as any)?.toDate() || new Date(), { addSuffix: true }) : ''}
                      </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-center text-slate-500 py-4">No notifications.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
