import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { Trophy, Clock, ArrowLeft } from 'lucide-react';

type Registration = Database['public']['Tables']['registrations']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface Props {
  registration: Registration;
  match: Match | null;
  onBack: () => void;
}

export const LiveMatch: React.FC<Props> = ({ registration, match, onBack }) => {
  const [isBuzzerActive, setIsBuzzerActive] = useState(false);
  const [hasHit, setHasHit] = useState(false);

  useEffect(() => {
    if (!match) return;

    // Listen for buzzer activation for THIS specific match
    const channel = supabase.channel(`match-${match.id}`)
      .on('broadcast', { event: 'activate-buzzer' }, () => {
        setIsBuzzerActive(true);
        setHasHit(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [match]);

  const handleBuzzerHit = async () => {
    if (!isBuzzerActive || hasHit || !match) return;

    const hitTime = Date.now();
    setHasHit(true);

    try {
      await supabase.from('buzzer_hits').insert({
        registration_id: registration.id,
        match_id: match.id,
        hit_timestamp: new Date(hitTime).toISOString(),
        venue_id: registration.venue_id
      });
      
      // Auto-hide buzzer after hit
      setTimeout(() => setIsBuzzerActive(false), 2000);
    } catch (error) {
      console.error('Buzzer hit failed:', error);
    }
  };

  if (!match) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
        <p>No match selected for live tracking.</p>
        <button onClick={onBack} className="ucl-button" style={{ marginTop: '1rem' }}>GO TO FIXTURES</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '400px', height: '85vh', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1vh' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.7rem', cursor: 'pointer', padding: '0.5rem' }}>
        <ArrowLeft size={14} /> BACK TO LIST
      </button>

      <div className="glass-card" style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '0' }}>
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1.5rem', marginBottom: '0.8rem' }}>
            <img src={match.home_logo || ''} width="50" alt="" />
            <span style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ucl-silver)' }}>VS</span>
            <img src={match.away_logo || ''} width="50" alt="" />
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.4rem' }}>
            {match.home_team} vs {match.away_team}
          </h2>
          <div style={{ display: 'inline-block', padding: '0.2rem 1rem', background: 'rgba(255,0,0,0.2)', color: 'red', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 800 }}>
            LIVE NOW
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          {isBuzzerActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={handleBuzzerHit}
                disabled={hasHit}
                className="ucl-button"
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  fontSize: '1.5rem',
                  background: hasHit ? 'rgba(255,255,255,0.1)' : 'radial-gradient(circle, #ff0000, #b30000)',
                  boxShadow: hasHit ? 'none' : '0 0 50px rgba(255, 0, 0, 0.5)',
                  animation: hasHit ? 'none' : 'pulse 1s infinite',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  border: '8px solid rgba(255,255,255,0.1)'
                }}
              >
                {hasHit ? 'RECORDED!' : 'GOAL! HIT!'}
                {!hasHit && <Trophy size={28} />}
              </button>
              <p style={{ color: 'var(--ucl-gold)', fontWeight: 800, fontSize: '0.7rem', textAlign: 'center' }}>
                BE THE FASTEST AT {registration.venue_id.toUpperCase()}!
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', opacity: 0.8 }}>
              <Clock size={40} style={{ color: 'var(--ucl-gold)', marginBottom: '0.8rem' }} />
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>Waiting for Goal...</h3>
              <p style={{ fontSize: '0.75rem', opacity: 0.6, maxWidth: '240px' }}>Stay alert! The buzzer activates instantly when a goal is scored.</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '1rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem', fontWeight: 800 }}>
            <span style={{ opacity: 0.6 }}>PREDICTION STATUS</span>
            <span style={{ color: 'var(--ucl-gold)' }}>LOCKED & LIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
