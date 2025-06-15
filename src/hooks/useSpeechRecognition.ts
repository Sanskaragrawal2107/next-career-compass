
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
  const finalTranscriptRef = useRef('');

  const isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  
  const isListeningStateRef = useRef(isListening);
  isListeningStateRef.current = isListening;

  const cleanup = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onstart = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors on stop, which can happen if not running
      }
      recognitionRef.current = null;
    }
  }, []);

  const coreStart = useCallback(async () => {
    cleanup();

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Speech recognition started successfully');
        setError(null);
        retryCountRef.current = 0;
      };

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscriptResult = finalTranscriptRef.current;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscriptResult += transcriptPart + ' ';
          } else {
            interimTranscript += transcriptPart;
          }
        }
        finalTranscriptRef.current = finalTranscriptResult;
        setTranscript(finalTranscriptResult + interimTranscript);
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
              setIsListening(false);
            }
            break;
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone access and try again.');
            setIsListening(false);
            break;
          case 'no-speech':
            console.log('No speech detected. The service will restart.');
            break;
          case 'audio-capture':
            setError('No microphone found. Please connect a microphone and try again.');
            setIsListening(false);
            break;
          case 'aborted':
            console.log('Speech recognition aborted.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}. Please try again.`);
            setIsListening(false);
        }
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        if (isListeningStateRef.current) {
          console.log('Restarting recognition...');
          setTimeout(() => coreStart(), 100);
        } else {
          cleanup();
        }
      };

      recognition.start();
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setError(`Failed to start speech recognition: ${err.message}. Please try again.`);
      setIsListening(false);
      cleanup();
    }
  }, [cleanup]);

  const startListening = useCallback(() => {
    if (isListeningStateRef.current || !isSupported) {
      return;
    }
    setError(null);
    setIsListening(true);
    coreStart();
  }, [isSupported, coreStart]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    cleanup();
  }, [cleanup]);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
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
    error,
  };
};
