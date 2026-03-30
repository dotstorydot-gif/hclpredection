import { useState } from 'react';
import { Registration } from './components/Registration';
import { MatchSelection } from './components/MatchSelection';
import { LiveMatch } from './components/LiveMatch';
import { AdminDashboard } from './components/AdminDashboard';
import type { Database } from './types/database';

type RegistrationType = Database['public']['Tables']['registrations']['Row'];

function App() {
  const [registration, setRegistration] = useState<RegistrationType | null>(() => {
    const saved = localStorage.getItem('ucl_registration');
    return saved ? JSON.parse(saved) : null;
  });
  const [isAdmin] = useState(() => window.location.hash === '#admin');
  const [view, setView] = useState<'selection' | 'live'>('selection');

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
    <main>
      <div className="star-background" />
      <nav className="glass-card" style={{ borderRadius: '0', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="https://upload.wikimedia.org/wikipedia/en/b/bf/UEFA_Champions_League_logo_2.svg" alt="UCL Logo" width="40" height="40" style={{ filter: 'brightness(0) invert(1)' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, letterSpacing: '2px', fontSize: '1.2rem', background: 'linear-gradient(to right, #fff, #888)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              UCL INTERACTIVE
            </span>
          </div>
        </div>
        
        {registration && (
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => setView('selection')} 
                className={`ucl-button ${view === 'selection' ? '' : 'inactive'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.6rem', border: view === 'selection' ? 'none' : '1px solid var(--ucl-glass-border)', background: view === 'selection' ? 'var(--ucl-electric)' : 'none' }}
              >
                PREDICT
              </button>
              <button 
                onClick={() => setView('live')} 
                className={`ucl-button ${view === 'live' ? '' : 'inactive'}`}
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.6rem', border: view === 'live' ? 'none' : '1px solid var(--ucl-glass-border)', background: view === 'live' ? 'var(--ucl-electric)' : 'none' }}
              >
                LIVE
              </button>
            </div>
            <button 
              onClick={resetRegistration} 
              style={{ background: 'none', border: 'none', color: 'var(--ucl-silver)', fontSize: '0.7rem', textDecoration: 'underline', cursor: 'pointer' }}
            >
              Log out
            </button>
          </div>
        )}
      </nav>

      {!registration ? (
        <Registration onComplete={handleRegistrationComplete} />
      ) : (
        view === 'selection' ? (
          <MatchSelection registration={registration} onPredictionComplete={() => setView('live')} />
        ) : (
          <LiveMatch registration={registration} />
        )
      )}

      <footer style={{ marginTop: '4rem', padding: '2rem', textAlign: 'center', borderTop: '1px solid var(--ucl-glass-border)', color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.8rem' }}>
        &copy; 2024 UCL Live Experience - Official Venue Game
      </footer>
    </main>
  );
}

export default App;
