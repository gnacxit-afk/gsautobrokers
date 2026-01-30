'use client';

import { useVoice } from '@/providers/voice-provider';
import { Phone, PhoneCall, PhoneOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export function Dialer() {
  const { 
    showDialer, 
    numberToDial, 
    callState, 
    hangupCall, 
    connectCall, 
    error,
  } = useVoice();

  if (!showDialer) {
    return null;
  }

  const isIdle = callState === 'idle';
  const isInCall = callState !== 'idle';
  
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Card className="w-80 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             {isIdle && <PhoneCall className="text-gray-500" />}
             {callState === 'connected' && <Phone className="text-green-500 animate-pulse" />}
             {callState === 'connecting' && <Phone className="text-blue-500 animate-pulse" />}
             {callState === 'ringing' && <Phone className="text-yellow-500 animate-pulse" />}
             {callState === 'error' && <AlertTriangle className="text-red-500" />}
             <span>{isInCall ? 'Call in Progress' : 'Ready to Call'}</span>
          </CardTitle>
          <CardDescription>
            {numberToDial ? `Dialing: ${numberToDial}` : 'No number selected'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isIdle ? (
                <div className="space-y-4">
                    <p className="text-sm text-center text-muted-foreground">Click "Dial" to start the call.</p>
                    <div className="flex gap-2">
                        <Button variant="outline" className="w-full" onClick={hangupCall}>
                            Cancel
                        </Button>
                        <Button className="w-full" onClick={connectCall}>
                            <PhoneCall className="mr-2 h-4 w-4" /> Dial
                        </Button>
                    </div>
                </div>
            ) : (
                 <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm font-medium capitalize">{callState}</p>
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                    <Button variant="destructive" className="w-full" onClick={hangupCall}>
                        <PhoneOff className="mr-2 h-4 w-4" /> Hang Up
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
