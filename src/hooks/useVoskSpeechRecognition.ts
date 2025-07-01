
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
  
  const recognizerRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
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
      const { createModel, createRecognizer } = await import('vosk-browser');
      
      // Load the model (using a small English model)
      const modelUrl = 'https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip';
      const model = await createModel(modelUrl);
      
      // Create recognizer
      recognizerRef.current = new (await createRecognizer(model, 16000))();
      
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
            const resultObj = JSON.parse(result);
            if (resultObj.text) {
              setTranscript(prev => prev + ' ' + resultObj.text);
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
      const finalResult = JSON.parse(recognizerRef.current.finalResult());
      if (finalResult.text) {
        setTranscript(prev => prev + ' ' + finalResult.text);
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
