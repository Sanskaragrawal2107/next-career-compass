import { useState, useRef, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
  isLoading: boolean;
}

export const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const shouldBeListeningRef = useRef(false);

  // Check if Web Speech API is supported
  const isSupported = typeof window !== 'undefined' && 
                     ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(async () => {
    if (isListening || !isSupported) {
      console.log('Already listening or not supported');
      return;
    }

    try {
      console.log('Starting Web Speech API transcription...');
      setError(null);
      setIsLoading(true);
      shouldBeListeningRef.current = true;

      // Create speech recognition instance
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        console.log('✅ Speech recognition started');
        setIsLoading(false);
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          console.log('Final transcript:', finalTranscript);
          setTranscript(prev => {
            const newTranscript = prev + ' ' + finalTranscript.trim();
            return newTranscript.trim();
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.error('❌ Speech recognition error:', event.error);
        setIsLoading(false);
        
        switch (event.error) {
          case 'no-speech':
            setError('No speech detected. Please speak into the microphone.');
            break;
          case 'audio-capture':
            setError('No microphone found or permission denied.');
            break;
          case 'not-allowed':
            setError('Microphone permission denied. Please allow microphone access.');
            break;
          case 'network':
            setError('Network error. Please check your internet connection.');
            break;
          case 'service-not-allowed':
            setError('Speech recognition service not allowed.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }
        
        setIsListening(false);
        shouldBeListeningRef.current = false;
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
        
        // Restart if we should still be listening
        if (shouldBeListeningRef.current) {
          console.log('Restarting speech recognition...');
          setTimeout(() => {
            if (shouldBeListeningRef.current) {
              recognition.start();
            }
          }, 100);
        }
      };

      // Start recognition
      recognition.start();

    } catch (err: any) {
      console.error('❌ Error starting speech recognition:', err);
      setError(`Failed to start: ${err.message}`);
      setIsLoading(false);
      shouldBeListeningRef.current = false;
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    console.log('Stopping speech recognition...');
    shouldBeListeningRef.current = false;
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('Error stopping speech recognition:', err);
      }
      recognitionRef.current = null;
    }
    
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    console.log('Resetting transcript');
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  return {
    isListening,
    transcript: transcript.trim(),
    startListening,
    stopListening,
    resetTranscript,
    isSupported,
    error,
    isLoading,
  };
};