"use client";

import AtsScoreCard from "@/components/AtsScoreCard";
import Footer from "@/components/Footer";
import GeneratedResume from "@/components/GeneratedResume";
import Heatmap from "@/components/Heatmap";
import JDSection from "@/components/JDSection";
import SkillGap from "@/components/SkillGap";
import { apiGet, clearAuth, getAuth } from "@/lib/api";
import {
  FileText,
  LogOut,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/* ── TYPES ── */
interface Auth { token: string; email: string | null; name: string | null; }
interface Profile { full_name?: string; email?: string; phone?: string; location?: string; institute?: string; }

/* ── DESIGN ── */
const C = {
  ink: '#0f172a',
  paper: '#f8fafc',
  surface: '#ffffff',
  accent: '#7c3aed',
  accentSoft: '#ede9fe',
  accent2: '#ef4444',
  muted: '#64748b',
  border: '#e2e8f0',
};

/* ── NAVBAR ── */
function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA'];
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', height: 60, padding: '0 34px',
      background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)',
      borderBottom: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => router.push('/home')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 7 2 12 8 17" />
          <polyline points="16 7 22 12 16 17" />
        </svg>
        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: '#0d0d14', display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          AIRO<div style={{ width: '6px', height: '6px', backgroundColor: '#7c3aed', marginLeft: '4px' }} />
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 36, marginRight: '120px' }}>
        {NAV.map(label => (
          <button key={label} onClick={() => {
            const path = label === 'Dashboard' ? '/home' : label === 'Development' ? '/development' : label === 'Resume Builder' ? '/resume' : '/dsa';
            router.push(path);
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', fontSize: 14, color: active === label ? C.accent : C.muted, fontWeight: active === label ? 700 : 500, borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent', paddingBottom: 4, transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

const Index = () => {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sbHover, setSbHover] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [gapData, setGapData] = useState<any>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [atsScores, setAtsScores] = useState({ with_jd: 0, without_jd: 0 });

  const SB_MIN = 88;
  const SB_MAX = 285;
  const NAV_H = 60;

  useEffect(() => {
    const a = getAuth();
    if (!a) { router.push('/login'); return; }
    setAuth(a);
    if (a.email) {
      apiGet(`/form/get-profile/${encodeURIComponent(a.email)}`)
        .then(setProfile)
        .catch(() => { });
    }
  }, [router]);

  const handleGenerate = (data?: any) => {
    if (data && data.status === "success") {
      setResumeData(data.tailored_resume);
      setGapData(data.gap_analysis);
      setPdfPath(data.pdf_path);
      setAtsScores(data.ats_score);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const logout = () => { clearAuth(); router.push('/login'); };

  const displayName = profile?.full_name || auth?.name || auth?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: 'Montserrat, sans-serif' }}>
      <Navbar active="Resume Builder" />

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setSbHover(true)}
        onMouseLeave={() => setSbHover(false)}
        style={{
          position: 'fixed', top: NAV_H, left: 0, width: sbHover ? SB_MAX : SB_MIN, height: `calc(100vh - ${NAV_H}px)`,
          overflowX: 'hidden', overflowY: 'auto', borderRight: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)', padding: sbHover ? '40px 28px 40px 34px' : '40px 14px', display: 'flex',
          flexDirection: 'column', alignItems: sbHover ? 'flex-start' : 'center', zIndex: 100, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', scrollbarWidth: 'none'
        }}>
        <div style={{
          width: sbHover ? 72 : 52, height: sbHover ? 72 : 52, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: sbHover ? 24 : 18,
          marginBottom: sbHover ? 16 : 32, flexShrink: 0, boxShadow: `0 12px 30px ${C.accent}45`, transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden'
        }}>
          {initials}
        </div>

        <div style={{ opacity: sbHover ? 1 : 0, height: sbHover ? 'auto' : 0, transition: 'all 0.3s', visibility: sbHover ? 'visible' : 'hidden', width: '100%' }}>
          <p style={{ fontWeight: 800, fontSize: 18, color: C.ink, margin: '0 0 4px', whiteSpace: 'nowrap' }}>{displayName}</p>
          <p style={{ fontSize: 12, color: C.muted, margin: '0 0 24px', wordBreak: 'break-all' }}>{auth?.email}</p>
        </div>

        <div style={{ flex: 1 }} />

        <button onClick={logout}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent2; e.currentTarget.style.color = C.accent2; e.currentTarget.style.background = '#fff0f0'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; e.currentTarget.style.background = 'none'; }}
          style={{
            width: sbHover ? '100%' : 44, height: 44, display: 'flex', alignItems: 'center', gap: 12, justifyContent: sbHover ? 'flex-start' : 'center',
            background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: sbHover ? '10px 14px' : '0', fontFamily: 'Montserrat, sans-serif',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: C.muted, transition: 'all 0.2s', flexShrink: 0
          }} title={!sbHover ? 'Logout' : ''}>
          <LogOut size={18} />
          {sbHover && <span>Logout</span>}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{
        marginLeft: sbHover ? SB_MAX : SB_MIN, paddingTop: NAV_H + 40, paddingBottom: 100,
        transition: 'margin-left 0.4s cubic-bezier(0.4, 0, 0.2, 1)', minHeight: '100vh'
      }}>
        <div style={{ maxWidth: 850, margin: '0 auto', padding: '0 40px' }}>
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontWeight: 900, fontSize: 44, color: C.ink, margin: '0 0 10px', letterSpacing: '-1.5px' }}>
              Resume <span style={{ color: C.accent }}>Builder</span>
            </h1>
            <p style={{ fontSize: 16, color: C.muted, fontWeight: 500 }}>
              Tailor your resume to any job description with AI precision
            </p>
          </div>

          <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 28, padding: 32, boxShadow: '0 4px 20px rgba(15,23,42,0.06)', marginBottom: 40 }}>
            <JDSection onGenerate={handleGenerate} isGenerating={isGenerating} setIsGenerating={setIsGenerating} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {!showResults && !isGenerating && (
              <div style={{ border: `2px dashed ${C.border}`, borderRadius: 28, height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, color: C.muted }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                  <FileText size={32} />
                </div>
                <p style={{ fontWeight: 600, fontSize: 14 }}>
                  Paste a job description above to generate your optimized resume
                </p>
              </div>
            )}

            {isGenerating && (
              <div style={{ borderRadius: 28, background: '#fff', border: `1px solid ${C.border}`, height: 320, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                <div style={{ width: 44, height: 44, border: `3px solid ${C.accentSoft}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <p style={{ fontWeight: 700, color: C.ink, fontSize: 15 }}>
                  AI is analyzing the JD and crafting your resume...
                </p>
              </div>
            )}

            {showResults && resumeData && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                <GeneratedResume
                  resumeData={resumeData}
                  pdfPath={pdfPath}
                  onRegenerate={() => {
                    setShowResults(false);
                    setResumeData(null);
                    setPdfPath(null);
                  }}
                />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                      <Sparkles size={16} />
                    </div>
                    <h2 style={{ fontWeight: 800, fontSize: 24, color: C.ink, margin: 0 }}>ATS Analysis</h2>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <AtsScoreCard label="Match with JD" score={atsScores.with_jd} delay={100} />
                    <AtsScoreCard label="Base Score" score={atsScores.without_jd} delay={300} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                  <Heatmap gapData={gapData} />
                  <SkillGap gapData={gapData} />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Index;
