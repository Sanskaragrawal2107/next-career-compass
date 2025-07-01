
import { useState, useRef, useCallback, useEffect } from 'react';

export interface AssemblyAISpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => Promise<void>;
  stopListening: () => void;
  resetTranscript: () => void;
  isSupported: boolean;
  error: string | null;
  isLoading: boolean;
}

export const useAssemblyAISpeechRecognition = (): AssemblyAISpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const isSupported = typeof navigator !== 'undefined' && 
                     'mediaDevices' in navigator && 
                     'getUserMedia' in navigator.mediaDevices;

  const startListening = useCallback(async () => {
    if (isListening || !isSupported) return;

    try {
      setError(null);
      setIsLoading(true);

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

      // Create WebSocket connection to AssemblyAI
      const websocket = new WebSocket('wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=1ae99acbc8b44b569c3ff8ce381dab51');
      
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('Connected to AssemblyAI real-time transcription');
        setIsLoading(false);
        setIsListening(true);
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.message_type === 'FinalTranscript') {
          if (data.text && data.text.trim()) {
            setTranscript(prev => prev + ' ' + data.text.trim());
          }
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('Real-time transcription connection failed');
        setIsLoading(false);
      };

      websocket.onclose = () => {
        console.log('WebSocket connection closed');
        setIsListening(false);
      };

      // Set up MediaRecorder to capture audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && websocketRef.current?.readyState === WebSocket.OPEN) {
          // Convert blob to base64 and send to AssemblyAI
          const reader = new FileReader();
          reader.onload = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            websocketRef.current?.send(JSON.stringify({
              audio_data: base64Audio
            }));
          };
          reader.readAsDataURL(event.data);
        }
      };

      // Start recording with small time slices for real-time processing
      mediaRecorder.start(100);

    } catch (err: any) {
      console.error('Error starting speech recognition:', err);
      setError(`Failed to start speech recognition: ${err.message}`);
      setIsLoading(false);
    }
  }, [isListening, isSupported]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    // Close WebSocket connection
    if (websocketRef.current) {
      websocketRef.current.close();
      websocketRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Clear audio chunks
    audioChunksRef.current = [];
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
