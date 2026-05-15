// Speech Recognition Hook - Uses Web Speech API for voice input
import { useState, useCallback, useEffect, useRef } from 'react';

interface SpeechRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  finalTranscript: string;
  error: string | null;
  startListening: (language?: string) => void;
  stopListening: (immediate?: boolean) => void;
  resetTranscript: () => void;
}

// Extend Window interface for Speech Recognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const shouldRestartRef = useRef<boolean>(false);
  const languageRef = useRef<string>('en-US');

  // Check if Web Speech API is supported
  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize speech recognition
  const initRecognition = useCallback((language: string = 'en-US') => {
    if (!isSupported) return null;

    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    
    const recognition = new SpeechRecognition();
    
    // Configure recognition
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      finalTranscriptRef.current = '';
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't manually stopped
      if (shouldRestartRef.current) {
        try {
          recognition.start();
          return; // Don't set isListening to false, we're restarting
        } catch (e) {
          console.error('Failed to restart speech recognition:', e);
        }
      }
      
      setIsListening(false);
      // Set the final transcript when recognition ends
      if (finalTranscriptRef.current) {
        setFinalTranscript(finalTranscriptRef.current);
        setTranscript(finalTranscriptRef.current);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      
      switch (event.error) {
        case 'not-allowed':
          setError('Microphone access denied. Please allow microphone permissions.');
          break;
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'network':
          setError('Network error. Please check your connection.');
          break;
        case 'aborted':
          // User stopped, not an error - still update final transcript
          if (finalTranscriptRef.current) {
            setFinalTranscript(finalTranscriptRef.current);
            setTranscript(finalTranscriptRef.current);
          }
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = '';
      let interimText = '';

      // Only process results from the current result index onwards
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        
        if (result.isFinal) {
          // Append final results to our accumulated final transcript
          finalTranscriptRef.current += transcript;
          setFinalTranscript(finalTranscriptRef.current);
        } else {
          // Interim results are temporary and get replaced
          interimText += transcript;
        }
      }

      // Display is: all accumulated finals + current interim
      const displayTranscript = finalTranscriptRef.current + interimText;
      setTranscript(displayTranscript);
    };

    return recognition;
  }, [isSupported]);

  // Start listening
  const startListening = useCallback((language: string = 'en-US') => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Stop any existing recognition
    shouldRestartRef.current = false; // Prevent auto-restart during stop
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    // Reset transcripts when starting new session
    setTranscript('');
    setFinalTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
    languageRef.current = language;
    shouldRestartRef.current = true; // Enable auto-restart

    // Create new recognition instance
    const recognition = initRecognition(language);
    if (recognition) {
      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        setError('Failed to start speech recognition. Please try again.');
        shouldRestartRef.current = false;
      }
    }
  }, [isSupported, initRecognition]);

  // Stop listening - use immediate=true for instant browser-level termination
  const stopListening = useCallback((immediate: boolean = false) => {
    shouldRestartRef.current = false; // Disable auto-restart
    if (recognitionRef.current) {
      try {
        if (immediate) {
          // abort() immediately stops recognition without processing remaining audio
          recognitionRef.current.abort();
        } else {
          // stop() allows final results to be processed
          recognitionRef.current.stop();
        }
      } catch (e) {
        // Ignore errors when stopping
      }
      // Nullify the reference to ensure browser releases the microphone
      recognitionRef.current = null;
      setIsListening(false);
      
      // Ensure final transcript is set
      if (finalTranscriptRef.current) {
        setFinalTranscript(finalTranscriptRef.current);
        setTranscript(finalTranscriptRef.current);
      }
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    finalTranscriptRef.current = '';
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    transcript,
    finalTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  };
};

export default useSpeechRecognition;
