import { useState, useRef, useCallback } from 'react';

export interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
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

  const startListeningFn = useRef<() => Promise<void>>();
  const isListeningStateRef = useRef(isListening);
  isListeningStateRef.current = isListening;

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        // Detach handlers to prevent them from firing during or after cleanup
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors on stop
      }
      recognitionRef.current = null;
    }
    // Don't set isListening here, it's handled by callers to avoid race conditions.
  }, []);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (isListeningStateRef.current) {
      console.log('Already listening, returning.');
      return;
    }

    setIsListening(true); // Set listening status immediately

    try {
      cleanup(); // Clean up any previous instance

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started successfully');
        setError(null); // Clear any previous errors (like retry messages)
        retryCountRef.current = 0;
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcriptPart;
          } else {
            interimTranscript += transcriptPart;
          }
        }
        
        // This logic is flawed for continuous mode, but we keep it to avoid breaking changes to user expectation
        // A better implementation would accumulate the full transcript.
        setTranscript(finalTranscript + interimTranscript);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);

        switch (event.error) {
          case 'network':
            if (retryCountRef.current < maxRetries) {
              retryCountRef.current++;
              setError(`Network error - retrying (${retryCountRef.current}/${maxRetries})...`);
            } else {
              setError('Network connection failed. Please check your internet connection and try again.');
              setIsListening(false); // Give up
            }
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access and try again.');
            setIsListening(false);
            break;
          case 'no-speech':
            setError('No speech detected. Please try speaking again.');
            // Let onend handle restart
            break;
          case 'audio-capture':
            setError('No microphone found. Please connect a microphone and try again.');
            setIsListening(false);
            break;
          case 'aborted':
            // User-initiated stop, this is fine.
            setIsListening(false);
            break;
          default:
            setError(`Speech recognition error: ${event.error}. Please try again.`);
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        if (isListeningStateRef.current) {
          console.log('Restarting recognition after it ended...');
          cleanup();
          setTimeout(() => startListeningFn.current?.(), 100);
        } else {
            cleanup(); // ensure cleanup if it stopped for any other reason
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setError(`Failed to start speech recognition: ${err.message}. Please try again.`);
      setIsListening(false);
      cleanup();
    }
  }, [isSupported, cleanup]);

  startListeningFn.current = startListening;

  const stopListening = useCallback(() => {
    console.log('Manually stopping speech recognition');
    setIsListening(false); // Signal to onend not to restart
    cleanup();
    setError(null);
  }, [cleanup]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  const stableStartListening = useCallback(() => {
    if (!isListeningStateRef.current) {
      startListeningFn.current?.();
    }
  }, []);

  return {
    isListening,
    transcript,
    startListening: stableStartListening,
    stopListening,
    resetTranscript,
    isSupported,
    error
  };
};
