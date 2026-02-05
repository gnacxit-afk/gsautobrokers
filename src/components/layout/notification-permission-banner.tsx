'use client';

import { useNotificationPermission } from '@/hooks/use-notification-permission';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { useState } from 'react';

export function NotificationPermissionBanner() {
  const { permission, requestPermissionAndGetToken } = useNotificationPermission();
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if permission is already granted, denied, unsupported, or if the user dismissed it.
  if (permission !== 'default' || isDismissed) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-blue-500 text-white p-3 shadow-md mb-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Bell className="h-5 w-5" />
        <p className="text-sm font-medium">
          Enable push notifications to stay updated on important events.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          className="bg-blue-600 hover:bg-blue-700 text-white"
          onClick={requestPermissionAndGetToken}
        >
          Enable Notifications
        </Button>
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/20"
            onClick={() => setIsDismissed(true)}
        >
            <X size={16} />
        </Button>
      </div>
    </div>
  );
}
