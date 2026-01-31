'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { useUser } from '@/firebase';
import { generateTwilioToken } from '@/ai/flows/generate-twilio-token';
import { useToast } from '@/hooks/use-toast';

interface VoiceContextType {
  isReady: boolean;
  callState: 'idle' | 'connecting' | 'ringing' | 'connected' | 'incoming' | 'error';
  error: string | null;
  initiateCall: (phoneNumber: string) => void;
  connectCall: () => void;
  acceptCall: () => void;
  rejectCall: () => void;
  hangupCall: () => void;
  currentCall: Call | null;
  showDialer: boolean;
  numberToDial: string | null;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const { toast } = useToast();
  const [device, setDevice] = useState<Device | null>(null);
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'ringing' | 'connected' | 'incoming' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const [showDialer, setShowDialer] = useState(false);
  const [numberToDial, setNumberToDial] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const cleanupCall = useCallback(() => {
    if (audioRef.current) {
        audioRef.current.srcObject = null;
    }
    setCurrentCall(null);
    setIncomingCall(null);
    setCallState('idle');
    setShowDialer(false);
    setNumberToDial(null);
  }, []);

  const handleTracks = useCallback((call: Call) => {
    if (audioRef.current) {
      call.on('track', (track) => {
        if (audioRef.current && track.kind === 'audio') {
          const remoteStream = new MediaStream([track.mediaStreamTrack]);
          audioRef.current.srcObject = remoteStream;
        }
      });
    }
  }, []);
  
  useEffect(() => {
    let deviceInstance: Device | null = null;
    
    if (user?.id) {
        const initialize = async () => {
            try {
                await navigator.mediaDevices.getUserMedia({ audio: true });
                const token = await generateTwilioToken(user.id);
                deviceInstance = new Device(token, {
                    logLevel: 1,
                    codecPreferences: ['opus', 'pcmu'] as Call.Codec[],
                });

                deviceInstance.on('registered', () => {
                    setIsReady(true);
                    setCallState('idle');
                    console.log('Twilio Device is registered and ready.');
                });
                
                deviceInstance.on('incoming', (incCall) => {
                    console.log('Incoming call from', incCall.parameters.From);
                    toast({
                      title: "Incoming Call",
                      description: `From: ${incCall.parameters.From}`,
                    });

                    setIncomingCall(incCall);
                    setCallState('incoming');
                    setShowDialer(true);
                    setNumberToDial(incCall.parameters.From);

                    incCall.on('disconnect', cleanupCall);
                    incCall.on('cancel', cleanupCall);
                });

                deviceInstance.on('registering', () => console.log('Twilio Device is registering...'));
                deviceInstance.on('unregistered', () => {
                    console.log('Twilio Device is unregistered.');
                    if (deviceInstance) deviceInstance.destroy();
                    setIsReady(false);
                });
                deviceInstance.on('error', (err) => {
                    setIsReady(false);
                    setCallState('error');
                    setError(err.message);
                    console.error('Twilio Device Error:', err);
                });
                deviceInstance.on('disconnect', () => {
                    console.log('Twilio device transport disconnected.');
                    setIsReady(false);
                });

                deviceInstance.register();
                setDevice(deviceInstance);
            } catch (err: any) {
                console.error('Error setting up Twilio Device:', err);
                if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setError('Microphone access denied. Please enable microphone permissions in your browser settings to make calls.');
                } else {
                    setError(err.message || 'Could not initialize phone. Please refresh.');
                }
                setCallState('error');
                setShowDialer(true);
            }
        };
        
        initialize();
    }

    return () => {
      if (deviceInstance) {
        deviceInstance.destroy();
        setDevice(null);
        setIsReady(false);
        setCallState('idle');
      }
    };
  }, [user?.id, toast, cleanupCall]);

  const initiateCall = useCallback((phoneNumber: string) => {
    const phoneRegex = /^\+1\d{10}$/;
    if (!phoneNumber) {
         toast({ title: "Invalid Number", description: "This lead does not have a valid phone number.", variant: "destructive" });
        return;
    }
    if (!phoneRegex.test(phoneNumber)) {
        toast({ title: "Invalid Number Format", description: "Phone number must be in the format +1XXXXXXXXXX for US calls.", variant: "destructive" });
        return;
    }
    setNumberToDial(phoneNumber);
    setShowDialer(true);
    setCallState('idle');
    setError(null);
  }, [toast]);

  const connectCall = useCallback(async () => {
    if (!device || !isReady || !numberToDial) {
        setError('Phone is not ready or number is missing. Please refresh the page and grant microphone permissions.');
        setCallState('error');
        setShowDialer(true);
        return;
    }

    setCallState('connecting');
    setError(null);
    try {
        const call = await device.connect({ params: { To: numberToDial } });
        setCurrentCall(call);

        handleTracks(call);
        
        call.on('ringing', () => setCallState('ringing'));
        call.on('accept', () => {
            setCallState('connected');
        });
        call.on('disconnect', cleanupCall);
        call.on('cancel', cleanupCall);
        call.on('error', (err) => {
            setError(err.message);
            setCallState('error');
        });
    } catch (err: any) {
        console.error('Call failed to connect:', err);
        setError(err.message);
        setCallState('error');
    }
  }, [device, isReady, numberToDial, cleanupCall, handleTracks]);
  
  const acceptCall = useCallback(() => {
    if (!incomingCall) return;

    incomingCall.accept();
    setCurrentCall(incomingCall);
    setCallState('connected');
    handleTracks(incomingCall);
    setIncomingCall(null);
  }, [incomingCall, handleTracks]);

  const rejectCall = useCallback(() => {
    if (incomingCall) {
      incomingCall.reject();
    }
    cleanupCall();
  }, [incomingCall, cleanupCall]);

  const hangupCall = useCallback(() => {
    if (currentCall) {
      currentCall.disconnect();
    }
    cleanupCall();
  }, [currentCall, cleanupCall]);

  const value = {
    isReady,
    callState,
    error,
    initiateCall,
    connectCall,
    acceptCall,
    rejectCall,
    hangupCall,
    currentCall,
    showDialer,
    numberToDial,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
    </VoiceContext.Provider>
  );
}
