import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Dashboard from './Dashboard';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState(''); // Added for registration
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const devEmail = import.meta.env.VITE_DEV_EMAIL || 'developer@example.com';

  useEffect(() => {
    // Check if accessed via /register link
    if (window.location.pathname === '/register' || window.location.search.includes('register=true')) {
      setIsLogin(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRateLimit = (isLoginAction: boolean) => {
    const limit = isLoginAction ? 5 : 3;
    const timeWindow = 60000; // 1 minute
    const storageKey = isLoginAction ? 'loginAttempts' : 'registerAttempts';
    
    const now = Date.now();
    const attemptsStr = localStorage.getItem(storageKey);
    let attempts: number[] = attemptsStr ? JSON.parse(attemptsStr) : [];
    
    attempts = attempts.filter(time => now - time < timeWindow);
    
    if (attempts.length >= limit) {
      const waitTime = Math.ceil((timeWindow - (now - attempts[0])) / 1000);
      return { allowed: false, waitTime };
    }
    
    attempts.push(now);
    localStorage.setItem(storageKey, JSON.stringify(attempts));
    return { allowed: true, waitTime: 0 };
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setIsError(false);

    const rateLimit = checkRateLimit(isLogin);
    if (!rateLimit.allowed) {
      setIsError(true);
      setMessage(`Too many attempts. Please try again in ${rateLimit.waitTime} seconds.`);
      setIsLoading(false);
      return;
    }

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        setMessage('Successfully logged in!');
        // Here you would typically redirect the user to the app dashboard
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          }
        }
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        setMessage('Registration successful! Please check your email for verification.');
      }
    }
    setIsLoading(false);
  };

  if (session) {
    return <Dashboard session={session} />;
  }

  return (
    <div className="container">
      <div className="glass-panel">
        <h2 className="title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="subtitle">
          {isLogin ? 'Sign in to your account to continue' : 'Join us to get started'}
        </p>

        {message && (
          <div className="dev-notice" style={{ backgroundColor: isError ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', borderColor: isError ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)' }}>
            <p style={{ color: isError ? '#fca5a5' : '#86efac' }}>{message}</p>
          </div>
        )}

        <form onSubmit={handleAuth} className="form">
          {!isLogin && (
            <div className="input-group">
              <label htmlFor="fullName">Full Name</label>
              <input
                type="text"
                id="fullName"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
          )}
          
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register Account')}
          </button>
        </form>

        <div className="toggle-section">
          <p>
            {isLogin ? (
               <span>
                 Need an account? Contact the developer at <br/>
                 <a href={`mailto:${devEmail}`} style={{ color: '#60a5fa', fontWeight: 'bold', textDecoration: 'none' }}>{devEmail}</a>
               </span>
            ) : (
              <span>
                Already have an account? 
                <button
                  className="toggle-btn"
                  type="button"
                  onClick={() => window.location.href = '/'}
                >
                  Log in
                </button>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
