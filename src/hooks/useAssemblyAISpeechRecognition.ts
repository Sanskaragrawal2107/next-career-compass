
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldBeListeningRef = useRef(false);

  const isSupported = typeof navigator !== 'undefined' && 
                     'mediaDevices' in navigator && 
                     'getUserMedia' in navigator.mediaDevices;

  const cleanupResources = useCallback(() => {
    console.log('Cleaning up speech recognition resources');
    
    // Stop media recorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (err) {
        console.error('Error stopping media recorder:', err);
      }
    }
    
    // Close WebSocket connection
    if (websocketRef.current) {
      try {
        websocketRef.current.close();
      } catch (err) {
        console.error('Error closing websocket:', err);
      }
      websocketRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (err) {
          console.error('Error stopping track:', err);
        }
      });
      streamRef.current = null;
    }

    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || !isSupported) {
      console.log('Already listening or not supported');
      return;
    }

    try {
      console.log('Starting AssemblyAI speech recognition...');
      setError(null);
      setIsLoading(true);
      shouldBeListeningRef.current = true;

      // Get microphone access with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      console.log('Microphone access granted');
      streamRef.current = stream;

      // Create WebSocket connection to AssemblyAI
      const websocketUrl = 'wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=1ae99acbc8b44b569c3ff8ce381dab51';
      console.log('Connecting to AssemblyAI WebSocket...');
      
      const websocket = new WebSocket(websocketUrl);
      websocketRef.current = websocket;

      websocket.onopen = () => {
        console.log('✅ Connected to AssemblyAI real-time transcription');
        setIsLoading(false);
        setIsListening(true);
        setError(null);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('AssemblyAI message:', data);
          
          if (data.message_type === 'FinalTranscript') {
            if (data.text && data.text.trim()) {
              console.log('Final transcript:', data.text);
              setTranscript(prev => prev + ' ' + data.text.trim());
            }
          } else if (data.message_type === 'PartialTranscript') {
            if (data.text && data.text.trim()) {
              console.log('Partial transcript:', data.text);
              // You can optionally show partial transcripts in real-time
            }
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection to AssemblyAI failed. Please check your internet connection.');
        setIsLoading(false);
        setIsListening(false);
      };

      websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsListening(false);
        
        // Only attempt reconnection if we should still be listening and it wasn't a manual close
        if (shouldBeListeningRef.current && event.code !== 1000) {
          console.log('Attempting to reconnect...');
          setError('Connection lost. Attempting to reconnect...');
          
          reconnectTimeoutRef.current = setTimeout(() => {
            if (shouldBeListeningRef.current) {
              console.log('Reconnecting to AssemblyAI...');
              startListening();
            }
          }, 2000);
        }
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
            try {
              const base64Audio = (reader.result as string).split(',')[1];
              if (websocketRef.current?.readyState === WebSocket.OPEN) {
                websocketRef.current.send(JSON.stringify({
                  audio_data: base64Audio
                }));
              }
            } catch (err) {
              console.error('Error sending audio data:', err);
            }
          };
          reader.onerror = (err) => {
            console.error('FileReader error:', err);
          };
          reader.readAsDataURL(event.data);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Microphone recording error occurred');
      };

      // Start recording with small time slices for real-time processing
      mediaRecorder.start(250); // Increased interval for better stability
      console.log('MediaRecorder started');

    } catch (err: any) {
      console.error('❌ Error starting speech recognition:', err);
      setError(`Failed to start: ${err.message}`);
      setIsLoading(false);
      shouldBeListeningRef.current = false;
      cleanupResources();
    }
  }, [isListening, isSupported, cleanupResources]);

  const stopListening = useCallback(() => {
    console.log('Stopping speech recognition...');
    shouldBeListeningRef.current = false;
    setIsListening(false);
    cleanupResources();
  }, [cleanupResources]);

  const resetTranscript = useCallback(() => {
    console.log('Resetting transcript');
    setTranscript('');
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldBeListeningRef.current = false;
      cleanupResources();
    };
  }, [cleanupResources]);

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
