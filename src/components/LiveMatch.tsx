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

    // 1. Listen for Broadcast (Ultra-fast, ephemeral)
    const channel = supabase.channel(`match-${match.id}`)
      .on('broadcast', { event: 'activate-buzzer' }, () => {
        setIsBuzzerActive(true);
        setHasHit(false);
      })
      // 2. Listen for Postgres Changes (Source of truth, handles late joiners/reconnects)
      .on(
        'postgres_changes',
        { event: 'UPDATE', table: 'matches', schema: 'public', filter: `id=eq.${match.id}` },
        (payload) => {
          const updatedMatch = payload.new as Match;
          if (updatedMatch.buzzer_active) {
            setIsBuzzerActive(true);
            setHasHit(false);
          } else {
            setIsBuzzerActive(false);
          }
        }
      )
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
    <div className="container" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'calc(10vh - 20px)', gap: '1rem' }}>
      <div className="glass-card" style={{ padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '0', borderRadius: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
            <img src={match.home_logo || ''} width="60" alt="" />
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ucl-silver)', opacity: 0.5 }}>VS</span>
            <img src={match.away_logo || ''} width="60" alt="" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem', color: 'white' }}>
            {match.home_team} vs {match.away_team}
          </h2>
          <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', background: 'rgba(255,0,0,0.2)', color: 'red', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>
            LIVE NOW
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '2rem 0' }}>
          {isBuzzerActive ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
              <button
                onClick={handleBuzzerHit}
                disabled={hasHit}
                className="ucl-button"
                style={{
                  width: '200px',
                  height: '200px',
                  borderRadius: '50%',
                  fontSize: '1.6rem',
                  background: hasHit ? 'rgba(255,255,255,0.1)' : 'radial-gradient(circle, #ff0000, #b30000)',
                  boxShadow: hasHit ? 'none' : '0 0 60px rgba(255, 0, 0, 0.6)',
                  animation: hasHit ? 'none' : 'pulse 1s infinite',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  border: '10px solid rgba(255,255,255,0.1)',
                  fontWeight: 900
                }}
              >
                {hasHit ? 'RECORDED!' : 'GOAL! HIT!'}
                {!hasHit && <Trophy size={32} style={{ marginTop: '0.5rem' }} />}
              </button>
              <p style={{ color: 'var(--ucl-gold)', fontWeight: 900, fontSize: '0.8rem', textAlign: 'center', letterSpacing: '1px' }}>
                BE THE FASTEST AT YOUR VENUE!
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', opacity: 0.9 }}>
              <Clock size={50} style={{ color: 'var(--ucl-gold)', marginBottom: '1rem', animation: 'pulse 2s infinite' }} />
              <h3 style={{ fontSize: '1.3rem', marginBottom: '0.6rem', fontWeight: 800 }}>Waiting for Goal...</h3>
              <p style={{ fontSize: '0.85rem', opacity: 0.6, maxWidth: '260px', margin: '0 auto', lineHeight: '1.4' }}>Stay alert! The buzzer activates instantly when a goal is scored.</p>
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', fontWeight: 900, letterSpacing: '1px' }}>
            <span style={{ opacity: 0.5 }}>PREDICTION STATUS</span>
            <span style={{ color: 'var(--ucl-gold)' }}>LOCKED & LIVE</span>
          </div>
        </div>
      </div>

      <button 
        onClick={onBack} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'white', 
          opacity: 0.5, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '0.5rem', 
          fontSize: '0.8rem', 
          cursor: 'pointer', 
          padding: '1rem',
          width: '100%',
          fontWeight: 800
        }}
      >
        <ArrowLeft size={16} /> BACK TO FIXTURES
      </button>
    </div>
  );
};
