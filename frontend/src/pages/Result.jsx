import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Play, ArrowLeft, Loader2 } from 'lucide-react';



export default function Result() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSentenceId, setActiveSentenceId] = useState(null);
  const audioRef = useRef(null);

  useEffect(() => {
    let intervalId;

    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/task/${taskId}/status`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const taskStatus = await res.json();
        
        if (taskStatus.status === 'completed') {
          clearInterval(intervalId);
          // Fetch final result
          const resultRes = await fetch(`/api/result/${taskId}`);
          if (!resultRes.ok) throw new Error('Failed to fetch result');
          
          const resultData = await resultRes.json();
          // Ensure mediaUrl has full path if it's relative
          if (resultData.mediaUrl && resultData.mediaUrl.startsWith('/')) {
            resultData.mediaUrl = resultData.mediaUrl;
          }
          setData(resultData);
          setIsLoading(false);
        } else if (taskStatus.status === 'failed') {
          clearInterval(intervalId);
          alert('Task failed: ' + taskStatus.error);
          navigate('/');
        }
      } catch (err) {
        console.error(err);
      }
    };

    intervalId = setInterval(checkStatus, 2000);
    checkStatus(); // initial check

    return () => clearInterval(intervalId);
  }, [taskId, navigate]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      if (activeSentenceId === null) return;
      const activeSentence = data.sentences.find(s => s.id === activeSentenceId);
      if (activeSentence && audio.currentTime >= activeSentence.audio_end) {
        audio.pause();
        setActiveSentenceId(null);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    return () => audio.removeEventListener('timeupdate', handleTimeUpdate);
  }, [activeSentenceId, data]);

  const playSentence = (sentence) => {
    if (audioRef.current) {
      audioRef.current.currentTime = sentence.audio_start;
      audioRef.current.play().catch(err => {
        console.error("Autoplay prevented:", err);
      });
      setActiveSentenceId(sentence.id);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '24px' }}>
        <Loader2 className="animate-spin" size={48} color="var(--accent-color)" style={{ animation: 'spin 1s linear infinite' }} />
        <h2 style={{ marginTop: '24px' }}>Memproses Audio...</h2>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '8px' }}>
          Mentranskripsi dan menganalisa kosakata. Ini mungkin memakan waktu beberapa saat.
        </p>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <header style={{ padding: '16px 24px', background: 'var(--surface-color)', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => navigate('/')} className="btn-icon" style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)' }}>
          <ArrowLeft size={24} />
        </button>
        <h2 style={{ fontSize: '18px', margin: 0 }}>Hasil Analisa</h2>
      </header>

      {/* Hidden Audio Element */}
      {data?.mediaUrl && (
        <audio ref={audioRef} src={data.mediaUrl} preload="auto" style={{ display: 'none' }} />
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', paddingBottom: `calc(24px + var(--safe-area-bottom))` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {data?.sentences.map((sentence) => (
            <div key={sentence.id} style={{ 
              background: 'var(--surface-color)', 
              borderRadius: '16px', 
              padding: '20px',
              border: activeSentenceId === sentence.id ? '1px solid var(--accent-color)' : '1px solid transparent',
              transition: 'border 0.2s ease'
            }}>
              
              {/* Card Header: Number, Mandarin, Play Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '18px', flex: 1, paddingRight: '16px' }}>
                  {sentence.id}. {sentence.hanzi}
                </div>
                <button 
                  onClick={() => playSentence(sentence)}
                  style={{
                    background: activeSentenceId === sentence.id ? 'var(--accent-hover)' : 'var(--surface-color-light)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    flexShrink: 0
                  }}
                >
                  <Play size={20} fill={activeSentenceId === sentence.id ? "white" : "none"} />
                </button>
              </div>

              {/* Hanzi & Pinyin Full */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', marginBottom: '4px' }}><strong>Hanzi:</strong> {sentence.hanzi}</div>
                <div style={{ fontSize: '16px', color: 'var(--text-secondary)' }}><strong>Pinyin:</strong> {sentence.pinyin}</div>
              </div>

              {/* Per Kata Breakdown */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>Per kata:</div>
                <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: 0, color: 'var(--text-secondary)' }}>
                  {sentence.words.map((word, idx) => (
                    <li key={idx} style={{ marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{word.hanzi}</span> = {word.pinyin} = {word.meaning}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Translation */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <strong>Arti:</strong> {sentence.translation}
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
