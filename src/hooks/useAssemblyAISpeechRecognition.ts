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
  const audioContextRef = useRef<AudioContext | null>(null);
  const shouldBeListeningRef = useRef(false);

  const isSupported = typeof navigator !== 'undefined' && 
                     'mediaDevices' in navigator && 
                     'getUserMedia' in navigator.mediaDevices;

  const cleanupResources = useCallback(() => {
    console.log('Cleaning up speech recognition resources');
    
    shouldBeListeningRef.current = false;
    
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
        if (websocketRef.current.readyState === WebSocket.OPEN) {
          websocketRef.current.close(1000, 'Manual close');
        }
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

    // Close audio context
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (err) {
        console.error('Error closing audio context:', err);
      }
      audioContextRef.current = null;
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || !isSupported) {
      console.log('Already listening or not supported');
      return;
    }

    try {
      console.log('Starting AssemblyAI streaming transcription...');
      setError(null);
      setIsLoading(true);
      shouldBeListeningRef.current = true;

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

      console.log('Microphone access granted');
      streamRef.current = stream;

      // Create audio context for processing
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      // Get temporary token from our server
      // Use local Supabase Edge Function for dev, production URL for deployed
      const isLocal = typeof window !== 'undefined' && window.location.hostname === 'localhost';
      const supabaseEdgeUrl = isLocal
        ? 'http://localhost:54321/functions/v1/create-assemblyai-token'
        : 'https://mtwkqxnsabqadrrxpdwl.functions.supabase.co/create-assemblyai-token';
      const response = await fetch(supabaseEdgeUrl, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to get AssemblyAI token');
      }

      const { token } = await response.json();

      // Create WebSocket connection to AssemblyAI streaming API
      const websocketUrl = `wss://api.assemblyai.com/v2/realtime/ws?sample_rate=16000&token=${token}`;
      
      const websocket = new WebSocket(websocketUrl);
      websocketRef.current = websocket;

      const connectionTimeout = setTimeout(() => {
        if (websocket.readyState !== WebSocket.OPEN) {
          setError('Connection to AssemblyAI timed out.');
          websocket.close();
        }
      }, 10000); // 10-second timeout

      websocket.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('✅ Connected to AssemblyAI streaming transcription');
        setIsLoading(false);
        setIsListening(true);
        setError(null);

        // Send a keep-alive message every 5 seconds
        const keepAliveInterval = setInterval(() => {
          if (websocket.readyState === WebSocket.OPEN) {
            websocket.send(JSON.stringify({}));
          } else {
            clearInterval(keepAliveInterval);
          }
        }, 5000);
      };

      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('AssemblyAI streaming message:', data);
          
          if (data.message_type === 'FinalTranscript') {
            if (data.text && data.text.trim()) {
              console.log('Final transcript:', data.text);
              setTranscript(prev => {
                const newTranscript = prev + ' ' + data.text.trim();
                return newTranscript.trim();
              });
            }
          } else if (data.message_type === 'PartialTranscript') {
            if (data.text && data.text.trim()) {
              console.log('Partial transcript:', data.text);
              // Optionally handle partial transcripts for real-time feedback
            }
          } else if (data.message_type === 'SessionBegins') {
            console.log('AssemblyAI session began:', data.session_id);
          } else if (data.message_type === 'SessionTerminated') {
            console.log('AssemblyAI session terminated');
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      websocket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('Connection to AssemblyAI failed. Please check your internet connection and API key.');
        setIsLoading(false);
        setIsListening(false);
        shouldBeListeningRef.current = false;
      };

      websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsListening(false);
        
        // Only show error if we weren't expecting to close
        if (shouldBeListeningRef.current && event.code !== 1000) {
          setError('Connection to AssemblyAI was lost unexpectedly.');
        }
      };

      // Set up MediaRecorder for streaming audio
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 16000
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && 
            websocketRef.current?.readyState === WebSocket.OPEN && 
            shouldBeListeningRef.current) {
          
          // Convert audio blob to base64 and send to AssemblyAI
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const audioData = reader.result as string;
              const base64Audio = audioData.split(',')[1]; // Remove data:audio/webm;base64, prefix
              
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
        shouldBeListeningRef.current = false;
      };

      mediaRecorder.onstop = () => {
        console.log('MediaRecorder stopped');
      };

      // Start recording with frequent data chunks for streaming
      mediaRecorder.start(100); // Send data every 100ms for better streaming
      console.log('MediaRecorder started for streaming');

    } catch (err: any) {
      console.error('❌ Error starting streaming transcription:', err);
      setError(`Failed to start: ${err.message}`);
      setIsLoading(false);
      shouldBeListeningRef.current = false;
      cleanupResources();
    }
  }, [isListening, isSupported, cleanupResources]);

  const stopListening = useCallback(() => {
    console.log('Stopping streaming transcription...');
    shouldBeListeningRef.current = false;
    
    // Send terminate message to AssemblyAI
    if (websocketRef.current?.readyState === WebSocket.OPEN) {
      try {
        websocketRef.current.send(JSON.stringify({ terminate_session: true }));
      } catch (err) {
        console.error('Error sending terminate message:', err);
      }
    }
    
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
