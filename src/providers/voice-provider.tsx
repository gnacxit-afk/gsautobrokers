'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { useUser } from '@/firebase';
import { generateTwilioToken } from '@/ai/flows/generate-twilio-token';
import { useToast } from '@/hooks/use-toast';

// Define the singleton at the module level.
// This will persist across hot reloads in development.
let deviceSingleton: Device | null = null;

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
  
  const [currentCall, setCurrentCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'ringing' | 'connected' | 'incoming' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const [showDialer, setShowDialer] = useState(false);
  const [numberToDial, setNumberToDial] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const deviceRef = useRef<Device | null>(null);

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
    const setupDevice = async (userId: string) => {
      try {
        const token = await generateTwilioToken(userId);
        
        if (!deviceSingleton) {
          console.log("Creating new Twilio Device instance.");
          deviceSingleton = new Device(token, {
            logLevel: 1,
            codecPreferences: ['opus', 'pcmu'] as Call.Codec[],
            edge: ['ashburn', 'dublin'],
          });

          deviceSingleton.on('registered', () => {
            setIsReady(true);
            setCallState('idle');
            console.log('Twilio Device is registered and ready.');
          });

          deviceSingleton.on('tokenWillExpire', async (deviceInstance) => {
            console.log('Twilio token is about to expire. Fetching a new one.');
            if (user?.id) {
              const newToken = await generateTwilioToken(user.id);
              deviceInstance.updateToken(newToken);
            }
          });
          
          deviceSingleton.on('incoming', (incCall) => {
            console.log('Incoming call from', incCall.parameters.From);
            toast({ title: "Incoming Call", description: `From: ${incCall.parameters.From}` });
            setIncomingCall(incCall);
            setCallState('incoming');
            setShowDialer(true);
            setNumberToDial(incCall.parameters.From);
            incCall.on('disconnect', cleanupCall);
            incCall.on('cancel', cleanupCall);
          });
          
          deviceSingleton.on('unregistered', () => {
            console.log('Twilio Device is unregistered.');
            setIsReady(false);
          });
          
          deviceSingleton.on('error', (err) => {
            setIsReady(false);
            setCallState('error');
            setError(err.message);
            console.error('Twilio Device Error:', err);
            setShowDialer(true);
          });

          await deviceSingleton.register();
        } else {
            console.log("Twilio Device singleton exists. Updating token.");
            deviceSingleton.updateToken(token);
            if(deviceSingleton.state === 'registered') setIsReady(true);
        }

        deviceRef.current = deviceSingleton;

      } catch (err: any) {
        console.error('Error setting up Twilio Device:', err);
        setError(err.message || 'Could not initialize phone. Please refresh.');
        setCallState('error');
        setShowDialer(true);
      }
    };

    if (user?.id) {
      setupDevice(user.id);
    } else {
      if (deviceSingleton) {
        deviceSingleton.destroy();
        deviceSingleton = null;
      }
      deviceRef.current = null;
      setIsReady(false);
    }
  }, [user?.id, toast, cleanupCall]);

  const initiateCall = useCallback(async (phoneNumber: string) => {
    if (!phoneNumber || !phoneNumber.startsWith('+')) {
        setError("Invalid number format. Must use E.164 format (e.g., +1...).");
        setCallState('error');
        setShowDialer(true);
        return;
    }
    if (!deviceRef.current || !isReady) {
        setError('Phone is not ready. Please wait or refresh the page.');
        setCallState('error');
        setShowDialer(true);
        return;
    }

    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      setError('Microphone access denied. Please enable microphone permissions.');
      setCallState('error');
      setShowDialer(true);
      return;
    }
    
    setNumberToDial(phoneNumber);
    setShowDialer(true);
    setCallState('connecting');
    setError(null);

    try {
        const call = await deviceRef.current.connect({ params: { To: phoneNumber } });
        setCurrentCall(call);
        handleTracks(call);
        call.on('ringing', () => setCallState('ringing'));
        call.on('accept', () => setCallState('connected'));
        call.on('disconnect', cleanupCall);
        call.on('cancel', cleanupCall);
        call.on('error', (err) => {
            setError(err.message);
            setCallState('error');
        });
    } catch (err: any) {
        setError(err.message);
        setCallState('error');
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
        setError('Microphone access denied. Please enable microphone permissions.');
        setCallState('error');
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
    currentCall?.disconnect();
    cleanupCall();
  }, [currentCall, cleanupCall]);

  const value = { isReady, callState, error, initiateCall, acceptCall, rejectCall, hangupCall, currentCall, showDialer, numberToDial };

  return (
    <VoiceContext.Provider value={value}>
      {children}
      <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
    </VoiceContext.Provider>
  );
}
