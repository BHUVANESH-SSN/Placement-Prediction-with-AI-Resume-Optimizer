'use client';

import AuthLayout from '@/components/AuthLayout';
import { apiPost, saveAuth } from '@/lib/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/* ─── Shared Components & Icons ─── */
const EyeOn = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function Field({
  label, icon, error, children,
}: {
  label: string; icon: React.ReactNode; error?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600,
        color: '#5a576e', letterSpacing: 0.4, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif'
      }}>
        <span style={{ color: error ? '#ef4444' : '#6c47ff', display: 'flex' }}>{icon}</span>
        {label}
      </label>
      {children}
      {error && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: '#ef4444', fontWeight: 600, fontFamily: 'Montserrat, sans-serif' }}>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor"><path d="M6 1a5 5 0 100 10A5 5 0 006 1zm0 7.5a.6.6 0 110-1.2.6.6 0 010 1.2zm.5-2.5h-1V3.5h1V6z" /></svg>
          {error}
        </span>
      )}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email';
    if (!form.password) e.password = 'Password is required';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiPost('/auth/login', {
        email: form.email,
        password: form.password,
      });
      saveAuth(data.access_token, form.email, '');
      router.push('/home');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }));
    if (fieldErrors[field]) setFieldErrors(fe => ({ ...fe, [field]: '' }));
  }

  return (
    <AuthLayout>
      <div className="w-full fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(108, 71, 255, 0.08)',
            border: '1px solid rgba(108, 71, 255, 0.2)', borderRadius: 20, padding: '4px 12px', marginBottom: 14,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c47ff', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#6c47ff', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
              Welcome Back
            </span>
          </div>

          <h1 className="heading" style={{ fontSize: 'clamp(30px, 3.8vw, 44px)', marginBottom: 10, marginTop: 0 }}>
            Log in to your<br />
            <span className="heading-accent">Dashboard</span>
          </h1>
          <p style={{ fontSize: 14.5, color: '#9896a4', lineHeight: 1.65, fontFamily: 'Montserrat, sans-serif', fontWeight: 400, margin: 0 }}>
            Access your tailored resumes, gap analysis, and applications.
          </p>
        </div>

        {error && (
          <div className="error-banner fade-in-up" style={{ marginBottom: 20 }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zm0 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
            {error}
          </div>
        )}

        {/* ── Social Sign‑in ── */}
        <div className="fade-in-up fade-in-up-delay-1" style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11.5, color: '#9896a4', fontWeight: 600, letterSpacing: 0.5, marginBottom: 10, fontFamily: 'Montserrat, sans-serif' }}>
            Quick sign‑in with
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <button
              type="button"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px',
                border: '1.5px solid #e5e4ef', borderRadius: 12, background: 'white', fontSize: 13.5, fontWeight: 700,
                color: '#1A1624', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Montserrat, sans-serif',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#6c47ff';
                (e.currentTarget as HTMLButtonElement).style.background = '#f5f3ff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e4ef';
                (e.currentTarget as HTMLButtonElement).style.background = 'white';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button
              type="button"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 16px',
                border: '1.5px solid #e5e4ef', borderRadius: 12, background: 'white', fontSize: 13.5, fontWeight: 700,
                color: '#1A1624', cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'Montserrat, sans-serif',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#6c47ff';
                (e.currentTarget as HTMLButtonElement).style.background = '#f5f3ff';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#e5e4ef';
                (e.currentTarget as HTMLButtonElement).style.background = 'white';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              GitHub
            </button>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="fade-in-up fade-in-up-delay-1" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: '#e5e4ef' }} />
          <span style={{ fontSize: 10.5, color: '#b0aec8', fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
            or sign in with email
          </span>
          <div style={{ flex: 1, height: 1, background: '#e5e4ef' }} />
        </div>

        <form className="fade-in-up fade-in-up-delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 14 }} onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <Field label="Email Address" icon={<MailIcon />} error={fieldErrors.email}>
            <input
              type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)}
              className={`form-input ${fieldErrors.email ? 'input-error' : ''}`} autoComplete="email" style={{ paddingLeft: 14 }}
            />
          </Field>

          {/* Password */}
          <Field label="Password" icon={<LockIcon />} error={fieldErrors.password}>
            <div className="input-wrapper">
              <input
                type={showPw ? 'text' : 'password'} placeholder="••••••••••••" value={form.password} onChange={e => set('password', e.target.value)}
                className={`form-input ${fieldErrors.password ? 'input-error' : ''}`} autoComplete="current-password" style={{ paddingLeft: 14, paddingRight: 40 }}
              />
              <button type="button" className="input-icon-btn" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                {showPw ? <EyeOff /> : <EyeOn />}
              </button>
            </div>
          </Field>

          {/* Remember / Forgot */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="checkbox-label" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 600 }}>
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
              Remember me
            </label>
            <button type="button" className="btn-link" style={{ fontFamily: 'Montserrat, sans-serif', fontSize: 12.5, fontWeight: 700, color: '#6c47ff' }}>
              Forgot Password?
            </button>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: 6 }}>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="spinner" /> Signing in...
              </span>
            ) : 'Sign In →'}
          </button>
        </form>

        <p className="fade-in-up fade-in-up-delay-3" style={{ marginTop: 24, fontSize: 13.5, color: '#9896a4', textAlign: 'center', fontFamily: 'Montserrat, sans-serif' }}>
          New to AIRO?{' '}
          <Link href="/signup" style={{ color: '#6c47ff', fontWeight: 700, textDecoration: 'none' }}>
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
