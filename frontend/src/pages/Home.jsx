import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Upload, Link as LinkIcon, Square, Play, Trash2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload'); // upload | record | link

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(null); // Blob URL for preview
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);

  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);

  // --- Handlers for Upload ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  // --- Handlers for Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        
        // Convert Blob to File object so it can be uploaded easily
        const file = new File([audioBlob], "recording.webm", { type: 'audio/webm' });
        setSelectedFile(file);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Gagal mengakses mikrofon. Pastikan Anda memberikan izin akses mikrofon di browser Anda.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const clearRecording = () => {
    setRecordedAudio(null);
    setSelectedFile(null);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  // Helper to format time
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);


  // --- Common Handler for Submitting to Backend ---
  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // We hit the backend (Vercel proxy handles this)
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      setIsProcessing(false);
      navigate(`/result/${data.taskId}`);
    } catch (error) {
      console.error(error);
      alert('Gagal memproses file. Pastikan backend FastAPI sedang berjalan.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Belajar Mandarin</h1>
        <p>Praktik Lewat Video & Suara</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '32px', background: 'var(--surface-color)', padding: '4px', borderRadius: '16px', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setActiveTab('upload'); setSelectedFile(null); }}
          style={{ flex: '1 1 auto', padding: '10px 8px', borderRadius: '12px', border: 'none', background: activeTab === 'upload' ? 'var(--surface-color-light)' : 'transparent', color: activeTab === 'upload' ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}
        >
          <Upload size={18} style={{ margin: '0 auto', display: 'block', marginBottom: '4px' }} />
          Upload
        </button>
        <button
          onClick={() => { setActiveTab('record'); setSelectedFile(null); }}
          style={{ flex: '1 1 auto', padding: '10px 8px', borderRadius: '12px', border: 'none', background: activeTab === 'record' ? 'var(--surface-color-light)' : 'transparent', color: activeTab === 'record' ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}
        >
          <Mic size={18} style={{ margin: '0 auto', display: 'block', marginBottom: '4px' }} />
          Rekam
        </button>
        <button
          onClick={() => { setActiveTab('link'); setSelectedFile(null); }}
          style={{ flex: '1 1 auto', padding: '10px 8px', borderRadius: '12px', border: 'none', background: activeTab === 'link' ? 'var(--surface-color-light)' : 'transparent', color: activeTab === 'link' ? 'white' : 'var(--text-secondary)', fontWeight: 600, fontSize: '14px' }}
        >
          <LinkIcon size={18} style={{ margin: '0 auto', display: 'block', marginBottom: '4px' }} />
          Link
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {activeTab === 'upload' && (
          <div style={{ width: '100%', background: 'var(--surface-color)', padding: '32px', borderRadius: '16px', textAlign: 'center', border: '2px dashed var(--border-color)' }}>
            <Upload size={48} color="var(--text-secondary)" style={{ margin: '0 auto', display: 'block', marginBottom: '16px' }} />
            <p style={{ marginBottom: '24px' }}>Pilih video atau audio (MP4, WAV, MP3)</p>
            <input type="file" id="file-upload" accept="video/mp4,audio/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <label htmlFor="file-upload" className="btn" style={{ marginBottom: '16px', display: 'inline-block' }}>
              Browse File
            </label>
            {selectedFile && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontWeight: 600, color: 'var(--accent-color)', wordBreak: 'break-all' }}>{selectedFile.name}</p>
                <p style={{ fontSize: '14px', marginTop: '4px' }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? 'Memproses...' : 'Analisa File'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'record' && (
          <div style={{ width: '100%', background: 'var(--surface-color)', padding: '32px 16px', borderRadius: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {!recordedAudio ? (
              <>
                <p style={{ marginBottom: '24px', color: 'var(--text-secondary)' }}>Tekan untuk merekam suara Anda langsung</p>
                
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: isRecording ? 'transparent' : 'var(--accent-color)',
                    border: isRecording ? '2px solid var(--error-color)' : 'none',
                    color: isRecording ? 'var(--error-color)' : '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', marginBottom: '16px',
                    transition: 'all 0.2s',
                    animation: isRecording ? 'pulse 1.5s infinite' : 'none'
                  }}
                >
                  {isRecording ? <Square fill="currentColor" size={32} /> : <Mic size={32} />}
                </button>

                <div style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 600, color: isRecording ? 'var(--error-color)' : 'var(--text-primary)' }}>
                  {formatTime(recordingTime)}
                </div>
              </>
            ) : (
              <>
                <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>Rekaman Selesai</p>
                
                <audio controls src={recordedAudio} style={{ width: '100%', marginBottom: '24px', borderRadius: '8px' }} />
                
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <button className="btn" style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--error-color)' }} onClick={clearRecording}>
                    <Trash2 size={18} style={{ marginRight: '8px' }} /> Hapus
                  </button>
                  <button className="btn btn-primary" style={{ flex: 2 }} onClick={handleProcess} disabled={isProcessing}>
                    {isProcessing ? 'Memproses...' : 'Analisa Suara'}
                  </button>
                </div>
              </>
            )}

            {/* Pulsing animation style definition */}
            <style>{`
              @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(239, 68, 68, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
              }
            `}</style>
          </div>
        )}

        {activeTab === 'link' && (
          <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <LinkIcon size={48} style={{ margin: '0 auto', display: 'block', marginBottom: '16px', opacity: 0.5 }} />
            <p>Fitur paste link (YouTube/TikTok) akan hadir di Fase 3.</p>
          </div>
        )}

      </div>
    </div>
  );
}
