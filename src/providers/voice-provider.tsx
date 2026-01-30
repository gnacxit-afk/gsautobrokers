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

  const cleanupCall = useCallback(() => {
    setCurrentCall(null);
    setCallState('idle');
  }, []);
  
  const setupDevice = useCallback((token: string) => {
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
    
    // IMPORTANT: On disconnect, we just mark as not ready, but don't destroy the device instance here.
    // This prevents the setup useEffect from re-triggering in a loop.
    newDevice.on('disconnect', () => {
        console.log('Twilio device transport disconnected.');
        setIsReady(false);
    });

    newDevice.register();
    return newDevice;
  }, []); // Dependencies are state setters, so this is stable.


  // This effect handles the lifecycle of the device: creation and destruction.
  useEffect(() => {
    // This variable will hold the device instance for the scope of this effect
    let deviceInstance: Device | null = null;
    
    const initialize = async () => {
      if (user?.id) {
        try {
          const token = await generateTwilioToken(user.id);
          deviceInstance = setupDevice(token);
          setDevice(deviceInstance);
        } catch (err: any) {
          console.error('Error setting up Twilio Device:', err);
          setError(err.message || 'Could not initialize phone. Please refresh.');
          setCallState('error');
        }
      }
    };
    
    // Only initialize when user is loaded and we haven't created a device yet.
    if (!userLoading && user && !device) {
      initialize();
    }

    // The cleanup function will be called when the component unmounts or when the dependencies (user, userLoading) change.
    return () => {
      if (deviceInstance) {
        deviceInstance.destroy();
        setDevice(null);
        setIsReady(false);
        setCallState('idle');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  const makeCall = useCallback(async (phoneNumber: string) => {
    if (!device || !isReady) {
        setError('Phone is not ready. Please wait or refresh the page.');
        setCallState('error');
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
  }, [device, isReady, cleanupCall]);

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
