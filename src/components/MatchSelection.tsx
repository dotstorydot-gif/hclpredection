import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { CheckCircle2 } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];
type Prediction = Database['public']['Tables']['predictions']['Row'];

interface Props {
  registration: Registration;
  onPredictionComplete: (match: Match) => void;
}

export const MatchSelection: React.FC<Props> = ({ registration, onPredictionComplete }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [choice, setChoice] = useState<'HOME' | 'AWAY' | 'DRAW' | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const fetchData = React.useCallback(async () => {
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
      supabase.from('predictions').select('*').eq('registration_id', registration.id)
    ]);
    
    setMatches(matchData || []);
    setPredictions(predData || []);
    setLoading(false);
  }, [registration.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getUserChoice = (matchId: string) => {
    return predictions.find(p => p.match_id === matchId)?.winner_choice;
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
      
      const matchToLive = selectedMatch;
      setIsConfirming(false);
      setSelectedMatch(null);
      setChoice(null);
      onPredictionComplete(matchToLive);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  // Group matches by date
  const groupedMatches = matches.reduce((acc, match) => {
    const date = new Date(match.kickoff_time).toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  if (loading && matches.length === 0) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Loading fixtures...</div>;

  if (selectedMatch && !isConfirming) {
    return (
      <div className="container" style={{ maxWidth: '400px' }}>
        <button onClick={() => setSelectedMatch(null)} className="ucl-button" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem', width: 'auto' }}>
          &larr; BACK
        </button>
        <div className="glass-card">
          <h2 className="ucl-title" style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Who will win?</h2>
          <div className="grid" style={{ gap: '0.8rem' }}>
            <button 
              className={`ucl-input ${choice === 'HOME' ? 'selected' : ''}`} 
              onClick={() => setChoice('HOME')}
            >
              {selectedMatch.home_team}
            </button>
            <button 
              className={`ucl-input ${choice === 'DRAW' ? 'selected' : ''}`} 
              onClick={() => setChoice('DRAW')}
            >
              THE DRAW
            </button>
            <button 
              className={`ucl-input ${choice === 'AWAY' ? 'selected' : ''}`} 
              onClick={() => setChoice('AWAY')}
            >
              {selectedMatch.away_team}
            </button>
            
            <button 
              className="ucl-button" 
              disabled={!choice} 
              onClick={() => setIsConfirming(true)}
              style={{ marginTop: '1rem', background: choice ? 'var(--ucl-electric)' : 'rgba(255,255,255,0.1)' }}
            >
              CONTINUE
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (selectedMatch && isConfirming) {
    return (
      <div className="container" style={{ maxWidth: '400px' }}>
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <h2 className="ucl-title" style={{ fontSize: '1.5rem' }}>Confirm Choice</h2>
          <div style={{ margin: '1.5rem 0' }}>
            <p style={{ opacity: 0.6, fontSize: '0.8rem' }}>You predict</p>
            <h3 style={{ fontSize: '1.8rem', margin: '0.5rem 0', color: 'var(--ucl-white)' }}>
              {choice === 'HOME' ? selectedMatch.home_team : choice === 'AWAY' ? selectedMatch.away_team : 'The Draw'}
            </h3>
          </div>
          <button className="ucl-button" onClick={handlePredict} disabled={loading} style={{ background: 'var(--ucl-electric)' }}>
            {loading ? 'SAVING...' : 'PLACE PREDICTION'}
          </button>
          <button className="ucl-input" disabled={loading} onClick={() => setIsConfirming(false)} style={{ background: 'none', border: 'none', marginTop: '0.5rem', fontSize: '0.8rem' }}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isDummyMatch = (match: Match) => {
    const kickoff = new Date(match.kickoff_time);
    return kickoff < new Date('2026-04-03');
  };

  return (
    <div className="container" style={{ maxWidth: '400px', height: '85vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
        {Object.entries(groupedMatches).map(([date, dateMatches]) => (
          <div key={date} style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.7rem', color: 'var(--ucl-gold)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '0.8rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.3rem' }}>
              {date}
            </h3>
            <div className="grid" style={{ gap: '0.8rem' }}>
              {dateMatches.map(match => {
                const userChoice = getUserChoice(match.id);
                return (
                  <div key={match.id} className="glass-card" onClick={() => setSelectedMatch(match)} style={{ cursor: 'pointer', padding: '0.8rem', position: 'relative' }}>
                    {isDummyMatch(match) && (
                      <div style={{ position: 'absolute', top: '-5px', right: '10px', background: 'var(--ucl-navy)', color: 'white', fontSize: '0.5rem', padding: '2px 6px', borderRadius: '4px', border: '1px solid var(--ucl-electric)', fontWeight: 800, zIndex: 10 }}>DUMMY</div>
                    )}
                    <div className="match-card" style={{ gap: '0.5rem' }}>
                      <div className="team-info">
                        <img src={match.home_logo || ''} width="30" height="30" alt="" style={{ marginBottom: '0.2rem' }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>{match.home_team.split(' ')[0]}</span>
                      </div>
                      
                      <div style={{ textAlign: 'center', minWidth: '40px' }}>
                        {userChoice ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CheckCircle2 color="var(--ucl-electric)" size={16} />
                            <span style={{ fontSize: '0.5rem', color: 'var(--ucl-electric)', fontWeight: 800 }}>PICKED</span>
                          </div>
                        ) : (
                          <div className="vs-badge" style={{ fontSize: '0.5rem', padding: '0.2rem 0.4rem' }}>{match.status === 'LIVE' ? 'LIVE' : 'VS'}</div>
                        )}
                      </div>

                      <div className="team-info">
                        <img src={match.away_logo || ''} width="30" height="30" alt="" style={{ marginBottom: '0.2rem' }} />
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>{match.away_team.split(' ')[0]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
