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

  const isPredictionLocked = (match: Match) => {
    const kickoff = new Date(match.kickoff_time);
    const now = new Date();
    const diffInMinutes = (now.getTime() - kickoff.getTime()) / (1000 * 60);
    // Lock if match started more than 60 minutes ago
    return diffInMinutes > 60;
  };

  const handlePredict = async () => {
    if (!selectedMatch || !choice) return;
    
    if (isPredictionLocked(selectedMatch)) {
      alert('Prediction window closed. (Locked 60 mins after kickoff)');
      setSelectedMatch(null);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('predictions')
        .upsert({
          registration_id: registration.id,
          match_id: selectedMatch.id,
          winner_choice: choice,
        }, { onConflict: 'registration_id,match_id' });

      if (error) {
        console.error('Supabase Error:', error);
        throw error;
      }
      
      const matchToLive = selectedMatch;
      setIsConfirming(false);
      setSelectedMatch(null);
      setChoice(null);
      fetchData(); // Refresh to show the new pick
      onPredictionComplete(matchToLive);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Prediction failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const groupedMatches = matches.reduce((acc, match) => {
    const date = new Date(match.kickoff_time).toLocaleDateString('en-US', { day: 'numeric', month: 'long' }).toUpperCase();
    if (!acc[date]) acc[date] = [];
    acc[date].push(match);
    return acc;
  }, {} as Record<string, Match[]>);

  const dates = Object.keys(groupedMatches);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    if (dates.length > 0 && !selectedDate) {
      // Default to today if possible, or the first date
      const today = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long' }).toUpperCase();
      setSelectedDate(dates.includes(today) ? today : dates[0]);
    }
  }, [dates, selectedDate]);

  const isDummyMatch = (match: Match) => {
    const kickoff = new Date(match.kickoff_time);
    return kickoff < new Date('2026-04-03');
  };

  if (loading && matches.length === 0) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Loading fixtures...</div>;

  if (selectedMatch && !isConfirming) {
    return (
      <div className="container" style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'calc(10vh - 20px)', gap: '1rem' }}>
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
            justifyContent: 'center',
            minHeight: '0'
          }}
        >
          <h2 className="ucl-title" style={{ fontSize: '1.8rem', marginBottom: '2rem', textAlign: 'center' }}>Who will win?</h2>
          
          <div className="grid" style={{ gap: '1rem', width: '100%' }}>
            <button 
              className={`ucl-input ${choice === 'HOME' ? 'selected' : ''}`} 
              onClick={() => setChoice('HOME')}
              style={{ 
                padding: '1rem', 
                height: 'auto', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem',
                width: '100%'
              }}
            >
              <img src={selectedMatch.home_logo || ''} width="35" height="35" alt="" />
              <span style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.5px' }}>{selectedMatch.home_team.toUpperCase()}</span>
            </button>

            <button 
              className={`ucl-input ${choice === 'DRAW' ? 'selected' : ''}`} 
              onClick={() => setChoice('DRAW')}
              style={{ 
                fontSize: '1rem', 
                fontWeight: 900, 
                padding: '1rem', 
                textAlign: 'center',
                letterSpacing: '0.5px',
                width: '100%'
              }}
            >
              THE DRAW
            </button>

            <button 
              className={`ucl-input ${choice === 'AWAY' ? 'selected' : ''}`} 
              onClick={() => setChoice('AWAY')}
              style={{ 
                padding: '1rem', 
                height: 'auto', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '1rem',
                width: '100%'
              }}
            >
              <img src={selectedMatch.away_logo || ''} width="35" height="35" alt="" />
              <span style={{ fontSize: '1rem', fontWeight: 900, letterSpacing: '0.5px' }}>{selectedMatch.away_team.toUpperCase()}</span>
            </button>
            
            <button 
              className="ucl-button" 
              disabled={!choice} 
              onClick={() => setIsConfirming(true)}
              style={{ 
                marginTop: '1.5rem', 
                background: choice ? 'var(--ucl-electric)' : 'rgba(255,255,255,0.1)',
                color: choice ? 'black' : 'white',
                padding: '1.2rem',
                fontSize: '1.1rem',
                fontWeight: 900,
                letterSpacing: '1px',
                width: '100%'
              }}
            >
              CONTINUE
            </button>
          </div>
        </div>

        <button 
          onClick={() => setSelectedMatch(null)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            opacity: 0.5, 
            fontSize: '0.8rem', 
            cursor: 'pointer', 
            fontWeight: 800,
            textAlign: 'center',
            width: '100%',
            marginTop: '1rem'
          }}
        >
          &larr; BACK
        </button>
      </div>
    );
  }

  if (selectedMatch && isConfirming) {
    return (
      <div className="container" style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'calc(10vh - 20px)', gap: '1rem' }}>
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
            justifyContent: 'center',
            minHeight: '0',
            textAlign: 'center'
          }}
        >
          <h2 className="ucl-title" style={{ fontSize: '1.8rem', marginBottom: '2rem' }}>Confirm Choice</h2>
          <div style={{ margin: '1.5rem 0' }}>
            <p style={{ opacity: 0.6, fontSize: '0.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>You predict</p>
            <h3 style={{ fontSize: '1.8rem', margin: '0.5rem 0', color: 'var(--ucl-white)', fontWeight: 900 }}>
              {choice === 'HOME' ? selectedMatch.home_team : choice === 'AWAY' ? selectedMatch.away_team : 'The Draw'}
            </h3>
          </div>
          <button 
            className="ucl-button" 
            onClick={handlePredict} 
            disabled={loading} 
            style={{ 
              background: 'var(--ucl-electric)', 
              color: 'black', 
              width: '100%', 
              padding: '1.2rem', 
              fontSize: '1.1rem', 
              fontWeight: 900,
              letterSpacing: '1px'
            }}
          >
            {loading ? 'SAVING...' : 'PLACE PREDICTION'}
          </button>
        </div>
        
        <button 
          disabled={loading} 
          onClick={() => setIsConfirming(false)} 
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'white', 
            opacity: 0.5, 
            fontSize: '1rem', 
            cursor: 'pointer', 
            fontWeight: 900,
            textAlign: 'center',
            width: '100%',
            marginTop: '1rem'
          }}
        >
          &larr; GO BACK
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 'calc(10vh - 20px)' }}>
      <div style={{ width: '100%', padding: '1rem' }}>
        {selectedDate && groupedMatches[selectedDate] ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1rem', color: 'white', letterSpacing: '3px', textTransform: 'uppercase', marginBottom: '1rem', textAlign: 'center', borderBottom: '2px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', width: '100%' }}>
              TODAY'S MATCH
            </h3>
            {groupedMatches[selectedDate].map(match => {
              const userChoice = getUserChoice(match.id);
              const locked = isPredictionLocked(match);

              return (
                <div 
                  key={match.id} 
                  className="glass-card" 
                  onClick={() => !locked && setSelectedMatch(match)} 
                  style={{ 
                    cursor: locked ? 'default' : 'pointer', 
                    padding: '2.5rem 1.5rem', 
                    position: 'relative', 
                    width: '100%',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                    opacity: locked ? 0.7 : 1
                  }}
                >
                  {isDummyMatch(match) && !locked && (
                    <div style={{ position: 'absolute', top: '10px', right: '15px', background: 'var(--ucl-navy)', color: 'white', fontSize: '0.6rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--ucl-electric)', fontWeight: 800, zIndex: 10 }}>TEST</div>
                  )}
                    {locked && (
                      <div style={{ position: 'absolute', top: '10px', right: '15px', background: 'rgba(0,0,0,0.5)', color: 'var(--ucl-gold)', fontSize: '0.6rem', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--ucl-gold)', fontWeight: 800, zIndex: 10 }}>LOCKED</div>
                    )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={match.home_logo || ''} width="65" height="65" alt="" />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, textAlign: 'center', color: 'white', letterSpacing: '0.5px' }}>{match.home_team.toUpperCase()}</span>
                    </div>
                    
                    <div style={{ textAlign: 'center', minWidth: '60px' }}>
                      {userChoice ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                          <CheckCircle2 color="var(--ucl-electric)" size={24} />
                          <span style={{ fontSize: '0.6rem', color: 'var(--ucl-electric)', fontWeight: 900, letterSpacing: '1px' }}>PICKED</span>
                        </div>
                      ) : (
                        <div className="vs-badge" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', fontWeight: 900 }}>VS</div>
                      )}
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
                      <div style={{ width: '70px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <img src={match.away_logo || ''} width="65" height="65" alt="" />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 900, textAlign: 'center', color: 'white', letterSpacing: '0.5px' }}>{match.away_team.toUpperCase()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', opacity: 0.5 }}>
            <p style={{ fontSize: '1rem', letterSpacing: '1px' }}>NO MATCHES SCHEDULED</p>
          </div>
        )}
      </div>
    </div>
  );
};
