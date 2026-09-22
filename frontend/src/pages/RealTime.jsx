import React, { useEffect, useRef } from 'react';
import { ArrowLeft, Mic, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRealtimeTranslation } from '../hooks/useRealtimeTranslation';

function RealTime() {
  const navigate = useNavigate();
  const { isListening, currentTranscript, sentences, startListening, stopListening } = useRealtimeTranslation();
  const bottomRef = useRef(null);

  // Auto-scroll to bottom when new sentences arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sentences, currentTranscript]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 'calc(max(16px, env(safe-area-inset-top))) 0 calc(max(16px, env(safe-area-inset-bottom))) 0' }}>
      {/* Header */}
      <header className="glass-panel" style={{ padding: '16px 24px', position: 'sticky', top: 0, zIndex: 10, display: 'flex', alignItems: 'center', gap: '16px', borderLeft: 'none', borderRight: 'none', borderTop: 'none', borderRadius: 0 }}>
        <button onClick={() => navigate('/')} className="btn-icon" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-primary)' }}>
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-gradient" style={{ fontSize: '20px', margin: 0 }}>Live Translation</h2>
      </header>

      {/* Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        
        {/* Empty State */}
        {!isListening && sentences.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', textAlign: 'center' }}>
            <Mic size={48} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p>Tekan tombol di bawah dan mulailah berbicara dalam bahasa Mandarin.</p>
          </div>
        )}

        {/* Completed Sentences */}
        {sentences.map((sentence, idx) => (
          <div key={idx} className="glass-panel" style={{ 
            borderRadius: '20px', 
            padding: '20px',
            animation: 'slideUp 0.4s ease-out forwards'
          }}>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
              {sentence.hanzi}
            </div>
            <div style={{ fontSize: '16px', color: 'var(--accent-color)', marginBottom: '12px' }}>
              {sentence.pinyin}
            </div>
            <div style={{ fontSize: '15px', color: 'rgba(255,255,255,0.9)', lineHeight: 1.5 }}>
              {sentence.translation}
            </div>
          </div>
        ))}

        {/* Current Transcript (Draft) */}
        {isListening && currentTranscript && (
          <div className="glass-panel" style={{ 
            borderRadius: '20px', 
            padding: '20px',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            background: 'rgba(139, 92, 246, 0.05)'
          }}>
            <div style={{ fontSize: '18px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
              {currentTranscript}
            </div>
          </div>
        )}
        
        <div ref={bottomRef} style={{ height: '80px' }} />
      </div>

      {/* Floating Action Button */}
      <div style={{ position: 'fixed', bottom: 'calc(max(24px, env(safe-area-inset-bottom)))', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 20 }}>
        <div style={{ position: 'relative' }}>
          {isListening && (
            <div style={{ position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px', background: 'var(--accent-gradient)', borderRadius: '50%', opacity: 0.3, animation: 'pulse-glow 1.5s infinite' }}></div>
          )}
          <button 
            onClick={isListening ? stopListening : startListening}
            style={{
              position: 'relative', zIndex: 2,
              width: '80px', height: '80px', borderRadius: '50%',
              background: isListening ? 'var(--surface-color)' : 'var(--accent-gradient)',
              border: isListening ? '2px solid var(--accent-color)' : 'none',
              color: isListening ? 'var(--accent-color)' : '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              boxShadow: isListening ? 'none' : '0 8px 32px rgba(139, 92, 246, 0.4)'
            }}
          >
            {isListening ? <Square fill="currentColor" size={28} /> : <Mic size={32} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-glow {
          0% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0.1; }
          100% { transform: scale(1); opacity: 0.5; }
        }
        .typing-indicator {
          display: flex; gap: 4px;
        }
        .typing-indicator span {
          width: 6px; height: 6px; background: var(--accent-color); borderRadius: 50%;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        .typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
        .typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

export default RealTime;
