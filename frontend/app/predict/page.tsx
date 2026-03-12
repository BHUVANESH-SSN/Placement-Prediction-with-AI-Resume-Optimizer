'use client';

import { apiGet, apiPostAuth, clearAuth, getAuth } from '@/lib/api';
import {
  AlertCircle,
  BarChart2,
  BookOpen,
  Brain,
  CheckCircle2,
  ChevronDown,
  Code2,
  Github,
  LogOut,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trophy,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/* ── TYPES ── */
interface Auth { token: string; email: string | null; name: string | null; }

interface PrefillData {
  github_linked: boolean;
  leetcode_linked: boolean;
  profile_linked: boolean;
  prefill: {
    cgpa: number | null;
    backlog_count: number | null;
    branch: string | null;
    internship_count: number | null;
    internship_duration_months: number | null;
    project_count: number | null;
    project_complexity_score: number | null;
    certification_count: number | null;
    skill_diversity_score: number | null;
    github_repo_count: number | null;
    github_contributions: number | null;
    leetcode_problems_solved: number | null;
    leetcode_ranking: number | null;
  };
  github_username: string | null;
  leetcode_username: string | null;
}

interface FeatureImpact { feature: string; shap_value: number; }
interface Recommendation { priority: string; action: string; }
interface PredictResult {
  placement_probability_pct: number;
  predicted_company_tier: string;
  strengths: FeatureImpact[];
  gaps: FeatureImpact[];
  recommendations: Recommendation[];
}

/* ── CONSTANTS ── */
const BRANCHES = ['CS', 'IT', 'ECE', 'EEE', 'Mechanical', 'Chemical', 'Civil', 'Biotech'];

const TIER_COLORS: Record<string, string> = {
  'FAANG': '#6366f1',
  'Mid-tier': '#3b82f6',
  'Mass Recruiter': '#10b981',
  'Not Placed': '#ef4444',
};

/* ── DESIGN ── */
const C = {
  ink: '#0f172a',
  paper: '#f8fafc',
  surface: '#ffffff',
  accent: '#7c3aed',
  accentSoft: '#ede9fe',
  muted: '#64748b',
  border: '#e2e8f0',
  success: '#16a34a',
  danger: '#ef4444',
  orange: '#f97316',
};

/* ── NAVBAR ── */
function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA', 'Predict', 'resuMate'];
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', height: 60, padding: '0 34px',
      background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/home')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 7 2 12 8 17" />
          <polyline points="16 7 22 12 16 17" />
        </svg>
        <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: '#0d0d14' }}>
          AIRO<div style={{ width: '6px', height: '6px', backgroundColor: '#7c3aed', marginLeft: '4px', display: 'inline-block' }} />
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 32, marginRight: '80px' }}>
        {NAV.map(label => (
          <button key={label} onClick={() => {
            const paths: Record<string, string> = {
              'Dashboard': '/home', 'Development': '/development',
              'Resume Builder': '/resume', 'DSA': '/dsa', 'Predict': '/predict', 'resuMate': '/career-coach',
            };
            router.push(paths[label] || '/home');
          }} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Fira Code', monospace", fontSize: 14,
            color: active === label ? C.accent : C.muted,
            fontWeight: active === label ? 700 : 500,
            borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent',
            paddingBottom: 4, transition: 'all 0.2s',
          }}>
            {label}
          </button>
        ))}
      </div>
      <button onClick={() => { clearAuth(); router.push('/login'); }}
        style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontFamily: "'Fira Code', monospace", fontSize: 13 }}>
        <LogOut size={15} /> Logout
      </button>
    </nav>
  );
}

/* ── INPUT FIELD ── */
function Field({ label, value, onChange, type = 'number', min, max, step, note, readOnly, autoFilled }:
  { label: string; value: string | number; onChange: (v: string) => void; type?: string; min?: number; max?: number; step?: number; note?: string; readOnly?: boolean; autoFilled?: boolean; }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{
        fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700,
        color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {label}
        {autoFilled && (
          <span style={{ background: '#dcfce7', color: '#16a34a', fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
            auto-filled
          </span>
        )}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        readOnly={readOnly} min={min} max={max} step={step}
        style={{
          padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${autoFilled ? '#86efac' : C.border}`,
          fontFamily: "'Fira Code', monospace", fontSize: 14, color: C.ink,
          background: readOnly ? '#f8fafc' : autoFilled ? '#f0fdf4' : C.surface,
          outline: 'none', transition: 'border-color 0.2s',
        }}
      />
      {note && <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: C.muted }}>{note}</span>}
    </div>
  );
}

/* ── SELECT FIELD ── */
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[]; }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
      <label style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', padding: '10px 36px 10px 14px', borderRadius: 10,
            border: `1.5px solid ${C.border}`, fontFamily: "'Fira Code', monospace",
            fontSize: 14, color: C.ink, background: C.surface, outline: 'none',
            appearance: 'none', cursor: 'pointer',
          }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

/* ── RESULT CARD ── */
function ResultCard({ result }: { result: PredictResult }) {
  const prob = result.placement_probability_pct;
  const tier = result.predicted_company_tier;
  const tierColor = TIER_COLORS[tier] || C.accent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Probability Gauge */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
        }}>
          <Trophy size={28} color={prob >= 70 ? C.success : prob >= 40 ? C.orange : C.danger} />
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 52, fontWeight: 900, color: prob >= 70 ? C.success : prob >= 40 ? C.orange : C.danger, lineHeight: 1 }}>
            {prob}%
          </div>
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted, fontWeight: 600 }}>
            Placement Probability
          </div>
          <div style={{ width: '100%', background: C.border, borderRadius: 8, height: 8 }}>
            <div style={{ width: `${prob}%`, background: prob >= 70 ? C.success : prob >= 40 ? C.orange : C.danger, borderRadius: 8, height: 8, transition: 'width 1s ease' }} />
          </div>
        </div>

        {/* Company Tier */}
        <div style={{
          background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
          padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          boxShadow: '0 4px 24px rgba(15,23,42,0.06)',
        }}>
          <BarChart2 size={28} color={tierColor} />
          <div style={{ fontFamily: "'Fira Code', monospace", fontSize: 26, fontWeight: 900, color: tierColor, textAlign: 'center' }}>
            {tier}
          </div>
          <div style={{
            background: `${tierColor}18`, color: tierColor, padding: '6px 16px',
            borderRadius: 20, fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700,
          }}>
            Predicted Company Tier
          </div>
        </div>
      </div>

      {/* Strengths & Gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, fontWeight: 800, color: C.success, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={16} /> Your Strengths
          </h3>
          {result.strengths.length === 0
            ? <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted }}>No standout strengths identified.</p>
            : result.strengths.slice().reverse().map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < result.strengths.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.ink, fontWeight: 600 }}>
                  {s.feature.replace(/_/g, ' ')}
                </span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: C.success, fontWeight: 700 }}>
                  +{s.shap_value.toFixed(3)}
                </span>
              </div>
            ))
          }
        </div>

        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, fontWeight: 800, color: C.danger, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={16} /> Gaps to Address
          </h3>
          {result.gaps.length === 0
            ? <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted }}>No major gaps detected!</p>
            : result.gaps.map((g, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < result.gaps.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.ink, fontWeight: 600 }}>
                  {g.feature.replace(/_/g, ' ')}
                </span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: C.danger, fontWeight: 700 }}>
                  {g.shap_value.toFixed(3)}
                </span>
              </div>
            ))
          }
        </div>
      </div>

      {/* Recommendations */}
      {result.recommendations.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '24px 28px', boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
          <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, fontWeight: 800, color: C.ink, margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color={C.accent} /> Action Plan
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {result.recommendations.map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', borderRadius: 12, background: r.priority === 'HIGH' ? '#fff1f2' : '#fffbeb', border: `1px solid ${r.priority === 'HIGH' ? '#fecaca' : '#fde68a'}` }}>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 6, background: r.priority === 'HIGH' ? C.danger : C.orange, color: 'white', flexShrink: 0, marginTop: 1 }}>
                  {r.priority}
                </span>
                <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.ink, lineHeight: 1.5 }}>
                  {r.action}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function PredictPage() {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [prefill, setPrefill] = useState<PrefillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictResult | null>(null);

  // Form state
  const [cgpa, setCgpa] = useState('7.5');
  const [backlogs, setBacklogs] = useState('0');
  const [branch, setBranch] = useState('CS');
  const [internships, setInternships] = useState('1');
  const [internshipMonths, setInternshipMonths] = useState('3');
  const [projects, setProjects] = useState('2');
  const [projectComplexity, setProjectComplexity] = useState('5.0');
  const [certifications, setCertifications] = useState('2');
  const [skillDiversity, setSkillDiversity] = useState('5.0');
  const [ghContributions, setGhContributions] = useState('');
  const [ghRepos, setGhRepos] = useState('');
  const [lcSolved, setLcSolved] = useState('');
  const [lcRating, setLcRating] = useState('1500');

  // Track which fields were auto-filled
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);

  const NAV_H = 60;

  const handleFetchDetails = async () => {
    setFetching(true);
    try {
      const data: PrefillData = await apiGet('/predict/prefill');
      setPrefill(data);
      const filled = new Set<string>();
      const p = data.prefill;

      if (p.cgpa != null)                      { setCgpa(String(p.cgpa));                                    filled.add('cgpa'); }
      if (p.backlog_count != null)              { setBacklogs(String(p.backlog_count));                       filled.add('backlog_count'); }
      if (p.branch != null)                     { setBranch(p.branch);                                        filled.add('branch'); }
      if (p.internship_count != null)           { setInternships(String(p.internship_count));                  filled.add('internship_count'); }
      if (p.internship_duration_months != null) { setInternshipMonths(String(p.internship_duration_months));   filled.add('internship_duration_months'); }
      if (p.project_count != null)              { setProjects(String(p.project_count));                        filled.add('project_count'); }
      if (p.project_complexity_score != null)   { setProjectComplexity(String(p.project_complexity_score));    filled.add('project_complexity_score'); }
      if (p.certification_count != null)        { setCertifications(String(p.certification_count));            filled.add('certification_count'); }
      if (p.skill_diversity_score != null)      { setSkillDiversity(String(p.skill_diversity_score));          filled.add('skill_diversity_score'); }
      if (p.github_repo_count != null)          { setGhRepos(String(p.github_repo_count));                     filled.add('github_repo_count'); }
      if (p.github_contributions != null)       { setGhContributions(String(p.github_contributions));          filled.add('github_contributions'); }
      if (p.leetcode_problems_solved != null)   { setLcSolved(String(p.leetcode_problems_solved));             filled.add('leetcode_problems_solved'); }

      setAutoFilled(filled);
    } catch {/* silently ignore — user can fill manually */}
    finally { setFetching(false); }
  };

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.push('/login'); return; }
    setAuth(a);
    handleFetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSubmit = async () => {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const body = {
        cgpa: parseFloat(cgpa),
        backlog_count: parseInt(backlogs),
        degree_branch: branch,
        internship_count: parseInt(internships),
        internship_duration_months: parseFloat(internshipMonths),
        project_count: parseInt(projects),
        project_complexity_score: parseFloat(projectComplexity),
        certification_count: parseInt(certifications),
        skill_diversity_score: parseFloat(skillDiversity),
        github_contributions: parseInt(ghContributions) || 0,
        github_repo_count: parseInt(ghRepos) || 0,
        leetcode_problems_solved: parseInt(lcSolved) || 0,
        leetcode_contest_rating: parseInt(lcRating) || 0,
        top_n: 5,
      };
      const data = await apiPostAuth('/predict', body);
      setResult(data);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      if (e.status === 401) {
        clearAuth();
        router.replace('/login');
        return;
      }
      setError(e.message || 'Prediction failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.paper, fontFamily: "'Fira Code', monospace" }}>
      <Navbar active="Predict" />

      <div style={{ paddingTop: NAV_H + 40, paddingBottom: 80, maxWidth: 960, margin: '0 auto', padding: `${NAV_H + 40}px 24px 80px` }}>

        {/* Header */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.accentSoft, padding: '6px 16px', borderRadius: 20, marginBottom: 16 }}>
            <Brain size={14} color={C.accent} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, letterSpacing: 1 }}>ML PLACEMENT PREDICTOR</span>
          </div>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: C.ink, margin: '0 0 12px', letterSpacing: '-1px' }}>
            Predict Your Placement
          </h1>
          <p style={{ fontSize: 15, color: C.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
            Our XGBoost model analyses 17 features from your academic, coding, and project profile to estimate your placement probability and target company tier.
          </p>
        </div>

        {/* Linked accounts banner */}
        {prefill && (
          <div style={{
            display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: prefill.profile_linked ? '#f0fdf4' : '#f8fafc', border: `1px solid ${prefill.profile_linked ? '#86efac' : C.border}` }}>
              <Sparkles size={14} color={prefill.profile_linked ? C.success : C.muted} />
              <span style={{ fontSize: 12, fontWeight: 700, color: prefill.profile_linked ? C.success : C.muted }}>
                {prefill.profile_linked ? 'Profile — education, projects, skills auto-filled' : 'Profile not set up'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: prefill.github_linked ? '#f0fdf4' : '#f8fafc', border: `1px solid ${prefill.github_linked ? '#86efac' : C.border}` }}>
              <Github size={14} color={prefill.github_linked ? C.success : C.muted} />
              <span style={{ fontSize: 12, fontWeight: 700, color: prefill.github_linked ? C.success : C.muted }}>
                {prefill.github_linked ? `GitHub: @${prefill.github_username} — stats auto-filled` : 'GitHub not linked'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 12, background: prefill.leetcode_linked ? '#f0fdf4' : '#f8fafc', border: `1px solid ${prefill.leetcode_linked ? '#86efac' : C.border}` }}>
              <Code2 size={14} color={prefill.leetcode_linked ? C.success : C.muted} />
              <span style={{ fontSize: 12, fontWeight: 700, color: prefill.leetcode_linked ? C.success : C.muted }}>
                {prefill.leetcode_linked ? `LeetCode: @${prefill.leetcode_username} — problems auto-filled` : 'LeetCode not linked'}
              </span>
            </div>
            {(!prefill.github_linked || !prefill.leetcode_linked) && (
              <button onClick={() => router.push('/development')}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 12, background: C.accentSoft, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: C.accent }}>
                <Zap size={13} /> Link accounts to auto-fill
              </button>
            )}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 28, alignItems: 'start' }}>

          {/* Form */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '32px 36px', boxShadow: '0 4px 24px rgba(15,23,42,0.07)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Fira Code', monospace", fontSize: 16, fontWeight: 800, color: C.ink, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={16} color={C.accent} /> Student Profile
              </h2>
              <button
                onClick={handleFetchDetails}
                disabled={fetching}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 10, border: `1.5px solid ${C.accent}`,
                  background: fetching ? C.accentSoft : 'white',
                  color: C.accent, cursor: fetching ? 'not-allowed' : 'pointer',
                  fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700,
                  transition: 'all 0.2s',
                }}
              >
                <RefreshCw size={13} style={{ animation: fetching ? 'spin 0.7s linear infinite' : 'none' }} />
                {fetching ? 'Fetching…' : 'Fetch Details'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Academic */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px' }}>Academic</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="CGPA" value={cgpa} onChange={setCgpa} min={0} max={10} step={0.1} note="0 – 10 scale" autoFilled={autoFilled.has('cgpa')} />
                  <Field label="Backlogs" value={backlogs} onChange={setBacklogs} min={0} max={48} autoFilled={autoFilled.has('backlog_count')} />
                  <div style={{ gridColumn: 'span 2' }}>
                    <SelectField label="Degree Branch" value={branch} onChange={setBranch} options={BRANCHES} />
                  </div>
                </div>
              </div>

              {/* Experience */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px' }}>Experience & Projects</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Internships" value={internships} onChange={setInternships} min={0} max={10} autoFilled={autoFilled.has('internship_count')} />
                  <Field label="Internship Months" value={internshipMonths} onChange={setInternshipMonths} min={0} max={24} step={0.5} autoFilled={autoFilled.has('internship_duration_months')} />
                  <Field label="Projects" value={projects} onChange={setProjects} min={0} max={20} autoFilled={autoFilled.has('project_count')} />
                  <Field label="Project Complexity" value={projectComplexity} onChange={setProjectComplexity} min={0} max={10} step={0.5} note="0 – 10 scale" autoFilled={autoFilled.has('project_complexity_score')} />
                </div>
              </div>

              {/* Skills */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px' }}>Skills & Certifications</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Certifications" value={certifications} onChange={setCertifications} min={0} max={20} autoFilled={autoFilled.has('certification_count')} />
                  <Field label="Skill Diversity" value={skillDiversity} onChange={setSkillDiversity} min={0} max={10} step={0.5} note="0 – 10 scale" autoFilled={autoFilled.has('skill_diversity_score')} />
                </div>
              </div>

              {/* GitHub */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Github size={12} /> GitHub Stats
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Contributions (year)" value={ghContributions} onChange={setGhContributions} min={0} max={5000}
                    autoFilled={autoFilled.has('github_contributions')} note="Last 12 months" />
                  <Field label="Public Repos" value={ghRepos} onChange={setGhRepos} min={0} max={200}
                    autoFilled={autoFilled.has('github_repo_count')} />
                </div>
              </div>

              {/* LeetCode */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, color: C.accent, letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BookOpen size={12} /> LeetCode Stats
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Problems Solved" value={lcSolved} onChange={setLcSolved} min={0} max={4000}
                    autoFilled={autoFilled.has('leetcode_problems_solved')} />
                  <Field label="Contest Rating" value={lcRating} onChange={setLcRating} min={0} max={3500}
                    note="0 if not participated"
                    autoFilled={autoFilled.has('leetcode_contest_rating')} />
                </div>
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#fff1f2', border: '1px solid #fecaca', borderRadius: 10 }}>
                  <AlertCircle size={15} color={C.danger} />
                  <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>{error}</span>
                </div>
              )}

              <button onClick={handleSubmit} disabled={loading}
                style={{
                  padding: '14px 24px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? C.muted : `linear-gradient(135deg, ${C.accent} 0%, #a855f7 100%)`,
                  color: 'white', fontFamily: "'Fira Code', monospace", fontSize: 15, fontWeight: 800,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: loading ? 'none' : '0 4px 14px rgba(124,58,237,0.35)',
                  transition: 'all 0.2s',
                }}>
                {loading ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                        <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                      </path>
                    </svg>
                    Analysing…
                  </>
                ) : (
                  <><Brain size={16} /> Predict Placement</>
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          {result && (
            <div>
              <h2 style={{ fontFamily: "'Fira Code', monospace", fontSize: 16, fontWeight: 800, color: C.ink, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Trophy size={16} color={C.accent} /> Analysis Results
              </h2>
              <ResultCard result={result} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
