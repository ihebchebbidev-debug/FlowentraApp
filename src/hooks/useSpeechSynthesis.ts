// Speech Synthesis Hook - Uses Web Speech API for text-to-speech
import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechSynthesisHook {
  isSpeaking: boolean;
  isSupported: boolean;
  isPaused: boolean;
  error: string | null;
  speak: (text: string, language?: string) => void;
  stop: () => void;
  pause: () => void;
  resume: () => void;
}

export const useSpeechSynthesis = (): SpeechSynthesisHook => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check if Web Speech API is supported
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Clean text for better speech (remove markdown, links, etc.)
  const cleanTextForSpeech = useCallback((text: string): string => {
    return text
      // Remove markdown links [text](url) -> text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove markdown bold/italic
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      // Remove markdown code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown headers
      .replace(/^#+\s+/gm, '')
      // Remove markdown list markers
      .replace(/^[-*]\s+/gm, '')
      .replace(/^\d+\.\s+/gm, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }, []);

  // Get appropriate voice for language
  const getVoice = useCallback((language: string): SpeechSynthesisVoice | null => {
    if (!isSupported) return null;
    
    const voices = window.speechSynthesis.getVoices();
    const langCode = language.startsWith('fr') ? 'fr' : 'en';
    
    // Try to find a native voice for the language
    const preferredVoice = voices.find(voice => 
      voice.lang.startsWith(langCode) && voice.localService
    );
    
    // Fallback to any voice for the language
    const anyVoice = voices.find(voice => voice.lang.startsWith(langCode));
    
    return preferredVoice || anyVoice || null;
  }, [isSupported]);

  // Speak text
  const speak = useCallback((text: string, language: string = 'en-US') => {
    if (!isSupported) {
      setError('Speech synthesis is not supported in this browser.');
      return;
    }

    // Stop any current speech
    window.speechSynthesis.cancel();
    setError(null);

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) {
      setError('No text to speak.');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    // Set language
    utterance.lang = language;
    
    // Try to get a voice for this language
    const voice = getVoice(language);
    if (voice) {
      utterance.voice = voice;
    }

    // Configure speech settings
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Event handlers
    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event.error);
      setIsSpeaking(false);
      setIsPaused(false);
      
      // Don't show error for user-initiated stops (canceled, interrupted)
      if (event.error !== 'canceled' && event.error !== 'interrupted') {
        setError(`Speech error: ${event.error}`);
      }
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    // Start speaking
    window.speechSynthesis.speak(utterance);
  }, [isSupported, cleanTextForSpeech, getVoice]);

  // Stop speaking
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  // Pause speaking
  const pause = useCallback(() => {
    if (isSupported && isSpeaking) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, [isSupported, isSpeaking]);

  // Resume speaking
  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, [isSupported, isPaused]);

  // Load voices (some browsers load them asynchronously)
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    isPaused,
    error,
    speak,
    stop,
    pause,
    resume
  };
};

export default useSpeechSynthesis;
