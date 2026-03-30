import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import { Zap, Play, CheckCircle, Save } from 'lucide-react';

type Match = Database['public']['Tables']['matches']['Row'];

export const AdminDashboard: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('kickoff_time', { ascending: true });
    
    if (error) console.error(error);
    else setMatches(data || []);
    setLoading(false);
  };

  const updateMatch = async (matchId: string, updates: Partial<Match>) => {
    try {
      const { error } = await supabase
        .from('matches')
        .update(updates)
        .eq('id', matchId);
      
      if (error) throw error;
      fetchMatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Update failed');
    }
  };

  const triggerBuzzer = async (matchId: string) => {
    try {
      // First, clear previous hits for this goal rond if needed, or just trigger
      const { error: resetError } = await supabase
        .from('buzzer_hits')
        .delete()
        .eq('match_id', matchId);
        
      if (resetError) throw resetError;

      const { error } = await supabase
        .from('matches')
        .update({
          buzzer_active: true
        })
        .eq('id', matchId);
      
      if (error) throw error;
      
      alert('BUZZER ACTIVATED! Users can now push.');
      
      // Auto-turn off buzzer after 15 seconds
      setTimeout(async () => {
        await supabase
          .from('matches')
          .update({ buzzer_active: false })
          .eq('id', matchId);
        fetchMatches();
      }, 15000);

      fetchMatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Buzzer trigger failed');
    }
  };

  if (loading) return <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>Loading Admin Panel...</div>;

  return (
    <div className="container">
      <h1 className="ucl-title">Admin Control Dashboard</h1>
      
      <div className="grid">
        {matches.map(match => (
          <div key={match.id} className="glass-card" style={{ border: match.status === 'LIVE' ? '2px solid var(--ucl-electric)' : '1px solid var(--ucl-glass-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
              <div className="vs-badge" style={{ background: match.status === 'LIVE' ? 'red' : 'rgba(255,255,255,0.1)' }}>
                {match.status}
              </div>
              <p style={{ fontSize: '0.8rem', opacity: 0.5 }}>{new Date(match.kickoff_time).toLocaleString()}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '3rem', marginBottom: '2rem' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800 }}>{match.home_team}</p>
                <input 
                  type="number" 
                  className="ucl-input" 
                  style={{ width: '60px', textAlign: 'center', fontSize: '1.5rem', marginTop: '0.5rem' }} 
                  value={match.home_score}
                  onChange={(e) => updateMatch(match.id, { home_score: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>VS</div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 800 }}>{match.away_team}</p>
                <input 
                  type="number" 
                  className="ucl-input" 
                  style={{ width: '60px', textAlign: 'center', fontSize: '1.5rem', marginTop: '0.5rem' }} 
                  value={match.away_score}
                  onChange={(e) => updateMatch(match.id, { away_score: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
              {match.status === 'UPCOMING' && (
                <button className="ucl-button" onClick={() => updateMatch(match.id, { status: 'LIVE' })}>
                  <Play size={14} style={{ marginRight: '0.5rem' }} /> START LIVE
                </button>
              )}
              {match.status === 'LIVE' && (
                <>
                  <button className="ucl-button" style={{ background: 'var(--ucl-gold)' }} onClick={() => triggerBuzzer(match.id)}>
                    <Zap size={14} style={{ marginRight: '0.5rem' }} /> TRIGGER BUZZER
                  </button>
                  <button className="ucl-button" onClick={() => updateMatch(match.id, { status: 'FINISHED' })}>
                    <CheckCircle size={14} style={{ marginRight: '0.5rem' }} /> FINISH
                  </button>
                </>
              )}
              {match.status === 'FINISHED' && (
                <button className="ucl-button" style={{ gridColumn: 'span 2', background: 'none', border: '1px solid rgba(255,255,255,0.2)' }} onClick={() => updateMatch(match.id, { status: 'UPCOMING', home_score: 0, away_score: 0 })}>
                  RESET MATCH
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '3rem', textAlign: 'center' }}>
        <button className="ucl-input" style={{ width: 'auto', padding: '0.8rem 2rem' }} onClick={() => window.location.reload()}>
          <Save size={16} style={{ marginRight: '0.5rem' }} /> REFRESH DASHBOARD
        </button>
      </div>
    </div>
  );
};
