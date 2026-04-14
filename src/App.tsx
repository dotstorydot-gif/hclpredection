import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Trophy } from 'lucide-react';
import { Registration } from './components/Registration';
import { MatchSelection } from './components/MatchSelection';
import { LiveMatch } from './components/LiveMatch';
import { AdminDashboard } from './components/AdminDashboard';
import { Leaderboard } from './components/Leaderboard';
import type { Database } from './types/database';

type RegistrationType = Database['public']['Tables']['registrations']['Row'];

function App() {
  const [registration, setRegistration] = useState<RegistrationType | null>(() => {
    const saved = localStorage.getItem('ucl_registration');
    return saved ? JSON.parse(saved) : null;
  });

  const [isAdmin] = useState(() => 
    window.location.hash === '#admin' || window.location.pathname === '/admin'
  );

  const [view, setViewState] = useState<'selection' | 'live' | 'leaderboard'>(() => {
    const savedView = localStorage.getItem('ucl_view');
    if (savedView === 'selection' || savedView === 'live' || savedView === 'leaderboard') {
      return savedView;
    }
    return 'selection';
  });

  const resetRegistration = () => {
    localStorage.removeItem('ucl_registration');
    localStorage.removeItem('ucl_view');
    setRegistration(null);
    setViewState('selection');
  };

  const setView = (v: 'selection' | 'live' | 'leaderboard') => {
    setViewState(v);
    localStorage.setItem('ucl_view', v);
  };

  const handleRegistrationComplete = (data: RegistrationType) => {
    setRegistration(data);
    localStorage.setItem('ucl_registration', JSON.stringify(data));
  };

  // Polling for the latest registration data (stamps, points)
  useEffect(() => {
    if (!registration) return;

    const fetchLatestReg = async () => {
      if (!registration) return;
      const { data } = await supabase
        .from('registrations')
        .select('*')
        .eq('id', registration.id)
        .single();
      
      if (!data) {
        // Record was deleted (e.g. database wipe) - logout the user
        resetRegistration();
        return;
      }
      
      // Update only if data changed to avoid infinite cycles
      if (data && (
        data.stamps_login !== registration.stamps_login ||
        data.stamps_prediction !== registration.stamps_prediction ||
        data.stamps_buzzer !== registration.stamps_buzzer ||
        data.points !== registration.points
      )) {
        setRegistration(data);
        localStorage.setItem('ucl_registration', JSON.stringify(data));
      }
    };

    const interval = setInterval(fetchLatestReg, 10000); // Poll every 10s
    fetchLatestReg(); // Initial fetch

    return () => clearInterval(interval);
  }, [registration]);

  if (isAdmin) {
    return <AdminDashboard />;
  }

  const totalStamps = registration 
    ? (registration.stamps_login + registration.stamps_prediction + registration.stamps_buzzer) 
    : 0;

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-top-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span className="nav-title">PREDICT & WIN</span>
              {registration && (
                <div style={{ 
                  background: 'var(--ucl-gold)', 
                  color: 'black', 
                  padding: '2px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.65rem', 
                  fontWeight: 900,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Trophy size={10} />
                  {totalStamps} STAMPS
                </div>
              )}
            </div>
            {registration && (
              <button 
                className="logout-btn"
                onClick={resetRegistration} 
              >
                LOGOUT
              </button>
            )}
          </div>
          
          {registration && (
            <div className="nav-controls">
              <div className="nav-tabs">
                <button 
                  onClick={() => setView('selection')} 
                  className={`ucl-button ${view === 'selection' ? '' : 'inactive'}`}
                >
                  GAMES
                </button>
                <button 
                  onClick={() => setView('live')} 
                  className={`ucl-button ${view === 'live' ? '' : 'inactive'}`}
                >
                  LIVE
                </button>
                <button 
                  onClick={() => setView('leaderboard')} 
                  className={`ucl-button ${view === 'leaderboard' ? '' : 'inactive'}`}
                >
                  RANK
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <div className={`main-content ${!registration ? 'registration-layout' : ''}`}>
        {!registration ? (
          <Registration onComplete={handleRegistrationComplete} />
        ) : (
          view === 'selection' ? (
            <MatchSelection 
              registration={registration} 
              onGoToLive={() => {
                setView('live');
              }} 
            />
          ) : view === 'live' ? (
            <LiveMatch 
              registration={registration} 
              onBack={() => setView('selection')} 
            />
          ) : (
            <Leaderboard 
              registration={registration} 
              onBack={() => setView('selection')} 
            />
          )
        )}
      </div>
    </main>
  );
}

export default App;
