import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type Venue = Database['public']['Tables']['venues']['Row'];

interface Props {
  onComplete: (registration: Database['public']['Tables']['registrations']['Row']) => void;
}

export const Registration: React.FC<Props> = ({ onComplete }) => {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchVenues = async () => {
      const { data, error } = await supabase.from('venues').select('*');
      if (error) console.error(error);
      else setVenues(data || []);
    };
    fetchVenues();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVenue) return alert('Please select a venue');
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert({
          name,
          phone,
          venue_id: selectedVenue,
        })
        .select()
        .single();

      if (error) throw error;
      if (data) onComplete(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '450px', marginTop: '5vh' }}>
      <div className="glass-card">
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg" alt="UCL" width="60" style={{ filter: 'brightness(0) invert(1)', marginBottom: '1rem' }} />
          <h1 className="ucl-title" style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome to the Game</h1>
          <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>Enter your details to join the live prediction</p>
        </div>

        <form onSubmit={handleSubmit} className="grid">
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>FULL NAME</label>
            <input
              type="text"
              className="ucl-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>PHONE NUMBER</label>
            <input
              type="tel"
              className="ucl-input"
              placeholder="+1 234 567 890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, fontSize: '0.85rem' }}>SELECT YOUR VENUE</label>
            <select
              className="ucl-input"
              value={selectedVenue}
              onChange={(e) => setSelectedVenue(e.target.value)}
              style={{ appearance: 'none', background: 'rgba(255,255,255,0.05)' }}
              required
            >
              <option value="" disabled style={{ background: '#111' }}>Choose a location...</option>
              {venues.map(v => (
                <option key={v.id} value={v.id} style={{ background: '#111' }}>{v.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="ucl-button" disabled={loading} style={{ marginTop: '1.5rem', width: '100%' }}>
            {loading ? 'REGISTERING...' : 'CONTINUE TO MATCHES'}
          </button>
        </form>
      </div>
    </div>
  );
};
