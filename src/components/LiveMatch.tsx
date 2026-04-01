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

interface Hit {
  id: string;
  registration_id: string;
  hit_time: string;
  venue_id: string;
  registrations: { name: string } | null;
}

export const LiveMatch: React.FC<Props> = ({ registration, match: initialMatch, onBack }) => {
  const [localMatch, setLocalMatch] = useState<Match | null>(initialMatch);
  const [isBuzzerActive, setIsBuzzerActive] = useState(initialMatch?.buzzer_active || false);
  const [hasHit, setHasHit] = useState(false);
  const [standings, setStandings] = useState<Hit[]>([]);

  const fetchStandings = React.useCallback(async () => {
    if (!localMatch) return;
    const { data } = await supabase
      .from('buzzer_hits')
      .select('*, registrations(name)')
      .eq('match_id', localMatch.id)
      .eq('venue_id', registration.venue_id)
      .order('hit_time', { ascending: true })
      .limit(5);
    setStandings(data || []);
  }, [localMatch, registration.venue_id]);

  const [lastScore, setLastScore] = useState((initialMatch?.home_score || 0) + (initialMatch?.away_score || 0));

  // Sync local buzzer state and scores
  useEffect(() => {
    if (!localMatch) return;
    
    const currentScore = (localMatch.home_score || 0) + (localMatch.away_score || 0);
    const buzzerTransitionedOn = !isBuzzerActive && localMatch.buzzer_active;

    // Only reset the "hit" status if a score happened OR the buzzer was just turned ON
    if (currentScore > lastScore || buzzerTransitionedOn) {
      setHasHit(false);
      setLastScore(currentScore);
    }

    setIsBuzzerActive(!!localMatch.buzzer_active);
  }, [localMatch, isBuzzerActive, lastScore]);

  useEffect(() => {
    if (!initialMatch) return;

    const fetchLatestMatch = async () => {
      const { data } = await supabase.from('matches').select('*').eq('id', initialMatch.id).single();
      if (data) setLocalMatch(data);
    };

    // 1. Listen for Broadcast (Ultra-fast, ephemeral)
    const channel = supabase.channel(`match-${initialMatch.id}`)
      .on('broadcast', { event: 'activate-buzzer' }, () => {
        setIsBuzzerActive(true);
        setHasHit(false);
        setStandings([]);
        fetchLatestMatch(); // Sync state on broadcast
      })
      // 2. Listen for Postgres Changes on Match (Scores, Status, Buzzer)
      .on(
        'postgres_changes',
        { event: 'UPDATE', table: 'matches', schema: 'public', filter: `id=eq.${initialMatch.id}` },
        (payload) => {
          const updated = payload.new as Match;
          setLocalMatch(updated);
        }
      )
      // 3. Listen for Postgres Changes on Hits (Standings update)
      .on(
        'postgres_changes',
        { event: 'INSERT', table: 'buzzer_hits', schema: 'public', filter: `match_id=eq.${initialMatch.id}` },
        () => {
          fetchStandings();
        }
      )
      .subscribe();

    // 4. Polling Fallback: re-fetch every 5s for mobile devices that might lose WS
    const pollInterval = setInterval(fetchLatestMatch, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [initialMatch?.id, fetchStandings]);

  // Initial fetch for standings
  useEffect(() => {
    if (isBuzzerActive) {
      fetchStandings();
    }
  }, [isBuzzerActive, fetchStandings]);

  const handleBuzzerHit = async () => {
    if (!isBuzzerActive || hasHit || !localMatch) return;

    const hitTime = Date.now();
    try {
      const { error: insertError } = await supabase.from('buzzer_hits').insert({
        registration_id: registration.id,
        match_id: localMatch.id,
        hit_time: new Date(hitTime).toISOString(),
        venue_id: registration.venue_id
      });
      
      if (insertError) {
        alert('Could not record hit. Please check your signal!');
        console.error('Insert error:', insertError);
        return;
      }

      setHasHit(true);
      fetchStandings();
    } catch (e) {
      alert('Internal game error. Please try again.');
      console.error('Buzzer hit exception:', e);
    }
  };

  if (!localMatch) {
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
            <img src={localMatch.home_logo || ''} width="60" alt="" />
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ucl-silver)', opacity: 0.5 }}>VS</span>
            <img src={localMatch.away_logo || ''} width="60" alt="" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem', color: 'white' }}>
            {localMatch.home_team} vs {localMatch.away_team}
          </h2>
          
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2.5rem', margin: '2rem 0', background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{localMatch.home_score || 0}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, marginTop: '0.5rem', letterSpacing: '1px' }}>HOME</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, opacity: 0.2, color: 'var(--ucl-gold)' }}>:</div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span style={{ fontSize: '3.5rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{localMatch.away_score || 0}</span>
              <span style={{ fontSize: '0.6rem', fontWeight: 800, opacity: 0.4, marginTop: '0.5rem', letterSpacing: '1px' }}>AWAY</span>
            </div>
          </div>

          <div style={{ 
            display: 'inline-block', 
            padding: '0.4rem 1.2rem', 
            background: localMatch.status === 'LIVE' ? 'rgba(255,0,0,0.2)' : 'rgba(197, 160, 89, 0.15)', 
            color: localMatch.status === 'LIVE' ? 'red' : 'var(--ucl-gold)', 
            borderRadius: '20px', 
            fontSize: '0.7rem', 
            fontWeight: 900, 
            letterSpacing: '1px',
            border: `1px solid ${localMatch.status === 'LIVE' ? 'rgba(255,0,0,0.2)' : 'rgba(197, 160, 89, 0.3)'}`
          }}>
            {localMatch.status === 'LIVE' ? 'LIVE NOW' : localMatch.status === 'FINISHED' ? 'MATCH FINISHED' : 'UPCOMING'}
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '2rem 0' }}>
          {isBuzzerActive && localMatch.status === 'LIVE' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
              {!hasHit ? (
                <>
                  <button
                    onClick={handleBuzzerHit}
                    className="ucl-button"
                    style={{
                      width: '180px',
                      height: '180px',
                      borderRadius: '50%',
                      fontSize: '1.6rem',
                      background: 'radial-gradient(circle, #ff0000, #b30000)',
                      boxShadow: '0 0 60px rgba(255, 0, 0, 0.6)',
                      animation: 'pulse 1s infinite',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      border: '8px solid rgba(255,255,255,0.1)',
                      fontWeight: 900
                    }}
                  >
                    GOAL! HIT!
                    <Trophy size={32} style={{ marginTop: '0.5rem' }} />
                  </button>
                  <p style={{ color: 'var(--ucl-gold)', fontWeight: 900, fontSize: '0.8rem', textAlign: 'center', letterSpacing: '1px' }}>
                    BE THE FASTEST AT YOUR VENUE!
                  </p>
                </>
              ) : (
                <div className="standings-container">
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 900, marginBottom: '1.5rem', textAlign: 'center', letterSpacing: '2px', color: 'var(--ucl-gold)' }}>
                    {localMatch.status === 'LIVE' ? '⚡ VENUE STANDINGS ⚡' : '🏆 FINAL STANDINGS 🏆'}
                  </h3>
                  <div style={{ width: '100%' }}>
                    {standings.length > 0 ? (
                      standings.map((h, i) => (
                        <div key={h.id} className={`standings-row ${i === 0 ? 'winner' : ''} ${h.registration_id === registration.id ? 'user' : ''}`}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                            <span className={`rank-badge ${i === 0 ? 'top' : ''}`}>#{i + 1}</span>
                            <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>
                              {h.registrations?.name === registration.name ? 'YOU' : h.registrations?.name || 'Anonymous'}
                            </span>
                          </div>
                          <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>
                            {new Date(h.hit_time).toLocaleTimeString([], { second: '2-digit', ...({ fractionalSecondDigits: 3 } as object) })}
                          </span>
                        </div>
                      ))
                    ) : (
                        <p style={{ textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>Updating standings...</p>
                    )}
                  </div>
                  {standings.length > 0 && standings[0].registration_id === registration.id && (
                     <p style={{ textAlign: 'center', color: 'var(--ucl-gold)', fontSize: '0.7rem', fontWeight: 900, marginTop: '1rem', animation: 'pulse 1s infinite' }}>
                        👑 CURRENT LEADER!
                     </p>
                  )}
                </div>
              )
              }
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
