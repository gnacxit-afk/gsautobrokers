
'use client';

import React, { useState, useMemo } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { useCollection } from '@/firebase';
import { collection, query, where, orderBy, updateDoc, doc } from 'firebase/firestore';
import type { Notification } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Bell, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';

export function Notifications() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const notificationsQuery = useMemo(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.id),
      orderBy('createdAt', 'desc')
    );
  }, [firestore, user]);

  const { data: notifications } = useCollection<Notification>(notificationsQuery);
  const unreadCount = useMemo(() => notifications?.filter(n => !n.read).length || 0, [notifications]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!firestore) return;

    if (!notification.read) {
      const notifRef = doc(firestore, 'notifications', notification.id);
      await updateDoc(notifRef, { read: true });
    }
    router.push(`/leads/${notification.leadId}/notes`);
  };

  const markAllAsRead = async () => {
    if (!firestore || !notifications) return;
    const unreadNotifications = notifications.filter(n => !n.read);
    const batch = [];
    for (const notif of unreadNotifications) {
      const notifRef = doc(firestore, 'notifications', notif.id);
      batch.push(updateDoc(notifRef, { read: true }));
    }
    await Promise.all(batch);
  };

  return (
    <Popover>
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
      <PopoverContent className="w-80" align="end">
        <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium text-sm">Notifications</h4>
            {unreadCount > 0 && (
                 <Button variant="link" size="sm" className="p-0 h-auto" onClick={markAllAsRead}>
                    <CheckCheck size={14} className="mr-1" /> Mark all as read
                </Button>
            )}
        </div>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {notifications && notifications.length > 0 ? (
            notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`p-2 rounded-lg cursor-pointer ${
                  n.read ? 'opacity-60' : 'bg-blue-50'
                } hover:bg-slate-100 transition-colors`}
              >
                <p className="text-xs text-slate-800">{n.content}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {formatDistanceToNow((n.createdAt as any)?.toDate() || new Date(), { addSuffix: true })}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-center text-slate-500 py-4">No new notifications.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
