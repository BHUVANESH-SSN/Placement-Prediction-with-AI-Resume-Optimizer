import Link from 'next/link';
import { ReactNode } from 'react';

const S = {
    page: {
        minHeight: '100vh',
        background: 'var(--paper)',
        color: 'var(--ink)',
        fontFamily: 'Montserrat, sans-serif',
        overflowX: 'hidden' as const,
    },
    nav: {
        position: 'fixed' as const,
        top: 0,
        width: '100%',
        padding: '20px 8vw',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(247, 246, 242, 0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(13,13,20,0.05)',
        zIndex: 100,
    },
    logo: {
        fontSize: 22,
        fontWeight: 900,
        letterSpacing: '-0.5px',
        color: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    navLinks: {
        display: 'flex',
        gap: 24,
        alignItems: 'center',
    },
    btnFlat: {
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--muted)',
        transition: 'color 0.2s',
    },
    btnMain: {
        background: 'linear-gradient(135deg, #6c47ff 0%, #8b6bff 100%)',
        color: 'white',
        padding: '10px 24px',
        borderRadius: 12,
        fontSize: 14.5,
        fontWeight: 700,
        boxShadow: '0 4px 14px rgba(108,71,255,0.3)',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    hero: {
        padding: '160px 8vw 100px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        textAlign: 'center' as const,
        position: 'relative' as const,
    },
    heroBadge: {
        padding: '6px 16px',
        background: 'rgba(108,71,255,0.1)',
        border: '1px solid rgba(108,71,255,0.2)',
        borderRadius: 20,
        color: '#6c47ff',
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: 1.5,
        textTransform: 'uppercase' as const,
        marginBottom: 24,
        animation: 'fadeSlideUp 0.5s ease-out forwards',
    },
    heroTitle: {
        fontSize: 'clamp(42px, 6vw, 76px)',
        fontWeight: 900,
        lineHeight: 1.05,
        letterSpacing: '-2px',
        marginBottom: 24,
        maxWidth: 900,
    },
    heroSub: {
        fontSize: 'clamp(16px, 2vw, 20px)',
        color: 'var(--muted)',
        lineHeight: 1.6,
        maxWidth: 700,
        marginBottom: 44,
    },
    ctaRow: {
        display: 'flex',
        gap: 16,
        animation: 'fadeSlideUp 0.8s ease-out forwards',
    },
    btnPrimaryLg: {
        background: 'var(--ink)',
        color: 'white',
        padding: '16px 36px',
        borderRadius: 14,
        fontSize: 16,
        fontWeight: 700,
        boxShadow: '0 8px 24px rgba(13,13,20,0.2)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
    },
    btnSecondaryLg: {
        background: 'white',
        color: 'var(--ink)',
        border: '1.5px solid var(--border)',
        padding: '16px 36px',
        borderRadius: 14,
        fontSize: 16,
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'all 0.2s',
    },
    section: {
        padding: '100px 8vw',
    },
    sectionHeader: {
        textAlign: 'center' as const,
        marginBottom: 64,
    },
    grid3: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32,
    },
    card: {
        background: 'white',
        border: '1px solid var(--border)',
        borderRadius: 24,
        padding: 40,
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        transition: 'transform 0.3s, box-shadow 0.3s',
    },
    iconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        background: 'rgba(108,71,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        color: '#6c47ff',
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 800,
        marginBottom: 12,
        letterSpacing: '-0.5px',
    },
    cardText: {
        fontSize: 15,
        color: '#6b6976',
        lineHeight: 1.65,
    },
    impactSection: {
        background: 'var(--ink)',
        color: 'white',
        padding: '100px 8vw',
        borderRadius: '40px 40px 0 0',
        marginTop: 60,
    },
    statsRow: {
        display: 'flex',
        justifyContent: 'space-around',
        flexWrap: 'wrap' as const,
        gap: 40,
        marginTop: 60,
    },
    statBox: {
        textAlign: 'center' as const,
    },
    statNum: {
        fontSize: 'clamp(48px, 6vw, 72px)',
        fontWeight: 900,
        letterSpacing: '-2px',
        color: '#6c47ff',
        marginBottom: 8,
    },
    statLabel: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.7)',
        fontWeight: 600,
    },
};

const FeatureCard = ({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) => (
    <div style={S.card} className="hover:-translate-y-2 hover:shadow-xl group transition-all duration-300">
        <div style={S.iconBox} className="group-hover:scale-110 transition-transform duration-300">
            {icon}
        </div>
        <h3 style={S.cardTitle}>{title}</h3>
        <p style={S.cardText}>{desc}</p>
    </div>
);

export default function LandingPage() {
    return (
        <div style={S.page}>
            {/* ── Navbar ── */}
            <nav style={S.nav}>
                <div style={S.logo}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="8 7 2 12 8 17" />
                        <polyline points="16 7 22 12 16 17" />
                    </svg>
                    <span style={{ display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
                        AIRO
                        <div style={{ width: '6px', height: '6px', backgroundColor: '#6c47ff', marginLeft: '4px' }} />
                    </span>
                </div>
                <div style={S.navLinks}>
                    <Link href="/login" style={S.btnFlat} className="hover:text-ink">Log in</Link>
                    <Link href="/signup" style={S.btnMain} className="hover:-translate-y-0.5 hover:shadow-lg">
                        Start Free
                    </Link>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={S.hero}>
                <div style={S.heroBadge}>Research-Grade Career Intelligence</div>
                <h1 style={S.heroTitle} className="fade-in-up">
                    Stop guessing keywords. <br />
                    Start <span style={{ color: '#6c47ff' }}>engineering</span> your career.
                </h1>
                <p style={S.heroSub} className="fade-in-up fade-in-up-delay-1">
                    A truly innovative Hybrid Resume Orchestrator. We don't just match keywords—we analyze semantic skill gaps, auto-cluster your experience, and generate highly targeted, hallucination-free LaTeX resumes tailored to exact Job Descriptions.
                </p>

                <div style={S.ctaRow}>
                    <Link href="/signup" style={S.btnPrimaryLg} className="hover:-translate-y-1 hover:shadow-xl">
                        Build My Profile
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                    </Link>
                    <a href="#features" style={S.btnSecondaryLg} className="hover:-translate-y-1 hover:border-ink">
                        See the Architecture
                    </a>
                </div>
            </section>

            {/* ── Project Motto / Vision ── */}
            <section style={{ ...S.section, background: 'rgba(108,71,255,0.03)', borderTop: '1px solid rgba(108,71,255,0.1)', borderBottom: '1px solid rgba(108,71,255,0.1)', textAlign: 'center' }}>
                <h2 style={{ fontSize: 14, fontWeight: 700, color: '#6c47ff', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 20 }}>
                    Our Vision
                </h2>
                <h3 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-1px', maxWidth: 900, margin: '0 auto 32px', lineHeight: 1.3 }}>
                    “Transforming job applications through intelligent resume tailoring and career insights.”
                </h3>
                <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 800, margin: '0 auto 48px', lineHeight: 1.6 }}>
                    Our system aims to revolutionize the job application process by automatically tailoring resumes to specific job descriptions using intelligent algorithms.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 24 }}>
                    {[
                        'Automated Resume Tailoring',
                        'Higher ATS Compatibility',
                        'Faster Job Application Workflow',
                        'Personalized Career Insights'
                    ].map((outcome, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', padding: '12px 24px', borderRadius: 30, border: '1px solid rgba(108,71,255,0.1)', boxShadow: '0 4px 12px rgba(108,71,255,0.03)', fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            {outcome}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Features Config ── */}
            <section id="features" style={S.section}>
                <div style={S.sectionHeader}>
                    <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16 }}>
                        What is Implemented in this Project?
                    </h2>
                    <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 600, margin: '0 auto' }}>
                        This isn't just another ChatGPT wrapper. It's a complete career reasoning engine with strict constraints and academic-level NLP pipelines.
                    </p>
                </div>

                <div style={S.grid3}>
                    <FeatureCard
                        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M3 12h18" /><circle cx="12" cy="12" r="4" /></svg>}
                        title={"1. Resume Versioning System"}
                        desc={"Every time you tailor a resume to a JD, our system saves a frozen snapshot. Treat your job applications like Git commits. View history, compare changes, and jump back to \"Resume_v4\" anytime."}
                    />
                    <FeatureCard
                        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12h4l3-9 5 18 3-9h5" /></svg>}
                        title={"2. Semantic Skill Gap Analysis"}
                        desc={"Traditional ATS parsers use basic regex. Our Gap Analyzer uses vector embeddings to map 'CNN' to 'Deep Learning.' It scores exactly what you have, what you partially match, and outputs a concrete Learning Roadmap."}
                    />
                    <FeatureCard
                        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
                        title={"3. Anti-Hallucination Constraints"}
                        desc={"A smart 'Truth Constraint' engine. If the AI LLM attempts to add 'Kubernetes' to a bullet point when it isn't supported by your base profile, our validation layer catches it, discards it, and safely falls back to a rule-based engine."}
                    />
                    <FeatureCard
                        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
                        title={"4. Auto Template Selection"}
                        desc={"The system automatically classifies your profile metadata using JD keyword scoring (Data Science vs. Software vs. Academic) and renders the best LaTeX template dynamically on the fly."}
                    />
                    <FeatureCard
                        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>}
                        title={"5. Personalized Impact Scoring"}
                        desc={"Every single generated bullet point is scored for impact inside our QualityScorer. Vague language ('helped with') is detected and penalized, while strong action verbs ('architected', 'spearheaded') are required for passing."}
                    />
                    <FeatureCard
                        icon={<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="7.5 4.21 12 6.81 16.5 4.21" /><polyline points="7.5 19.79 7.5 14.6 3 12" /><polyline points="21 12 16.5 14.6 16.5 19.79" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>}
                        title={"6. Multi-Model Scalable Engine"}
                        desc={"Powered by Groq with ultra-fast LLM routing. The Tailor Engine employs a deterministic multi-model fallback chain to guarantee high availability—ensuring zero latency interruptions during critical application rushes."}
                    />
                </div>
            </section>

            {/* ── Impact Section ── */}
            <section style={S.impactSection}>
                <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
                    <h2 style={{ fontSize: 46, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 20 }}>
                        What is the Impact?
                    </h2>
                    <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7 }}>
                        We've revolutionized how job applications are generated. By integrating deep semantic mapping with <strong>strict logic constraints</strong>, we eliminate the ethical, formatting, and optimization problems found in standard ChatGPT outputs.
                    </p>
                </div>

                <div style={S.statsRow}>
                    <div style={S.statBox}>
                        <div style={S.statNum}>100%</div>
                        <div style={S.statLabel}>No Hallucinations</div>
                    </div>
                    <div style={S.statBox}>
                        <div style={S.statNum}>3x</div>
                        <div style={S.statLabel}>ATS Match Rate</div>
                    </div>
                    <div style={S.statBox}>
                        <div style={S.statNum}>&lt;2s</div>
                        <div style={S.statLabel}>Tailoring Latency</div>
                    </div>
                    <div style={S.statBox}>
                        <div style={S.statNum}>LaTeX</div>
                        <div style={S.statLabel}>Pixel Perfect Parsing</div>
                    </div>
                </div>
            </section>

            {/* ── Purpose ── */}
            <section style={{ ...S.section, textAlign: 'center' }}>
                <h2 style={{ fontSize: 42, fontWeight: 900, letterSpacing: '-1.5px', marginBottom: 16 }}>
                    Designed for Action
                </h2>
                <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 700, margin: '0 auto 40px' }}>
                    <strong>Usage Purpose:</strong> Built exclusively for software engineers, data scientists, and academics striving for top-tier roles who need to bypass brutal automated ATS screenings while maintaining absolute technical integrity.
                </p>
                <Link href="/login" style={{ ...S.btnMain, fontSize: 16, padding: '16px 40px', borderRadius: 16 }}>
                    Experience the Engine
                </Link>
            </section>

            {/* ── Footer ── */}
            <footer style={{ padding: '40px 8vw', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', color: 'var(--muted)', fontSize: 14 }}>
                <div>© 2026 AIRO Pipeline. All rights reserved.</div>
                <div>Engineered with ❤️ for Tech Careers</div>
            </footer>
        </div>
    );
}
