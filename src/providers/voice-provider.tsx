
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Device } from '@twilio/voice-sdk';
import { generateTwilioToken } from '@/ai/flows/generate-twilio-token';
import { useUser } from '@/firebase';

type CallState = 'idle' | 'connecting' | 'active' | 'error';

interface VoiceContextType {
  callState: CallState;
  initiateCall: (phoneNumber: string) => void;
  // We can add hangUp, etc. later if needed
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [device, setDevice] = useState<Device | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');

  const initializeDevice = useCallback(async () => {
    if (!user) return;

    try {
      const token = await generateTwilioToken(user.id);
      const newDevice = new Device(token, {
        logLevel: 1, // 0: errors, 1: warnings, 2: info, 3: debug
        codecPreferences: ['opus', 'pcmu'],
      });

      newDevice.on('ready', () => {
        console.log('Twilio Voice SDK is ready.');
        setDevice(newDevice);
      });

      newDevice.on('connect', () => {
        setCallState('active');
        console.log('Call connected.');
      });

      newDevice.on('disconnect', () => {
        setCallState('idle');
        console.log('Call disconnected.');
      });

      newDevice.on('error', (error) => {
        console.error('Twilio Voice SDK Error:', error);
        setCallState('error');
      });

      // Register the device to listen for incoming connections.
      newDevice.register();

    } catch (error) {
      console.error("Failed to initialize Twilio Voice SDK:", error);
      setCallState('error');
    }
  }, [user]);

  useEffect(() => {
    if (user && !device) {
      initializeDevice();
    }
    
    // Cleanup on unmount
    return () => {
      device?.destroy();
      setDevice(null);
    };
  }, [user, device, initializeDevice]);

  const initiateCall = useCallback(async (phoneNumber: string) => {
    if (!device) {
      console.error("Twilio device not ready.");
      setCallState('error');
      return;
    }
    setCallState('connecting');
    try {
      await device.connect({ params: { To: phoneNumber } });
    } catch (error) {
      console.error("Failed to initiate call:", error);
      setCallState('error');
    }
  }, [device]);

  const value = { callState, initiateCall };

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
