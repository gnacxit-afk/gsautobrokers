
'use client';

import { useVoice } from '@/providers/voice-provider';
import { Phone, PhoneCall, PhoneOff, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePathname } from 'next/navigation';


export function Dialer() {
  const { 
    showDialer, 
    numberToDial, 
    callState, 
    hangupCall,
    acceptCall,
    rejectCall, 
    error,
  } = useVoice();
  const pathname = usePathname();

  // Do not show this floating dialer on the main call logs page
  if (!showDialer || pathname === '/calls') {
    return null;
  }
  
  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Card className="w-80 shadow-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             {callState === 'idle' && <PhoneCall className="text-gray-500" />}
             {callState === 'incoming' && <PhoneCall className="text-blue-500 animate-pulse" />}
             {callState === 'connected' && <Phone className="text-green-500 animate-pulse" />}
             {callState === 'connecting' && <Phone className="text-blue-500 animate-pulse" />}
             {callState === 'ringing' && <Phone className="text-yellow-500 animate-pulse" />}
             {callState === 'error' && <AlertTriangle className="text-red-500" />}
             <span>
                {callState === 'idle' && 'Call Ended'}
                {callState === 'incoming' && 'Incoming Call'}
                {callState !== 'idle' && callState !== 'incoming' && 'Call in Progress'}
             </span>
          </CardTitle>
          <CardDescription>
            {numberToDial ? `${callState === 'incoming' ? 'From' : 'Calling'}: ${numberToDial}` : 'No number selected'}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {callState === 'error' && error ? (
                <div className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Call Error</AlertTitle>
                        <AlertDescription>
                            {error}
                        </AlertDescription>
                    </Alert>
                    <Button variant="outline" className="w-full" onClick={hangupCall}>
                        Dismiss
                    </Button>
                </div>
            ) : callState === 'incoming' ? (
                 <div className="space-y-4">
                    <div className="flex gap-2">
                        <Button variant="destructive" className="w-full" onClick={rejectCall}>
                            <PhoneOff className="mr-2 h-4 w-4" /> Reject
                        </Button>
                        <Button className="w-full bg-green-600 hover:bg-green-700" onClick={acceptCall}>
                            <PhoneCall className="mr-2 h-4 w-4" /> Accept
                        </Button>
                    </div>
                </div>
            ) : (
                 <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm font-medium capitalize">{callState}</p>
                    </div>
                    <Button variant="destructive" className="w-full" onClick={hangupCall}>
                        <PhoneOff className="mr-2 h-4 w-4" /> {callState === 'idle' ? 'Close' : 'Hang Up'}
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
