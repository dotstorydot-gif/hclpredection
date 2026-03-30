import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { Trophy, Zap } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];

interface Props {
  registration: Registration;
}

export const LiveMatch: React.FC<Props> = ({ registration }) => {
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);
  const [buzzed, setBuzzed] = useState(false);
  const [winner, setWinner] = useState<{ name: string; hit_time: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchActiveMatch();

    // Subscribe to realtime changes on the matches table
    const subscription = supabase
      .channel('live-matches')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'matches' }, (payload) => {
        const updatedMatch = payload.new as Match;
        setActiveMatch(updatedMatch);
        
        // Reset buzzed state if buzzer becomes active
        if (updatedMatch.buzzer_active) {
          setBuzzed(false);
          setWinner(null);
          if (audioRef.current) audioRef.current.play().catch(() => {});
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchActiveMatch = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'LIVE')
      .single();
    
    if (!error && data) setActiveMatch(data);
  };

  const handleBuzzerHit = async () => {
    if (!activeMatch || buzzed) return;
    
    setBuzzed(true);
    try {
      const { error } = await supabase
        .from('buzzer_hits')
        .insert({
          match_id: activeMatch.id,
          registration_id: registration.id,
          venue_id: registration.venue_id,
          hit_time: new Date().toISOString(),
        });
      
      if (error) throw error;

      // Immediately check for the winner in this venue
      const { data: winnerData } = await supabase
        .from('buzzer_hits')
        .select('*, registrations(name)')
        .eq('match_id', activeMatch.id)
        .eq('venue_id', registration.venue_id)
        .order('hit_time', { ascending: true })
        .limit(1)
        .single();
      
      if (winnerData) {
        const winner = winnerData as unknown as { registrations: { name: string }; hit_time: string };
        setWinner({
          name: winner.registrations.name,
          hit_time: winner.hit_time
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!activeMatch) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
      <div className="glass-card">
        <p>Stay tuned! No matches are live right now.</p>
        <p style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '1rem' }}>Registered at: {registration.venue_id}</p>
      </div>
    </div>
  );

  return (
    <div className="container">
      <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" />
      
      <div className="glass-card" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <div>
            <div className="team-logo">{activeMatch.home_logo ? <img src={activeMatch.home_logo} width="50" alt="" /> : activeMatch.home_team.substring(0,3)}</div>
            <p style={{ fontWeight: 700, marginTop: '0.5rem' }}>{activeMatch.home_team}</p>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', gap: '1rem' }}>
            <span>{activeMatch.home_score}</span>
            <span>-</span>
            <span>{activeMatch.away_score}</span>
          </div>
          <div>
            <div className="team-logo">{activeMatch.away_logo ? <img src={activeMatch.away_logo} width="50" alt="" /> : activeMatch.away_team.substring(0,3)}</div>
            <p style={{ fontWeight: 700, marginTop: '0.5rem' }}>{activeMatch.away_team}</p>
          </div>
        </div>
        <div className="vs-badge" style={{ background: 'red', color: 'white' }}>LIVE</div>
      </div>

      {activeMatch.buzzer_active ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ucl-gold)', animation: 'pulse 1s infinite' }}>GOAL scored!!!</h2>
          
          <button 
            onClick={handleBuzzerHit} 
            disabled={buzzed}
            style={{
              width: '250px',
              height: '250px',
              borderRadius: '50%',
              background: buzzed ? '#333' : 'radial-gradient(circle, #ffd700, #c5a059)',
              border: '10px solid rgba(255,255,255,0.2)',
              boxShadow: buzzed ? 'none' : '0 0 50px rgba(197, 160, 89, 0.6)',
              cursor: buzzed ? 'default' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              transition: 'all 0.3s'
            }}
          >
            {buzzed ? (
              winner ? (
                <>
                  <div style={{ fontSize: '3rem' }}>🏆</div>
                  <p style={{ fontWeight: 800 }}>WINNER: {winner.name}</p>
                </>
              ) : (
                <p style={{ fontWeight: 800 }}>WAITING...</p>
              )
            ) : (
              <>
                <Zap size={60} fill="white" />
                <p style={{ fontWeight: 900, fontSize: '1.5rem', marginTop: '1rem' }}>PUSH!</p>
              </>
            )}
          </button>
          
          <p style={{ opacity: 0.7 }}>The fastest response at {registration.venue_id} wins!</p>
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>⚽</div>
          <h3>Watching the Match...</h3>
          <p style={{ opacity: 0.5 }}>Get ready! The buzzer will appear when a goal is scored.</p>
        </div>
      )}

      {winner && (
        <div className="glass-card" style={{ marginTop: '2rem', background: 'rgba(197, 160, 89, 0.1)', borderColor: 'var(--ucl-gold)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Trophy color="var(--ucl-gold)" />
            <div>
              <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Latest Venue Winner:</p>
              <p style={{ fontWeight: 800, fontSize: '1.2rem' }}>{winner.name}</p>
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
