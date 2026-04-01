import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { Trophy, Zap, Target } from 'lucide-react';

type Registration = Database['public']['Tables']['registrations']['Row'];

interface Props {
  registration: Registration;
  onBack: () => void;
}

interface BuzzerWinner {
  name: string;
  hit_timestamp: string;
  venue_id: string;
}

interface PredictionRank {
  name: string;
  points: number;
}

export const Leaderboard: React.FC<Props> = ({ registration, onBack }) => {
  const [tab, setTab] = useState<'buzzer' | 'predictions'>('buzzer');
  const [buzzerWinners, setBuzzerWinners] = useState<BuzzerWinner[]>([]);
  const [predictionRanks, setPredictionRanks] = useState<PredictionRank[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = React.useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'buzzer') {
        const { data } = await supabase
          .from('buzzer_hits')
          .select('*, registrations(name)')
          .eq('venue_id', registration.venue_id)
          .order('hit_time', { ascending: true })
          .limit(20);
        
        const winners = (data || []).map(d => ({
          name: (d.registrations as any)?.name || 'Anonymous',
          hit_timestamp: d.hit_time || '',
          venue_id: d.venue_id
        }));
        setBuzzerWinners(winners);
      } else {
        const { data, error } = await supabase
          .from('registrations')
          .select('name, points')
          .order('points', { ascending: false })
          .limit(20);
        
        if (!error && data) {
          setPredictionRanks(data as PredictionRank[]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [tab, registration.venue_id]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="container" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'calc(10vh - 20px)' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button 
          onClick={() => setTab('buzzer')} 
          className={`ucl-button ${tab === 'buzzer' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.7rem', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Zap size={14} /> LIVE BUZZER
        </button>
        <button 
          onClick={() => setTab('predictions')} 
          className={`ucl-button ${tab === 'predictions' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.7rem', padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Target size={14} /> PREDICTIONS
        </button>
      </div>

      <div 
        className="glass-card" 
        style={{ 
          width: '100%',
          padding: '2rem 1.5rem', 
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', 
          flexDirection: 'column', 
          minHeight: '400px' 
        }}
      >
        <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1.5rem', color: 'var(--ucl-gold)', textAlign: 'center', fontWeight: 900 }}>
          {tab === 'buzzer' ? '⚡️ FASTEST CLICK RANKING ⚡️' : '🏆 GLOBAL PREDICTION RANKING 🏆'}
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Updating rankings...</div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
            {tab === 'buzzer' ? (
              buzzerWinners.length > 0 ? (
                buzzerWinners.map((w, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '0.5rem', border: i === 0 ? '1px solid var(--ucl-gold)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontWeight: 800, color: i === 0 ? 'var(--ucl-gold)' : 'white', fontSize: '0.8rem' }}>#{i+1}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{w.name}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>{new Date(w.hit_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>No buzzer hits yet at this venue!</div>
              )
            ) : (
              predictionRanks.length > 0 ? (
                predictionRanks.map((r, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '0.5rem', border: i === 0 ? '1px solid var(--ucl-gold)' : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <span style={{ fontWeight: 800, color: i === 0 ? 'var(--ucl-gold)' : 'white', fontSize: '0.8rem' }}>#{i+1}</span>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Trophy size={12} color="var(--ucl-gold)" />
                      <span style={{ fontWeight: 900, color: 'var(--ucl-gold)', fontSize: '0.9rem' }}>{r.points}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>No finished matches yet!</div>
              )
            )}
          </div>
        )}
      </div>

      <button 
        onClick={onBack} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'white', 
          opacity: 0.5, 
          fontSize: '0.8rem', 
          fontWeight: 800,
          marginTop: '1rem',
          cursor: 'pointer'
        }}
      >
        &larr; BACK TO GAME
      </button>
    </div>
  );
};
