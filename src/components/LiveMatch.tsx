import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { Trophy, Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

type Registration = Database['public']['Tables']['registrations']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

interface Props {
  registration: Registration;
  onBack: () => void;
}

interface Hit {
  id: string;
  registration_id: string;
  hit_time: string;
  venue_id: string;
  registrations: { name: string } | null;
}

// Sub-component to manage the specific live match view
const SingleLiveMatch: React.FC<{ 
  registration: Registration; 
  initialMatch: Match; 
  isActiveView: boolean;
  prediction?: 'HOME' | 'AWAY' | 'DRAW' | null;
}> = ({ registration, initialMatch, isActiveView, prediction }) => {
  const [localMatch, setLocalMatch] = useState<Match>(initialMatch);
  const [isBuzzerActive, setIsBuzzerActive] = useState(initialMatch.buzzer_active || false);
  const [hasHit, setHasHit] = useState(false);
  const [standings, setStandings] = useState<Hit[]>([]);
  const [lastScore, setLastScore] = useState((initialMatch.home_score || 0) + (initialMatch.away_score || 0));
  const [isHitting, setIsHitting] = useState(false);

  const fetchStandings = React.useCallback(async () => {
    const goalNumber = (localMatch.home_score || 0) + (localMatch.away_score || 0);
    
    const { data } = await supabase
      .from('buzzer_hits')
      .select('*, registrations(name)')
      .eq('match_id', localMatch.id)
      .eq('venue_id', registration.venue_id)
      .eq('goal_number', goalNumber)
      .order('hit_time', { ascending: true })
      .limit(5);
    setStandings(data || []);
  }, [localMatch, registration.venue_id]);

  useEffect(() => {
    const currentScore = (localMatch.home_score || 0) + (localMatch.away_score || 0);
    const buzzerTransitionedOn = !isBuzzerActive && localMatch.buzzer_active;

    if (currentScore > lastScore || buzzerTransitionedOn) {
      setHasHit(false);
      setLastScore(currentScore);
    }
    setIsBuzzerActive(!!localMatch.buzzer_active);
  }, [localMatch, isBuzzerActive, lastScore]);

  useEffect(() => {
    const fetchLatestMatch = async () => {
      const { data } = await supabase.from('matches').select('*').eq('id', initialMatch.id).single();
      if (data) setLocalMatch(data);
    };

    const channel = supabase.channel(`match-${initialMatch.id}`)
      .on('broadcast', { event: 'activate-buzzer' }, () => {
        setIsBuzzerActive(true);
        setHasHit(false);
        setStandings([]);
        fetchLatestMatch();
      })
      .on(
        'postgres_changes',
        { event: 'UPDATE', table: 'matches', schema: 'public', filter: `id=eq.${initialMatch.id}` },
        (payload) => {
          const updated = payload.new as Match;
          setLocalMatch(updated);
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', table: 'buzzer_hits', schema: 'public', filter: `match_id=eq.${initialMatch.id}` },
        () => {
          fetchStandings();
        }
      )
      .subscribe();

    const pollInterval = setInterval(fetchLatestMatch, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [initialMatch.id, fetchStandings]);

  useEffect(() => {
    if (isBuzzerActive) {
      fetchStandings();
    }
  }, [isBuzzerActive, fetchStandings]);

  const handleBuzzerHit = async () => {
    if (!isBuzzerActive || hasHit || isHitting) return;

    setHasHit(true);
    setIsHitting(true);
    
    const goalNumber = (localMatch.home_score || 0) + (localMatch.away_score || 0);
    const hitTime = Date.now();
    try {
      const { error: insertError } = await supabase.from('buzzer_hits').insert({
        registration_id: registration.id,
        match_id: localMatch.id,
        hit_time: new Date(hitTime).toISOString(),
        venue_id: registration.venue_id,
        goal_number: goalNumber
      });
      
      if (insertError) {
        setHasHit(false);
        setIsHitting(false);
        alert('Could not record hit. Please check your signal!');
        return;
      }
      fetchStandings();
    } catch {
      setHasHit(false);
      setIsHitting(false);
      alert('Internal game error. Please try again.');
    } finally {
      setIsHitting(false);
    }
  };

  return (
    <div className="glass-card" style={{ padding: '2rem 1.5rem', display: isActiveView ? 'flex' : 'none', flexDirection: 'column', justifyContent: 'center', minHeight: '0', borderRadius: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1rem' }}>
          <img src={localMatch.home_logo || ''} width="60" alt="" />
          <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ucl-silver)', opacity: 0.5 }}>VS</span>
          <img src={localMatch.away_logo || ''} width="60" alt="" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.6rem', color: 'white' }}>
          {localMatch.home_team} vs {localMatch.away_team}
        </h2>

        {prediction && (
          <div style={{ 
            display: 'inline-block',
            margin: '0.5rem 0 1rem',
            padding: '0.4rem 1rem',
            background: 'var(--ucl-electric)',
            color: 'black',
            borderRadius: '8px',
            fontSize: '0.75rem',
            fontWeight: 900,
            letterSpacing: '1px'
          }}>
            YOUR PICK: {prediction === 'DRAW' ? 'THE DRAW' : prediction === 'HOME' ? localMatch.home_team.toUpperCase() : localMatch.away_team.toUpperCase()}
          </div>
        )}
        
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

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '2rem 0', minHeight: '200px' }}>
        {isBuzzerActive && localMatch.status === 'LIVE' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
            {!hasHit ? (
              <>
                <button
                  onClick={handleBuzzerHit}
                  className="buzzer-3d pulsing"
                  style={{ zIndex: 100 }}
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
    </div>
  );
};

export const LiveMatch: React.FC<Props> = ({ registration, onBack }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [userPredictions, setUserPredictions] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      // Get all predictions for this registration
      const { data: predData } = await supabase
        .from('predictions')
        .select('match_id, winner_choice')
        .eq('registration_id', registration.id);

      const predMap: Record<string, string> = {};
      const predictedMatchIds: string[] = [];
      
      predData?.forEach(p => {
        if (p.winner_choice) {
          predMap[p.match_id] = p.winner_choice;
          predictedMatchIds.push(p.match_id);
        }
      });
      setUserPredictions(predMap);

      if (predictedMatchIds.length === 0) {
        setMatches([]);
        setLoading(false);
        return;
      }

      // Get only the matches the user predicted that are not finished
      const { data } = await supabase
        .from('matches')
        .select('*')
        .in('id', predictedMatchIds)
        .neq('status', 'FINISHED')
        .order('kickoff_time', { ascending: true });
        
      setMatches(data || []);
      setLoading(false);
    };
    fetchMatches();
  }, [registration.id]);

  if (loading) {
    return <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>Loading matches...</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '10vh' }}>
        <p>No active matches found.</p>
        <button onClick={onBack} className="ucl-button" style={{ marginTop: '1rem' }}>GO TO FIXTURES</button>
      </div>
    );
  }

  const prevMatch = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : matches.length - 1));
  };

  const nextMatch = () => {
    setCurrentIndex((prev) => (prev < matches.length - 1 ? prev + 1 : 0));
  };

  return (
    <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Swipe/Match Navigation Controls */}
      {matches.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '0 1rem', marginBottom: '0.5rem' }}>
          <button onClick={prevMatch} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <ChevronLeft size={20} />
          </button>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--ucl-gold)', letterSpacing: '2px' }}>
              MATCH {currentIndex + 1} OF {matches.length}
            </span>
          </div>

          <button onClick={nextMatch} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Render all matches but only show current to maintain websocket connections without re-subscribing */}
      {matches.map((match, index) => (
        <SingleLiveMatch 
          key={match.id} 
          registration={registration} 
          initialMatch={match} 
          isActiveView={index === currentIndex} 
          prediction={userPredictions[match.id] as 'HOME' | 'AWAY' | 'DRAW'}
        />
      ))}

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
          fontWeight: 800,
          marginTop: '1rem'
        }}
      >
        <ArrowLeft size={16} /> BACK TO FIXTURES
      </button>
    </div>
  );
};
