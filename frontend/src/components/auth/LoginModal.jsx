import React, { useState } from 'react';

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid work email address.');
      return;
    }
    if (!cleanPassword) {
      setError('Please enter your account password.');
      return;
    }
    if (cleanPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }

    onLoginSuccess({
      email: cleanEmail,
      name: cleanName || cleanEmail.split('@')[0],
      loggedInAt: new Date().toISOString(),
    });
  };

  const handleDemoLogin = () => {
    setEmail('editor@brand.com');
    setPassword('editorial2026!');
    setName('Alex Morgan');
    setError('');

    onLoginSuccess({
      email: 'editor@brand.com',
      name: 'Alex Morgan',
      isDemo: true,
      loggedInAt: new Date().toISOString(),
    });
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'none',
            border: 'none',
            fontSize: '1.2rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="auth-modal-header">
          <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>✦</div>
          <h2 className="auth-modal-title">Sign in to ALTLUME</h2>
          <p className="auth-modal-subtitle">
            Enter your email and password to begin catalogue onboarding and access your review studio.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--rose-bg)',
            border: '1px solid var(--rose-border)',
            color: 'var(--rose)',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label" htmlFor="login-name">Your Full Name (Optional)</label>
            <input
              id="login-name"
              type="text"
              className="auth-form-input"
              placeholder="e.g. Alex Morgan"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div className="auth-form-group">
            <label className="auth-form-label" htmlFor="login-email">Work Email *</label>
            <input
              id="login-email"
              type="email"
              required
              className="auth-form-input"
              placeholder="editor@yourbrand.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <div className="auth-form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="auth-form-label" htmlFor="login-password" style={{ margin: 0 }}>Password *</label>
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent-indigo)',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {showPassword ? 'Hide 🙈' : 'Show 👁️'}
              </button>
            </div>
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              required
              className="auth-form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError('');
              }}
            />
          </div>

          <button type="submit" className="auth-btn-primary" style={{ marginTop: '12px' }}>
            Sign In & Continue to Onboarding →
          </button>
        </form>

        <div className="auth-divider">
          <span>or one-click demo login</span>
        </div>

        <button
          type="button"
          className="auth-btn-demo"
          onClick={handleDemoLogin}
          title="Instant sign-in as Commerce Editor"
        >
          <span>⚡ Instant Demo Sign-In (editor@brand.com)</span>
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to human-in-the-loop validation policies and verified alt-text standards.
        </div>
      </div>
    </div>
  );
}
