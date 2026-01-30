
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Device } from '@twilio/voice-sdk';
import { useUser } from '@/firebase';
import { generateTwilioToken } from '@/ai/flows/generate-twilio-token';

interface VoiceContextType {
  isReady: boolean;
  callState: 'idle' | 'connecting' | 'ringing' | 'connected' | 'error';
  error: string | null;
  makeCall: (phoneNumber: string) => void;
  hangupCall: () => void;
  currentCall: any | null; // Twilio Call object
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
  const { user, loading: userLoading } = useUser();
  const [device, setDevice] = useState<Device | null>(null);
  const [currentCall, setCurrentCall] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'ringing' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const setupDevice = useCallback(async (token: string) => {
    const newDevice = new Device(token, {
      logLevel: 1,
      codecPreferences: ['opus', 'pcmu'],
    });

    newDevice.on('ready', () => {
      setIsReady(true);
      setCallState('idle');
      console.log('Twilio Device is ready.');
    });

    newDevice.on('error', (err) => {
      setIsReady(false);
      setCallState('error');
      setError(err.message);
      console.error('Twilio Device Error:', err);
    });
    
    newDevice.on('disconnect', () => {
        setIsReady(false);
        setDevice(null);
    });

    await newDevice.register();
    setDevice(newDevice);
  }, []);
  
  const getTokenAndSetupDevice = useCallback(async () => {
    if (!user || !user.id || device) return;
    try {
      const result = await generateTwilioToken({ identity: user.id });
      await setupDevice(result.token);
    } catch (err: any) {
      console.error('Error getting Twilio token or setting up device:', err);
      setError(err.message || 'Could not initialize phone. Please refresh.');
      setCallState('error');
    }
  }, [user, device, setupDevice]);

  useEffect(() => {
    // Only attempt to set up the device if we are done loading the user,
    // a user object exists, and the device hasn't been set up yet.
    if (!userLoading && user && !device) {
      getTokenAndSetupDevice();
    }
    
    return () => {
      device?.disconnectAll();
      device?.destroy();
      setDevice(null);
      setIsReady(false);
    };
  }, [user, userLoading, device, getTokenAndSetupDevice]);
  
   const cleanupCall = useCallback(() => {
    setCurrentCall(null);
    setCallState('idle');
  }, []);

  const makeCall = useCallback(async (phoneNumber: string) => {
    if (!device || !isReady) {
        setError('Phone is not ready. Trying to reconnect...');
        await getTokenAndSetupDevice(); // Attempt to re-establish connection
        return;
    }

    setCallState('connecting');
    try {
        const call = await device.connect({ params: { To: phoneNumber } });
        setCurrentCall(call);

        call.on('ringing', () => setCallState('ringing'));
        call.on('accept', () => setCallState('connected'));
        call.on('disconnect', cleanupCall);
        call.on('cancel', cleanupCall);
        call.on('error', (err) => {
            setError(err.message);
            setCallState('error');
            cleanupCall();
        });

    } catch (err: any) {
        console.error('Call failed to connect:', err);
        setError(err.message);
        setCallState('error');
        cleanupCall();
    }
  }, [device, isReady, cleanupCall, getTokenAndSetupDevice]);

  const hangupCall = useCallback(() => {
    if (currentCall) {
      currentCall.disconnect();
      cleanupCall();
    }
  }, [currentCall, cleanupCall]);

  const value = {
    isReady,
    callState,
    error,
    makeCall,
    hangupCall,
    currentCall
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
