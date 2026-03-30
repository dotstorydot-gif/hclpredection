import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Match = Database['public']['Tables']['matches']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];

interface Props {
  registration: Registration;
  onPredictionComplete: () => void;
}

export const MatchSelection: React.FC<Props> = ({ registration, onPredictionComplete }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [choice, setChoice] = useState<'HOME' | 'AWAY' | 'DRAW' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('status', 'UPCOMING')
      .order('kickoff_time', { ascending: true });
    
    if (error) console.error(error);
    else setMatches(data || []);
    setLoading(false);
  };

  const handlePredict = async () => {
    if (!selectedMatch || !choice) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('predictions')
        .upsert({
          registration_id: registration.id,
          match_id: selectedMatch.id,
          winner_choice: choice,
        }, { onConflict: 'registration_id,match_id' });

      if (error) throw error;
      setIsConfirming(false);
      setSelectedMatch(null);
      setChoice(null);
      onPredictionComplete();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  if (loading && matches.length === 0) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Loading fixtures...</div>;

  if (selectedMatch && !isConfirming) {
    return (
      <div className="container" style={{ maxWidth: '500px' }}>
        <button onClick={() => setSelectedMatch(null)} className="ucl-button" style={{ background: 'none', border: '1px solid var(--ucl-glass-border)', marginBottom: '1.5rem' }}>
          &larr; BACK TO LIST
        </button>
        <div className="glass-card">
          <h2 className="ucl-title" style={{ fontSize: '1.5rem' }}>Who will win?</h2>
          <div className="grid" style={{ gap: '1rem' }}>
            <button 
              className={`ucl-input ${choice === 'HOME' ? 'selected' : ''}`} 
              onClick={() => setChoice('HOME')}
              style={{ textAlign: 'center', borderColor: choice === 'HOME' ? 'var(--ucl-electric)' : 'var(--ucl-glass-border)', background: choice === 'HOME' ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.05)' }}
            >
              {selectedMatch.home_team} (HOME)
            </button>
            <button 
              className={`ucl-input ${choice === 'DRAW' ? 'selected' : ''}`} 
              onClick={() => setChoice('DRAW')}
              style={{ textAlign: 'center', borderColor: choice === 'DRAW' ? 'var(--ucl-electric)' : 'var(--ucl-glass-border)', background: choice === 'DRAW' ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)' }}
            >
              DRAW
            </button>
            <button 
              className={`ucl-input ${choice === 'AWAY' ? 'selected' : ''}`} 
              onClick={() => setChoice('AWAY')}
              style={{ textAlign: 'center', borderColor: choice === 'AWAY' ? 'var(--ucl-electric)' : 'var(--ucl-glass-border)', background: choice === 'AWAY' ? 'rgba(0,123,255,0.1)' : 'rgba(255,255,255,0.05)' }}
            >
              {selectedMatch.away_team} (AWAY)
            </button>
            
            <button 
              className="ucl-button" 
              disabled={!choice} 
              onClick={() => setIsConfirming(true)}
              style={{ marginTop: '1rem' }}
            >
              CONFIRM PREDICTION
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMatch && isConfirming) {
    return (
      <div className="container" style={{ maxWidth: '500px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h2 className="ucl-title" style={{ fontSize: '1.5rem' }}>Final Confirmation</h2>
          <div style={{ margin: '2rem 0' }}>
            <p style={{ opacity: 0.7 }}>Your Prediction:</p>
            <h3 style={{ fontSize: '1.8rem', margin: '0.5rem 0', color: 'var(--ucl-electric)' }}>
              {choice === 'HOME' ? selectedMatch.home_team : choice === 'AWAY' ? selectedMatch.away_team : 'THE DRAW'}
            </h3>
            <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>Venue: {registration.venue_id}</p>
          </div>
          <div className="grid">
            <button className="ucl-button" onClick={handlePredict} disabled={loading}>
              {loading ? 'SAVING...' : 'YES, PLACE MY BET'}
            </button>
            <button className="ucl-input" disabled={loading} onClick={() => setIsConfirming(false)} style={{ background: 'none' }}>
              CHANGE MY CHOICE
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="ucl-title">Upcoming Matches</h1>
      <div className="grid">
        {matches.map(match => (
          <div key={match.id} className="glass-card" onClick={() => setSelectedMatch(match)} style={{ cursor: 'pointer' }}>
            <div className="match-card">
              <div className="team-info">
                <div className="team-logo">{match.home_logo ? <img src={match.home_logo} width="40" height="40" alt="" /> : match.home_team.substring(0,3).toUpperCase()}</div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{match.home_team}</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="vs-badge">VS</div>
                <p style={{ fontSize: '0.6rem', opacity: 0.5, marginTop: '0.5rem' }}>{new Date(match.kickoff_time).toLocaleTimeString()}</p>
              </div>
              <div className="team-info">
                <div className="team-logo">{match.away_logo ? <img src={match.away_logo} width="40" height="40" alt="" /> : match.away_team.substring(0,3).toUpperCase()}</div>
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{match.away_team}</span>
              </div>
            </div>
            <button className="ucl-button" style={{ width: '100%', marginTop: '1rem', fontSize: '0.7rem' }}>
              PREDICT NOW
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
