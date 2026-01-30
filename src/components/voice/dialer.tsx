'use client';

import { useVoice } from '@/providers/voice-provider';
import { Phone, PhoneOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function Dialer() {
  const { callState, hangupCall, error, currentCall } = useVoice();
  
  const phoneNumber = currentCall?.parameters?.To;

  if (callState === 'idle') {
    return null; // Don't show anything when there's no call
  }

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Card className="w-80 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {callState === 'connected' && <Phone className="text-green-500 animate-pulse" />}
            {callState === 'connecting' && <Phone className="text-blue-500 animate-pulse" />}
            {callState === 'ringing' && <Phone className="text-yellow-500 animate-pulse" />}
            {callState === 'error' && <AlertTriangle className="text-red-500" />}
            <span>
               {callState === 'error' ? 'Call Failed' : 'Call in Progress'}
            </span>
          </CardTitle>
           <CardDescription>
            {phoneNumber ? `Calling ${phoneNumber}` : 'Preparing call...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
                <p className="text-sm font-medium capitalize">{callState}</p>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>
            <Button variant="destructive" className="w-full" onClick={hangupCall}>
                <PhoneOff className="mr-2 h-4 w-4" /> Hang Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
