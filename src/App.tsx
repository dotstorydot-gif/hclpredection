import { useState } from 'react';
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

  const setView = (v: 'selection' | 'live' | 'leaderboard') => {
    setViewState(v);
    localStorage.setItem('ucl_view', v);
  };

  const handleRegistrationComplete = (data: RegistrationType) => {
    setRegistration(data);
    localStorage.setItem('ucl_registration', JSON.stringify(data));
  };

  const resetRegistration = () => {
    localStorage.removeItem('ucl_registration');
    localStorage.removeItem('ucl_view');
    setRegistration(null);
    setView('selection');
  };

  if (isAdmin) {
    return <AdminDashboard />;
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <nav className="main-nav">
        <div className="nav-container">
          <span className="nav-title">PREDICT & WIN</span>
          
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
              <button 
                className="logout-btn"
                onClick={resetRegistration} 
              >
                LOGOUT
              </button>
            </div>
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
