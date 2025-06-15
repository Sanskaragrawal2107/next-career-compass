
import { useState, useRef, useCallback } from 'react';

export interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Check if Web Speech API is supported
  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    try {
      setError(null);
      
      // Clean up any existing recognition
      cleanup();

      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        retryCountRef.current = 0;
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        // Handle different types of errors
        switch (event.error) {
          case 'network':
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              setError(`Network error - retrying (${retryCountRef.current}/${maxRetries})...`);
              // Retry after a short delay
              setTimeout(() => {
                if (!isListening) return; // Don't retry if user stopped manually
                startListening();
              }, 2000);
              return;
            } else {
              setError('Network connection failed. Please check your internet connection and try again.');
            }
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access and try again.');
            break;
          case 'no-speech':
            setError('No speech detected. Please try speaking again.');
            break;
          case 'audio-capture':
            setError('No microphone found. Please connect a microphone and try again.');
            break;
          case 'aborted':
            // Don't show error for user-initiated stops
            return;
          default:
            setError(`Speech recognition error: ${event.error}. Please try again.`);
        }
        
        cleanup();
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // Only auto-restart if it wasn't manually stopped and there was no error
        if (isListening && !error && retryCountRef.current === 0) {
          console.log('Auto-restarting speech recognition...');
          setTimeout(() => {
            if (isListening) {
              startListening();
            }
          }, 100);
        } else {
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      setError('Failed to start speech recognition. Please try again.');
      cleanup();
    }
  }, [isSupported, cleanup, isListening, error]);

  const stopListening = useCallback(() => {
    console.log('Manually stopping speech recognition');
    cleanup();
    setError(null);
  }, [cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error
  };
};
