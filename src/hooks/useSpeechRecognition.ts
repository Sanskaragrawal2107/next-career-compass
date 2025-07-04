import { useState, useRef, useCallback, useEffect } from 'react';

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
  
  const voskRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const shouldBeListeningRef = useRef(false);

  // Check if browser supports the required APIs
  const isSupported = typeof window !== 'undefined' && 
                     'MediaRecorder' in window &&
                     'AudioContext' in window &&
                     'WebAssembly' in window;

  const startListening = useCallback(async () => {
    if (isListening || !isSupported) {
      console.log('Already listening or not supported');
      return;
    }

    try {
      console.log('Starting Vosk speech recognition...');
      setError(null);
      setIsLoading(true);
      shouldBeListeningRef.current = true;

      // Dynamic import of Vosk
      const { createModel } = await import('vosk-browser');

      // Load the English model (small size for faster loading)
      const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
      console.log('Loading Vosk model...');
      
      const model = await createModel(modelUrl);
      console.log('✅ Vosk model loaded');
      
      const recognizer = new model.KaldiRecognizer(16000);
      voskRef.current = recognizer;

      // Set up event listeners for recognition results
      recognizer.on("result", (message: any) => {
        if (message.result.text && message.result.text.trim()) {
          console.log('Vosk result:', message.result.text);
          setTranscript(prev => {
            const newTranscript = prev + ' ' + message.result.text.trim();
            return newTranscript.trim();
          });
        }
      });

      recognizer.on("partialresult", (message: any) => {
        if (message.result.partial && message.result.partial.trim()) {
          console.log('Vosk partial:', message.result.partial);
          // Optionally handle partial results for real-time feedback
        }
      });

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      mediaStreamRef.current = stream;
      console.log('✅ Microphone access granted');

      // Create audio context
      const audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (event) => {
        if (!shouldBeListeningRef.current || !voskRef.current) return;

        try {
          recognizer.acceptWaveform(event.inputBuffer);
        } catch (error) {
          console.error('acceptWaveform failed', error);
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      // Store cleanup references
      voskRef.current._cleanup = () => {
        processor.disconnect();
        source.disconnect();
        audioContext.close();
      };

      setIsLoading(false);
      setIsListening(true);
      console.log('✅ Vosk speech recognition started');

    } catch (err: any) {
      console.error('❌ Error starting Vosk speech recognition:', err);
      setError(`Failed to start: ${err.message}`);
      setIsLoading(false);
      shouldBeListeningRef.current = false;
      
      // Cleanup on error
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    console.log('Stopping Vosk speech recognition...');
    shouldBeListeningRef.current = false;
    
    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    // Cleanup Vosk recognizer
    if (voskRef.current && voskRef.current._cleanup) {
      voskRef.current._cleanup();
    }
    voskRef.current = null;
    
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
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (voskRef.current && voskRef.current._cleanup) {
        voskRef.current._cleanup();
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