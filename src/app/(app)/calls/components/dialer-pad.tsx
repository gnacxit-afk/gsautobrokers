
'use client';

import { useState } from 'react';
import { useVoice } from '@/providers/voice-provider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, PhoneOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const keypadKeys = [
    { main: '1', sub: '' }, { main: '2', sub: 'ABC' }, { main: '3', sub: 'DEF' },
    { main: '4', sub: 'GHI' }, { main: '5', sub: 'JKL' }, { main: '6', sub: 'MNO' },
    { main: '7', sub: 'PQRS' }, { main: '8', sub: 'TUV' }, { main: '9', sub: 'WXYZ' },
    { main: '*', sub: '' }, { main: '0', sub: '+' }, { main: '#', sub: '' },
];

export function DialerPad() {
    const [displayValue, setDisplayValue] = useState('');
    const { callState, initiateCall, hangupCall, numberToDial, error } = useVoice();

    const handleKeyPress = (key: string) => {
        setDisplayValue(prev => prev + key);
    };

    const handleBackspace = () => {
        setDisplayValue(prev => prev.slice(0, -1));
    };
    
    const handleCall = () => {
        if (displayValue) {
            initiateCall(displayValue);
        }
    };

    const isCallInProgress = ['connecting', 'ringing', 'connected'].includes(callState);

    if (isCallInProgress || callState === 'error') {
        return (
             <Card className="w-full max-w-sm mx-auto">
                <CardContent className="p-6 text-center">
                   {callState === 'error' ? (
                     <div className="space-y-4">
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Call Error</AlertTitle>
                            <AlertDescription>
                                {error || 'An unknown error occurred.'}
                            </AlertDescription>
                        </Alert>
                        <Button variant="outline" className="w-full" onClick={hangupCall}>
                            Dismiss
                        </Button>
                    </div>
                   ) : (
                    <>
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                            <AvatarFallback className="text-4xl">
                                {numberToDial ? numberToDial.charAt(0) : '?'}
                            </AvatarFallback>
                        </Avatar>
                        <h3 className="text-xl font-bold">{numberToDial}</h3>
                        <p className="text-muted-foreground capitalize animate-pulse">{callState}...</p>
                        <Button variant="destructive" size="lg" className="w-full mt-6" onClick={hangupCall}>
                            <PhoneOff className="mr-2"/> Hang Up
                        </Button>
                    </>
                   )}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-sm mx-auto">
            <CardContent className="p-6">
                <Input
                    readOnly
                    value={displayValue}
                    className="text-3xl font-light text-center w-full mb-8 h-auto p-2 border-0 focus-visible:ring-0 shadow-none bg-slate-50"
                    placeholder="Enter number..."
                />
                <div className="grid grid-cols-3 gap-4">
                    {keypadKeys.map(({ main, sub }) => (
                        <Button
                            key={main}
                            variant="outline"
                            className="h-16 w-16 rounded-full flex flex-col text-2xl"
                            onClick={() => handleKeyPress(main)}
                        >
                            {main}
                            <span className="text-xs text-muted-foreground -mt-1">{sub}</span>
                        </Button>
                    ))}
                </div>
                <div className="flex items-center justify-center gap-4 mt-8">
                     <Button
                        size="lg"
                        className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
                        onClick={handleCall}
                        disabled={!displayValue}
                    >
                        <Phone />
                    </Button>
                    {displayValue && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-12 h-12 rounded-full"
                            onClick={handleBackspace}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"></path></svg>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
