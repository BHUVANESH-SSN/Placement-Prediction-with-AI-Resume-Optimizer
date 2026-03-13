'use client';

import { apiGet, apiPatch, apiPostAuth, clearAuth, getAuth } from '@/lib/api';
import {
  Building2,
  BookOpen,
  CheckCircle2,
  Code2,
  Copy,
  Github,
  Globe,
  LogOut,
  RefreshCw,
  Star,
  TrendingUp,
  UserCheck,
  Users,
  Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── TYPES ── */
interface Auth { token: string; email: string | null; name: string | null; }
interface RepoDetail { name: string; url: string; description: string; stars: number; language: string | null; }
interface GithubData {
  username: string; bio: string; followers: number; following: number;
  public_repos: number; stars: number; repo_details: RepoDetail[];
  profile_image: string; top_languages: string[];
}
interface ContributionDay { date: string; count: number; level: 0 | 1 | 2 | 3 | 4; }
interface ContributionWeek { days: ContributionDay[]; }
interface ContributionData { total_contributions: number; weeks: ContributionWeek[]; }
interface Profile {
  full_name?: string; phone?: string; location?: string; institute?: string;
}

/* ── DESIGN SYSTEM ── */
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
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f7df1e', Python: '#3572A5',
  Rust: '#dea584', Go: '#00ADD8', Java: '#b07219', 'C++': '#f34b7d',
  C: '#555555', Swift: '#F05138', Kotlin: '#A97BFF', Ruby: '#701516',
  PHP: '#4F5D95', HTML: '#e34c26', CSS: '#563d7c', Shell: '#89e051',
  Dart: '#00B4AB', Scala: '#c22d40', Haskell: '#5e5086',
};

function getLangColor(lang: string) { return LANG_COLORS[lang] ?? '#94a3b8'; }

/* ── SCROLL REVEAL — only call at top level of a component, never inside JSX ── */
function useScrollReveal(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return {
    ref,
    style: {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0px)' : 'translateY(32px)',
      transition: `opacity 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms, transform 0.55s cubic-bezier(.4,0,.2,1) ${delay}ms`,
    } as React.CSSProperties,
  };
}

/* ── NAVBAR ── */
export function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA', 'Roadmap', 'Predict', 'Nova AI'];
  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      height: 60,
      padding: '0 34px',
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${C.border}`,
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 200
    }}>
      {/* Logo on the left */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/home')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 7 2 12 8 17" />
          <polyline points="16 7 22 12 16 17" />
        </svg>
        <span style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 900,
          fontSize: '18px',
          letterSpacing: '-0.5px',
          color: '#0d0d14',
          display: 'flex',
          alignItems: 'baseline',
          lineHeight: 1,
        }}>
          AIRO
          <div style={{
            width: '6px',
            height: '6px',
            backgroundColor: '#7c3aed',
            marginLeft: '4px'
          }} />
        </span>
      </div>

      {/* Centered navigation links */}
      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        gap: 36,
        marginRight: '120px' // Offset to balance the logo's space
      }}>
        {NAV.map(label => (
          <button key={label} onClick={() => {
            if (label === 'Dashboard') router.push('/home');
            if (label === 'Development') router.push('/development');
            if (label === 'Resume builder') router.push('/resume');
            if (label === 'DSA') router.push('/dsa');
            if (label === 'Predict') router.push('/predict');
if (label === 'Roadmap') router.push('/roadmap');
            if (label === 'Nova AI') router.push('/career-coach');
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: active === label ? C.accent : C.muted, fontWeight: active === label ? 700 : 500, borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent', paddingBottom: 4, transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── TOAST ── */
function Toast({ msg, type, onClose }: { msg: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, background: type === 'success' ? C.success : C.accent2, color: '#fff', borderRadius: 14, padding: '13px 20px', fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 9, boxShadow: '0 8px 32px rgba(15,23,42,0.18)' }}>
      {type === 'success' ? <CheckCircle2 size={16} /> : 'x'} {msg}
    </div>
  );
}

/* ── STAT CARD ── */
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const reveal = useScrollReveal(80);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '22px 26px', display: 'flex', alignItems: 'center', gap: 18, boxShadow: '0 4px 18px rgba(15,23,42,0.06)', flex: 1, minWidth: 160 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 26, color: C.ink, margin: 0, lineHeight: 1 }}>{value}</p>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.muted, margin: '4px 0 0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</p>
      </div>
    </div>
  );
}

/* ── REPO CARD ── */
function RepoCard({ repo }: { repo: RepoDetail }) {
  const [hov, setHov] = useState(false);
  const langColor = repo.language ? getLangColor(repo.language) : C.muted;
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        flex: 1,
        minWidth: 'calc(33.333% - 16px)',
        borderRadius: 24,
        background: C.surface,
        border: `1px solid ${hov ? C.accent + '40' : C.border}`,
        boxShadow: hov ? '0 20px 40px rgba(15,23,42,0.1)' : '0 4px 12px rgba(15,23,42,0.04)',
        transform: hov ? 'translateY(-5px)' : 'none',
        transition: 'all 0.3s cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
            <BookOpen size={20} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.paper, padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, color: C.muted }}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" /> {repo.stars}
          </div>
        </div>

        <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: C.ink, margin: '0 0 10px', lineHeight: 1.4 }}>{repo.name}</h3>

        {repo.description && (
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13.5, color: C.muted, lineHeight: 1.6, margin: '0 0 24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{repo.description}</p>
        )}

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {repo.language && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 700, color: C.ink }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: langColor }} />{repo.language}
            </span>
          )}
          <a href={repo.url} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, background: hov ? C.accent : 'transparent', color: hov ? '#fff' : C.accent, border: `1.5px solid ${C.accent}`, padding: '8px 16px', borderRadius: 10, fontFamily: "'Montserrat', sans-serif", fontWeight: 700, textDecoration: 'none', transition: 'all 0.2s' }}>
            <Github size={14} /> Visit
          </a>
        </div>
      </div>
    </div>
  );
}

/* ── CONTRIBUTION GRAPH ── */
function ContributionGraph({ data }: { data: ContributionData }) {
  const reveal = useScrollReveal(100);
  const LEVELS = ['#e2e8f0', '#c4b5fd', '#a78bfa', '#7c3aed', '#4c1d95'];
  const months: string[] = [];
  let lastMonth = '';
  data.weeks.forEach(week => {
    const first = week.days[0];
    if (first) {
      const m = new Date(first.date).toLocaleDateString('en-US', { month: 'short' });
      if (m !== lastMonth) { months.push(m); lastMonth = m; } else months.push('');
    }
  });
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '28px 32px', boxShadow: '0 4px 18px rgba(15,23,42,0.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 18, color: C.ink, margin: '0 0 4px' }}>Activity Heatmap</h3>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: C.muted, margin: 0 }}>
            <strong style={{ color: C.accent }}>{data.total_contributions.toLocaleString()}</strong> contributions in the last year
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.muted }}>Less</span>
          {LEVELS.map((c, i) => <span key={i} style={{ width: 12, height: 12, borderRadius: 3, background: c, display: 'inline-block' }} />)}
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 11, color: C.muted }}>More</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 2, marginBottom: 4, paddingLeft: 28 }}>
        {months.map((m, i) => <span key={i} style={{ fontSize: 10, color: C.muted, fontFamily: "'Montserrat', sans-serif", width: 13, textAlign: 'center', flexShrink: 0 }}>{m}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 2 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginRight: 4 }}>
          {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
            <span key={i} style={{ fontSize: 9, color: C.muted, fontFamily: "'Montserrat', sans-serif", height: 13, lineHeight: '13px' }}>{d}</span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {data.weeks.map((week, wi) => (
            <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {week.days.map((day, di) => (
                <div key={di} title={`${day.date}: ${day.count} contributions`}
                  style={{ width: 13, height: 13, borderRadius: 3, background: LEVELS[day.level], cursor: 'default', transition: 'transform 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.3)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── GITHUB BANNER — named component so hook runs at component top level ── */
function GithubBanner({ github }: { github: GithubData }) {
  const reveal = useScrollReveal(0);
  return (
    <div ref={reveal.ref} style={{ ...reveal.style, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 28, padding: '36px 40px', marginBottom: 40, boxShadow: '0 4px 24px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', gap: 36, flexWrap: 'wrap' }}>
      {github.profile_image && <img src={github.profile_image} alt="GitHub avatar" style={{ width: 100, height: 100, borderRadius: '50%', border: `3px solid ${C.accentSoft}`, boxShadow: `0 8px 24px ${C.accent}30`, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8, flexWrap: 'wrap' }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, color: C.ink, margin: 0 }}>{github.username}</h2>
          <a href={`https://github.com/${github.username}`} target="_blank" rel="noopener noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 5, background: C.accentSoft, color: C.accent, borderRadius: 10, padding: '6px 14px', fontFamily: "'Montserrat', sans-serif", fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
            <Github size={13} /> Open GitHub
          </a>
        </div>
        {github.bio && <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: C.muted, margin: '0 0 16px', lineHeight: 1.6 }}>{github.bio}</p>}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: <Users size={14} />, label: `${github.followers} followers` },
            { icon: <UserCheck size={14} />, label: `${github.following} following` },
            { icon: <BookOpen size={14} />, label: `${github.public_repos} repos` },
          ].map(({ icon, label }, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: C.muted, fontWeight: 600 }}>{icon} {label}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── TOP LANGUAGES — named component so hook runs at component top level ── */
function TopLanguages({ languages }: { languages: string[] }) {
  const reveal = useScrollReveal(0);
  return (
    <div ref={reveal.ref} style={reveal.style}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, color: C.ink, margin: 0, letterSpacing: '-0.5px' }}>Top Languages</h2>
          <span style={{ minWidth: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', boxShadow: `0 4px 12px ${C.accent}40` }}>{languages.length}</span>
        </div>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: C.muted, margin: 0 }}>Languages used across your repositories</p>
      </div>
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        {languages.map((lang, i) => {
          const color = getLangColor(lang);
          return (
            <div key={lang}
              style={{ display: 'flex', alignItems: 'center', gap: 10, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '14px 20px', boxShadow: '0 2px 8px rgba(15,23,42,0.06)', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}30`; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(15,23,42,0.06)'; }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 14, color: C.ink }}>{lang}</span>
              {i === 0 && <span style={{ fontSize: 10, background: color + '20', color, borderRadius: 6, padding: '2px 8px', fontFamily: "'Montserrat', sans-serif", fontWeight: 700 }}>Primary</span>}
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 24, height: 10, borderRadius: 10, overflow: 'hidden', display: 'flex', gap: 2 }}>
        {languages.slice(0, 8).map((lang, i, arr) => (
          <div key={lang} style={{ flex: Math.max(1, arr.length - i), background: getLangColor(lang), transition: 'flex 0.4s' }} title={lang} />
        ))}
      </div>
    </div>
  );
}

/* ── REPOS SECTION ── */
function ReposSection({ github }: { github: GithubData }) {
  const reveal = useScrollReveal(0);
  const [search, setSearch] = useState('');
  const [filterLang, setFilterLang] = useState('All');

  const repos = github.repo_details;
  const langs = ['All', ...Array.from(new Set(repos.map(r => r.language).filter(Boolean)))];

  const filtered = repos
    .filter(r => (filterLang === 'All' || r.language === filterLang))
    .filter(r => r.name.toLowerCase().includes(search.toLowerCase()) || r.description?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.stars - a.stars);

  return (
    <div ref={reveal.ref} style={reveal.style}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, color: C.ink, margin: 0, letterSpacing: '-0.5px' }}>Repositories</h2>
            <span style={{ minWidth: 28, height: 28, borderRadius: 14, background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 12, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', boxShadow: `0 4px 12px ${C.accent}40` }}>{repos.length}</span>
          </div>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: C.muted, margin: 0 }}>Discover your public work and contributions</p>
        </div>

        <div style={{ display: 'flex', gap: 12, flex: 1, maxWidth: 500 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              style={{ width: '100%', padding: '12px 16px 12px 40px', borderRadius: 12, border: `1px solid ${C.border}`, fontFamily: "'Montserrat', sans-serif", fontSize: 14 }}
              placeholder="Search repositories..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Globe size={18} color={C.muted} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
          <select
            style={{ padding: '0 12px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.surface, fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600, color: C.ink, cursor: 'pointer', outline: 'none' }}
            value={filterLang}
            onChange={e => setFilterLang(e.target.value)}
          >
            {langs.map(l => <option key={l!} value={l!}>{l}</option>)}
          </select>
        </div>
      </div>

      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filtered.map((repo, i) => <RepoCard key={i} repo={repo} />)}
        </div>
      ) : (
        <div style={{ padding: '60px 0', textAlign: 'center', background: C.paper, borderRadius: 24, border: `2px dashed ${C.border}` }}>
          <p style={{ fontSize: 16, color: C.muted, fontWeight: 600, fontFamily: "'Montserrat', sans-serif" }}>No repositories found matching your current filters.</p>
        </div>
      )}
    </div>
  );
}

/* ── LINK GITHUB PANEL ── */
function LinkGithubPanel({ onLinked }: { onLinked: () => void }) {
  const [step, setStep] = useState<'enter' | 'verify'>('enter');
  const [githubId, setGithubId] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  async function getCode() {
    if (!githubId.trim()) return;
    setLoading(true);
    try {
      const res = await apiPostAuth('/dev/github/getcode', { github_id: githubId });
      setCode(res.verification_code); setStep('verify');
    } catch { setToast({ msg: 'Failed to get code', type: 'error' }); }
    finally { setLoading(false); }
  }

  async function link() {
    setLoading(true);
    try {
      await apiPostAuth('/dev/github/link', { github_id: githubId, code });
      setToast({ msg: 'GitHub linked!', type: 'success' });
      setTimeout(onLinked, 1000);
    } catch (e: any) { setToast({ msg: e?.message || 'Linking failed', type: 'error' }); }
    finally { setLoading(false); }
  }

  const inpStyle: React.CSSProperties = { width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${C.border}`, fontFamily: "'Montserrat', sans-serif", fontSize: 14, outline: 'none', background: C.surface, color: C.ink, boxSizing: 'border-box' };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500, padding: 40 }}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 28, padding: '48px 52px', maxWidth: 500, width: '100%', boxShadow: '0 8px 40px rgba(15,23,42,0.1)', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Github size={36} color={C.accent} />
        </div>
        <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 26, color: C.ink, margin: '0 0 8px' }}>Link GitHub</h2>
        <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: C.muted, margin: '0 0 36px', lineHeight: 1.6 }}>
          Connect your GitHub account to showcase your repositories, languages, and contributions.
        </p>
        {step === 'enter' ? (
          <>
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block', marginBottom: 6 }}>GitHub Username</label>
              <input style={inpStyle} placeholder="e.g. torvalds" value={githubId} onChange={e => setGithubId(e.target.value)} onKeyDown={e => e.key === 'Enter' && getCode()} />
            </div>
            <button onClick={getCode} disabled={loading || !githubId.trim()}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', border: 'none', borderRadius: 14, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading || !githubId.trim() ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {loading ? 'Getting code…' : <><Code2 size={16} /> Get Verification Code</>}
            </button>
          </>
        ) : (
          <>
            <div style={{ background: C.accentSoft, borderRadius: 16, padding: '20px 24px', marginBottom: 24 }}>
              <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.accent, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Your Verification Code</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color: C.accent, letterSpacing: 4 }}>{code}</span>
                <button onClick={() => { navigator.clipboard.writeText(code); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.accent }}>
                  <Copy size={20} />
                </button>
              </div>
            </div>
            <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 13, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
              Add this code to your GitHub bio at <strong>github.com/settings/profile</strong>, then click Verify below.
            </p>
            <button onClick={link} disabled={loading}
              style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', border: 'none', borderRadius: 14, color: '#fff', fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              {loading ? 'Verifying…' : <><CheckCircle2 size={16} /> Verify and Link</>}
            </button>
            <button onClick={() => setStep('enter')} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontFamily: "'Montserrat', sans-serif", fontSize: 13, fontWeight: 600 }}>
              Back
            </button>
          </>
        )}
      </div>
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function DevelopmentPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [github, setGithub] = useState<GithubData | null>(null);
  const [contributions, setContributions] = useState<ContributionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchData = useCallback(async (email: string) => {
    try {
      const data = await apiGet(`/form/get-profile/${encodeURIComponent(email)}`);
      setProfile({ full_name: data.full_name, phone: data.phone, location: data.location, institute: data.institute });
      if (data.github) setGithub(data.github);
    } catch { }
  }, []);

  const fetchContributions = useCallback(async (username: string) => {
    try {
      const data = await apiGet(`/dev/github/contributions/${encodeURIComponent(username)}`);
      setContributions(data);
    } catch { }
  }, []);

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.push('/login'); return; }
    setAuth(a);
    if (a.email) fetchData(a.email).finally(() => setLoading(false));
  }, [router, fetchData]);

  useEffect(() => {
    if (github?.username) fetchContributions(github.username);
  }, [github, fetchContributions]);

  async function updateGithub() {
    setUpdating(true);
    try {
      await apiPatch('/dev/github/update', {});
      if (auth?.email) await fetchData(auth.email);
      if (github?.username) await fetchContributions(github.username);
      setToast({ msg: 'GitHub data refreshed!', type: 'success' });
    } catch { setToast({ msg: 'Update failed', type: 'error' }); }
    finally { setUpdating(false); }
  }

  function logout() { clearAuth(); router.push('/login'); }

  const displayName = profile?.full_name || auth?.name || auth?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  const [sbHover, setSbHover] = useState(false);
  const SB_MIN = 88;
  const SB_MAX = 285;
  const NAV_H = 60;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: "'Montserrat', sans-serif" }}>
      <Navbar active="Development" />

      <aside
        onMouseEnter={() => setSbHover(true)}
        onMouseLeave={() => setSbHover(false)}
        style={{
          position: 'fixed',
          top: NAV_H,
          left: 0,
          width: sbHover ? SB_MAX : SB_MIN,
          height: `calc(100vh - ${NAV_H}px)`,
          overflowX: 'hidden',
          overflowY: 'auto',
          borderRight: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)',
          padding: sbHover ? '40px 28px 40px 34px' : '40px 14px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: sbHover ? 'flex-start' : 'center',
          zIndex: 100,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          scrollbarWidth: 'none'
        }}>
        <div style={{
          width: sbHover ? 72 : 52,
          height: sbHover ? 72 : 52,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: sbHover ? 24 : 18,
          marginBottom: sbHover ? 16 : 32,
          flexShrink: 0,
          boxShadow: `0 12px 30px ${C.accent}45`,
          overflow: 'hidden',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {github?.profile_image ? <img src={github.profile_image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
        </div>

        <div style={{ opacity: sbHover ? 1 : 0, height: sbHover ? 'auto' : 0, transition: 'all 0.3s', visibility: sbHover ? 'visible' : 'hidden', width: '100%' }}>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 18, color: C.ink, margin: '0 0 4px', whiteSpace: 'nowrap' }}>{displayName}</p>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.muted, margin: '0 0 8px', wordBreak: 'break-all', lineHeight: 1.5 }}>{auth?.email}</p>
          {github && (
            <a href={`https://github.com/${github.username}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'Montserrat', sans-serif", fontSize: 12, color: C.accent, fontWeight: 700, textDecoration: 'none', marginBottom: 24 }}>
              <Github size={14} /> @{github.username}
            </a>
          )}
        </div>

        {profile?.institute && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: sbHover ? '100%' : 44,
            height: 44,
            padding: sbHover ? '10px 13px' : '0',
            justifyContent: sbHover ? 'flex-start' : 'center',
            fontSize: 13,
            color: C.ink,
            fontFamily: "'Montserrat', sans-serif",
            marginBottom: sbHover ? 24 : 12,
            background: 'rgba(124, 58, 237, 0.05)',
            borderRadius: 12,
            border: `1px solid ${C.accentSoft}`,
            transition: 'all 0.3s'
          }} title={!sbHover ? profile.institute : ''}>
            <Building2 size={20} color={C.accent} style={{ flexShrink: 0 }} />
            {sbHover && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>{profile.institute}</span>}
          </div>
        )}

        {github && (
          <button onClick={updateGithub} disabled={updating}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              width: sbHover ? '100%' : 44,
              height: 44,
              justifyContent: sbHover ? 'flex-start' : 'center',
              background: 'none',
              border: `1.5px solid ${C.border}`,
              borderRadius: 12,
              padding: sbHover ? '10px 13px' : '0',
              fontSize: 13,
              color: C.muted,
              cursor: 'pointer',
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              transition: 'all 0.2s',
              marginBottom: 8,
              opacity: updating ? 0.6 : 1,
              flexShrink: 0
            }} title={!sbHover ? 'Refresh GitHub' : ''}>
            <RefreshCw size={18} style={{ animation: updating ? 'spin 1s linear infinite' : 'none', flexShrink: 0 }} />
            {sbHover && <span>{updating ? 'Refreshing…' : 'Refresh GitHub'}</span>}
          </button>
        )}

        <div style={{ flex: 1 }} />

        <button onClick={logout}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent2; e.currentTarget.style.color = C.accent2; e.currentTarget.style.background = '#fff0f0'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'none'; }}
          style={{
            width: sbHover ? '100%' : 44,
            height: 44,
            justifyContent: sbHover ? 'flex-start' : 'center',
            background: 'none',
            border: `1.5px solid ${C.border}`,
            borderRadius: 12,
            padding: sbHover ? '10px 14px' : '0',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            color: C.muted,
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexShrink: 0
          }} title={!sbHover ? 'Logout' : ''}>
          <LogOut size={18} style={{ flexShrink: 0 }} />
          {sbHover && <span>Logout</span>}
        </button>
      </aside>

      <main style={{
        marginLeft: sbHover ? SB_MAX : SB_MIN,
        paddingTop: NAV_H,
        minHeight: '100vh',
        transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ padding: '56px 64px 110px' }}>
          <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 48, color: C.ink, margin: '0 0 10px', letterSpacing: '-2px', lineHeight: 1 }}>
            My <span style={{ color: C.accent }}>Development</span>
          </h1>
          <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 15, color: C.muted, margin: '0 0 56px', fontWeight: 500 }}>
            GitHub activity, repositories, contributions, and coding languages
          </p>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 100 }}>
              <span className="spinner" style={{ borderColor: `${C.accent}25`, borderTopColor: C.accent, width: 40, height: 40 }} />
            </div>
          ) : !github ? (
            <LinkGithubPanel onLinked={() => { if (auth?.email) fetchData(auth.email); }} />
          ) : (
            <>
              {/* All sections are proper named components — zero hook violations */}
              <GithubBanner github={github} />

              <div style={{ display: 'flex', gap: 20, marginBottom: 56, flexWrap: 'wrap' }}>
                <StatCard icon={<Star size={22} />} label="Total Stars" value={github.stars} color="#f59e0b" />
                <StatCard icon={<BookOpen size={22} />} label="Public Repos" value={github.public_repos} color={C.accent} />
                <StatCard icon={<Users size={22} />} label="Followers" value={github.followers} color="#06b6d4" />
                <StatCard icon={<TrendingUp size={22} />} label="Following" value={github.following} color={C.success} />
                {contributions && (
                  <StatCard icon={<Zap size={22} />} label="Contributions" value={contributions.total_contributions.toLocaleString()} color="#f97316" />
                )}
              </div>

              {contributions && (
                <div style={{ marginBottom: 56 }}>
                  <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 900, fontSize: 28, color: C.ink, margin: '0 0 6px', letterSpacing: '-0.5px' }}>Contributions</h2>
                  <p style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 14, color: C.muted, margin: '0 0 24px' }}>Your coding activity over the last year</p>
                  <ContributionGraph data={contributions} />
                </div>
              )}

              {github.top_languages.length > 0 && (
                <div style={{ marginBottom: 56 }}>
                  <TopLanguages languages={github.top_languages} />
                </div>
              )}

              {github.repo_details.length > 0 && (
                <div style={{ marginBottom: 66 }}>
                  <ReposSection github={github} />
                </div>
              )}
            </>
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