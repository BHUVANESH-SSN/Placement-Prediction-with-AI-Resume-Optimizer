'use client';

import { apiGet, apiPatch, apiPostAuth, clearAuth, getAuth } from '@/lib/api';
import {
  Award,
  CheckCircle2,
  Code2,
  Copy,
  Globe,
  LogOut,
  RefreshCw,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ?????? TYPES ?????? */
interface Auth { token: string; email: string | null; name: string | null; }
interface LeetCodeData {
  username: string;
  real_name?: string;
  about?: string;
  ranking?: number;
  reputation?: number;
  avatar?: string;
  country?: string;
  skill_tags?: string[];
  total_solved?: number;
  easy_solved?: number;
  medium_solved?: number;
  hard_solved?: number;
  beats_easy?: number;
  beats_medium?: number;
  beats_hard?: number;
  streak?: number;
  total_active_days?: number;
  submission_calendar?: Record<string, number>;
  badges?: { name: string; icon?: string; id?: string }[];
  languages?: { name: string; count: number }[];
  topic_tags?: {
    advanced?: { name: string; count: number }[];
    intermediate?: { name: string; count: number }[];
    fundamental?: { name: string; count: number }[];
  };
  contest?: {
    rating?: number;
    global_ranking?: number;
    top_percentage?: number;
    attended_count?: number;
  };
  contest_history?: {
    attended?: boolean;
    rating?: number;
    ranking?: number;
    title?: string;
    start_time?: number;
  }[];
}

/* ?????? DESIGN SYSTEM ?????? */
const C = {
  ink: '#0f172a',
  paper: '#f8fafc',
  surface: '#ffffff',
  accent: '#7c3aed',
  accentHov: '#6d28d9',
  accentSoft: '#ede9fe',
  accent2: '#ef4444',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  orange: '#f97316',
  yellow: '#eab308',
};

/* ?????? SCROLL REVEAL ?????? */
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.06 });
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(28px)',
      transition: `opacity 0.5s ease ${delay}ms, transform 0.5s ease ${delay}ms`,
    } as React.CSSProperties,
  };
}

/* ?????? NAVBAR ?????? */
export function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA', 'Predict', 'Nova AI'];
  return (
    <nav style={{ display: 'flex', alignItems: 'center', height: 60, padding: '0 34px', background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/home')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 7 2 12 8 17" /><polyline points="16 7 22 12 16 17" />
        </svg>
        <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: '#0d0d14', display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          AIRO<div style={{ width: '6px', height: '6px', backgroundColor: '#7c3aed', marginLeft: '4px' }} />
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 36, marginRight: '120px' }}>
        {NAV.map(label => (
          <button key={label} onClick={() => {
            if (label === 'Dashboard') router.push('/home');
            if (label === 'Development') router.push('/development');
            if (label === 'Resume Builder') router.push('/resume');
            if (label === 'DSA') router.push('/dsa');
            if (label === 'Predict') router.push('/predict');
            if (label === 'Nova AI') router.push('/career-coach');
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Fira Code', monospace", fontSize: 14, color: active === label ? C.accent : C.muted, fontWeight: active === label ? 700 : 500, borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent', paddingBottom: 4, transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ?????? TOAST ?????? */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: type === 'success' ? C.success : C.accent2, color: '#fff', borderRadius: 14, padding: '13px 20px', fontFamily: "'Fira Code', monospace", fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 32px rgba(15,23,42,0.18)' }}>
      {type === 'success' ? <CheckCircle2 size={16} /> : '???'} {msg}
    </div>
  );
}

/* ?????? DONUT CHART WITH BEATS ?????? */
function DonutChart({ easy, medium, hard, total, beatsEasy, beatsMedium, beatsHard }: {
  easy: number; medium: number; hard: number; total: number;
  beatsEasy?: number; beatsMedium?: number; beatsHard?: number;
}) {
  const reveal = useScrollReveal(60);
  const SIZE = 180, SW = 22, r = (SIZE - SW) / 2, circ = 2 * Math.PI * r;
  const safe = total || 1;
  let offset = 0;
  const segs = [
    { val: easy, color: C.success, label: 'Easy', beats: beatsEasy },
    { val: medium, color: C.orange, label: 'Medium', beats: beatsMedium },
    { val: hard, color: C.accent2, label: 'Hard', beats: beatsHard },
  ].map(s => {
    const dash = circ * (s.val / safe);
    const arc = { ...s, dash, offset: -offset };
    offset += dash;
    return arc;
  });

  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
      <h3 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 800, fontSize: 15, color: C.muted, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Problems Solved</h3>
      <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
          <svg width={SIZE} height={SIZE} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
            {segs.map((a, i) => a.val > 0 && (
              <circle key={i} cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke={a.color} strokeWidth={SW}
                strokeDasharray={`${a.dash} ${circ - a.dash}`} strokeDashoffset={a.offset} strokeLinecap="round" />
            ))}
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 34, color: C.ink, lineHeight: 1 }}>{total}</span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: C.muted, marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Solved</span>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {segs.map(s => (
            <div key={s.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'baseline' }}>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 700, color: s.color }}>{s.label}</span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 800, color: C.ink }}>{s.val}</span>
              </div>
              <div style={{ height: 6, background: '#f1f5f9', borderRadius: 99 }}>
                <div style={{ width: `${safe ? (s.val / safe) * 100 : 0}%`, height: '100%', background: s.color, borderRadius: 99, transition: 'width 0.7s ease' }} />
              </div>
              {s.beats !== undefined && (
                <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: C.muted, margin: '3px 0 0' }}>Beats {s.beats}%</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ?????? CONTEST CARD ?????? */
function ContestCard({ contest, history }: {
  contest: LeetCodeData['contest'];
  history: LeetCodeData['contest_history'];
}) {
  const reveal = useScrollReveal(100);
  if (!contest?.rating && !contest?.attended_count) return null;

  const attended = history?.filter(h => h.attended) || [];
  const W = 260, H = 80;
  const ratings = attended.slice(-15).map(h => h.rating || 0);
  const minR = Math.min(...ratings, 1400) - 50;
  const maxR = Math.max(...ratings, 1600) + 50;
  const rangeR = maxR - minR || 1;

  const pts = ratings.map((r, i) =>
    `${Math.round((i / Math.max(ratings.length - 1, 1)) * W)},${Math.round(H - ((r - minR) / rangeR) * H)}`
  ).join(' ');

  const ratingColor = (r?: number) => !r ? C.muted : r >= 2000 ? '#f97316' : r >= 1600 ? '#eab308' : C.accent;

  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 28px 24px', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
      <h3 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 800, fontSize: 15, color: C.muted, margin: '0 0 20px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Contest Rating</h3>
      <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <p style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 40, color: ratingColor(contest?.rating), margin: '0 0 4px', lineHeight: 1 }}>
            {contest?.rating ? Math.round(contest.rating) : '???'}
          </p>
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: C.muted, margin: '0 0 16px' }}>Rating</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {contest?.global_ranking && (
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Trophy size={13} color={C.yellow} /> #{contest.global_ranking.toLocaleString()} Global
              </span>
            )}
            {contest?.top_percentage !== undefined && (
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Award size={13} color={C.orange} /> Top {contest.top_percentage.toFixed(1)}%
              </span>
            )}
            {contest?.attended_count !== undefined && (
              <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={13} /> {contest.attended_count} contests
              </span>
            )}
          </div>
        </div>
        {ratings.length >= 2 && (
          <div style={{ flex: 1, minWidth: 140 }}>
            <svg width="100%" height={H + 10} viewBox={`0 0 ${W} ${H + 10}`} style={{ overflow: 'visible' }}>
              <polyline points={pts} fill="none" stroke={ratingColor(contest?.rating)} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              {ratings.map((r, i) => {
                const x = Math.round((i / Math.max(ratings.length - 1, 1)) * W);
                const y = Math.round(H - ((r - minR) / rangeR) * H);
                return <circle key={i} cx={x} cy={y} r={3} fill={ratingColor(contest?.rating)} />;
              })}
            </svg>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: C.muted, margin: '4px 0 0', textAlign: 'center' }}>Last {ratings.length} contests</p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ?????? LANGUAGE BARS ?????? */
function LanguageBars({ languages }: { languages: { name: string; count: number }[] }) {
  const reveal = useScrollReveal(60);
  if (!languages || languages.length === 0) return null;
  const top = languages.slice(0, 6);
  const maxCount = top[0]?.count || 1;

  const LANG_COLORS: Record<string, string> = {
    Python: '#3572A5', JavaScript: '#f1e05a', TypeScript: '#2b7489', Java: '#b07219',
    'C++': '#f34b7d', C: '#555555', Go: '#00ADD8', Rust: '#dea584',
    Kotlin: '#F18E33', Swift: '#ffac45', Ruby: '#701516', SQL: '#e38c00',
  };

  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
      <h3 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 800, fontSize: 15, color: C.muted, margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Languages</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {top.map(l => {
          const color = LANG_COLORS[l.name] || C.accent;
          return (
            <div key={l.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 700, color: C.ink }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />{l.name}
                </span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted, fontWeight: 600 }}>{l.count}</span>
              </div>
              <div style={{ height: 7, background: '#f1f5f9', borderRadius: 99 }}>
                <div style={{ width: `${(l.count / maxCount) * 100}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.7s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ?????? TOPIC TAGS ?????? */
function TopicTags({ topicTags }: { topicTags: LeetCodeData['topic_tags'] }) {
  const reveal = useScrollReveal(80);
  if (!topicTags) return null;
  const sections = [
    { key: 'fundamental' as const, label: 'Fundamental', color: C.success },
    { key: 'intermediate' as const, label: 'Intermediate', color: C.orange },
    { key: 'advanced' as const, label: 'Advanced', color: C.accent2 },
  ];

  const hasAny = sections.some(s => (topicTags[s.key] || []).length > 0);
  if (!hasAny) return null;

  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 28px', boxShadow: '0 2px 10px rgba(15,23,42,0.05)' }}>
      <h3 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 800, fontSize: 15, color: C.muted, margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>Topic Tags</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {sections.map(s => {
          const tags = topicTags[s.key] || [];
          if (tags.length === 0) return null;
          return (
            <div key={s.key}>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, fontWeight: 700, color: s.color, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {tags.slice(0, 8).map(tag => (
                  <span key={tag.name} style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, fontWeight: 700, color: s.color, background: s.color + '15', border: `1px solid ${s.color}30`, borderRadius: 99, padding: '3px 10px', whiteSpace: 'nowrap' }}>
                    {tag.name} · {tag.count}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ━━━━ LINK LEETCODE PANEL ━━━━ */
function LinkLeetCodePanel({ onLinked }: { onLinked: () => void }) {
  const [step, setStep] = useState<'enter' | 'verify'>('enter');
  const [leetcodeId, setLeetcodeId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  async function getCode() {
    if (!leetcodeId.trim()) return;
    setLoading(true);
    try {
      const res = await apiPostAuth('/dev/leetcode/getcode', { leetcode_id: leetcodeId });
      setCode(res.verification_code); setStep('verify');
    } catch { setToast({ msg: 'Failed to get code', type: 'error' }); }
    finally { setLoading(false); }
  }

  async function link() {
    setLoading(true);
    try {
      await apiPostAuth('/dev/leetcode/link', { leetcode_id: leetcodeId, code });
      setToast({ msg: 'LeetCode linked!', type: 'success' });
      setTimeout(onLinked, 1000);
    } catch (e: any) { setToast({ msg: e?.message || 'Linking failed', type: 'error' }); }
    finally { setLoading(false); }
  }

  const inpStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`, fontFamily: "'Fira Code', monospace", fontSize: 14, outline: 'none', background: C.surface, color: C.ink, boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500, padding: 40 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 28, padding: '48px 52px', maxWidth: 500, width: '100%', boxShadow: '0 8px 40px rgba(15,23,42,0.1)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Code2 size={36} color={C.accent} />
        </div>
        <h2 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 26, color: C.ink, margin: '0 0 8px' }}>Link LeetCode</h2>
        <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>
          Connect your LeetCode account to showcase your problem-solving stats and achievements.
        </p>
        {step === 'enter' ? (
          <>
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>LeetCode Username</label>
              <input style={inpStyle} placeholder="e.g. your_username" value={leetcodeId} onChange={e => setLeetcodeId(e.target.value)} onKeyDown={e => e.key === 'Enter' && getCode()} />
            </div>
            <button onClick={getCode} disabled={loading || !leetcodeId.trim()}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', border: 'none', borderRadius: 14, color: '#fff', fontFamily: "'Fira Code', monospace", fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading || !leetcodeId.trim() ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? 'Getting code???' : <><Target size={16} /> Get Verification Code</>}
            </button>
          </>
        ) : (
          <>
            <div style={{ background: C.accentSoft, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: C.accent, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Verification Code</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: C.accent, letterSpacing: 4 }}>{code}</span>
                <button onClick={() => navigator.clipboard.writeText(code)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent }}>
                  <Copy size={20} />
                </button>
              </div>
            </div>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
              Add this code to your LeetCode bio at <strong>leetcode.com/profile</strong>, then click Verify below.
            </p>
            <button onClick={link} disabled={loading}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', border: 'none', borderRadius: 14, color: '#fff', fontFamily: "'Fira Code', monospace", fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              {loading ? 'Verifying???' : <><CheckCircle2 size={16} /> Verify and Link</>}
            </button>
            <button onClick={() => setStep('enter')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 600 }}>Back</button>
          </>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ?????? PROFILE SIDEBAR (inside main) ?????? */
function ProfileSidebar({ leetcode, updating, onUpdate }: {
  leetcode: LeetCodeData;
  updating: boolean;
  onUpdate: () => void;
}) {
  const totalSolved = (leetcode.easy_solved || 0) + (leetcode.medium_solved || 0) + (leetcode.hard_solved || 0);
  const ratingColor = !leetcode.contest?.rating ? C.muted
    : leetcode.contest.rating >= 2000 ? '#f97316'
    : leetcode.contest.rating >= 1600 ? '#eab308'
    : C.accent;

  return (
    <div style={{ width: 280, flexShrink: 0 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: `3px solid ${C.accentSoft}`, boxShadow: `0 8px 24px ${C.accent}25` }}>
          {leetcode.avatar
            ? <img src={leetcode.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 32 }}>
                {(leetcode.real_name || leetcode.username)[0].toUpperCase()}
              </div>
          }
        </div>
      </div>

      {leetcode.real_name && (
        <h2 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 22, color: C.ink, margin: '0 0 2px', letterSpacing: '-0.5px' }}>{leetcode.real_name}</h2>
      )}
      <a href={`https://leetcode.com/${leetcode.username}`} target="_blank" rel="noopener noreferrer"
        style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.accent, fontWeight: 600, textDecoration: 'none', display: 'block', marginBottom: 12 }}>
        @{leetcode.username}
      </a>

      {leetcode.about && (
        <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted, lineHeight: 1.6, margin: '0 0 16px' }}>{leetcode.about}</p>
      )}

      {leetcode.contest?.rating && (
        <div style={{ background: `${ratingColor}15`, border: `1.5px solid ${ratingColor}40`, borderRadius: 12, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trophy size={16} color={ratingColor} />
          <div>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: ratingColor, fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Contest Rating</p>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 18, fontWeight: 900, color: ratingColor, margin: 0 }}>{Math.round(leetcode.contest.rating)}</p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {leetcode.ranking && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={14} color={C.muted} />
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.ink }}>
              Ranked <strong>#{leetcode.ranking.toLocaleString()}</strong>
            </span>
          </div>
        )}
        {leetcode.country && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={14} color={C.muted} />
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted }}>{leetcode.country}</span>
          </div>
        )}

      </div>

      <div style={{ background: C.paper, borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
        <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: C.muted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Community Stats</p>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 20, color: C.ink, margin: 0 }}>{totalSolved}</p>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: C.muted, margin: '2px 0 0', textTransform: 'uppercase' }}>Solved</p>
          </div>
          {leetcode.reputation !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 20, color: C.ink, margin: 0 }}>{leetcode.reputation}</p>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: C.muted, margin: '2px 0 0', textTransform: 'uppercase' }}>Rep</p>
            </div>
          )}
          {leetcode.contest?.attended_count !== undefined && (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 20, color: C.ink, margin: 0 }}>{leetcode.contest.attended_count}</p>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, color: C.muted, margin: '2px 0 0', textTransform: 'uppercase' }}>Contests</p>
            </div>
          )}
        </div>
      </div>

      {leetcode.skill_tags && leetcode.skill_tags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: C.muted, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700 }}>Skills</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {leetcode.skill_tags.slice(0, 12).map(tag => (
              <span key={tag} style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, fontWeight: 600, color: C.accent, background: C.accentSoft, borderRadius: 6, padding: '3px 8px' }}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      <button onClick={onUpdate} disabled={updating}
        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
        style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 10, padding: '9px 13px', fontSize: 13, color: C.muted, cursor: 'pointer', fontFamily: "'Fira Code', monospace", fontWeight: 600, transition: 'all 0.2s', opacity: updating ? 0.6 : 1 }}>
        <RefreshCw size={14} style={{ animation: updating ? 'spin 1s linear infinite' : 'none' }} />
        {updating ? 'Refreshing???' : 'Refresh LeetCode'}
      </button>
    </div>
  );
}

/* ?????? MAIN PAGE ?????? */
export default function DsaPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [leetcode, setLeetcode] = useState<LeetCodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string } | null>(null);
  const NAV_H = 60;

  const fetchData = useCallback(async (email: string) => {
    try {
      const data = await apiGet(`/form/get-profile/${encodeURIComponent(email)}`);
      setProfile({ full_name: data.full_name });
      if (data.leetcode) setLeetcode(data.leetcode);
    } catch { }
  }, []);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.push('/login'); return; }
    setAuth(a);
    if (a.email) fetchData(a.email).finally(() => setLoading(false));
  }, [router, fetchData]);

  async function updateLeetCode() {
    setUpdating(true);
    try {
      await apiPatch('/dev/leetcode/update', {});
      if (auth?.email) await fetchData(auth.email);
      setToast({ msg: 'LeetCode data refreshed!', type: 'success' });
    } catch { setToast({ msg: 'Update failed', type: 'error' }); }
    finally { setUpdating(false); }
  }

  function logout() { clearAuth(); router.push('/login'); }

  const displayName = profile?.full_name || auth?.name || auth?.email?.split('@')[0] || 'User';
  const totalSolved = (leetcode?.easy_solved || 0) + (leetcode?.medium_solved || 0) + (leetcode?.hard_solved || 0);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: "'Fira Code', monospace" }}>
      <Navbar active="DSA" />

      {/* FIXED ICON SIDEBAR */}
      <aside style={{ position: 'fixed', top: NAV_H, left: 0, width: 72, height: `calc(100vh - ${NAV_H}px)`, borderRight: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 0', zIndex: 100, gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 15, overflow: 'hidden', boxShadow: `0 6px 16px ${C.accent}40`, flexShrink: 0 }}>
          {leetcode?.avatar ? <img src={leetcode.avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (displayName[0] || 'U').toUpperCase()}
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={logout} title="Logout"
          onMouseEnter={e => { e.currentTarget.style.color = C.accent2; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; }}
          style={{ width: 40, height: 40, borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, transition: 'all 0.2s' }}>
          <LogOut size={16} />
        </button>
      </aside>

      <main style={{ marginLeft: 72, paddingTop: NAV_H, minHeight: '100vh' }}>
        <div style={{ padding: '48px 56px 100px' }}>
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 44, color: C.ink, margin: '0 0 8px', letterSpacing: '-2px', lineHeight: 1 }}>
              My <span style={{ color: C.accent }}>DSA Journey</span>
            </h1>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, color: C.muted, margin: 0, fontWeight: 500 }}>
              Track your problem-solving progress, stats, and achievements
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <span className="spinner" style={{ borderColor: `${C.accent}25`, borderTopColor: C.accent, width: 40, height: 40 }} />
            </div>
          ) : !leetcode ? (
            <LinkLeetCodePanel onLinked={() => { if (auth?.email) fetchData(auth.email); }} />
          ) : (
            <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start' }}>
              {/* Profile sidebar */}
              <ProfileSidebar leetcode={leetcode} updating={updating} onUpdate={updateLeetCode} />

              {/* Right content */}
              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Contest first */}
                <ContestCard contest={leetcode.contest} history={leetcode.contest_history} />

                {/* Problems solved donut */}
                <DonutChart
                  easy={leetcode.easy_solved || 0}
                  medium={leetcode.medium_solved || 0}
                  hard={leetcode.hard_solved || 0}
                  total={totalSolved}
                  beatsEasy={leetcode.beats_easy}
                  beatsMedium={leetcode.beats_medium}
                  beatsHard={leetcode.beats_hard}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                  <LanguageBars languages={leetcode.languages || []} />
                  <TopicTags topicTags={leetcode.topic_tags} />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { display: inline-block; border: 3px solid; border-radius: 50%; animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}
