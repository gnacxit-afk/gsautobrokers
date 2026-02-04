
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Device, Call } from '@twilio/voice-sdk';
import { generateTwilioToken } from '@/ai/flows/generate-twilio-token';
import { useUser } from '@/firebase';

type CallState = 'idle' | 'connecting' | 'active' | 'error';

interface VoiceContextType {
  callState: CallState;
  initiateCall: (phoneNumber: string) => void;
  hangUp: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [device, setDevice] = useState<Device | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const deviceRef = useRef<Device | null>(null);

  useEffect(() => {
    // Only initialize if we have a user and haven't initialized before.
    if (user?.id && !deviceRef.current) {
      const initializeDevice = async () => {
        try {
          const token = await generateTwilioToken(user.id);
          const newDevice = new Device(token, {
            logLevel: 1,
            codecPreferences: ['opus', 'pcmu'],
          });

          newDevice.on('ready', () => {
            console.log('Twilio Voice SDK is ready.');
            deviceRef.current = newDevice;
            setDevice(newDevice); // Update state for consumers
          });

          newDevice.on('connect', (call) => {
            setCallState('active');
            setActiveCall(call);
            console.log('Call connected.');
          });

          newDevice.on('disconnect', () => {
            setCallState('idle');
            setActiveCall(null);
            console.log('Call disconnected.');
          });

          newDevice.on('error', (error) => {
            console.error('Twilio Voice SDK Error:', error);
            setCallState('error');
          });

          newDevice.register();
        } catch (error) {
          console.error("Failed to initialize Twilio Voice SDK:", error);
          setCallState('error');
        }
      };
      initializeDevice();
    }

    // Cleanup on unmount or user change
    return () => {
      if (deviceRef.current) {
        deviceRef.current.destroy();
        deviceRef.current = null;
        setDevice(null);
        setActiveCall(null);
        setCallState('idle');
      }
    };
  }, [user?.id]); // Depend only on the user's ID

  const initiateCall = useCallback(async (phoneNumber: string) => {
    if (!device) {
      console.error("Twilio device not ready.");
      setCallState('error');
      return;
    }
    setCallState('connecting');
    try {
      const call = await device.connect({ params: { To: phoneNumber } });
      setActiveCall(call);
    } catch (error) {
      console.error("Failed to initiate call:", error);
      setCallState('error');
    }
  }, [device]);
  
  const hangUp = useCallback(() => {
      if(activeCall) {
          activeCall.disconnect();
      }
  }, [activeCall]);

  const value = { callState, initiateCall, hangUp };

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
