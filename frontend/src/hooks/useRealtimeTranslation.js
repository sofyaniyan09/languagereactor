import { useState, useRef, useCallback } from 'react';

// Default to Render URL in production, or local in dev
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/realtime';

export function useRealtimeTranslation() {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [sentences, setSentences] = useState([]);
  
  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const startListening = useCallback(async () => {
    try {
      // 1. Connect WebSocket
      const wssUrl = WS_URL.replace('http', 'ws'); // Ensure correct protocol if http is passed
      wsRef.current = new WebSocket(wssUrl);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript_update') {
          setCurrentTranscript(data.text);
        } else if (data.type === 'sentence_complete') {
          setSentences(prev => [...prev, data.data]);
          setCurrentTranscript(''); // Reset for next sentence
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        stopListening();
      };

      // 2. Start Audio Recording
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // We will create a new MediaRecorder every 2 seconds to send complete WebM chunks
      const startChunkRecording = () => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'audio/webm' });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(event.data);
          }
        };
        
        mediaRecorder.start();
        
        // Stop after 2 seconds to flush the chunk
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, 2000);
      };

      // Start first chunk
      startChunkRecording();
      // Repeat every 2 seconds
      intervalRef.current = setInterval(startChunkRecording, 2000);
      
      setIsListening(true);
      setSentences([]);
      setCurrentTranscript('');
      
    } catch (err) {
      console.error("Error starting realtime:", err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsListening(false);
    setCurrentTranscript('');
  }, []);

  return {
    isListening,
    currentTranscript,
    sentences,
    startListening,
    stopListening
  };
}
