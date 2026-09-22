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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'calc(max(16px, env(safe-area-inset-top))) 0 calc(max(16px, env(safe-area-inset-bottom))) 0' }}>
      {/* Header */}
      <header className="glass-panel" style={{ padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }}>
        <button onClick={() => navigate('/')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-gradient" style={{ fontSize: '20px', margin: 0 }}>Hasil Analisa</h2>
      </header>

      {/* Hidden Audio Element */}
      {data?.mediaUrl && (
        <audio ref={audioRef} src={data.mediaUrl} preload="auto" style={{ display: 'none' }} />
      )}

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {data?.sentences.map((sentence) => (
            <div key={sentence.id} className="glass-panel" style={{ 
              borderRadius: '24px', 
              padding: '24px',
              border: activeSentenceId === sentence.id ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
              transition: 'all 0.3s ease',
              boxShadow: activeSentenceId === sentence.id ? '0 8px 32px rgba(139, 92, 246, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.2)',
              transform: activeSentenceId === sentence.id ? 'scale(1.02)' : 'scale(1)'
            }}>
              
              {/* Card Header: Number, Mandarin, Play Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ fontWeight: 700, fontSize: '20px', flex: 1, paddingRight: '16px', color: 'white' }}>
                  <span style={{ color: 'var(--accent-color)', marginRight: '8px' }}>{sentence.id}.</span>{sentence.hanzi}
                </div>
                <button 
                  onClick={() => playSentence(sentence)}
                  style={{
                    background: activeSentenceId === sentence.id ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '44px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'white',
                    flexShrink: 0,
                    transition: 'all 0.3s ease',
                    boxShadow: activeSentenceId === sentence.id ? '0 4px 15px rgba(139, 92, 246, 0.4)' : 'none'
                  }}
                >
                  <Play size={20} fill={activeSentenceId === sentence.id ? "white" : "none"} style={{ marginLeft: activeSentenceId === sentence.id ? '0' : '2px' }} />
                </button>
              </div>

              {/* Pinyin */}
              <div style={{ marginBottom: '20px', background: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '12px' }}>
                <div style={{ fontSize: '15px', color: 'var(--accent-color)', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>Pinyin</div>
                <div style={{ fontSize: '18px', color: 'white' }}>{sentence.pinyin}</div>
              </div>

              {/* Per Kata Breakdown */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Per Kata</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {sentence.words.map((word, idx) => (
                    <div key={idx} style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '12px', alignItems: 'center' }}>
                      <div style={{ flex: '0 0 60px', fontSize: '20px', color: 'white', fontWeight: 500 }}>{word.hanzi}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'var(--accent-color)', fontSize: '14px', marginBottom: '2px' }}>{word.pinyin}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{word.meaning}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Translation */}
              <div style={{ paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Terjemahan</div>
                <div style={{ fontSize: '16px', color: 'white', lineHeight: 1.6 }}>{sentence.translation}</div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
