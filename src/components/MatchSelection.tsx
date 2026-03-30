import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { CheckCircle2, ChevronRight } from 'lucide-react';

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: matchData }, { data: predData }] = await Promise.all([
      supabase.from('matches').select('*').order('kickoff_time', { ascending: true }),
      supabase.from('predictions').select('*').eq('registration_id', registration.id)
    ]);
    
    setMatches(matchData || []);
    setPredictions(predData || []);
    setLoading(false);
  };

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

  return (
    <div className="container" style={{ paddingBottom: '2rem' }}>
      {Object.entries(groupedMatches).map(([date, dateMatches]) => (
        <div key={date} style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.8rem', opacity: 0.5, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '1rem', borderLeft: '3px solid var(--ucl-navy)', paddingLeft: '0.8rem' }}>
            {date}
          </h3>
          <div className="grid">
            {dateMatches.map(match => {
              const userChoice = getUserChoice(match.id);
              return (
                <div key={match.id} className="glass-card" onClick={() => setSelectedMatch(match)} style={{ cursor: 'pointer', padding: '1rem' }}>
                  <div className="match-card">
                    <div className="team-info">
                      <div className="team-logo" style={{ width: '40px', height: '40px' }}>
                        {match.home_logo ? <img src={match.home_logo} width="30" alt="" /> : match.home_team[0]}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{match.home_team.split(' ')[0]}</span>
                    </div>
                    
                    <div style={{ textAlign: 'center' }}>
                      {userChoice ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                          <CheckCircle2 color="var(--ucl-navy)" size={20} />
                          <span style={{ fontSize: '0.6rem', color: 'var(--ucl-gold)', fontWeight: 800 }}>PICKED</span>
                        </div>
                      ) : (
                        <div className="vs-badge" style={{ fontSize: '0.6rem' }}>VS</div>
                      )}
                    </div>

                    <div className="team-info">
                      <div className="team-logo" style={{ width: '40px', height: '40px' }}>
                        {match.away_logo ? <img src={match.away_logo} width="30" alt="" /> : match.away_team[0]}
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{match.away_team.split(' ')[0]}</span>
                    </div>
                  </div>
                  {match.status === 'LIVE' && (
                    <div style={{ marginTop: '0.8rem', textAlign: 'center', fontSize: '0.6rem', color: 'red', fontWeight: 800, animation: 'pulse 1s infinite' }}>
                      WATCH LIVE &bull; BUZZER ACTIVE
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
