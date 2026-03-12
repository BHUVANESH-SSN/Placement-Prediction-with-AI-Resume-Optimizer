"use client";

import AtsScoreCard from "@/components/AtsScoreCard";
import GeneratedResume from "@/components/GeneratedResume";
import Heatmap from "@/components/Heatmap";
import JDSection from "@/components/JDSection";
import SkillGap from "@/components/SkillGap";
import { apiGet, clearAuth, getAuth } from "@/lib/api";
import {
  FileText,
  LogOut,
  Sparkles,
  Upload,
  Wand2,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ── TYPES ── */
interface Auth { token: string; email: string | null; name: string | null; }
interface Profile { full_name?: string; email?: string; phone?: string; location?: string; institute?: string; }

/* ── DESIGN ── */
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

/* ── NAVBAR ── */
function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA', 'Predict', 'Nova AI'];
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
        <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: '#0d0d14', display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          AIRO<div style={{ width: '6px', height: '6px', backgroundColor: '#7c3aed', marginLeft: '4px' }} />
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 36, marginRight: '120px' }}>
        {NAV.map(label => (
          <button key={label} onClick={() => {
            const path = label === 'Dashboard' ? '/home' : label === 'Development' ? '/development' : label === 'Resume Builder' ? '/resume' : label === 'DSA' ? '/dsa' : label === 'Predict' ? '/predict' : '/career-coach';
            router.push(path);
          }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Fira Code', monospace", fontSize: 14, color: active === label ? C.accent : C.muted, fontWeight: active === label ? 700 : 500, borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent', paddingBottom: 4, transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── CREATE MODE – plain resume from dashboard profile ── */
function CreateMode({ auth }: { auth: Auth | null }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<{ resumeData: any; pdfPath: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const formData = new FormData();
      if (resumeFile) formData.append("resume_file", resumeFile);

      const backendUrl = process.env.NEXT_PUBLIC_JD_BACKEND_URL || "http://localhost:5000";
      const res = await fetch(`${backendUrl}/api/create`, {
        method: "POST",
        headers: {
          "x-api-key": process.env.NEXT_PUBLIC_API_SECRET_KEY ?? "",
          ...(auth?.token ? { "Authorization": `Bearer ${auth.token}` } : {}),
        },
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? `Request failed with status ${res.status}`);
      }
      const data = await res.json();
      setResult({ resumeData: data.resume_data, pdfPath: data.pdf_path });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (result) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <GeneratedResume
          resumeData={result.resumeData}
          pdfPath={result.pdfPath}
          onRegenerate={() => setResult(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: '40px', boxShadow: '0 4px 20px rgba(15,23,42,0.06)', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Profile source info */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: C.accentSoft, borderRadius: 16, padding: '18px 22px' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={20} color="#fff" />
        </div>
        <div>
          <p style={{ fontFamily: "'Fira Code', monospace", fontWeight: 700, fontSize: 14, color: C.ink, margin: '0 0 4px' }}>
            Using your dashboard profile
          </p>
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, color: C.muted, margin: 0 }}>
            We&apos;ll pull your education, skills, experience and projects from your saved profile to generate an ATS-friendly LaTeX resume.
            Optionally upload your existing resume file below to use that instead.
          </p>
        </div>
      </div>

      {/* Optional resume file upload */}
      <div>
        <label style={{ fontFamily: "'Fira Code', monospace", fontSize: 12.5, fontWeight: 700, color: C.ink, marginBottom: 10, display: 'block', letterSpacing: '0.3px' }}>
          Override with existing resume (optional — PDF or DOCX)
        </label>
        <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }}
          onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)} />
        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault(); setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f && (f.name.endsWith('.pdf') || f.name.endsWith('.docx'))) setResumeFile(f);
          }}
          style={{
            border: `2px dashed ${dragOver ? C.accent : C.border}`, borderRadius: 14,
            padding: '22px 20px', display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', transition: 'all 0.2s',
            background: dragOver ? C.accentSoft : 'transparent',
          }}
          onMouseEnter={e => { if (!dragOver) { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.background = `${C.accentSoft}60`; } }}
          onMouseLeave={e => { if (!dragOver) { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = 'transparent'; } }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 10, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0 }}>
            <Upload size={18} />
          </div>
          {resumeFile ? (
            <div>
              <p style={{ fontFamily: "'Fira Code', monospace", fontWeight: 700, fontSize: 14, color: C.ink, margin: 0 }}>{resumeFile.name}</p>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: C.success, margin: '3px 0 0', fontWeight: 600 }}>Will be parsed automatically</p>
            </div>
          ) : (
            <div>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, color: C.muted, margin: 0 }}>
                Drop a <strong style={{ color: C.ink }}>.pdf</strong> or <strong style={{ color: C.ink }}>.docx</strong> here, or click to browse
              </p>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, color: C.muted, margin: '3px 0 0' }}>Leave empty to use your dashboard profile</p>
            </div>
          )}
          {resumeFile && (
            <button onClick={(e) => { e.stopPropagation(); setResumeFile(null); }}
              style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, fontSize: 18, lineHeight: 1, padding: 4 }}>×</button>
          )}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fff0f0', border: `1px solid ${C.accent2}40`, borderRadius: 12, padding: '12px 16px', color: C.accent2, fontSize: 13.5, fontFamily: "'Fira Code', monospace", fontWeight: 600 }}>
          ⚠️ {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={isGenerating}
        style={{
          width: '100%', padding: 16, background: isGenerating ? 'rgba(167,139,250,0.6)' : 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', color: '#fff',
          border: 'none', borderRadius: 14, fontFamily: "'Fira Code', monospace", fontWeight: 700,
          fontSize: 15, cursor: isGenerating ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
          boxShadow: `0 4px 20px ${C.accent}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        }}
        onMouseEnter={e => { if (!isGenerating) { e.currentTarget.style.background = 'linear-gradient(135deg, #c4b5fd 0%, #7c3aed 50%, #0d0d14 100%)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
        onMouseLeave={e => { if (!isGenerating) { e.currentTarget.style.background = 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)'; e.currentTarget.style.transform = 'none'; } }}
      >
        {isGenerating ? (
          <><div style={{ width: 18, height: 18, border: `2px solid rgba(255,255,255,0.4)`, borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Building your resume...</>
        ) : (
          <><FileText size={18} /> Generate Resume</>
        )}
      </button>
    </div>
  );
}

const Index = () => {
  const router = useRouter();
  const [auth, setAuth] = useState<Auth | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sbHover, setSbHover] = useState(false);
  const [mode, setMode] = useState<'create' | 'tailor'>('create');

  /* tailor mode state */
  const [isGenerating, setIsGenerating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resumeData, setResumeData] = useState<any>(null);
  const [gapData, setGapData] = useState<any>(null);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [atsScores, setAtsScores] = useState({ with_jd: 0, without_jd: 0 });
  const [atsKeywords, setAtsKeywords] = useState<any>(null);

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

  const handleTailorGenerate = (data?: any) => {
    if (data && data.status === "success") {
      setResumeData(data.tailored_resume);
      setGapData(data.gap_analysis);
      setPdfPath(data.pdf_path);
      setAtsScores(data.ats_score);
      setAtsKeywords(data.ats_keywords ?? null);
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const logout = () => { clearAuth(); router.push('/login'); };

  const displayName = profile?.full_name || auth?.name || auth?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: "'Fira Code', monospace" }}>
      <Navbar active="Resume Builder" />

      {/* SIDEBAR */}
      <aside
        onMouseEnter={() => setSbHover(true)}
        onMouseLeave={() => setSbHover(false)}
        style={{
          position: 'fixed', top: NAV_H, left: 0, width: sbHover ? SB_MAX : SB_MIN, height: `calc(100vh - ${NAV_H}px)`,
          overflowX: 'hidden', overflowY: 'auto', borderRight: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(20px)', padding: sbHover ? '40px 28px 40px 34px' : '40px 14px', display: 'flex',
          flexDirection: 'column', alignItems: sbHover ? 'flex-start' : 'center', zIndex: 100,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', scrollbarWidth: 'none'
        }}>
        <div style={{
          width: sbHover ? 72 : 52, height: sbHover ? 72 : 52, borderRadius: '50%',
          background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          fontWeight: 800, fontSize: sbHover ? 24 : 18, marginBottom: sbHover ? 16 : 32,
          flexShrink: 0, boxShadow: `0 12px 30px ${C.accent}45`,
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden'
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
            width: sbHover ? '100%' : 44, height: 44, display: 'flex', alignItems: 'center',
            gap: 12, justifyContent: sbHover ? 'flex-start' : 'center', background: 'none',
            border: `1.5px solid ${C.border}`, borderRadius: 12, padding: sbHover ? '10px 14px' : '0',
            fontFamily: "'Fira Code', monospace", fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            color: C.muted, transition: 'all 0.2s', flexShrink: 0
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
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 40px' }}>

          {/* Page header */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontWeight: 900, fontSize: 44, color: C.ink, margin: '0 0 10px', letterSpacing: '-1.5px' }}>
              Resume <span style={{ color: C.accent }}>Builder</span>
            </h1>
            <p style={{ fontSize: 16, color: C.muted, fontWeight: 500, margin: 0 }}>
              Build a clean ATS-friendly resume or tailor it to a specific job description.
            </p>
          </div>

          {/* Mode switcher */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 36 }}>
            {([
              { key: 'create', label: 'Create Resume', icon: <FileText size={16} />, desc: 'From your profile' },
              { key: 'tailor', label: 'Tailor to JD', icon: <Wand2 size={16} />, desc: 'AI-powered match' },
            ] as const).map(({ key, label, icon, desc }) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px',
                  borderRadius: 16, border: `2px solid ${mode === key ? C.accent : C.border}`,
                  background: mode === key ? C.accentSoft : C.surface,
                  cursor: 'pointer', transition: 'all 0.2s', fontFamily: "'Fira Code', monospace",
                  boxShadow: mode === key ? `0 4px 16px ${C.accent}20` : 'none',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 10, background: mode === key ? C.accent : `${C.muted}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mode === key ? '#fff' : C.muted, flexShrink: 0 }}>
                  {icon}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14, color: mode === key ? C.accent : C.ink }}>{label}</p>
                  <p style={{ margin: 0, fontSize: 12, color: C.muted, fontWeight: 500 }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── CREATE MODE ── */}
          {mode === 'create' && <CreateMode auth={auth} />}

          {/* ── TAILOR MODE ── */}
          {mode === 'tailor' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 28, padding: 32, boxShadow: '0 4px 20px rgba(15,23,42,0.06)' }}>
                <JDSection onGenerate={handleTailorGenerate} isGenerating={isGenerating} setIsGenerating={setIsGenerating} />
              </div>

              {!showResults && !isGenerating && (
                <div style={{ border: `2px dashed ${C.border}`, borderRadius: 28, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: C.muted }}>
                  <div style={{ width: 60, height: 60, borderRadius: 18, background: C.accentSoft, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                    <Wand2 size={28} />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: 14, margin: 0 }}>Paste or upload a job description above to get your AI-tailored resume</p>
                </div>
              )}

              {isGenerating && (
                <div style={{ borderRadius: 28, background: '#fff', border: `1px solid ${C.border}`, height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  <div style={{ width: 44, height: 44, border: `3px solid ${C.accentSoft}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontWeight: 700, color: C.ink, fontSize: 15, margin: 0 }}>AI is analyzing the JD and crafting your resume...</p>
                </div>
              )}

              {showResults && resumeData && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
                  <GeneratedResume
                    resumeData={resumeData}
                    pdfPath={pdfPath}
                    onRegenerate={() => { setShowResults(false); setResumeData(null); setPdfPath(null); }}
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
                    <Heatmap gapData={gapData} atsKeywords={atsKeywords} />
                    <SkillGap gapData={gapData} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>


      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default Index;
