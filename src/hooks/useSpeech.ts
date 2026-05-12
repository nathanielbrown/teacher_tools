import { useCallback } from 'react';
import { speak, speakAsync } from '../utils/speech';

/**
 * Hook for using the standardized speech system in React components.
 */
export const useSpeech = () => {
  const speakText = useCallback((text: string, rate?: number) => {
    speak(text, rate);
  }, []);

  const speakTextAsync = useCallback(async (text: string, rate?: number) => {
    return speakAsync(text, rate);
  }, []);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return {
    speak: speakText,
    speakAsync: speakTextAsync,
    cancel
  };
};
