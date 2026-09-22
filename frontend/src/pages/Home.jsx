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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp4' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudio(audioUrl);
        
        // Use Blob directly for iOS compatibility
        setSelectedFile(audioBlob);
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
    if (!selectedFile) {
      alert("Error: File belum terpilih atau kosong!");
      return;
    }
    setIsProcessing(true);

    try {
      const formData = new FormData();
      // Add filename explicitly for Blob
      formData.append('file', selectedFile, 'recording.mp4');

      // alert(`Mengirim file sebesar ${selectedFile.size} bytes ke server...`); // debug

      // We hit the backend (Vercel proxy handles this)
      const response = await fetch('/api/process', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      setIsProcessing(false);
      navigate(`/result/${data.taskId}`);
    } catch (error) {
      console.error(error);
      alert(`Gagal memproses: ${error.message}`);
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ 
      padding: 'calc(max(24px, env(safe-area-inset-top) + 12px)) 24px calc(max(24px, env(safe-area-inset-bottom) + 12px)) 24px', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%' 
    }}>
      <header style={{ marginBottom: '40px', textAlign: 'center', marginTop: '16px' }}>
        <h1 className="text-gradient" style={{ fontSize: '32px', marginBottom: '8px' }}>Belajar Mandarin</h1>
        <p style={{ fontSize: '16px', opacity: 0.8 }}>Praktik Lewat Video & Suara</p>
      </header>

      {/* Tabs */}
      <div className="glass-panel" style={{ display: 'flex', gap: '4px', marginBottom: '32px', padding: '6px', borderRadius: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setActiveTab('upload'); setSelectedFile(null); }}
          style={{ 
            flex: '1 1 auto', padding: '12px 8px', borderRadius: '16px', border: 'none', 
            background: activeTab === 'upload' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', 
            color: activeTab === 'upload' ? 'white' : 'var(--text-secondary)', 
            fontWeight: 600, fontSize: '14px', transition: 'all 0.3s ease',
            boxShadow: activeTab === 'upload' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Upload size={20} style={{ margin: '0 auto', display: 'block', marginBottom: '6px', color: activeTab === 'upload' ? 'var(--accent-color)' : 'inherit' }} />
          Upload
        </button>
        <button
          onClick={() => { setActiveTab('record'); setSelectedFile(null); }}
          style={{ 
            flex: '1 1 auto', padding: '12px 8px', borderRadius: '16px', border: 'none', 
            background: activeTab === 'record' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', 
            color: activeTab === 'record' ? 'white' : 'var(--text-secondary)', 
            fontWeight: 600, fontSize: '14px', transition: 'all 0.3s ease',
            boxShadow: activeTab === 'record' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <Mic size={20} style={{ margin: '0 auto', display: 'block', marginBottom: '6px', color: activeTab === 'record' ? 'var(--accent-color)' : 'inherit' }} />
          Rekam
        </button>
        <button
          onClick={() => { setActiveTab('link'); setSelectedFile(null); }}
          style={{ 
            flex: '1 1 auto', padding: '12px 8px', borderRadius: '16px', border: 'none', 
            background: activeTab === 'link' ? 'rgba(255, 255, 255, 0.1)' : 'transparent', 
            color: activeTab === 'link' ? 'white' : 'var(--text-secondary)', 
            fontWeight: 600, fontSize: '14px', transition: 'all 0.3s ease',
            boxShadow: activeTab === 'link' ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
          }}
        >
          <LinkIcon size={20} style={{ margin: '0 auto', display: 'block', marginBottom: '6px', color: activeTab === 'link' ? 'var(--accent-color)' : 'inherit' }} />
          Link
        </button>
        <button
          onClick={() => navigate('/realtime')}
          style={{ 
            flex: '1 1 auto', padding: '12px 8px', borderRadius: '16px', border: 'none', 
            background: 'transparent', 
            color: 'var(--text-secondary)', 
            fontWeight: 600, fontSize: '14px', transition: 'all 0.3s ease',
            boxShadow: 'none'
          }}
        >
          <Mic size={20} style={{ margin: '0 auto', display: 'block', marginBottom: '6px', color: 'inherit' }} />
          Live
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: '32px' }}>

        {activeTab === 'upload' && (
          <div className="glass-panel" style={{ width: '100%', padding: '40px 24px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--accent-gradient)' }}></div>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <Upload size={36} color="var(--accent-color)" />
            </div>
            <p style={{ marginBottom: '24px', fontSize: '16px' }}>Pilih video atau audio<br/><span style={{opacity: 0.6, fontSize: '14px'}}>(MP4, WAV, MP3)</span></p>
            <input type="file" id="file-upload" accept="video/mp4,audio/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <label htmlFor="file-upload" className="btn" style={{ marginBottom: '16px', display: 'inline-flex', minWidth: '160px' }}>
              Browse File
            </label>
            {selectedFile && (
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
                <p style={{ fontWeight: 600, color: 'white', wordBreak: 'break-all' }}>{selectedFile.name}</p>
                <p style={{ fontSize: '14px', marginTop: '4px', color: 'var(--accent-color)' }}>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px' }} onClick={handleProcess} disabled={isProcessing}>
                  {isProcessing ? 'Memproses...' : 'Analisa File'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'record' && (
          <div className="glass-panel" style={{ width: '100%', padding: '40px 24px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--danger-gradient)' }}></div>
            
            {!recordedAudio ? (
              <>
                <p style={{ marginBottom: '32px', color: 'var(--text-secondary)', fontSize: '16px' }}>Tekan untuk mulai merekam</p>
                
                <div style={{ position: 'relative', marginBottom: '32px' }}>
                  {isRecording && (
                    <div style={{ position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px', background: 'var(--danger-gradient)', borderRadius: '50%', opacity: 0.2, animation: 'pulse-glow 1.5s infinite' }}></div>
                  )}
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    style={{
                      position: 'relative', zIndex: 2,
                      width: '96px', height: '96px', borderRadius: '50%',
                      background: isRecording ? 'transparent' : 'var(--danger-gradient)',
                      border: isRecording ? '3px solid var(--danger-color)' : 'none',
                      color: isRecording ? 'var(--danger-color)' : '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: isRecording ? 'none' : '0 8px 32px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    {isRecording ? <Square fill="currentColor" size={32} /> : <Mic size={40} />}
                  </button>
                </div>

                <div style={{ fontSize: '32px', fontFamily: 'monospace', fontWeight: 700, color: isRecording ? 'var(--danger-color)' : 'var(--text-primary)', letterSpacing: '2px' }}>
                  {formatTime(recordingTime)}
                </div>
              </>
            ) : (
              <div style={{ width: '100%', animation: 'fadeIn 0.5s' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Mic size={28} color="var(--success-color)" />
                </div>
                <p style={{ marginBottom: '24px', color: 'white', fontWeight: 600 }}>Rekaman Selesai</p>
                
                <audio controls src={recordedAudio} style={{ width: '100%', marginBottom: '32px', borderRadius: '12px', height: '48px' }} />
                
                <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
                  <button className="btn" style={{ flex: 1, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: 'var(--danger-color)' }} onClick={clearRecording}>
                    <Trash2 size={20} />
                  </button>
                  <button className="btn btn-primary" style={{ flex: 3 }} onClick={handleProcess} disabled={isProcessing}>
                    {isProcessing ? 'Memproses...' : 'Analisa Suara'}
                  </button>
                </div>
              </div>
            )}

            <style>{`
              @keyframes pulse-glow {
                0% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.3); opacity: 0.1; }
                100% { transform: scale(1); opacity: 0.5; }
              }
              @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </div>
        )}

        {activeTab === 'link' && (
          <div className="glass-panel" style={{ width: '100%', padding: '40px 24px', borderRadius: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <LinkIcon size={36} color="var(--text-secondary)" />
            </div>
            <p style={{fontSize: '16px', lineHeight: 1.6}}>Fitur paste link (YouTube/TikTok) akan hadir di Fase 3.</p>
          </div>
        )}

      </div>
    </div>
  );
}
