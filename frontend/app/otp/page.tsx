'use client';

import AuthLayout from '@/components/AuthLayout';
import { apiPost, saveAuth } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const OTP_LEN = 6;
const RESEND_SEC = 60;

/* ─── Inline styles (no extra CSS needed) ─── */
const S = {
  page: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 0,
  },

  /* back button */
  back: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#9896a4',
    fontSize: 13,
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 600,
    padding: '0 0 32px 0',
    transition: 'color 0.2s',
    letterSpacing: 0.2,
  },

  /* progress bar */
  progressWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 32,
  },
  progressStep: (active: boolean, done: boolean) => ({
    flex: 1,
    height: 3,
    borderRadius: 10,
    background: done ? '#6c47ff' : active ? 'rgba(108,71,255,0.4)' : '#e5e4ef',
    transition: 'background 0.4s',
  }),
  progressDot: (active: boolean, done: boolean) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: done || active ? '#6c47ff' : '#e5e4ef',
    transition: 'background 0.4s',
    flexShrink: 0,
  }),

  /* header pill */
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(108,71,255,0.08)',
    border: '1px solid rgba(108,71,255,0.2)',
    borderRadius: 20,
    padding: '4px 12px',
    marginBottom: 16,
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#6c47ff',
    animation: 'pulse 2s infinite',
  },
  pillText: {
    fontSize: 11,
    fontWeight: 700,
    color: '#6c47ff',
    letterSpacing: 1.5,
    textTransform: 'uppercase' as const,
    fontFamily: 'Montserrat, sans-serif',
  },

  /* icon box */
  iconBox: {
    width: 68,
    height: 68,
    borderRadius: 22,
    background: 'linear-gradient(135deg, rgba(108,71,255,0.12) 0%, rgba(108,71,255,0.04) 100%)',
    border: '1.5px solid rgba(108,71,255,0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    boxShadow: '0 4px 20px rgba(108,71,255,0.12)',
  },

  /* email badge */
  emailBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    background: '#f5f3ff',
    border: '1px solid rgba(108,71,255,0.2)',
    borderRadius: 8,
    padding: '5px 10px',
    fontFamily: 'Montserrat, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    color: '#6c47ff',
    marginTop: 4,
  },

  /* OTP grid */
  otpGrid: {
    display: 'flex',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 6,
  },

  /* verify button */
  verifyBtn: (disabled: boolean) => ({
    width: '100%',
    padding: '15px',
    background: disabled
      ? 'rgba(108,71,255,0.35)'
      : 'linear-gradient(135deg, #6c47ff 0%, #8b6bff 100%)',
    color: 'white',
    border: 'none',
    borderRadius: 14,
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 800,
    fontSize: 15,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.25s',
    boxShadow: disabled ? 'none' : '0 6px 24px rgba(108,71,255,0.4)',
    letterSpacing: 0.3,
    marginTop: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  }),

  /* info box */
  infoBox: {
    marginTop: 20,
    padding: '14px 18px',
    background: 'rgba(108,71,255,0.04)',
    borderRadius: 12,
    border: '1px solid rgba(108,71,255,0.1)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    fontSize: 12.5,
    color: '#9896a4',
    lineHeight: 1.6,
    fontFamily: 'Montserrat, sans-serif',
  },

  /* timer row */
  timerRow: {
    marginTop: 20,
    textAlign: 'center' as const,
    fontSize: 13.5,
    color: '#9896a4',
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 500,
  },

  /* circular timer */
  circleTimerWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },

  /* success state */
  successWrap: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    textAlign: 'center' as const,
    gap: 0,
    paddingTop: 12,
  },
  successRing: {
    width: 88,
    height: 88,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, rgba(34,197,94,0.15) 0%, rgba(34,197,94,0.05) 100%)',
    border: '2px solid rgba(34,197,94,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    boxShadow: '0 0 32px rgba(34,197,94,0.2)',
    animation: 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)',
  },
};

/* ─── OTP digit box ─── */
function OTPBox({
  value, focused, error, disabled, inputRef, onChange, onKeyDown, onFocus, index,
}: {
  value: string;
  focused: boolean;
  error: boolean;
  disabled: boolean;
  inputRef: (el: HTMLInputElement | null) => void;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  index: number;
}) {
  const filled = !!value;
  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        maxLength={1}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        disabled={disabled}
        aria-label={`OTP digit ${index + 1}`}
        style={{
          width: 54,
          height: 62,
          textAlign: 'center',
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 24,
          fontWeight: 800,
          border: error
            ? '2px solid #ef4444'
            : focused
              ? '2px solid #6c47ff'
              : filled
                ? '2px solid rgba(108,71,255,0.5)'
                : '2px solid #e5e4ef',
          borderRadius: 14,
          background: error
            ? 'rgba(239,68,68,0.04)'
            : focused
              ? 'rgba(108,71,255,0.06)'
              : filled
                ? 'rgba(108,71,255,0.04)'
                : 'white',
          outline: 'none',
          color: error ? '#ef4444' : '#0d0d14',
          caretColor: '#6c47ff',
          boxShadow: error
            ? '0 0 0 4px rgba(239,68,68,0.12)'
            : focused
              ? '0 0 0 4px rgba(108,71,255,0.15), 0 4px 16px rgba(108,71,255,0.18)'
              : filled
                ? '0 2px 10px rgba(108,71,255,0.1)'
                : '0 1px 4px rgba(0,0,0,0.04)',
          transform: focused ? 'translateY(-2px) scale(1.06)' : filled ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: disabled ? 'not-allowed' : 'text',
          letterSpacing: 0,
        }}
      />
      {/* filled dot indicator */}
      {filled && !focused && !error && (
        <div style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#6c47ff',
          animation: 'popIn 0.2s ease',
        }} />
      )}
    </div>
  );
}

/* ─── Circular countdown ─── */
function CircleTimer({ seconds, total }: { seconds: number; total: number }) {
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const progress = seconds / total;
  const dashoffset = circumference * (1 - progress);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
      <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
        {/* track */}
        <circle cx="24" cy="24" r={r} fill="none" stroke="#e5e4ef" strokeWidth="3" />
        {/* fill */}
        <circle
          cx="24" cy="24" r={r}
          fill="none"
          stroke={seconds <= 10 ? '#ef4444' : '#6c47ff'}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
        />
      </svg>
      {/* label inside */}
      <div style={{ marginLeft: -48, width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{
          fontFamily: 'Montserrat, sans-serif',
          fontSize: 12,
          fontWeight: 800,
          color: seconds <= 10 ? '#ef4444' : '#6c47ff',
          transition: 'color 0.3s',
        }}>
          {String(seconds).padStart(2, '0')}
        </span>
      </div>
      <span style={{ fontSize: 13, color: '#9896a4', fontFamily: 'Montserrat, sans-serif', fontWeight: 500 }}>
        sec to resend
      </span>
    </div>
  );
}

/* ─── Main Component ─── */
export default function OTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState<string[]>(Array(OTP_LEN).fill(''));
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timer, setTimer] = useState(RESEND_SEC);
  const [pending, setPending] = useState<{ full_name: string; email: string; password: string } | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // hover state for verify button
  const [btnHover, setBtnHover] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem('pending_signup');
    if (!raw) { router.replace('/signup'); return; }
    setPending(JSON.parse(raw));
    setTimeout(() => refs.current[0]?.focus(), 100);
  }, [router]);

  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  function handleChange(i: number, val: string) {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setError('');
    if (digit && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      if (otp[i]) { const n = [...otp]; n[i] = ''; setOtp(n); }
      else if (i > 0) refs.current[i - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < OTP_LEN - 1) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LEN);
    const next = [...otp];
    digits.split('').forEach((d, i) => { next[i] = d; });
    setOtp(next);
    refs.current[Math.min(digits.length, OTP_LEN - 1)]?.focus();
  }

  const verify = useCallback(async () => {
    if (!pending) return;
    const code = otp.join('');
    if (code.length < OTP_LEN) { setError('Please enter the complete 6-digit code'); return; }
    setLoading(true);
    setError('');
    try {
      await apiPost('/auth/signup', {
        full_name: pending.full_name,
        email: pending.email,
        password: pending.password,
        otp: code,
      });
      const loginData = await apiPost('/auth/login', {
        email: pending.email,
        password: pending.password,
      });
      saveAuth(loginData.access_token, pending.email, pending.full_name);
      sessionStorage.removeItem('pending_signup');
      setSuccess(true);
      setTimeout(() => router.push('/home'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired OTP. Please try again.');
      setOtp(Array(OTP_LEN).fill(''));
      setTimeout(() => refs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  }, [otp, pending, router]);

  // Auto-submit when all filled
  useEffect(() => {
    if (otp.every(d => d !== '') && !loading && !success) verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  async function resend() {
    if (!pending || timer > 0) return;
    setResending(true);
    setError('');
    try {
      await apiPost('/auth/send-otp', { email: pending.email });
      setOtp(Array(OTP_LEN).fill(''));
      setTimer(RESEND_SEC);
      setTimeout(() => refs.current[0]?.focus(), 50);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  }

  const filledCount = otp.filter(d => d !== '').length;
  const masked = pending?.email.replace(/(.{2}).+(@.+)/, '$1•••$2') ?? '...';
  const allFilled = otp.every(d => d !== '');

  /* ──── Success Screen ──── */
  if (success) return (
    <AuthLayout>
      <div style={S.successWrap} className="fade-in-up">
        {/* Big animated checkmark */}
        <div style={S.successRing}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"
            stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Confetti-like dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
          {['#6c47ff', '#22c55e', '#f97316', '#6c47ff', '#22c55e'].map((c, i) => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: c,
              animation: `popIn 0.3s ease ${i * 0.08}s both`,
            }} />
          ))}
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(34,197,94,0.08)',
            border: '1px solid rgba(34,197,94,0.25)',
            borderRadius: 20,
            padding: '4px 12px',
            marginBottom: 16,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Montserrat, sans-serif' }}>
              Verified
            </span>
          </div>
        </div>

        <h2 className="heading" style={{ fontSize: 'clamp(30px, 4vw, 44px)', marginBottom: 10 }}>
          Welcome aboard,<br />
          <span className="heading-accent">
            {pending?.full_name.split(' ')[0] ?? 'Friend'}!
          </span>
        </h2>
        <p style={{ fontSize: 15, color: '#9896a4', lineHeight: 1.65, fontFamily: 'Montserrat, sans-serif', marginBottom: 32 }}>
          Your account is all set. Taking you to<br />your dashboard now…
        </p>

        {/* Progress bar */}
        <div style={{ width: '100%', height: 3, background: '#e5e4ef', borderRadius: 10, overflow: 'hidden', maxWidth: 280 }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6c47ff, #22c55e)',
            borderRadius: 10,
            animation: 'progressFill 2s linear forwards',
          }} />
        </div>

        <style>{`
          @keyframes progressFill {
            from { width: 0% }
            to   { width: 100% }
          }
        `}</style>
      </div>
    </AuthLayout>
  );

  /* ──── Main OTP Screen ──── */
  return (
    <AuthLayout>
      <div style={S.page} className="fade-in-up">

        {/* ── Back ── */}
        <button
          onClick={() => router.push('/signup')}
          style={S.back}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6c47ff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#9896a4'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Signup
        </button>

        {/* ── Step Progress Bar ── */}
        <div style={S.progressWrap}>
          <div style={S.progressDot(false, true)} />
          <div style={S.progressStep(false, true)} />
          <div style={S.progressDot(true, false)} />
          <div style={S.progressStep(true, false)} />
          <div style={S.progressDot(false, false)} />
        </div>

        {/* ── Header ── */}
        <div className="fade-in-up" style={{ marginBottom: 32 }}>
          {/* Pill */}
          <div style={S.pill}>
            <div style={S.pillDot} />
            <span style={S.pillText}>Step 2 of 3 — Verification</span>
          </div>

          {/* Icon */}
          <div style={S.iconBox}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>

          <h1 className="heading" style={{ fontSize: 'clamp(28px, 4vw, 42px)', marginBottom: 10 }}>
            Check your<br /><span className="heading-accent">Inbox</span>
          </h1>
          <p style={{ fontSize: 14.5, color: '#9896a4', lineHeight: 1.65, fontFamily: 'Montserrat, sans-serif', marginBottom: 12 }}>
            We sent a 6-digit verification code to
          </p>

          {/* Email badge */}
          <div style={S.emailBadge}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            {masked}
          </div>
        </div>

        {/* ── OTP Inputs ── */}
        <div className="fade-in-up fade-in-up-delay-1">
          {/* Progress dots above boxes */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 14 }}>
            {otp.map((d, i) => (
              <div key={i} style={{
                width: 54,
                height: 3,
                borderRadius: 10,
                background: d ? '#6c47ff' : '#e5e4ef',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>

          <div style={S.otpGrid} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <OTPBox
                key={i}
                index={i}
                value={digit}
                focused={focusedIdx === i}
                error={!!error}
                disabled={loading}
                inputRef={el => { refs.current[i] = el; }}
                onChange={v => handleChange(i, v)}
                onKeyDown={e => handleKeyDown(i, e)}
                onFocus={() => setFocusedIdx(i)}
              />
            ))}
          </div>

          {/* Fill progress text */}
          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 11.5, color: '#b0aec8', fontFamily: 'Montserrat, sans-serif', fontWeight: 600, letterSpacing: 0.5 }}>
            {filledCount === 0
              ? 'Enter your code above'
              : filledCount < OTP_LEN
                ? `${filledCount} of ${OTP_LEN} digits entered`
                : loading
                  ? 'Verifying…'
                  : ''}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 14, padding: '10px 14px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              animation: 'shake 0.35s ease',
            }} className="fade-in-up">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="#ef4444">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3.5a.5.5 0 01.5.5v3a.5.5 0 01-1 0V5a.5.5 0 01.5-.5zm0 7a.75.75 0 110-1.5.75.75 0 010 1.5z" />
              </svg>
              <span style={{ fontSize: 13, color: '#ef4444', fontFamily: 'Montserrat, sans-serif', fontWeight: 600 }}>
                {error}
              </span>
            </div>
          )}

          {/* ── Verify Button ── */}
          <button
            style={{
              ...S.verifyBtn(loading || !allFilled),
              ...(btnHover && !loading && allFilled ? {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 32px rgba(108,71,255,0.5)',
              } : {}),
            }}
            onClick={verify}
            disabled={loading || !allFilled}
            onMouseEnter={() => setBtnHover(true)}
            onMouseLeave={() => setBtnHover(false)}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Verifying your code…
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                Verify & Create Account
              </>
            )}
          </button>

          {/* ── Timer / Resend ── */}
          <div style={S.timerRow}>
            {timer > 0 ? (
              <div style={S.circleTimerWrap}>
                <CircleTimer seconds={timer} total={RESEND_SEC} />
                <p style={{ fontSize: 12.5, color: '#b0aec8', fontFamily: 'Montserrat, sans-serif' }}>
                  Didn&apos;t get the code? Wait to resend.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <p style={{ fontSize: 13, color: '#9896a4', fontFamily: 'Montserrat, sans-serif' }}>
                  Didn&apos;t receive it?
                </p>
                <button
                  onClick={resend}
                  disabled={resending}
                  style={{
                    background: 'none',
                    border: '1.5px solid rgba(108,71,255,0.35)',
                    borderRadius: 10,
                    padding: '8px 20px',
                    color: '#6c47ff',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: resending ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.2s',
                    opacity: resending ? 0.65 : 1,
                  }}
                  onMouseEnter={e => {
                    if (!resending) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(108,71,255,0.06)';
                      (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'none';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  {resending ? (
                    <><span className="spinner" style={{ borderColor: 'rgba(108,71,255,0.3)', borderTopColor: '#6c47ff', width: 14, height: 14 }} /> Sending…</>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 .49-3.69" />
                      </svg>
                      Resend OTP
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ── Info box ── */}
          <div style={S.infoBox}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0aec8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p style={S.infoText}>
              Code expires in <strong style={{ color: '#6c47ff' }}>5 minutes</strong>.
              Check your <strong style={{ color: '#0d0d14' }}>spam folder</strong> if you don&apos;t see it in your inbox.
            </p>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
