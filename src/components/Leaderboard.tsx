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
  const [tab, setTab] = useState<'buzzer' | 'ranking' | 'prediction'>('buzzer');
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
          .limit(5);
        
        const winners = (data || []).map(d => ({
          name: (d.registrations as { name: string } | null)?.name || 'Anonymous',
          hit_timestamp: d.hit_time || '',
          venue_id: d.venue_id
        }));
        setBuzzerWinners(winners);
      } else if (tab === 'ranking') {
        const { data, error } = await supabase
          .from('registrations')
          .select('name, stamps_login, stamps_prediction, stamps_buzzer');
        
        if (!error && data) {
          const calculated = (data || []).map(r => ({
            name: r.name,
            points: (r.stamps_login || 0) + (r.stamps_prediction || 0) + (r.stamps_buzzer || 0)
          })).sort((a,b) => b.points - a.points).slice(0, 5);
          
          setPredictionRanks(calculated);
        }
      } else if (tab === 'prediction') {
        const { data, error } = await supabase
          .from('registrations')
          .select('name, stamps_prediction')
          .order('stamps_prediction', { ascending: false })
          .limit(5);
        
        if (!error && data) {
          setPredictionRanks(data.map(r => ({ name: r.name, points: r.stamps_prediction || 0 })));
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
    <div className="container" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'calc(6rem + 2vh)' }}>
      <div style={{ display: 'flex', gap: '0.2rem', marginBottom: '1.5rem', width: '100%' }}>
        <button 
          onClick={() => setTab('buzzer')} 
          className={`ucl-button ${tab === 'buzzer' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.6rem', padding: '0.7rem 0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
        >
          <Zap size={12} /> LIVE BUZZER
        </button>
        <button 
          onClick={() => setTab('ranking')} 
          className={`ucl-button ${tab === 'ranking' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.6rem', padding: '0.7rem 0.3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
        >
          <Trophy size={12} /> RANKING
        </button>
        <button 
          onClick={() => setTab('prediction')} 
          className={`ucl-button ${tab === 'prediction' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.55rem', padding: '0.6rem 0.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.2rem' }}
        >
          <Target size={12} /> PREDICTION
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
          {tab === 'buzzer' ? '⚡️ FASTEST CLICK RANKING ⚡️' : tab === 'ranking' ? '🏆 GLOBAL STAMP RANKING 🏆' : '🎯 PREDICTION CHAMPIONS 🎯'}
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
                      <span style={{ fontWeight: 900, color: 'var(--ucl-gold)', fontSize: '0.9rem' }}>{r.points || 0}</span>
                      <span style={{ fontSize: '0.65rem', fontWeight: 900, opacity: 0.4 }}>STAMPS</span>
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
