import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { Zap, Play, CheckCircle, Trophy, Layout } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'];

interface BuzzerHit {
  id: string;
  name: string;
  venue_id: string;
  hit_time: string;
  match_id: string;
}

interface Rank {
  name: string;
  points: number;
}

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'MATCHES' | 'BUZZER' | 'RANKS'>('MATCHES');
  const [matches, setMatches] = useState<Match[]>([]);
  const [buzzerHits, setBuzzerHits] = useState<BuzzerHit[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    const { data } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });
    setMatches(data || []);
  }, []);

  const fetchBuzzerHits = useCallback(async () => {
    const { data } = await supabase
      .from('buzzer_hits')
      .select('*, registrations(name)')
      .order('hit_time', { ascending: false })
      .limit(50);
    
    const hits = (data || []).map(d => ({
      id: d.id,
      name: (d.registrations as any)?.name || 'Anonymous',
      venue_id: d.venue_id,
      hit_time: d.hit_time || '',
      match_id: d.match_id
    }));
    setBuzzerHits(hits);
  }, []);

  const calculateRanks = useCallback(async () => {
    const { data: regs } = await supabase.from('registrations').select('name, id');
    const { data: matchesData } = await supabase.from('matches').select('*').eq('status', 'FINISHED');
    const { data: preds } = await supabase.from('predictions').select('*');

    const calculated = (regs || []).map(r => {
      let points = 0;
      const userPreds = (preds || []).filter(p => p.registration_id === r.id);
      userPreds.forEach(p => {
        const match = (matchesData || []).find(m => m.id === p.match_id);
        if (match) {
          const winner = match.home_score > match.away_score ? 'HOME' : 
                         match.home_score < match.away_score ? 'AWAY' : 'DRAW';
          if (p.winner_choice === winner) points += 10;
        }
      });
      return { name: r.name, points };
    }).sort((a,b) => b.points - a.points).slice(0, 20);

    setRanks(calculated);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchMatches();
      await fetchBuzzerHits();
      await calculateRanks();
      setLoading(false);
    };
    init();

    // Set up real-time for buzzer hits
    const buzzerSub = supabase
      .channel('admin-buzzer')
      .on(
        'postgres_changes' as any, 
        { event: 'INSERT', table: 'buzzer_hits', schema: 'public' }, 
        () => {
          fetchBuzzerHits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buzzerSub);
    };
  }, [fetchMatches, fetchBuzzerHits, calculateRanks]);

  const updateMatch = async (matchId: string, updates: Partial<Match>) => {
    const { error } = await supabase.from('matches').update(updates).eq('id', matchId);
    if (!error) fetchMatches();
  };

  const triggerBuzzer = async (matchId: string) => {
    await supabase.from('buzzer_hits').delete().eq('match_id', matchId);
    await supabase.from('matches').update({ buzzer_active: true }).eq('id', matchId);
    
    setTimeout(async () => {
      await supabase.from('matches').update({ buzzer_active: false }).eq('id', matchId);
      fetchMatches();
    }, 15000);
    fetchMatches();
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

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Synchronizing Admin Data...</div>;

  return (
    <div className="container" style={{ maxWidth: '800px', width: '95%', margin: '0 auto', paddingTop: '2rem' }}>
      <h1 className="ucl-title" style={{ fontSize: '2rem', marginBottom: '2rem' }}>ADMIN CONTROL</h1>
      
      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '12px' }}>
        <button 
          onClick={() => setActiveTab('MATCHES')}
          className={`ucl-button ${activeTab === 'MATCHES' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Layout size={16} /> MATCHES
        </button>
        <button 
          onClick={() => setActiveTab('BUZZER')}
          className={`ucl-button ${activeTab === 'BUZZER' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Zap size={16} /> LIVE BUZZER
        </button>
        <button 
          onClick={() => setActiveTab('RANKS')}
          className={`ucl-button ${activeTab === 'RANKS' ? '' : 'inactive'}`}
          style={{ flex: 1, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
        >
          <Trophy size={16} /> ALL RANKS
        </button>
      </div>

      {activeTab === 'MATCHES' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {matches.map(match => (
            <div key={match.id} className="glass-card" style={{ border: match.status === 'LIVE' ? '2px solid var(--ucl-electric)' : '1px solid var(--ucl-glass-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <span className="vs-badge" style={{ background: match.status === 'LIVE' ? 'red' : 'rgba(255,255,255,0.1)' }}>{match.status}</span>
                <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{new Date(match.kickoff_time).toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{match.home_team}</p>
                  <input type="number" className="ucl-input" style={{ width: '60px', textAlign: 'center', fontSize: '1.2rem' }} value={match.home_score} onChange={(e) => updateMatch(match.id, { home_score: parseInt(e.target.value) || 0 })} />
                </div>
                <div style={{ fontWeight: 900 }}>VS</div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.5rem' }}>{match.away_team}</p>
                  <input type="number" className="ucl-input" style={{ width: '60px', textAlign: 'center', fontSize: '1.2rem' }} value={match.away_score} onChange={(e) => updateMatch(match.id, { away_score: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {match.status === 'UPCOMING' && <button className="ucl-button" style={{ gridColumn: 'span 2' }} onClick={() => updateMatch(match.id, { status: 'LIVE' })}><Play size={14} /> START MATCH</button>}
                {match.status === 'LIVE' && (
                  <>
                    <button className="ucl-button" style={{ background: 'var(--ucl-gold)', color: 'black' }} onClick={() => triggerBuzzer(match.id)}><Zap size={14} /> TRIGGER BUZZER</button>
                    <button className="ucl-button" onClick={() => updateMatch(match.id, { status: 'FINISHED' })}><CheckCircle size={14} /> FINISH</button>
                  </>
                )}
                {match.status === 'FINISHED' && <button className="ucl-button" style={{ gridColumn: 'span 2', opacity: 0.5 }} onClick={() => updateMatch(match.id, { status: 'UPCOMING', home_score: 0, away_score: 0 })}>RESET MATCH</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'BUZZER' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--ucl-gold)', textAlign: 'center' }}>REAL-TIME BUZZER HITS</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {buzzerHits.length > 0 ? buzzerHits.map((h, i) => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <p style={{ fontWeight: 800 }}>{h.name}</p>
                  <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>Venue: {h.venue_id}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: 'var(--ucl-gold)', fontWeight: 900 }}>{i + 1}</p>
                  <p style={{ fontSize: '0.6rem', opacity: 0.4 }}>{new Date(h.hit_time).toLocaleTimeString()}</p>
                </div>
              </div>
            )) : <div style={{ textAlign: 'center', opacity: 0.5, padding: '2rem' }}>Waiting for hits...</div>}
          </div>
        </div>
      )}

      {activeTab === 'RANKS' && (
        <div className="glass-card" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: 'var(--ucl-gold)', textAlign: 'center' }}>GLOBAL PREDICTION STANDINGS</h2>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {ranks.map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ opacity: 0.5 }}>#{i+1}</span>
                  <span style={{ fontWeight: 700 }}>{r.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Trophy size={14} color="var(--ucl-gold)" />
                  <span style={{ fontWeight: 900, color: 'var(--ucl-gold)' }}>{r.points} pts</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,0,0,0.2)', textAlign: 'center' }}>
            <p style={{ color: 'red', fontSize: '0.7rem', marginBottom: '0.5rem', fontWeight: 800 }}>DANGER ZONE</p>
            <button className="ucl-button" style={{ background: 'rgba(255,0,0,0.1)', border: '1px solid red', color: 'red' }} onClick={wipeAllData}>WIPE EVERYTHING</button>
          </div>
        </div>
      )}
      
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button className="ucl-button" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }} onClick={() => window.location.reload()}>SYNC DATA</button>
      </div>
    </div>
  );
};
