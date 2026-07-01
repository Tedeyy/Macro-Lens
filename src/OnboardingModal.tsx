import { useState } from 'react';
import { supabase } from './supabaseClient';
import './OnboardingModal.css';

interface OnboardingModalProps {
  userId: string;
  onComplete: () => void;
}

const CALORIE_PRESETS = [
  { label: 'Weight loss', value: 1500 },
  { label: 'Maintain', value: 2000 },
  { label: 'Muscle gain', value: 2500 },
  { label: 'Active', value: 3000 },
];

const IconRuler = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.3 8.7 8.7 21.3c-1 1-2.5 1-3.4 0l-2.6-2.6c-1-1-1-2.5 0-3.4L15.3 2.7c1-1 2.5-1 3.4 0l2.6 2.6c1 1 1 2.5 0 3.4Z"/>
    <path d="m7.5 10.5 2 2"/><path d="m10.5 7.5 2 2"/>
    <path d="m13.5 4.5 2 2"/><path d="m4.5 13.5 2 2"/>
  </svg>
);

const IconWeight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="5" r="3"/>
    <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z"/>
  </svg>
);

const IconFire = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"/>
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function OnboardingModal({ userId, onComplete }: OnboardingModalProps) {
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [calories, setCalories] = useState('2000');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePreset = (value: number) => {
    setCalories(String(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const h = parseFloat(height);
    const w = parseFloat(weight);
    const c = parseInt(calories, 10);

    if (!height || isNaN(h) || h < 50 || h > 280) {
      setError('Please enter a valid height between 50 and 280 cm.');
      return;
    }
    if (!weight || isNaN(w) || w < 20 || w > 500) {
      setError('Please enter a valid weight between 20 and 500 kg.');
      return;
    }
    if (!calories || isNaN(c) || c < 500 || c > 10000) {
      setError('Please enter a daily calorie goal between 500 and 10,000 kcal.');
      return;
    }

    setSaving(true);

    const { error: supabaseError } = await supabase
      .from('user_profiles')
      .update({
        height_cm: h,
        weight_kg: w,
        daily_calorie_goal: c,
      })
      .eq('id', userId);

    setSaving(false);

    if (supabaseError) {
      setError(supabaseError.message);
      return;
    }

    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  const activePreset = CALORIE_PRESETS.find(p => String(p.value) === calories)?.value ?? null;

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="ob-title">
        {/* Header */}
        <div className="onboarding-header">
          <div className="onboarding-step-badge">
            <span className="onboarding-step-dot" />
            Profile setup
          </div>
          <h2 className="onboarding-title" id="ob-title">Complete your profile</h2>
          <p className="onboarding-desc">
            We need a few body measurements to calculate your nutrition goals accurately.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="onboarding-body">
            {/* Height & Weight */}
            <div className="ob-row">
              <div className="ob-field">
                <label className="ob-label" htmlFor="ob-height">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconRuler /> Height
                  </span>
                </label>
                <div className="ob-input-wrap">
                  <input
                    id="ob-height"
                    type="number"
                    className="ob-input ob-input--unit"
                    placeholder="175"
                    min={50}
                    max={280}
                    step={0.1}
                    value={height}
                    onChange={e => setHeight(e.target.value)}
                    required
                  />
                  <span className="ob-unit-badge">cm</span>
                </div>
              </div>

              <div className="ob-field">
                <label className="ob-label" htmlFor="ob-weight">
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <IconWeight /> Weight
                  </span>
                </label>
                <div className="ob-input-wrap">
                  <input
                    id="ob-weight"
                    type="number"
                    className="ob-input ob-input--unit"
                    placeholder="70"
                    min={20}
                    max={500}
                    step={0.1}
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    required
                  />
                  <span className="ob-unit-badge">kg</span>
                </div>
              </div>
            </div>

            {/* Daily calorie goal */}
            <div className="ob-field">
              <label className="ob-label" htmlFor="ob-calories">
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <IconFire /> Daily calorie goal <span style={{ marginLeft: 4 }}>(kcal/day)</span>
                </span>
              </label>
              <div className="ob-input-wrap">
                <input
                  id="ob-calories"
                  type="number"
                  className="ob-input ob-input--unit"
                  placeholder="2000"
                  min={500}
                  max={10000}
                  step={50}
                  value={calories}
                  onChange={e => setCalories(e.target.value)}
                  required
                />
                <span className="ob-unit-badge">kcal</span>
              </div>
              {/* Quick presets */}
              <div className="ob-calorie-presets">
                {CALORIE_PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    className={`ob-preset-btn ${activePreset === p.value ? 'active' : ''}`}
                    onClick={() => handlePreset(p.value)}
                  >
                    {p.label} — {p.value.toLocaleString()}
                  </button>
                ))}
              </div>
              <p className="ob-hint">
                Not sure? Start with <strong>2,000 kcal</strong> and adjust after a few days.
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="ob-alert ob-alert--error">
                <IconAlert />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="onboarding-footer">
            <button
              id="ob-save-btn"
              type="submit"
              className="ob-submit-btn"
              disabled={saving}
            >
              {saving
                ? <><span className="ob-spinner" /> Saving…</>
                : <><IconCheck /> Save and continue</>
              }
            </button>
            <button
              type="button"
              className="ob-skip-btn"
              onClick={handleSkip}
              disabled={saving}
            >
              Skip for now — I'll set this up later
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default OnboardingModal;
