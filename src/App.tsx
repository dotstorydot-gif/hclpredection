import { useState } from 'react';
import { Registration } from './components/Registration';
import { MatchSelection } from './components/MatchSelection';
import { LiveMatch } from './components/LiveMatch';
import { AdminDashboard } from './components/AdminDashboard';
import { Leaderboard } from './components/Leaderboard';
import type { Database } from './types/database';

type RegistrationType = Database['public']['Tables']['registrations']['Row'];
type Match = Database['public']['Tables']['matches']['Row'];

function App() {
  const [registration, setRegistration] = useState<RegistrationType | null>(() => {
    const saved = localStorage.getItem('ucl_registration');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdmin] = useState(() => 
    window.location.hash === '#admin' || window.location.pathname === '/admin'
  );
  const [view, setView] = useState<'selection' | 'live' | 'leaderboard'>('selection');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);

  const handleRegistrationComplete = (data: RegistrationType) => {
    setRegistration(data);
    localStorage.setItem('ucl_registration', JSON.stringify(data));
  };

  const resetRegistration = () => {
    localStorage.removeItem('ucl_registration');
    setRegistration(null);
  };

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 50, 
        background: '#004d1e', // Heineken Dark Green
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 1.5rem', 
        flexShrink: 0 
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          <span style={{ fontWeight: 800, letterSpacing: '1px', fontSize: '1rem', color: 'white', textTransform: 'uppercase' }}>
            PREDICT AND WIN
          </span>
        </div>
        
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {registration ? (
            <>
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button 
                  onClick={() => setView('selection')} 
                  className={`ucl-button ${view === 'selection' ? '' : 'inactive'}`}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.6rem' }}
                >
                  GAMES
                </button>
                <button 
                  onClick={() => setView('live')} 
                  className={`ucl-button ${view === 'live' ? '' : 'inactive'}`}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.6rem' }}
                >
                  LIVE
                </button>
                <button 
                  onClick={() => setView('leaderboard')} 
                  className={`ucl-button ${view === 'leaderboard' ? '' : 'inactive'}`}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.6rem' }}
                >
                  RANKS
                </button>
              </div>
              <button 
                onClick={resetRegistration} 
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', textDecoration: 'underline', fontSize: '0.6rem', cursor: 'pointer', fontWeight: 700 }}
              >
                LOGOUT
              </button>
            </>
          ) : (
            <span style={{ fontSize: '0.7rem', color: 'var(--ucl-gold)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
              LOGIN
            </span>
          )}
        </div>
      </nav>

      <div style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '1rem 0.5rem' }}>
        {!registration ? (
          <Registration onComplete={handleRegistrationComplete} />
        ) : (
          view === 'selection' ? (
            <MatchSelection 
              registration={registration} 
              onPredictionComplete={(match) => {
                setCurrentMatch(match);
                setView('live');
              }} 
            />
          ) : view === 'live' ? (
            <LiveMatch 
              registration={registration} 
              match={currentMatch} 
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
