
import { useState, useRef, useCallback, useEffect } from 'react';

// Import Vosk types
declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

export interface VoskSpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
  isLoading: boolean;
}

export const useVoskSpeechRecognition = (): VoskSpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const modelRef = useRef<any>(null);
  const recognizerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isSupported = typeof navigator !== 'undefined' && 
                     'mediaDevices' in navigator && 
                     'getUserMedia' in navigator.mediaDevices;

  const initializeVosk = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Dynamically import Vosk
      const { createModel, Model } = await import('vosk-browser');
      
      // Load the model (using a small English model)
      const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
      modelRef.current = await createModel(modelUrl);
      
      // Create recognizer using the Model constructor
      recognizerRef.current = new Model(modelRef.current, 16000);
      
      setIsLoading(false);
      return true;
    } catch (err: any) {
      console.error('Failed to initialize Vosk:', err);
      setError(`Failed to initialize speech recognition: ${err.message}`);
      setIsLoading(false);
      return false;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || !isSupported) return;

    try {
      setError(null);
      
      // Initialize Vosk if not already done
      if (!recognizerRef.current) {
        const initialized = await initializeVosk();
        if (!initialized) return;
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        }
      });

      streamRef.current = stream;

      // Create audio context
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      // Create script processor for audio processing
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      processorRef.current.onaudioprocess = (event) => {
        if (!recognizerRef.current || !isListening) return;
        
        const inputBuffer = event.inputBuffer;
        const inputData = inputBuffer.getChannelData(0);
        
        // Convert to 16-bit PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-32768, Math.min(32767, inputData[i] * 32768));
        }
        
        // Send to Vosk recognizer
        if (recognizerRef.current.acceptWaveform) {
          const result = recognizerRef.current.acceptWaveform(pcmData);
          if (result) {
            try {
              const resultObj = JSON.parse(result);
              if (resultObj.text && resultObj.text.trim()) {
                setTranscript(prev => prev + ' ' + resultObj.text.trim());
              }
            } catch (parseError) {
              console.warn('Failed to parse Vosk result:', parseError);
            }
          }
        }
      };
      
      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      setIsListening(true);
      
    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setError(`Failed to start speech recognition: ${err.message}`);
    }
  }, [isListening, isSupported, initializeVosk]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    
    // Get final result
    if (recognizerRef.current && recognizerRef.current.finalResult) {
      try {
        const finalResult = recognizerRef.current.finalResult();
        const finalResultObj = JSON.parse(finalResult);
        if (finalResultObj.text && finalResultObj.text.trim()) {
          setTranscript(prev => prev + ' ' + finalResultObj.text.trim());
        }
      } catch (parseError) {
        console.warn('Failed to parse final Vosk result:', parseError);
      }
    }
    
    // Clean up audio resources
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

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
