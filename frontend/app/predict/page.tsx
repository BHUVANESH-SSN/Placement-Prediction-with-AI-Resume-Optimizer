'use client';

import { apiGet, apiPostAuth, clearAuth, getAuth } from '@/lib/api';
import {
  AlertCircle,
  ArrowLeft,
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
import { useEffect, useRef, useState } from 'react';

/* ── TYPES ── */
interface Auth { token: string; email: string | null; name: string | null; }
interface PrefillData {
  github_linked: boolean; leetcode_linked: boolean; profile_linked: boolean;
  prefill: {
    cgpa: number | null; backlog_count: number | null; branch: string | null;
    internship_count: number | null; internship_duration_months: number | null;
    project_count: number | null; project_complexity_score: number | null;
    certification_count: number | null; skill_diversity_score: number | null;
    github_repo_count: number | null; github_contributions: number | null;
    leetcode_problems_solved: number | null; leetcode_ranking: number | null;
    leetcode_contest_rating: number | null;
  };
  github_username: string | null; leetcode_username: string | null;
}
interface FeatureImpact { feature: string; shap_value: number; }
interface Recommendation { priority: string; action: string; }
interface PredictResult {
  placement_probability_pct: number; predicted_company_tier: string;
  strengths: FeatureImpact[]; gaps: FeatureImpact[]; recommendations: Recommendation[];
}

/* ── CONSTANTS ── */
const BRANCHES = ['CS', 'IT', 'ECE', 'EEE', 'Mechanical', 'Chemical', 'Civil', 'Biotech'];

const TIER_META: Record<string, { color: string; bg: string; label: string; emoji: string }> = {
  'FAANG':         { color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  label: 'Top Tier',      emoji: '🚀' },
  'Mid-tier':      { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  label: 'Strong Tier',   emoji: '⚡' },
  'Mass Recruiter':{ color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Good Standing', emoji: '✅' },
  'Not Placed':    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   label: 'Needs Work',    emoji: '📈' },
};

/* ── DESIGN TOKENS ── */
const C = {
  ink: '#0f172a', paper: '#f8fafc', surface: '#ffffff',
  accent: '#7c3aed', accentSoft: '#ede9fe',
  muted: '#64748b', border: '#e2e8f0',
  success: '#16a34a', danger: '#ef4444', orange: '#f97316',
};

const FONT = "'Montserrat', sans-serif";

/* ══════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════ */
function Navbar({ active, onBack, showBack }: { active?: string; onBack?: () => void; showBack?: boolean }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA', 'Roadmap', 'Predict', 'Nova AI'];
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', height: 60, padding: '0 34px',
      background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)',
      borderBottom: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/home')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 7 2 12 8 17" /><polyline points="16 7 22 12 16 17" />
        </svg>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: '#0d0d14' }}>
          AIRO<span style={{ display: 'inline-block', width: 6, height: 6, background: '#7c3aed', marginLeft: 4, verticalAlign: 'middle' }} />
        </span>
      </div>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 32, marginRight: '80px' }}>
        {NAV.map(label => (
          <button key={label} onClick={() => {
            const paths: Record<string,string> = { Dashboard:'/home', Development:'/development', 'Resume Builder':'/resume', DSA:'/dsa', Roadmap:'/roadmap', Predict:'/predict', 'Nova AI':'/career-coach' };
            router.push(paths[label] || '/home');
          }} style={{
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 14,
            color: active === label ? C.accent : C.muted,
            fontWeight: active === label ? 700 : 500,
            borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent',
            paddingBottom: 4, transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {showBack && onBack && (
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'white',
            cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 700, color: C.ink,
            transition: 'all 0.2s',
          }}>
            <ArrowLeft size={13} /> Back to Form
          </button>
        )}
        <button onClick={() => { clearAuth(); router.push('/login'); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontFamily: FONT, fontSize: 13 }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </nav>
  );
}

/* ══════════════════════════════════════════
   FORM FIELD
══════════════════════════════════════════ */
function Field({ label, value, onChange, type='number', min, max, step, note, autoFilled }:
  { label:string; value:string|number; onChange:(v:string)=>void; type?:string; min?:number; max?:number; step?:number; note?:string; readOnly?:boolean; autoFilled?:boolean }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.8, display:'flex', alignItems:'center', gap:6 }}>
        {label}
        {autoFilled && <span style={{ background:'#dcfce7', color:'#16a34a', fontSize:9, padding:'2px 7px', borderRadius:4, fontWeight:800, letterSpacing:0.5 }}>AUTO</span>}
      </label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        min={min} max={max} step={step}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          padding:'10px 14px', borderRadius:10,
          border: `1.5px solid ${focused ? C.accent : autoFilled ? '#86efac' : C.border}`,
          fontFamily:FONT, fontSize:14, color:C.ink,
          background: autoFilled ? '#f0fdf4' : C.surface,
          outline:'none', transition:'all 0.2s',
          boxShadow: focused ? `0 0 0 3px ${C.accentSoft}` : 'none',
        }}
      />
      {note && <span style={{ fontFamily:FONT, fontSize:10, color:C.muted }}>{note}</span>}
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label:string; value:string; onChange:(v:string)=>void; options:string[] }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
      <label style={{ fontFamily:FONT, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:0.8 }}>{label}</label>
      <div style={{ position:'relative' }}>
        <select value={value} onChange={e => onChange(e.target.value)} style={{
          width:'100%', padding:'10px 36px 10px 14px', borderRadius:10,
          border:`1.5px solid ${C.border}`, fontFamily:FONT, fontSize:14,
          color:C.ink, background:C.surface, outline:'none', appearance:'none', cursor:'pointer',
        }}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', color:C.muted, pointerEvents:'none' }} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ANIMATED NUMBER
══════════════════════════════════════════ */
function AnimatedNumber({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 1400;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setDisplay(target); clearInterval(timer); }
      else setDisplay(Math.floor(start * 10) / 10);
    }, step);
    return () => clearInterval(timer);
  }, [target]);
  return <>{display}{suffix}</>;
}

/* ══════════════════════════════════════════
   RESULTS PAGE (full-page, animated)
══════════════════════════════════════════ */
function ResultsPage({ result, onBack }: { result: PredictResult; onBack: () => void }) {
  const [visible, setVisible] = useState(false);
  const prob = result.placement_probability_pct;
  const tier = result.predicted_company_tier;
  const tierMeta = TIER_META[tier] || { color: C.accent, bg: C.accentSoft, label: 'Predicted', emoji: '🎯' };

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const probColor = prob >= 70 ? C.success : prob >= 40 ? C.orange : C.danger;

  return (
    <div style={{
      minHeight: '100vh', background: C.paper, fontFamily: FONT,
      paddingTop: 100, paddingBottom: 80,
      opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(24px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:C.accentSoft, padding:'5px 14px', borderRadius:20, marginBottom:12 }}>
              <Brain size={13} color={C.accent} />
              <span style={{ fontSize:11, fontWeight:800, color:C.accent, letterSpacing:1.2 }}>ML ANALYSIS COMPLETE</span>
            </div>
            <h1 style={{ fontFamily:FONT, fontSize:'clamp(30px,4vw,46px)', fontWeight:900, color:C.ink, margin:0, letterSpacing:'-1.5px', lineHeight:1.1 }}>
              Your Placement Report
            </h1>
            <p style={{ fontFamily:FONT, fontSize:14, color:C.muted, marginTop:8, fontWeight:500 }}>
              Based on 17 profile features · XGBoost model prediction
            </p>
          </div>
          <button onClick={onBack} style={{
            display:'flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:12,
            border:`2px solid ${C.border}`, background:C.surface, cursor:'pointer',
            fontFamily:FONT, fontSize:13, fontWeight:700, color:C.ink,
            boxShadow:'0 2px 8px rgba(15,23,42,0.06)', transition:'all 0.2s',
          }}>
            <ArrowLeft size={15} /> Re-run Prediction
          </button>
        </div>

        {/* ── HERO METRICS ROW ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:24 }}>

          {/* Probability big card */}
          <div style={{
            gridColumn: 'span 1', background:C.surface, borderRadius:24, padding:'36px 40px',
            border:`1px solid ${C.border}`, boxShadow:'0 8px 40px rgba(15,23,42,0.08)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:8,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg, ${probColor}, ${probColor}88)`, borderRadius:'24px 24px 0 0' }} />
            <Trophy size={32} color={probColor} strokeWidth={2} />
            <div style={{ fontFamily:FONT, fontSize:64, fontWeight:900, color:probColor, lineHeight:1, letterSpacing:'-3px', marginTop:4 }}>
              <AnimatedNumber target={prob} suffix="%" />
            </div>
            <div style={{ fontFamily:FONT, fontSize:13, color:C.muted, fontWeight:600, letterSpacing:0.3 }}>Placement Probability</div>
            {/* Progress arc bar */}
            <div style={{ width:'100%', marginTop:8 }}>
              <div style={{ width:'100%', height:10, background:`${probColor}18`, borderRadius:10, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:10,
                  background:`linear-gradient(90deg, ${probColor}88, ${probColor})`,
                  width:`${prob}%`, transition:'width 1.4s cubic-bezier(0.34,1.56,0.64,1)',
                }} />
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:4 }}>
                <span style={{ fontFamily:FONT, fontSize:10, color:C.muted }}>0%</span>
                <span style={{ fontFamily:FONT, fontSize:10, color:C.muted }}>100%</span>
              </div>
            </div>
          </div>

          {/* Company tier card */}
          <div style={{
            background:C.surface, borderRadius:24, padding:'36px 32px',
            border:`1px solid ${C.border}`, boxShadow:'0 8px 40px rgba(15,23,42,0.08)',
            display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg, ${tierMeta.color}, ${tierMeta.color}88)`, borderRadius:'24px 24px 0 0' }} />
            <div style={{ fontSize:36 }}>{tierMeta.emoji}</div>
            <div style={{ fontFamily:FONT, fontSize:28, fontWeight:900, color:tierMeta.color, textAlign:'center', letterSpacing:'-0.5px', lineHeight:1.2 }}>
              {tier}
            </div>
            <div style={{ background:tierMeta.bg, color:tierMeta.color, padding:'6px 18px', borderRadius:20, fontFamily:FONT, fontSize:11, fontWeight:800, letterSpacing:0.5 }}>
              {tierMeta.label}
            </div>
          </div>

          {/* Score summary card */}
          <div style={{
            background:C.surface, borderRadius:24, padding:'28px 28px',
            border:`1px solid ${C.border}`, boxShadow:'0 8px 40px rgba(15,23,42,0.08)',
            display:'flex', flexDirection:'column', gap:12,
            position:'relative', overflow:'hidden',
          }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:4, background:`linear-gradient(90deg, ${C.accent}, ${C.accentSoft})`, borderRadius:'24px 24px 0 0' }} />
            <p style={{ fontFamily:FONT, fontSize:11, fontWeight:800, color:C.accent, letterSpacing:1.2, textTransform:'uppercase', margin:0 }}>Profile Breakdown</p>
            {[
              { label:'Strengths', value:result.strengths.length, color:C.success },
              { label:'Gaps Found', value:result.gaps.length, color:C.danger },
              { label:'Action Items', value:result.recommendations.length, color:C.orange },
            ].map(item => (
              <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontFamily:FONT, fontSize:13, color:C.muted, fontWeight:500 }}>{item.label}</span>
                <span style={{ fontFamily:FONT, fontSize:20, fontWeight:900, color:item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── STRENGTHS & GAPS ── */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>

          {/* Strengths */}
          <div style={{ background:C.surface, borderRadius:24, padding:'28px 32px', border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <CheckCircle2 size={18} color={C.success} />
              </div>
              <h3 style={{ fontFamily:FONT, fontSize:15, fontWeight:800, color:C.ink, margin:0 }}>Your Strengths</h3>
            </div>
            {result.strengths.length === 0
              ? <p style={{ fontFamily:FONT, fontSize:13, color:C.muted }}>No standout strengths identified.</p>
              : result.strengths.slice().reverse().map((s, i) => {
                const pct = Math.min(100, Math.abs(s.shap_value) * 30);
                return (
                  <div key={i} style={{ marginBottom: i < result.strengths.length - 1 ? 14 : 0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontFamily:FONT, fontSize:13, color:C.ink, fontWeight:600, textTransform:'capitalize' }}>
                        {s.feature.replace(/_/g,' ')}
                      </span>
                      <span style={{ fontFamily:FONT, fontSize:12, color:C.success, fontWeight:800 }}>+{s.shap_value.toFixed(3)}</span>
                    </div>
                    <div style={{ height:6, background:'#dcfce7', borderRadius:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:6, background:`linear-gradient(90deg, #86efac, ${C.success})`, width:`${pct}%`, transition:'width 1s ease' }} />
                    </div>
                  </div>
                );
              })
            }
          </div>

          {/* Gaps */}
          <div style={{ background:C.surface, borderRadius:24, padding:'28px 32px', border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <AlertCircle size={18} color={C.danger} />
              </div>
              <h3 style={{ fontFamily:FONT, fontSize:15, fontWeight:800, color:C.ink, margin:0 }}>Gaps to Address</h3>
            </div>
            {result.gaps.length === 0
              ? <p style={{ fontFamily:FONT, fontSize:13, color:C.muted }}>No major gaps detected!</p>
              : result.gaps.map((g, i) => {
                const pct = Math.min(100, Math.abs(g.shap_value) * 60);
                return (
                  <div key={i} style={{ marginBottom: i < result.gaps.length - 1 ? 14 : 0 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontFamily:FONT, fontSize:13, color:C.ink, fontWeight:600, textTransform:'capitalize' }}>
                        {g.feature.replace(/_/g,' ')}
                      </span>
                      <span style={{ fontFamily:FONT, fontSize:12, color:C.danger, fontWeight:800 }}>{g.shap_value.toFixed(3)}</span>
                    </div>
                    <div style={{ height:6, background:'#fee2e2', borderRadius:6, overflow:'hidden' }}>
                      <div style={{ height:'100%', borderRadius:6, background:`linear-gradient(90deg, #fca5a5, ${C.danger})`, width:`${pct}%`, transition:'width 1s ease' }} />
                    </div>
                  </div>
                );
              })
            }
          </div>
        </div>

        {/* ── ACTION PLAN ── */}
        {result.recommendations.length > 0 && (
          <div style={{ background:C.surface, borderRadius:24, padding:'32px 36px', border:`1px solid ${C.border}`, boxShadow:'0 4px 24px rgba(15,23,42,0.06)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:C.accentSoft, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <TrendingUp size={18} color={C.accent} />
              </div>
              <h3 style={{ fontFamily:FONT, fontSize:15, fontWeight:800, color:C.ink, margin:0 }}>Your Action Plan</h3>
              <span style={{ marginLeft:'auto', fontFamily:FONT, fontSize:11, color:C.muted, fontWeight:600 }}>
                {result.recommendations.length} item{result.recommendations.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px, 1fr))', gap:12 }}>
              {result.recommendations.map((r, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'flex-start', gap:14, padding:'16px 20px', borderRadius:14,
                  background: r.priority === 'HIGH' ? '#fff1f2' : '#fffbeb',
                  border:`1.5px solid ${r.priority === 'HIGH' ? '#fecaca' : '#fde68a'}`,
                  transition:'transform 0.2s',
                }}>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
                    <span style={{
                      fontFamily:FONT, fontSize:9, fontWeight:900, padding:'4px 8px', borderRadius:6,
                      background: r.priority === 'HIGH' ? C.danger : C.orange,
                      color:'white', letterSpacing:0.8,
                    }}>{r.priority}</span>
                    <span style={{ fontFamily:FONT, fontSize:11, color:C.muted, fontWeight:600 }}>#{i + 1}</span>
                  </div>
                  <span style={{ fontFamily:FONT, fontSize:13, color:C.ink, lineHeight:1.6, fontWeight:500 }}>{r.action}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── BOTTOM CTA ── */}
        <div style={{ marginTop:32, display:'flex', justifyContent:'center', gap:16, flexWrap:'wrap' }}>
          <button onClick={onBack} style={{
            display:'flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:12,
            border:`2px solid ${C.border}`, background:C.surface, cursor:'pointer',
            fontFamily:FONT, fontSize:14, fontWeight:700, color:C.ink,
            boxShadow:'0 2px 8px rgba(15,23,42,0.06)', transition:'all 0.2s',
          }}>
            <ArrowLeft size={16} /> Adjust & Re-predict
          </button>
        </div>

      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   FORM PAGE
══════════════════════════════════════════ */
function FormPage({ onResult }: { onResult: (r: PredictResult) => void }) {
  const router = useRouter();
  const [prefill, setPrefill] = useState<PrefillData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set());
  const [fetching, setFetching] = useState(false);

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
      if (p.leetcode_contest_rating != null)    { setLcRating(String(Math.round(p.leetcode_contest_rating))); filled.add('leetcode_contest_rating'); }
      setAutoFilled(filled);
    } catch { /* silent */ }
    finally { setFetching(false); }
  };

  useEffect(() => { handleFetchDetails(); }, []);

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const body = {
        cgpa: parseFloat(cgpa), backlog_count: parseInt(backlogs), degree_branch: branch,
        internship_count: parseInt(internships), internship_duration_months: parseFloat(internshipMonths),
        project_count: parseInt(projects), project_complexity_score: parseFloat(projectComplexity),
        certification_count: parseInt(certifications), skill_diversity_score: parseFloat(skillDiversity),
        github_contributions: parseInt(ghContributions) || 0, github_repo_count: parseInt(ghRepos) || 0,
        leetcode_problems_solved: parseInt(lcSolved) || 0, leetcode_contest_rating: parseInt(lcRating) || 0,
        top_n: 5,
      };
      const data = await apiPostAuth('/predict', body);
      onResult(data);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      if (e.status === 401) { clearAuth(); router.replace('/login'); return; }
      setError(e.message || 'Prediction failed');
    } finally { setLoading(false); }
  };

  const sectionLabel = (text: string, icon?: React.ReactNode) => (
    <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:14, paddingBottom:10, borderBottom:`1px solid ${C.border}` }}>
      {icon}
      <p style={{ fontFamily:FONT, fontSize:10, fontWeight:900, color:C.accent, letterSpacing:1.5, textTransform:'uppercase', margin:0 }}>{text}</p>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', background:C.paper, fontFamily:FONT, paddingTop:100, paddingBottom:80 }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'0 24px' }}>

        {/* Header */}
        <div style={{ marginBottom:32, textAlign:'center' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:C.accentSoft, padding:'6px 16px', borderRadius:20, marginBottom:14 }}>
            <Brain size={13} color={C.accent} />
            <span style={{ fontSize:11, fontWeight:800, color:C.accent, letterSpacing:1.2 }}>ML PLACEMENT PREDICTOR</span>
          </div>
          <h1 style={{ fontFamily:FONT, fontSize:'clamp(26px,4vw,40px)', fontWeight:900, color:C.ink, margin:'0 0 10px', letterSpacing:'-1.5px' }}>
            Predict Your Placement
          </h1>
          <p style={{ fontFamily:FONT, fontSize:14, color:C.muted, maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
            Our XGBoost model analyses 17 features from your profile to predict your placement probability and target company tier.
          </p>
        </div>

        {/* Linked accounts */}
        {prefill && (
          <div style={{ display:'flex', gap:10, justifyContent:'center', marginBottom:28, flexWrap:'wrap' }}>
            {[
              { linked: prefill.profile_linked,   icon: <Sparkles size={12} />, text: prefill.profile_linked ? 'Profile linked' : 'Profile not set up' },
              { linked: prefill.github_linked,     icon: <Github size={12} />,   text: prefill.github_linked ? (prefill.github_username ? `@${prefill.github_username}` : 'GitHub linked') : 'GitHub not linked' },
              { linked: prefill.leetcode_linked,   icon: <Code2 size={12} />,    text: prefill.leetcode_linked ? (prefill.leetcode_username ? `@${prefill.leetcode_username}` : 'LeetCode linked') : 'LeetCode not linked' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background: item.linked ? '#f0fdf4' : '#f8fafc', border:`1px solid ${item.linked ? '#86efac' : C.border}`, color: item.linked ? C.success : C.muted }}>
                {item.icon}
                <span style={{ fontFamily:FONT, fontSize:11, fontWeight:700 }}>{item.text}</span>
              </div>
            ))}
            {(!prefill.github_linked || !prefill.leetcode_linked) && (
              <button onClick={() => router.push('/development')} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:20, background:'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', border:'none', cursor:'pointer', fontFamily:FONT, fontSize:11, fontWeight:800, color:'#fff' }}>
                <Zap size={11} /> Link accounts
              </button>
            )}
          </div>
        )}

        {/* Form card */}
        <div style={{ background:C.surface, border:`1px solid ${C.border}`, borderRadius:28, padding:'36px 40px', boxShadow:'0 8px 40px rgba(15,23,42,0.08)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28 }}>
            <h2 style={{ fontFamily:FONT, fontSize:16, fontWeight:800, color:C.ink, margin:0, display:'flex', alignItems:'center', gap:8 }}>
              <Sparkles size={16} color={C.accent} /> Student Profile
            </h2>
            <button onClick={handleFetchDetails} disabled={fetching} style={{
              display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:10,
              border:`1.5px solid ${C.accent}`, background: fetching ? C.accentSoft : 'white',
              color:C.accent, cursor: fetching ? 'not-allowed' : 'pointer',
              fontFamily:FONT, fontSize:11, fontWeight:800, transition:'all 0.2s',
            }}>
              <RefreshCw size={12} style={{ animation: fetching ? 'spin 0.7s linear infinite' : 'none' }} />
              {fetching ? 'Fetching…' : 'Fetch Details'}
            </button>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:28 }}>
            <div>
              {sectionLabel('Academic')}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="CGPA" value={cgpa} onChange={setCgpa} min={0} max={10} step={0.1} note="0–10 scale" autoFilled={autoFilled.has('cgpa')} />
                <Field label="Backlogs" value={backlogs} onChange={setBacklogs} min={0} max={48} autoFilled={autoFilled.has('backlog_count')} />
                <div style={{ gridColumn:'span 2' }}>
                  <SelectField label="Degree Branch" value={branch} onChange={setBranch} options={BRANCHES} />
                </div>
              </div>
            </div>

            <div>
              {sectionLabel('Experience & Projects')}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="Internships" value={internships} onChange={setInternships} min={0} max={10} autoFilled={autoFilled.has('internship_count')} />
                <Field label="Internship Months" value={internshipMonths} onChange={setInternshipMonths} min={0} max={24} step={0.5} autoFilled={autoFilled.has('internship_duration_months')} />
                <Field label="Projects" value={projects} onChange={setProjects} min={0} max={20} autoFilled={autoFilled.has('project_count')} />
                <Field label="Project Complexity" value={projectComplexity} onChange={setProjectComplexity} min={0} max={10} step={0.5} note="0–10 scale" autoFilled={autoFilled.has('project_complexity_score')} />
              </div>
            </div>

            <div>
              {sectionLabel('Skills & Certifications')}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="Certifications" value={certifications} onChange={setCertifications} min={0} max={20} autoFilled={autoFilled.has('certification_count')} />
                <Field label="Skill Diversity" value={skillDiversity} onChange={setSkillDiversity} min={0} max={10} step={0.5} note="0–10 scale" autoFilled={autoFilled.has('skill_diversity_score')} />
              </div>
            </div>

            <div>
              {sectionLabel('GitHub Stats', <Github size={12} color={C.accent} />)}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="Contributions (year)" value={ghContributions} onChange={setGhContributions} min={0} max={5000} note="Last 12 months" autoFilled={autoFilled.has('github_contributions')} />
                <Field label="Public Repos" value={ghRepos} onChange={setGhRepos} min={0} max={200} autoFilled={autoFilled.has('github_repo_count')} />
              </div>
            </div>

            <div>
              {sectionLabel('LeetCode Stats', <BookOpen size={12} color={C.accent} />)}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <Field label="Problems Solved" value={lcSolved} onChange={setLcSolved} min={0} max={4000} autoFilled={autoFilled.has('leetcode_problems_solved')} />
                <Field label="Contest Rating" value={lcRating} onChange={setLcRating} min={0} max={3500} note="0 if not participated" autoFilled={autoFilled.has('leetcode_contest_rating')} />
              </div>
            </div>

            {error && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'12px 16px', background:'#fff1f2', border:'1px solid #fecaca', borderRadius:10 }}>
                <AlertCircle size={15} color={C.danger} />
                <span style={{ fontFamily:FONT, fontSize:13, color:C.danger, fontWeight:600 }}>{error}</span>
              </div>
            )}

            <button onClick={handleSubmit} disabled={loading} style={{
              padding:'15px 24px', borderRadius:14, border:'none', cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? C.muted : 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)',
              color:'white', fontFamily:FONT, fontSize:15, fontWeight:800,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              boxShadow: loading ? 'none' : '0 6px 20px rgba(124,58,237,0.4)',
              transition:'all 0.2s', letterSpacing:0.3,
            }}>
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83">
                      <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="0.8s" repeatCount="indefinite" />
                    </path>
                  </svg>
                  Analysing your profile…
                </>
              ) : (
                <><Brain size={16} /> Run Placement Prediction</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   ROOT PAGE — switches between form & results
══════════════════════════════════════════ */
export default function PredictPage() {
  const router = useRouter();
  const [result, setResult] = useState<PredictResult | null>(null);

  useEffect(() => {
    const a = getAuth();
    if (!a) router.push('/login');
  }, [router]);

  const handleResult = (r: PredictResult) => {
    setResult(r);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setResult(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Navbar active="Predict" showBack={!!result} onBack={handleBack} />
      {result
        ? <ResultsPage result={result} onBack={handleBack} />
        : <FormPage onResult={handleResult} />
      }
    </>
  );
}