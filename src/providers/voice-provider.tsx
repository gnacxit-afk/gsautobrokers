'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Device } from '@twilio/voice-sdk';
import { useUser } from '@/firebase';
import { generateTwilioToken } from '@/ai/flows/generate-twilio-token';
import { useToast } from '@/hooks/use-toast';

interface VoiceContextType {
  isReady: boolean;
  callState: 'idle' | 'connecting' | 'ringing' | 'connected' | 'error';
  error: string | null;
  initiateCall: (phoneNumber: string) => void;
  connectCall: () => void;
  hangupCall: () => void;
  currentCall: any | null;
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
  const [currentCall, setCurrentCall] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [callState, setCallState] = useState<'idle' | 'connecting' | 'ringing' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const [showDialer, setShowDialer] = useState(false);
  const [numberToDial, setNumberToDial] = useState<string | null>(null);

  const cleanupCall = useCallback(() => {
    setCurrentCall(null);
    setCallState('idle');
    setShowDialer(false);
    setNumberToDial(null);
  }, []);
  
  useEffect(() => {
    let deviceInstance: Device | null = null;
    
    if (user?.id) {
        const initialize = async () => {
            try {
                const token = await generateTwilioToken(user.id);
                deviceInstance = new Device(token, {
                    logLevel: 1,
                    codecPreferences: ['opus', 'pcmu'],
                });

                deviceInstance.on('registered', () => {
                    setIsReady(true);
                    setCallState('idle');
                    console.log('Twilio Device is registered and ready.');
                });

                deviceInstance.on('registering', () => {
                    console.log('Twilio Device is registering...');
                });

                deviceInstance.on('unregistered', () => {
                    console.log('Twilio Device is unregistered.');
                    if (deviceInstance) {
                        deviceInstance.destroy();
                    }
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
                setError(err.message || 'Could not initialize phone. Please refresh.');
                setCallState('error');
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
  }, [user?.id]);


  const initiateCall = useCallback((phoneNumber: string) => {
    const phoneRegex = /^\+1\d{10}$/;
    if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
        toast({
            title: "Invalid Number",
            description: "Phone number must be in the format +1XXXXXXXXXX for US calls.",
            variant: "destructive",
        });
        return;
    }
    setNumberToDial(phoneNumber);
    setShowDialer(true);
    setCallState('idle');
    setError(null);
  }, [toast]);

  const connectCall = useCallback(async () => {
    if (!device || !isReady || !numberToDial) {
        setError('Phone is not ready or number is missing.');
        setCallState('error');
        setShowDialer(true);
        return;
    }

    setCallState('connecting');
    setError(null);
    try {
        const call = await device.connect({ params: { To: numberToDial } });
        setCurrentCall(call);

        call.on('ringing', () => setCallState('ringing'));
        call.on('accept', () => setCallState('connected'));
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
  }, [device, isReady, numberToDial, cleanupCall]);

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
    hangupCall,
    currentCall,
    showDialer,
    numberToDial,
  };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}
