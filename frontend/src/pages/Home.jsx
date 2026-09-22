import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Upload, Link as LinkIcon, Square, Play, Trash2 } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload'); // upload | link

  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);

  // Loading state
  const [isProcessing, setIsProcessing] = useState(false);



  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleProcess = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // We'll hit the localhost backend. In production, we'd use environment variables.
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
        <p>Dari video (Upload MP4)</p>
      </header>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', background: 'var(--surface-color)', padding: '4px', borderRadius: '16px' }}>
        <button
          onClick={() => setActiveTab('upload')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'upload' ? 'var(--surface-color-light)' : 'transparent', color: activeTab === 'upload' ? 'white' : 'var(--text-secondary)', fontWeight: 600 }}
        >
          <Upload size={20} style={{ margin: '0 auto', display: 'block', marginBottom: '4px' }} />
          Upload Video
        </button>
        <button
          onClick={() => setActiveTab('link')}
          style={{ flex: 1, padding: '12px', borderRadius: '12px', border: 'none', background: activeTab === 'link' ? 'var(--surface-color-light)' : 'transparent', color: activeTab === 'link' ? 'white' : 'var(--text-secondary)', fontWeight: 600 }}
        >
          <LinkIcon size={20} style={{ margin: '0 auto', display: 'block', marginBottom: '4px' }} />
          Link (Segera)
        </button>
      </div>

      {/* Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

        {activeTab === 'upload' && (
          <div style={{ width: '100%', background: 'var(--surface-color)', padding: '32px', borderRadius: '16px', textAlign: 'center', border: '2px dashed var(--border-color)' }}>
            <Upload size={48} color="var(--text-secondary)" style={{ margin: '0 auto', display: 'block', marginBottom: '16px' }} />
            <p style={{ marginBottom: '24px' }}>Pilih video atau audio (MP4, WAV, MP3)</p>
            <input type="file" id="file-upload" accept="video/mp4,audio/*" onChange={handleFileChange} style={{ display: 'none' }} />
            <label htmlFor="file-upload" className="btn" style={{ marginBottom: '16px' }}>
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
