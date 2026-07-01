import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './Dashboard.css';
import OnboardingModal from './OnboardingModal';

interface DashboardProps {
  session: Session;
}

interface UserProfile {
  full_name: string | null;
  email: string;
  daily_calorie_goal: number;
  weight_kg: number | null;
  height_cm: number | null;
}

interface MealLog {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  logged_at: string;
}

interface AnalysisLog {
  id: string;
  food_name: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  serving_size: string | null;
  scanned_at: string;
}

const MEAL_ORDER: MealLog['meal_type'][] = ['breakfast', 'lunch', 'dinner', 'snack'];

const getDefaultMealType = (): MealLog['meal_type'] => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour <= 9) return 'breakfast';
  if (hour >= 11 && hour <= 13) return 'lunch';
  if (hour >= 17 && hour <= 20) return 'dinner';
  return 'snack';
};

// ── SVG Icon Components ────────────────────────────────────────

const IconLogo = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
  </svg>
);

const IconCamera = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/>
    <circle cx="12" cy="13" r="3"/>
  </svg>
);

const IconOverview = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconMeals = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><line x1="7" y1="2" x2="7" y2="11"/>
    <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1h18v1z"/><line x1="12" y1="2" x2="12" y2="13"/>
    <path d="M18 2a5 5 0 0 1 3 4.5V11h-6V6.5A5 5 0 0 1 18 2z"/>
  </svg>
);

const IconHistory = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const IconMealBreakfast = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconMealLunch = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
    <line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/>
    <line x1="14" y1="1" x2="14" y2="4"/>
  </svg>
);

const IconMealDinner = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const IconMealSnack = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </svg>
);

const IconStat1 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const IconStat2 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
);

const IconStat3 = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const IconStatWeight = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
  </svg>
);

const IconEmptyScans = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const MEAL_ICONS: Record<MealLog['meal_type'], React.JSX.Element> = {
  breakfast: <IconMealBreakfast />,
  lunch: <IconMealLunch />,
  dinner: <IconMealDinner />,
  snack: <IconMealSnack />,
};

const NAV_ICONS = {
  overview: <IconOverview />,
  meals: <IconMeals />,
  history: <IconHistory />,
};

// ── Calorie Ring ───────────────────────────────────────────────

function CalorieRing({ consumed, goal }: { consumed: number; goal: number }) {
  const pct = Math.min(consumed / goal, 1);
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = pct >= 1 ? '#ef4444' : pct >= 0.85 ? '#f59e0b' : '#60a5fa';

  return (
    <div className="calorie-ring-wrapper">
      <svg viewBox="0 0 120 120" className="calorie-ring-svg">
        <circle cx="60" cy="60" r={r} className="ring-track" />
        <circle
          cx="60" cy="60" r={r}
          className="ring-fill"
          style={{
            strokeDasharray: `${dash} ${circ}`,
            stroke: color,
            transition: 'stroke-dasharray 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>
      <div className="ring-center">
        <span className="ring-calories" style={{ color }}>{consumed.toLocaleString()}</span>
        <span className="ring-label">of {goal.toLocaleString()}</span>
        <span className="ring-unit">kcal</span>
      </div>
    </div>
  );
}

// ── Macro Bar ──────────────────────────────────────────────────

function MacroBar({ label, value, max, color, unit }: { label: string; value: number; max: number; color: string; unit: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="macro-bar-item">
      <div className="macro-bar-header">
        <span className="macro-label">{label}</span>
        <span className="macro-value" style={{ color }}>{value.toFixed(1)}{unit}</span>
      </div>
      <div className="macro-bar-track">
        <div
          className="macro-bar-fill"
          style={{ width: `${pct}%`, background: color, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </div>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────

function Dashboard({ session }: DashboardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [recentScans, setRecentScans] = useState<AnalysisLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'meals' | 'history'>('overview');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<Partial<AnalysisLog> & { meal_type: MealLog['meal_type'] } | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [scannedImage, setScannedImage] = useState<string | null>(null);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const SCAN_COOLDOWN_MS = 10000; // 10 seconds cooldown
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);

  const today = new Date().toISOString().split('T')[0];

  const fetchData = useCallback(async () => {
    setLoading(true);
    const userId = session.user.id;

    const [profileRes, mealRes, scanRes] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('full_name, email, daily_calorie_goal, weight_kg, height_cm')
        .eq('id', userId)
        .single(),
      supabase
        .from('meal_logs')
        .select('id, meal_type, calories, protein_g, carbs_g, fat_g, logged_at')
        .eq('user_id', userId)
        .eq('log_date', today),
      supabase
        .from('analysis_logs')
        .select('id, food_name, calories, protein_g, carbs_g, fat_g, serving_size, scanned_at')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false })
        .limit(5),
    ]);

    if (profileRes.data) {
      setProfile(profileRes.data);
      // Gate: show onboarding if height or weight not set
      if (!profileRes.data.height_cm || !profileRes.data.weight_kg) {
        setShowOnboarding(true);
      }
    }
    if (mealRes.data) setMealLogs(mealRes.data);
    if (scanRes.data) setRecentScans(scanRes.data);

    setLoading(false);
  }, [session.user.id, today]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (lastScanTime === 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, SCAN_COOLDOWN_MS - (Date.now() - lastScanTime));
      setCooldownRemaining(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [lastScanTime]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (showCamera) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch(err => {
          console.error("Error accessing camera:", err);
          alert("Could not access camera.");
          setShowCamera(false);
        });
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [showCamera]);

  // After onboarding saves, re-fetch profile so dashboard reflects new values
  const handleOnboardingComplete = useCallback(async () => {
    setShowOnboarding(false);
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, email, daily_calorie_goal, weight_kg, height_cm')
      .eq('id', session.user.id)
      .single();
    if (data) setProfile(data);
  }, [session.user.id]);

  const handleLogout = async () => { await supabase.auth.signOut(); };

  const handleCapture = async () => {
    if (Date.now() - lastScanTime < SCAN_COOLDOWN_MS) {
      alert(`Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before scanning again.`);
      return;
    }

    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64dataWithPrefix = canvas.toDataURL('image/jpeg', 0.8);
    const base64data = base64dataWithPrefix.split(',')[1];
    
    setScannedImage(base64dataWithPrefix);
    setShowCamera(false); // Close camera viewfinder
    setIsAnalyzing(true);
    
    try {
      const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Analyze this food image. Return a JSON object ONLY with the following structure, with no markdown formatting or backticks:
      {
        "food_name": "string (name of food/drink)",
        "serving_size": "string (e.g. '1 bowl', '200g')",
        "calories": number,
        "protein_g": number,
        "carbs_g": number,
        "fat_g": number
      }
      Provide your best estimates.`;

      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64data, mimeType: "image/jpeg" } }
      ]);
      
      let responseText = result.response.text();
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(responseText);

      setScanResult({
        food_name: parsed.food_name || 'Unknown Food',
        serving_size: parsed.serving_size || '1 serving',
        calories: parsed.calories || 0,
        protein_g: parsed.protein_g || 0,
        carbs_g: parsed.carbs_g || 0,
        fat_g: parsed.fat_g || 0,
        meal_type: getDefaultMealType()
      });
      setLastScanTime(Date.now());
      setCooldownRemaining(SCAN_COOLDOWN_MS);
    } catch (err) {
      console.error("Gemini API Error:", err);
      alert("Error analyzing image: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSaveScan = async () => {
    if (!scanResult) return;
    
    // Insert into analysis_logs
    const { error: analysisError } = await supabase
      .from('analysis_logs')
      .insert({
        user_id: session.user.id,
        food_name: scanResult.food_name,
        serving_size: scanResult.serving_size,
        calories: scanResult.calories,
        protein_g: scanResult.protein_g,
        carbs_g: scanResult.carbs_g,
        fat_g: scanResult.fat_g
      })
      .select()
      .single();

    if (analysisError) {
      alert("Failed to save scan");
      return;
    }

    // Insert or update meal_logs
    if (scanResult.meal_type) {
      const existing = mealLogs.find(m => m.meal_type === scanResult.meal_type);
      if (existing) {
        await supabase
          .from('meal_logs')
          .update({
            calories: existing.calories + (scanResult.calories || 0),
            protein_g: Number(existing.protein_g) + Number(scanResult.protein_g || 0),
            carbs_g: Number(existing.carbs_g) + Number(scanResult.carbs_g || 0),
            fat_g: Number(existing.fat_g) + Number(scanResult.fat_g || 0)
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('meal_logs')
          .insert({
            user_id: session.user.id,
            meal_type: scanResult.meal_type,
            log_date: today,
            calories: scanResult.calories || 0,
            protein_g: scanResult.protein_g || 0,
            carbs_g: scanResult.carbs_g || 0,
            fat_g: scanResult.fat_g || 0
          });
      }
    }

    setScanResult(null);
    fetchData();
  };

  const totals = mealLogs.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      protein: acc.protein + Number(m.protein_g),
      carbs: acc.carbs + Number(m.carbs_g),
      fat: acc.fat + Number(m.fat_g),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const calorieGoal = profile?.daily_calorie_goal ?? 2000;
  const remaining = Math.max(calorieGoal - totals.calories, 0);
  const displayName = profile?.full_name?.split(' ')[0] || session.user.email?.split('@')[0] || 'there';

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <div className="db-loading">
        <div className="db-spinner" />
        <p>Loading your dashboard</p>
      </div>
    );
  }

  return (
    <div className="db-root">
      {/* Onboarding modal — shown over the dashboard when profile is incomplete */}
      {showOnboarding && (
        <OnboardingModal
          userId={session.user.id}
          onComplete={handleOnboardingComplete}
        />
      )}

      {/* Camera Viewfinder */}
      {showCamera && (
        <div className="db-modal-overlay">
          <div className="db-camera-container">
            <video ref={videoRef} autoPlay playsInline className="db-camera-video" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            <div className="db-camera-actions">
              <button className="db-btn-secondary" onClick={() => setShowCamera(false)}>Cancel</button>
              <button className="db-btn-primary" onClick={handleCapture}>Capture</button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay for Camera */}
      {isAnalyzing && (
        <div className="db-loading-overlay">
          <div className="db-spinner" />
          <p>Analyzing food with AI...</p>
        </div>
      )}

      {/* Scan Confirmation Modal */}
      {scanResult && (
        <div className="db-modal-overlay">
          <div className="db-modal-content" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="db-modal-title">AI Scan Result</h2>
            {scannedImage && (
              <img src={scannedImage} alt="Scanned food" style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} />
            )}
            <div className="db-scan-form">
              <label>Food Name</label>
              <input type="text" value={scanResult.food_name || ''} onChange={(e) => setScanResult({...scanResult, food_name: e.target.value})} />
              
              <label>Serving Size</label>
              <input type="text" value={scanResult.serving_size || ''} onChange={(e) => setScanResult({...scanResult, serving_size: e.target.value})} />
              
              <div className="db-scan-macros-grid">
                <div><label>Calories</label><input type="number" value={scanResult.calories} onChange={(e) => setScanResult({...scanResult, calories: Number(e.target.value)})} /></div>
                <div><label>Protein (g)</label><input type="number" value={scanResult.protein_g} onChange={(e) => setScanResult({...scanResult, protein_g: Number(e.target.value)})} /></div>
                <div><label>Carbs (g)</label><input type="number" value={scanResult.carbs_g} onChange={(e) => setScanResult({...scanResult, carbs_g: Number(e.target.value)})} /></div>
                <div><label>Fat (g)</label><input type="number" value={scanResult.fat_g} onChange={(e) => setScanResult({...scanResult, fat_g: Number(e.target.value)})} /></div>
              </div>

              <label>Meal Type</label>
              <select value={scanResult.meal_type} onChange={(e) => setScanResult({...scanResult, meal_type: e.target.value as any})}>
                <option value="breakfast">Breakfast (6am - 9am)</option>
                <option value="lunch">Lunch (11am - 1pm)</option>
                <option value="dinner">Dinner (5pm - 8pm)</option>
                <option value="snack">Snack (Anytime)</option>
              </select>
            </div>
            <div className="db-modal-actions">
              <button className="db-btn-secondary" onClick={() => setScanResult(null)}>Cancel</button>
              <button className="db-btn-primary" onClick={handleSaveScan}>Save Log</button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="db-sidebar">
        <div className="db-brand">
          <span className="db-brand-icon"><IconLogo /></span>
          <span className="db-brand-name">MacroLens</span>
        </div>

        <nav className="db-nav">
          {(['overview', 'meals', 'history'] as const).map((tab) => (
            <button
              key={tab}
              id={`nav-${tab}`}
              className={`db-nav-item ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="db-nav-icon">{NAV_ICONS[tab]}</span>
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </nav>

        <div className="db-sidebar-footer">
          <div className="db-user-chip">
            <div className="db-avatar">{displayName[0].toUpperCase()}</div>
            <div className="db-user-info">
              <span className="db-user-name">{profile?.full_name || displayName}</span>
              <span className="db-user-email">{profile?.email}</span>
            </div>
          </div>
          <button id="logout-btn" className="db-logout-btn" onClick={handleLogout} title="Sign out">
            <IconLogout />
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="db-main">
        <header className="db-header">
          <div>
            <h1 className="db-greeting">{greeting}, {displayName}</h1>
            <p className="db-date">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="db-remaining-pill">
            <span className="db-remaining-num">{remaining.toLocaleString()}</span>
            <span className="db-remaining-lbl">kcal remaining</span>
          </div>
        </header>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="db-tab-content" id="tab-overview">
            <div className="db-overview-grid">
              <div className="db-card db-card-ring">
                <h3 className="db-card-title">Today's Calories</h3>
                <CalorieRing consumed={totals.calories} goal={calorieGoal} />
              </div>

              <div className="db-card db-card-macros">
                <h3 className="db-card-title">Macronutrients</h3>
                <div className="macro-bars">
                  <MacroBar label="Protein" value={totals.protein} max={200} color="#60a5fa" unit="g" />
                  <MacroBar label="Carbs" value={totals.carbs} max={300} color="#a78bfa" unit="g" />
                  <MacroBar label="Fat" value={totals.fat} max={80} color="#f59e0b" unit="g" />
                </div>
                <div className="macro-totals-row">
                  <div className="macro-total-chip" style={{ '--chip-color': '#60a5fa' } as React.CSSProperties}>
                    <span>{totals.protein.toFixed(0)}g</span><span>Protein</span>
                  </div>
                  <div className="macro-total-chip" style={{ '--chip-color': '#a78bfa' } as React.CSSProperties}>
                    <span>{totals.carbs.toFixed(0)}g</span><span>Carbs</span>
                  </div>
                  <div className="macro-total-chip" style={{ '--chip-color': '#f59e0b' } as React.CSSProperties}>
                    <span>{totals.fat.toFixed(0)}g</span><span>Fat</span>
                  </div>
                </div>
              </div>

              <div className="db-card db-card-stats">
                <h3 className="db-card-title">Quick Stats</h3>
                <div className="quick-stats">
                  <div className="stat-item">
                    <span className="stat-icon"><IconStat1 /></span>
                    <span className="stat-value">{mealLogs.length}</span>
                    <span className="stat-label">Meals Today</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon"><IconStat2 /></span>
                    <span className="stat-value">{totals.calories.toLocaleString()}</span>
                    <span className="stat-label">kcal Logged</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon"><IconStat3 /></span>
                    <span className="stat-value">{recentScans.length}</span>
                    <span className="stat-label">Recent Scans</span>
                  </div>
                  {profile?.weight_kg && (
                    <div className="stat-item">
                      <span className="stat-icon"><IconStatWeight /></span>
                      <span className="stat-value">{profile.weight_kg}kg</span>
                      <span className="stat-label">Weight</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MEALS TAB */}
        {activeTab === 'meals' && (
          <div className="db-tab-content" id="tab-meals">
            <h2 className="db-section-title">Today's Meal Breakdown</h2>
            <div className="meals-grid">
              {MEAL_ORDER.map((type) => {
                const log = mealLogs.find((m) => m.meal_type === type);
                return (
                  <div key={type} className={`meal-card ${log ? 'meal-card--logged' : 'meal-card--empty'}`} id={`meal-${type}`}>
                    <div className="meal-card-header">
                      <span className="meal-icon">{MEAL_ICONS[type]}</span>
                      <span className="meal-name">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      {log && <span className="meal-time">{formatTime(log.logged_at)}</span>}
                    </div>
                    {log ? (
                      <>
                        <div className="meal-calories">{log.calories} <span>kcal</span></div>
                        <div className="meal-macros-row">
                          <span style={{ color: '#60a5fa' }}>P {Number(log.protein_g).toFixed(1)}g</span>
                          <span style={{ color: '#a78bfa' }}>C {Number(log.carbs_g).toFixed(1)}g</span>
                          <span style={{ color: '#f59e0b' }}>F {Number(log.fat_g).toFixed(1)}g</span>
                        </div>
                      </>
                    ) : (
                      <div className="meal-empty-msg">No entry yet</div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="db-card day-totals-card">
              <h3 className="db-card-title">Daily Total</h3>
              <div className="day-totals-row">
                <div className="day-total-item">
                  <span className="day-total-val">{totals.calories.toLocaleString()}</span>
                  <span className="day-total-lbl">kcal</span>
                </div>
                <div className="day-total-divider" />
                <div className="day-total-item">
                  <span className="day-total-val" style={{ color: '#60a5fa' }}>{totals.protein.toFixed(1)}g</span>
                  <span className="day-total-lbl">Protein</span>
                </div>
                <div className="day-total-divider" />
                <div className="day-total-item">
                  <span className="day-total-val" style={{ color: '#a78bfa' }}>{totals.carbs.toFixed(1)}g</span>
                  <span className="day-total-lbl">Carbs</span>
                </div>
                <div className="day-total-divider" />
                <div className="day-total-item">
                  <span className="day-total-val" style={{ color: '#f59e0b' }}>{totals.fat.toFixed(1)}g</span>
                  <span className="day-total-lbl">Fat</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="db-tab-content" id="tab-history">
            <h2 className="db-section-title">Recent AI Scans</h2>
            {recentScans.length === 0 ? (
              <div className="empty-state">
                <IconEmptyScans />
                <p>No food scans yet. Use MacroLens to scan your first meal.</p>
              </div>
            ) : (
              <div className="scans-list">
                {recentScans.map((scan) => (
                  <div key={scan.id} className="scan-item" id={`scan-${scan.id}`}>
                    <div className="scan-info">
                      <span className="scan-name">{scan.food_name}</span>
                      {scan.serving_size && <span className="scan-serving">{scan.serving_size}</span>}
                      <span className="scan-time">
                        {new Date(scan.scanned_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        {' · '}
                        {formatTime(scan.scanned_at)}
                      </span>
                    </div>
                    <div className="scan-macros">
                      <div className="scan-cal">{scan.calories} kcal</div>
                      <div className="scan-macros-row">
                        <span style={{ color: '#60a5fa' }}>P {Number(scan.protein_g).toFixed(1)}g</span>
                        <span style={{ color: '#a78bfa' }}>C {Number(scan.carbs_g).toFixed(1)}g</span>
                        <span style={{ color: '#f59e0b' }}>F {Number(scan.fat_g).toFixed(1)}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FAB Camera Button */}
      <button 
        className="db-fab-camera" 
        onClick={() => setShowCamera(true)} 
        aria-label="Scan food"
        disabled={cooldownRemaining > 0}
        style={{ opacity: cooldownRemaining > 0 ? 0.5 : 1 }}
      >
        <IconCamera />
        {cooldownRemaining > 0 && (
          <span style={{ position: 'absolute', top: -10, right: -10, background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '12px', fontWeight: 'bold' }}>
            {Math.ceil(cooldownRemaining / 1000)}s
          </span>
        )}
      </button>
    </div>
  );
}

export default Dashboard;
