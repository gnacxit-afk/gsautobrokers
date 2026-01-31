
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
  
  const deviceRef = useRef<Device | null>(null);

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
    setError(null);
  }, []);

  const handleTracks = useCallback((call: Call) => {
    call.on('track', (track) => {
      if (audioRef.current && track.kind === 'audio') {
        const remoteStream = new MediaStream([track.mediaStreamTrack]);
        audioRef.current.srcObject = remoteStream;
        audioRef.current.play().catch(e => console.error("Audio play failed", e));
      }
    });
  }, []);
  
  useEffect(() => {
    const initializeDevice = async () => {
        if (!user?.id || deviceRef.current) return;

        try {
            const token = await generateTwilioToken(user.id);
            const device = new Device(token, {
                logLevel: 1,
                codecPreferences: ['opus', 'pcmu'] as Call.Codec[],
                edge: ['ashburn', 'dublin'],
            });

            device.on('registered', () => {
                setIsReady(true);
                setCallState('idle');
                console.log('Twilio Device is registered and ready.');
            });

            device.on('tokenWillExpire', async (deviceInstance) => {
              console.log('Twilio token is about to expire. Fetching a new one.');
              const newToken = await generateTwilioToken(user.id);
              deviceInstance.updateToken(newToken);
            });
            
            device.on('incoming', (incCall) => {
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

            device.on('registering', () => console.log('Twilio Device is registering...'));
            device.on('unregistered', () => {
                console.log('Twilio Device is unregistered.');
                if (deviceRef.current) deviceRef.current.destroy();
                deviceRef.current = null;
                setIsReady(false);
            });

            device.on('error', (err) => {
                setIsReady(false);
                setCallState('error');
                setError(err.message);
                console.error('Twilio Device Error:', err);
                setShowDialer(true);
            });
            
            await device.register();
            deviceRef.current = device;
        } catch (err: any) {
            console.error('Error setting up Twilio Device:', err);
            setError(err.message || 'Could not initialize phone. Please refresh.');
            setCallState('error');
            setShowDialer(true);
        }
    };
    
    initializeDevice();

    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
      }
      setIsReady(false);
      setCallState('idle');
    };
  }, [user?.id, toast, cleanupCall]);

  const initiateCall = useCallback(async (phoneNumber: string) => {
    const numberToCall = phoneNumber;

    if (!numberToCall || !numberToCall.startsWith('+')) {
        console.error("Dialer Error: Phone number must be in E.164 format (e.g., +15551234567).");
        setError("Invalid number format. Phone number must start with a '+' and country code.");
        setCallState('error');
        setShowDialer(true);
        return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err: any) {
      console.error("Microphone permission was not granted.", err);
      setError('Microphone access denied. Please enable microphone permissions in your browser settings to make calls.');
      setCallState('error');
      setShowDialer(true);
      return;
    }

    if (!deviceRef.current || !isReady) {
        setError('Phone is not ready. Please refresh the page and try again.');
        setCallState('error');
        setShowDialer(true);
        return;
    }
    
    setNumberToDial(numberToCall);
    setShowDialer(true);
    setCallState('connecting');
    setError(null);

    try {
        const call = await deviceRef.current.connect({ params: { To: numberToCall } });
        setCurrentCall(call);
        handleTracks(call);
        
        call.on('ringing', () => setCallState('ringing'));
        call.on('accept', () => setCallState('connected'));
        call.on('disconnect', cleanupCall);
        call.on('cancel', cleanupCall);
        call.on('error', (err) => {
            setError(err.message);
            setCallState('error');
            setShowDialer(true);
        });
    } catch (err: any) {
        console.error('Call failed to connect:', err);
        setError(err.message);
        setCallState('error');
        setShowDialer(true);
    }
  }, [isReady, cleanupCall, handleTracks]);
  
  const acceptCall = useCallback(async () => {
    if (!incomingCall) return;
    
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        incomingCall.accept();
        setCurrentCall(incomingCall);
        setCallState('connected');
        handleTracks(incomingCall);
        setIncomingCall(null);
    } catch(err) {
        console.error("Microphone permission was not granted for incoming call.", err);
        setError('Microphone access denied. Please enable microphone permissions to receive calls.');
        setCallState('error');
        setShowDialer(true);
        incomingCall.reject();
        cleanupCall();
    }
  }, [incomingCall, handleTracks, cleanupCall]);

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
    if (deviceRef.current) {
        deviceRef.current.disconnectAll();
    }
    cleanupCall();
  }, [currentCall, cleanupCall]);

  const value = {
    isReady,
    callState,
    error,
    initiateCall,
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
