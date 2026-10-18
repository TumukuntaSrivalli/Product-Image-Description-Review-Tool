import React, { useState } from 'react';

export function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    const cleanName = name.trim();

    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    onLoginSuccess({
      email: cleanEmail,
      name: cleanName || cleanEmail.split('@')[0],
      loggedInAt: new Date().toISOString(),
    });
  };

  const handleDemoLogin = () => {
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
            Enter your credentials to access your catalogue review studio and deterministic guardrails.
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
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-form-label" htmlFor="login-name">Your Name</label>
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

          <button type="submit" className="auth-btn-primary">
            Continue with Email →
          </button>
        </form>

        <div className="auth-divider">
          <span>or single-click access</span>
        </div>

        <button
          type="button"
          className="auth-btn-demo"
          onClick={handleDemoLogin}
          title="Instant sign-in as Commerce Editor"
        >
          <span>⚡ Continue as Demo Commerce Editor</span>
        </button>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
          By continuing, you agree to editorial terms and human-in-the-loop review policies.
        </div>
      </div>
    </div>
  );
}
