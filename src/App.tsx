import { useState, useEffect } from 'react';
import './App.css';
import { supabase } from './supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Dashboard from './Dashboard';

// ── SVG Icons ─────────────────────────────────────────────────
const LogoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconMail = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);

const IconLock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const IconAlertCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const IconCheckCircle = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IconArrowRight = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" />
    <polyline points="12 5 19 12 12 19" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────
function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const devEmail = import.meta.env.VITE_DEV_EMAIL || 'developer@example.com';

  useEffect(() => {
    if (window.location.pathname === '/register' || window.location.search.includes('register=true')) {
      setIsLogin(false);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkRateLimit = (isLoginAction: boolean) => {
    const limit = isLoginAction ? 5 : 3;
    const timeWindow = 60000;
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        setIsError(true);
        setMessage(error.message);
      } else {
        setMessage('Account created! Please check your email to verify before signing in.');
      }
    }

    setIsLoading(false);
  };

  const switchToLogin = () => {
    setIsLogin(true);
    setMessage('');
    setIsError(false);
    setFullName('');
  };

  if (session) return <Dashboard session={session} />;

  return (
    <div className="auth-root">
      {/* ── Left Brand Panel ── */}
      <aside className="auth-brand">
        <div className="auth-brand-logo">
          <div className="auth-brand-icon"><LogoIcon /></div>
          <span className="auth-brand-name">MacroLens</span>
        </div>

        <div className="auth-brand-body">
          <h2 className="auth-brand-tagline">
            Track your nutrition<br />
            with <span>precision</span>
          </h2>
          <p className="auth-brand-desc">
            Scan meals, monitor macros, and hit your daily goals — all in one clean, focused dashboard.
          </p>
          <div className="auth-feature-list">
            {[
              'AI-powered food scanning',
              'Real-time macro breakdowns',
              'Daily calorie goal tracking',
              'Meal-by-meal logging',
            ].map(f => (
              <div className="auth-feature-item" key={f}>
                <div className="auth-feature-dot" />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="auth-brand-footer">MacroLens &copy; {new Date().getFullYear()}</p>
      </aside>

      {/* ── Right Form Panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Mobile logo */}
          <div className="auth-mobile-logo">
            <div className="auth-mobile-icon"><LogoIcon /></div>
            <span className="auth-mobile-name">MacroLens</span>
          </div>

          <div className="auth-card-header">
            <h1 className="auth-card-title">
              {isLogin ? 'Sign in' : 'Create account'}
            </h1>
            <p className="auth-card-subtitle">
              {isLogin
                ? 'Enter your credentials to access your dashboard.'
                : 'Fill in the details below to get started.'}
            </p>
          </div>

          {/* Alert */}
          {message && (
            <div className={`auth-alert ${isError ? 'auth-alert--error' : 'auth-alert--success'}`} style={{ marginBottom: 20 }}>
              <span className="auth-alert-icon">
                {isError ? <IconAlertCircle /> : <IconCheckCircle />}
              </span>
              <span>{message}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleAuth} noValidate>
            {!isLogin && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="fullName">Full name</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon"><IconUser /></span>
                  <input
                    id="fullName"
                    type="text"
                    className="auth-input"
                    placeholder="Jane Smith"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email address</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconMail /></span>
                <input
                  id="email"
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="password">Password</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><IconLock /></span>
                <input
                  id="password"
                  type="password"
                  className="auth-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
            </div>

            <button id="auth-submit-btn" type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading
                ? <><span className="auth-spinner" /> Processing…</>
                : <>{isLogin ? 'Sign in' : 'Create account'} <IconArrowRight /></>
              }
            </button>
          </form>

          {/* Footer */}
          {!isLogin ? (
            <p className="auth-footer">
              Already have an account?
              <button type="button" className="auth-link" onClick={switchToLogin}>Sign in</button>
            </p>
          ) : (
            <p className="auth-contact-line">
              Need access? Contact{' '}
              <a href={`mailto:${devEmail}`}>{devEmail}</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
