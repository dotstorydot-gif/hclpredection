import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { Zap, Play, CheckCircle, Trophy, Layout, Square, RotateCw } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'];

interface BuzzerHit {
  id: string;
  registrations: { name: string } | null;
  venue_id: string;
  hit_time: string;
  match_id: string;
}

interface Rank {
  name: string;
  points: number;
}

interface Player {
  id: string;
  name: string;
  phone: string;
  venue_id: string;
  stamps_login: number;
  stamps_prediction: number;
  stamps_buzzer: number;
  created_at: string;
  venues: { name: string } | null;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'BUZZER' | 'RANKS' | 'PLAYERS'>('MATCHES');
  const [matches, setMatches] = useState<Match[]>([]);
  const [buzzerHits, setBuzzerHits] = useState<BuzzerHit[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedVenueFilter, setSelectedVenueFilter] = useState<string>('ALL');
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [venues, setVenues] = useState<Database['public']['Tables']['venues']['Row'][]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });
    setMatches(data || []);
  }, []);

  const fetchVenues = useCallback(async () => {
    const { data } = await supabase.from('venues').select('*');
    setVenues(data || []);
  }, []);

  const fetchBuzzerHits = useCallback(async () => {
    const { data } = await supabase
      .from('buzzer_hits')
      .select('*, registrations(name)')
      .order('hit_time', { ascending: false })
      .limit(100);
    
    setBuzzerHits(data || []);
  }, []);

  const calculateRanks = useCallback(async () => {
    const { data } = await supabase
      .from('registrations')
      .select('name, stamps_login, stamps_prediction, stamps_buzzer');
    
    const calculated = (data || []).map(r => ({
      name: r.name,
      points: (r.stamps_login || 0) + (r.stamps_prediction || 0) + (r.stamps_buzzer || 0)
    })).sort((a,b) => b.points - a.points).slice(0, 50);

    setRanks(calculated);
  }, []);

  const fetchPlayers = useCallback(async () => {
    const { data } = await supabase
      .from('registrations')
      .select('*, venues(name)')
      .order('created_at', { ascending: false });
    setPlayers(data || []);
  }, []);

  const finishMatch = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match || match.processed) return;

    if (!confirm(`Finish ${match.home_team} vs ${match.away_team} and AWARD 1 STAMP to all winners?`)) return;

    setLoading(true);
    try {
      const winner = match.home_score > match.away_score ? 'HOME' : 
                     match.home_score < match.away_score ? 'AWAY' : 'DRAW';

      // Call the high-performance database scorer
      const { error } = await supabase.rpc('award_points_for_match', { 
        m_id: matchId, 
        win_choice: winner 
      });

      if (error) throw error;

      alert(`Match Processed Successfully! Rankings updated.`);
      await fetchMatches();
      await calculateRanks();
    } catch (err: any) {
      alert(`Award stamps failed: ${err?.message || 'Check SQL'}`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetEverything = async () => {
    if (!confirm('☢️ RESET ALL STAMPS AND MATCHES TO ZERO?')) return;
    setLoading(true);
    try {
      await supabase.rpc('reset_all_player_points', {});
      alert('Stamps reset to Zero!');
      fetchMatches();
      calculateRanks();
    } catch (err) { alert('Reset failed. Check SQL.'); } finally { setLoading(false); }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([
        fetchMatches(),
        fetchVenues(),
        fetchBuzzerHits(),
        calculateRanks(),
        fetchPlayers()
      ]);
      setLoading(false);
    };
    init();

    // Set up real-time for buzzer hits
    const buzzerSub = supabase
      .channel('admin-buzzer')
      .on(
        'postgres_changes' as any, 
        { event: '*', table: 'buzzer_hits', schema: 'public' }, 
        () => {
          fetchBuzzerHits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buzzerSub);
    };
  }, [fetchMatches, fetchVenues, fetchBuzzerHits, calculateRanks, fetchPlayers]);

  const updateMatch = async (matchId: string, updates: Partial<Match>) => {
    const { error } = await supabase.from('matches').update(updates).eq('id', matchId);
    if (!error) {
      fetchMatches();
    } else {
      alert(`Match Update Error: ${error.message}`);
    }
  };

  const triggerBuzzer = async (matchId: string) => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;
    
    // The Goal Number is the current total score + 1 (the goal being celebrated)
    const goalNumber = (match.home_score || 0) + (match.away_score || 0);

    // 1. Update DB (source of truth for late joiners)
    const { error: updError } = await supabase.from('matches').update({ buzzer_active: true }).eq('id', matchId);
    if (updError) {
      alert(`Buzzer Activation Error: ${updError.message}`);
      return;
    }

    // 2. Send Broadcast with Goal Number for ultra-fast instant activation
    const channel = supabase.channel(`match-${matchId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'activate-buzzer',
          payload: { matchId, goalNumber }
        });
      }
    });
    
    fetchMatches();

    // Auto-reset after 2 minutes
    setTimeout(async () => {
      await supabase.from('matches').update({ buzzer_active: false }).eq('id', matchId);
      fetchMatches();
    }, 120000);
  };

  const recordGoal = async (matchId: string, side: 'HOME' | 'AWAY') => {
    const match = matches.find(m => m.id === matchId);
    if (!match) return;

    const updates = side === 'HOME' 
      ? { home_score: (match.home_score || 0) + 1 } 
      : { away_score: (match.away_score || 0) + 1 };

    const { error } = await supabase.from('matches').update(updates).eq('id', matchId);
    if (!error) {
      await triggerBuzzer(matchId);
    } else {
      alert(`Goal Recording Error: ${error.message}`);
    }
  };

  const wipeAllData = async () => {
    if (!confirm('☢️ DANGER: THIS WILL PERMANENTLY WIPE ALL REGISTRATIONS, PREDICTIONS, AND BUZZER HITS. ARE YOU SURE?')) return;
    
    setLoading(true);
    try {
      // Deleting registrations cascades to predictions and buzzer_hits
      const { error } = await supabase.from('registrations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      
      alert('Data wiped successfully!');
      fetchMatches();
      fetchBuzzerHits();
      calculateRanks();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Wipe failed. Ensure you ran the SQL policies first.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="container" style={{ textAlign: 'center', marginTop: '10rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
      <div className="live-dot" style={{ width: '40px', height: '40px' }}></div>
      <p style={{ fontWeight: 800, letterSpacing: '2px', opacity: 0.6 }}>SYNCHRONIZING UCL COMMAND CENTER...</p>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '1200px', width: '95%', margin: '0 auto', paddingBottom: '4rem' }}>
      <header style={{ padding: '3rem 0', textAlign: 'center' }}>
        <h1 className="ucl-title" style={{ fontSize: '2.5rem', marginBottom: '0.5rem', letterSpacing: '2px' }}>COMMAND CENTER</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', opacity: 0.6 }}>
          <div className="live-indicator"><div className="live-dot" /> SYSTEM ONLINE</div>
          <span>•</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{matches.filter(m => m.status === 'LIVE').length} ACTIVE MATCHES</span>
        </div>
      </header>
      
      {/* Premium Tab Navigation */}
      <nav style={{ 
        display: 'flex', 
        gap: '0.4rem', 
        marginBottom: '3rem', 
        background: 'rgba(255,255,255,0.03)', 
        padding: '0.6rem', 
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.05)',
        maxWidth: '750px',
        margin: '0 auto 3rem auto'
      }}>
        {(['MATCHES', 'BUZZER', 'RANKS', 'PLAYERS'] as const).map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`ucl-button ${activeTab === tab ? '' : 'inactive'}`}
            style={{ 
              flex: 1, 
              fontSize: '0.75rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.6rem',
              borderRadius: '14px',
              background: activeTab === tab ? 'var(--ucl-navy)' : 'transparent'
            }}
          >
            {tab === 'MATCHES' && <Layout size={16} />}
            {tab === 'BUZZER' && <Zap size={16} />}
            {tab === 'RANKS' && <Trophy size={16} />}
            {tab === 'PLAYERS' && <RotateCw size={16} />}
            {tab}
          </button>
        ))}
      </nav>

      {activeTab === 'MATCHES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {Object.entries(
            matches.reduce((acc, m) => {
              const d = new Date(m.kickoff_time);
              const date = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
              if (!acc[date]) acc[date] = [];
              acc[date].push(m);
              return acc;
            }, {} as Record<string, Match[]>)
          ).map(([date, dayMatches]) => (
            <div key={date} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0 1rem' }}>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1))' }} />
                <h2 style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '4px', textTransform: 'uppercase', color: 'var(--ucl-gold)', opacity: 0.8 }}>{date}</h2>
                <div style={{ height: '1px', flex: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0.1), transparent)' }} />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
                {dayMatches.map(match => (
                  <div key={match.id} className={`admin-card ${match.buzzer_active ? 'buzzer-active-pulse' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', alignItems: 'flex-start' }}>
                      <div>
                        <div className="vs-badge" style={{ 
                          background: match.status === 'LIVE' ? 'rgba(255,43,0,0.2)' : 'rgba(255,255,255,0.05)',
                          color: match.status === 'LIVE' ? 'var(--ucl-electric)' : 'inherit',
                          border: match.status === 'LIVE' ? '1px solid var(--ucl-electric)' : '1px solid transparent',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          fontSize: '0.65rem',
                          fontWeight: 900,
                          letterSpacing: '1px',
                          marginBottom: '0.5rem'
                        }}>
                          {match.status === 'LIVE' && <div className="live-dot" style={{ width: '6px', height: '6px' }} />}
                          {match.status}
                        </div>
                        {match.processed && (
                          <div style={{ fontSize: '0.6rem', color: 'var(--ucl-gold)', fontWeight: 900, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <CheckCircle size={10} /> STAMP AWARDED
                          </div>
                        )}
                        <p style={{ fontSize: '0.65rem', opacity: 0.4, fontWeight: 700 }}>{new Date(match.kickoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {match.status === 'UPCOMING' && (
                          <button className="ucl-button" style={{ padding: '0.6rem 1rem', fontSize: '0.65rem' }} onClick={() => updateMatch(match.id, { status: 'LIVE' })}>
                            <Play size={12} /> INITIATE
                          </button>
                        )}
                        {match.status === 'LIVE' && (
                          <button className="ucl-button" style={{ padding: '0.6rem 1rem', fontSize: '0.65rem', background: 'rgba(255,255,255,0.1)' }} onClick={() => finishMatch(match.id)}>
                            <Square size={12} /> FINISH
                          </button>
                        )}
                        {match.status === 'FINISHED' && (
                          <button className="ucl-button" style={{ padding: '0.6rem 1rem', fontSize: '0.65rem', opacity: 0.4 }} onClick={() => updateMatch(match.id, { status: 'UPCOMING', home_score: 0, away_score: 0, processed: false })}>
                            <RotateCw size={12} /> RESET
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <img src={match.home_logo || ''} alt="" style={{ width: '40px', height: '40px', marginBottom: '0.8rem', opacity: 0.8 }} />
                        <p style={{ fontWeight: 900, fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase' }}>{match.home_team}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            className="ucl-input" 
                            style={{ width: '70px', textAlign: 'center', fontSize: '1.5rem', padding: '0.5rem' }} 
                            value={match.home_score} 
                            onChange={(e) => updateMatch(match.id, { home_score: parseInt(e.target.value) || 0 })} 
                          />
                          {match.status === 'LIVE' && (
                            <button className="ucl-button goal-button-home" style={{ width: '100%', fontSize: '0.6rem', background: 'var(--ucl-deep-blue)' }} onClick={() => recordGoal(match.id, 'HOME')}>+ GOAL</button>
                          )}
                        </div>
                      </div>

                      <div style={{ fontWeight: 100, fontSize: '2rem', opacity: 0.2 }}>:</div>

                      <div style={{ flex: 1, textAlign: 'center' }}>
                        <img src={match.away_logo || ''} alt="" style={{ width: '40px', height: '40px', marginBottom: '0.8rem', opacity: 0.8 }} />
                        <p style={{ fontWeight: 900, fontSize: '0.8rem', marginBottom: '1rem', textTransform: 'uppercase' }}>{match.away_team}</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
                          <input 
                            type="number" 
                            className="ucl-input" 
                            style={{ width: '70px', textAlign: 'center', fontSize: '1.5rem', padding: '0.5rem' }} 
                            value={match.away_score} 
                            onChange={(e) => updateMatch(match.id, { away_score: parseInt(e.target.value) || 0 })} 
                          />
                          {match.status === 'LIVE' && (
                            <button className="ucl-button goal-button-away" style={{ width: '100%', fontSize: '0.6rem' }} onClick={() => recordGoal(match.id, 'AWAY')}>+ GOAL</button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                      {match.status === 'LIVE' && (
                        <>
                          <button className="ucl-button" style={{ background: 'var(--ucl-gold)', color: 'black' }} onClick={() => triggerBuzzer(match.id)}>
                            <Zap size={14} /> MANUAL BUZZER
                          </button>
                          <button className="ucl-button" style={{ background: 'rgba(255,255,255,0.1)' }} onClick={() => finishMatch(match.id)}>
                            <CheckCircle size={14} /> AWARD STAMPS
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'BUZZER' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', alignItems: 'start' }}>
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>REAL-TIME BUZZER FEED</h2>
              <div className="live-indicator"><div className="live-dot" /> STREAMING</div>
            </div>
            <div style={{ maxHeight: '600px', overflowY: 'auto', paddingRight: '1rem' }}>
              {buzzerHits.length > 0 ? buzzerHits.map((h, i) => {
                const venueName = venues.find(v => v.id === h.venue_id)?.name || 'Unknown Venue';
                return (
                  <div key={h.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '1.2rem', 
                    background: i === 0 ? 'rgba(197, 160, 89, 0.05)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: i === 0 ? '12px' : '0',
                    marginBottom: i === 0 ? '0.5rem' : '0'
                  }}>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.2rem', fontWeight: 900, color: i === 0 ? 'var(--ucl-gold)' : 'rgba(255,255,255,0.2)', width: '30px' }}>{i + 1}</span>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: '1rem' }}>{h.registrations?.name || 'Anonymous'}</p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.3rem' }}>
                          <span className="venue-badge">{venueName}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: 'var(--ucl-gold)', fontWeight: 900, fontSize: '0.7rem' }}>{new Date(h.hit_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', ...({ fractionalSecondDigits: 3 } as object) })}</p>
                      <p style={{ fontSize: '0.6rem', opacity: 0.3, marginTop: '0.3rem' }}>MATCH ID: {h.match_id.split('-')[0]}</p>
                    </div>
                  </div>
                );
              }) : <div style={{ textAlign: 'center', opacity: 0.5, padding: '4rem' }}>
                <Zap size={40} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                <p>Awaiting game activity...</p>
              </div>}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div className="admin-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 900, marginBottom: '1.5rem', letterSpacing: '1px', opacity: 0.6 }}>VENUE ACTIVITY</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {venues.map(v => {
                  const count = buzzerHits.filter(h => h.venue_id === v.id).length;
                  const total = buzzerHits.length || 1;
                  const percent = Math.round((count / total) * 100);
                  return (
                    <div key={v.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 800, marginBottom: '0.4rem' }}>
                        <span>{v.name}</span>
                        <span style={{ color: 'var(--ucl-gold)' }}>{count} hits</span>
                      </div>
                      <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px' }}>
                        <div style={{ height: '100%', width: `${percent}%`, background: 'var(--ucl-gold)', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="admin-card" style={{ padding: '1.5rem', border: '1px solid rgba(255,0,0,0.2)' }}>
              <p style={{ color: '#ff3b30', fontSize: '0.6rem', marginBottom: '1rem', fontWeight: 900, letterSpacing: '1px' }}>SYSTEM TOOLS</p>
              <button className="ucl-button" style={{ 
                width: '100%', 
                background: 'rgba(0, 130, 50, 0.1)', 
                border: '1px solid var(--ucl-navy)', 
                color: 'var(--ucl-navy)',
                fontSize: '0.7rem' 
              }} onClick={calculateRanks}>SYNC STAMPS</button>
              <button className="ucl-button" style={{ 
                width: '100%', 
                background: 'rgba(255,197,89,0.05)', 
                border: '1px solid rgba(255,255,255,0.1)', 
                color: 'white',
                fontSize: '0.7rem' 
              }} onClick={resetEverything}>RESET ALL STAMPS</button>
              <button className="ucl-button" style={{ 
                width: '100%', 
                background: 'rgba(255,59,48,0.1)', 
                border: '1px solid #ff3b30', 
                color: '#ff3b30',
                fontSize: '0.7rem' 
              }} onClick={wipeAllData}>WIPE ALL PLAYERS</button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'RANKS' && (
        <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 900 }}>GLOBAL STAMP LEADERBOARD</h2>
            <Trophy size={24} color="var(--ucl-gold)" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ranks.map((r, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                padding: '1.2rem', 
                background: i < 3 ? 'rgba(255,255,255,0.03)' : 'transparent',
                borderRadius: '16px',
                border: i < 3 ? '1px solid rgba(197, 160, 89, 0.1)' : '1px solid transparent'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <span style={{ 
                    fontSize: i < 3 ? '1.2rem' : '0.9rem', 
                    fontWeight: 900, 
                    opacity: i < 3 ? 1 : 0.3,
                    color: i === 0 ? 'var(--ucl-gold)' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'white'
                  }}>#{i+1}</span>
                  <span style={{ fontWeight: 800, fontSize: '1rem' }}>{r.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span style={{ fontWeight: 900, color: 'var(--ucl-gold)', fontSize: '1.1rem' }}>{r.points}</span>
                  <span style={{ fontSize: '0.6rem', fontWeight: 700, opacity: 0.4 }}>STAMPS</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PLAYERS' && (
        <div className="admin-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 900 }}>PLAYER COMMAND LIST ({players.filter(p => selectedVenueFilter === 'ALL' || p.venue_id === selectedVenueFilter).length})</h2>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 900, opacity: 0.5 }}>VENUE FILTER:</span>
              <select 
                className="ucl-input" 
                value={selectedVenueFilter}
                onChange={(e) => setSelectedVenueFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.1)', cursor: 'pointer' }}
              >
                <option value="ALL">ALL VENUES</option>
                {venues.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.1)', opacity: 0.4 }}>
                  <th style={{ padding: '1rem' }}>PARTICIPANT</th>
                  <th style={{ padding: '1rem' }}>VENUE</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>LOGIN</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>PRED</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>BUZZER</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {players
                  .filter(p => selectedVenueFilter === 'ALL' || p.venue_id === selectedVenueFilter)
                  .map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ fontWeight: 800 }}>{p.name}</div>
                        <div style={{ fontSize: '0.65rem', opacity: 0.4 }}>{p.phone}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="venue-badge">{p.venues?.name || 'Unknown'}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{p.stamps_login || 0}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{p.stamps_prediction || 0}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{p.stamps_buzzer || 0}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 900, color: 'var(--ucl-gold)' }}>
                        {(p.stamps_login || 0) + (p.stamps_prediction || 0) + (p.stamps_buzzer || 0)}
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '4rem', textAlign: 'center' }}>
        <button className="ucl-button" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.4, fontSize: '0.7rem' }} onClick={() => window.location.reload()}>SYSTEM SYNC</button>
      </div>
    </div>
  );
};
