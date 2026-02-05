'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { useFirebaseApp, useUser, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from './use-toast';

export function useNotificationPermission() {
  const app = useFirebaseApp();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported' | 'loading'>('loading');

  useEffect(() => {
    async function checkSupport() {
      const supported = await isSupported();
      if (supported) {
        setPermission(Notification.permission);
      } else {
        setPermission('unsupported');
      }
    }
    checkSupport();
  }, []);

  const requestPermissionAndGetToken = useCallback(async () => {
    if (permission !== 'default' || !app || !user || !firestore) {
      if (permission === 'denied') {
        toast({
          title: "Permission Denied",
          description: "You have blocked notifications. Please enable them in your browser settings.",
          variant: "destructive"
        });
      }
      return;
    }

    try {
      const messaging = getMessaging(app);
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);

      if (currentPermission === 'granted') {
        // NOTE: Ensure your VAPID key is set in a .env.local file.
        // e.g., NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-key-here
        const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
            console.error("VAPID key is not set in environment variables (NEXT_PUBLIC_FIREBASE_VAPID_KEY).");
            toast({ title: "Configuration Error", description: "Push notification credentials are not set up on the server.", variant: "destructive"});
            return;
        }

        const fcmToken = await getToken(messaging, { vapidKey });

        if (fcmToken) {
          const userDocRef = doc(firestore, 'staff', user.id);
          await updateDoc(userDocRef, {
            fcmTokens: arrayUnion(fcmToken),
          });
          toast({ title: "Notifications Enabled!", description: "You will now receive push notifications."});
        }
      } else {
        toast({ title: "Notifications Not Enabled", description: "You have denied permission for notifications.", variant: "destructive"});
      }
    } catch (error) {
      console.error('Error getting notification permission or token:', error);
      toast({ title: "Error", description: "Could not enable notifications.", variant: "destructive"});
      setPermission('denied');
    }
  }, [app, firestore, user, permission, toast]);

  return { permission, requestPermissionAndGetToken };
}
