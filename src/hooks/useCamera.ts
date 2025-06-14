
import { useState, useRef, useCallback } from 'react';

export interface CameraHook {
  isActive: boolean;
  videoRef: React.RefObject<HTMLVideoElement>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  error: string | null;
}

export const useCamera = (): CameraHook => {
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera...');
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsActive(true);
      console.log('Camera started successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';
      console.error('Camera error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  }, []);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsActive(false);
    setError(null);
  }, []);

  return {
    isActive,
    videoRef,
    startCamera,
    stopCamera,
    error
  };
};
