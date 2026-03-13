"use client";

import Footer from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { apiGet, clearAuth, getAuth } from "@/lib/api";
import {
    ArrowLeft,
    ChevronRight,
    Cloud,
    Compass,
    Cpu,
    Database,
    ExternalLink,
    FileText,
    Layers,
    Layout,
    LogOut,
    Map as MapIcon,
    Palette,
    Server,
    Shield,
    Smartphone,
    Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/* ── DESIGN SYSTEM ── */
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

/* ── HELPERS ── */
function useScrollReveal(delay = 0) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setVisible(true);
        }, { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);
    return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms` } as React.CSSProperties };
}


/* ── ROLES DATA ── */
const ROLES = [
    { id: 'frontend', name: 'Frontend', icon: <Layout size={20} />, color: '#3b82f6', desc: 'Build stunning user interfaces using React, Next.js, and CSS.' },
    { id: 'backend', name: 'Backend', icon: <Server size={20} />, color: '#10b981', desc: 'Design robust APIs, databases, and server-side logic.' },
    { id: 'full-stack', name: 'Full Stack', icon: <Layers size={20} />, color: '#8b5cf6', desc: 'Master both ends of the web and build complete applications.' },
    { id: 'devops', name: 'DevOps', icon: <Cloud size={20} />, color: '#f59e0b', desc: 'Automate deployments, scale infra, and master CI/CD.' },
    { id: 'android', name: 'Android', icon: <Smartphone size={20} />, color: '#34d399', desc: 'Create amazing mobile experiences for the Android ecosystem.' },
    { id: 'ios', name: 'iOS', icon: <Smartphone size={20} />, color: '#000000', desc: 'Build premium mobile apps for iPhone and iPad using Swift.' },
    { id: 'data-analyst', name: 'Data Analyst', icon: <Database size={20} />, color: '#ec4899', desc: 'Extract insights from data using Python, SQL, and Excel.' },
    { id: 'ai-data-scientist', name: 'Data Scientist', icon: <Cpu size={20} />, color: '#06b6d4', desc: 'Build ML models and predictive systems with advanced math.' },
    { id: 'cyber-security', name: 'Cyber Security', icon: <Shield size={20} />, color: '#ef4444', desc: 'Protect systems from threats and master ethical hacking.' },
    { id: 'ux-design', name: 'UI Developer', icon: <Palette size={20} />, color: '#f43f5e', desc: 'Focus on perfect pixel implementation and motion design.' },
    { id: 'product-manager', name: 'Product Manager', icon: <Compass size={20} />, color: '#6366f1', desc: 'Define product vision, strategy, and lead delivery teams.' },
];

// ROADMAP_DETAILS removed - now fetched dynamically from backend

/* ── ROLE CARD COMPONENT ── */
const RoleCard = ({
    role,
    index,
    loadingRoadmap,
    onSelect,
    onAIReport
}: {
    role: any,
    index: number,
    loadingRoadmap: boolean,
    onSelect: (id: string) => void,
    onAIReport: (name: string) => void
}) => {
    const reveal = useScrollReveal(index * 50);
    return (
        <div ref={reveal.ref} style={{ ...reveal.style }}>
            <div
                onClick={() => onSelect(role.id)}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.04)'; }}
                style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)', boxShadow: '0 4px 12px rgba(15,23,42,0.04)', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}
            >
                <div style={{ width: 48, height: 48, borderRadius: 14, background: `${role.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color, marginBottom: 20 }}>
                    {role.icon}
                </div>
                <h3 style={{ fontWeight: 800, fontSize: 20, color: C.ink, marginBottom: 12 }}>{role.name}</h3>
                <p style={{ fontSize: 13.5, color: C.muted, lineHeight: 1.6, flex: 1 }}>{role.desc}</p>

                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: C.accent, fontWeight: 700, fontSize: 13 }}>
                        View <ChevronRight size={14} />
                    </div>
                    <button
                        disabled={loadingRoadmap}
                        onClick={(e) => { e.stopPropagation(); onAIReport(role.name); }}
                        style={{ marginLeft: 'auto', background: C.accentSoft, color: C.accent, border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                        {loadingRoadmap ? "..." : <><Sparkles size={12} /> AI Guide</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const STD_ICON_MAP: Record<string, any> = {
    "frontend": <Layout size={20} />,
    "backend": <Server size={20} />,
    "full-stack": <Layers size={20} />,
    "devops": <Cloud size={20} />,
    "android": <Smartphone size={20} />,
    "ios": <Smartphone size={20} />,
    "data-analyst": <Database size={20} />,
    "ai-data-scientist": <Cpu size={20} />,
    "cyber-security": <Shield size={20} />,
    "ux-design": <Palette size={20} />,
    "product-manager": <Compass size={20} />,
};

/* ── TOPIC SIDEBAR COMPONENT ── */
const TopicSidebar = ({ topic, onClose }: { topic: any, onClose: () => void }) => {
    if (!topic) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, width: 400,
            background: '#fff', borderLeft: `1px solid ${C.border}`, zIndex: 1000,
            boxShadow: '-20px 0 60px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column',
            animation: 'slideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)'
        }}>
            <style>{`
                @keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
            `}</style>

            <div style={{ padding: '32px 32px 24px', borderBottom: `1px solid ${C.paper}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: C.accent }} />
                    <h3 style={{ fontWeight: 900, fontSize: 20, color: C.ink, margin: 0 }}>Topic Detail</h3>
                </div>
                <button onClick={onClose} style={{ background: C.paper, border: 'none', borderRadius: 10, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: C.muted }}>
                    <ChevronRight size={18} />
                </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
                <h4 style={{ fontWeight: 900, fontSize: 32, color: C.ink, marginBottom: 16, lineHeight: 1.1 }}>{topic.n}</h4>
                
                {topic.desc && (
                    <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.6, marginBottom: 32 }}>{topic.desc}</p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {/* Primary Resource */}
                    <div>
                        <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Official Documentation</p>
                        <a href={topic.l} target="_blank" rel="noopener noreferrer" style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                            background: C.accentSoft, borderRadius: 16, textDecoration: 'none',
                            transition: 'all 0.2s', border: `1px solid ${C.accent}20`
                        }}
                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(124, 58, 237, 0.12)'; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                                <FileText size={16} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 14, fontWeight: 700, color: C.accent }}>View Documentation</div>
                                <div style={{ fontSize: 11, color: C.accent, opacity: 0.7 }}>{topic.l.includes('search') ? 'Resource Search' : new URL(topic.l).hostname}</div>
                            </div>
                            <ExternalLink size={16} color={C.accent} />
                        </a>
                    </div>

                    {/* Additional Resources from roadmap.sh */}
                    {topic.res && topic.res.length > 0 && (
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: 1 }}>Learning Resources</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {topic.res.map((r: any, i: number) => (
                                    <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{
                                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                                        background: C.paper, borderRadius: 12, textDecoration: 'none',
                                        transition: 'all 0.2s', color: C.ink, fontSize: 13, fontWeight: 600
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.borderColor = C.border; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = C.paper; e.currentTarget.style.boxShadow = 'none'; }}>
                                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.muted }} />
                                        <span style={{ flex: 1 }}>{r.title}</span>
                                        <ExternalLink size={14} color={C.muted} />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div style={{ padding: 32, borderTop: `1px solid ${C.paper}` }}>
                <button onClick={onClose} style={{ width: '100%', background: C.ink, color: '#fff', border: 'none', borderRadius: 14, padding: '14px', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                    Got it, thanks!
                </button>
            </div>
        </div>
    );
};

/* ── MIND MAP COMPONENT ── */
function MindMap({ data, onTopicSelect }: { data: any, onTopicSelect: (topic: any) => void }) {
    const reveal = useScrollReveal(100);
    const steps = data.steps || [];
    const colors = ['#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#f43f5e'];

    return (
        <div ref={reveal.ref} style={{ ...reveal.style, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 40, padding: '80px 40px', overflowX: 'auto', minHeight: 800, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.04)', position: 'relative', backgroundImage: `radial-gradient(${C.border} 1px, transparent 1px)`, backgroundSize: '40px 40px' }}>

            {/* Connecting SVG Lines (Simplified Concept) */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.1 }}>
                <defs>
                    <marker id="dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3">
                        <circle cx="5" cy="5" r="5" fill={C.muted} />
                    </marker>
                </defs>
            </svg>

            {/* Center Node */}
            <div style={{
                background: C.ink, borderRadius: 28, padding: '28px 56px',
                boxShadow: `0 24px 48px rgba(15,23,42,0.2)`, zIndex: 20, textAlign: 'center', minWidth: 320,
                fontFamily: "'Fira Code', monospace", fontWeight: 950, color: '#fff', fontSize: 24,
                marginBottom: 120, position: 'relative', border: '1px solid rgba(255,255,255,0.15)',
                letterSpacing: '-0.5px'
            }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', border: '4px solid #fff', boxShadow: '0 8px 16px rgba(124, 58, 237, 0.3)' }}>
                    <Sparkles size={32} color="#fff" />
                </div>
                {data.title}
                <div style={{ position: 'absolute', bottom: -120, left: '50%', width: 2, height: 120, background: `linear-gradient(to bottom, ${C.ink}, ${C.border})`, opacity: 0.5 }} />
            </div>

            {/* Hierarchical Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 60, width: '100%', maxWidth: 1200, position: 'relative' }}>
                {steps.map((step: any, i: number) => (
                    <div key={i} style={{ position: 'relative' }}>
                        {/* Connecting Line to Grid Item */}
                        <div style={{ position: 'absolute', top: -40, left: '50%', width: 2, height: 40, background: colors[i % colors.length], opacity: 0.2 }} />

                        <div style={{
                            background: '#fff', border: `1.5px solid ${C.border}`, borderRadius: 28, padding: 36,
                            boxShadow: '0 4px 20px rgba(0,0,0,0.02)', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            display: 'flex', flexDirection: 'column', gap: 24, height: '100%'
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = colors[i % colors.length];
                                e.currentTarget.style.transform = 'translateY(-10px)';
                                e.currentTarget.style.boxShadow = `0 20px 40px ${colors[i % colors.length]}10`;
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = C.border;
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.02)';
                            }}>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{
                                    width: 44, height: 44, borderRadius: 12, background: `${colors[i % colors.length]}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors[i % colors.length],
                                    fontWeight: 900, fontSize: 18, border: `1px solid ${colors[i % colors.length]}20`
                                }}>
                                    {i + 1}
                                </div>
                                <h4 style={{ fontWeight: 800, fontSize: 20, color: C.ink, margin: 0, letterSpacing: '-0.3px' }}>{step.name}</h4>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {step.items.map((item: any, j: number) => (
                                    <div key={j}
                                        onClick={() => onTopicSelect(item)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
                                            padding: '12px 16px', background: item.s === 'skip' ? '#f0fdf4' : item.s === 'focus' ? '#fff1f2' : item.s === 'bridge' ? '#fffbeb' : '#f9fafb',
                                            borderRadius: 16, border: `1px solid ${item.s === 'skip' ? '#bbf7d0' : item.s === 'focus' ? '#fecdd3' : item.s === 'bridge' ? '#fef3c7' : 'transparent'}`,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateX(6px)';
                                            e.currentTarget.style.background = '#fff';
                                            e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)';
                                            e.currentTarget.style.borderColor = colors[i % colors.length];
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'none';
                                            e.currentTarget.style.background = item.s === 'skip' ? '#f0fdf4' : item.s === 'focus' ? '#fff1f2' : item.s === 'bridge' ? '#fffbeb' : '#f9fafb';
                                            e.currentTarget.style.boxShadow = 'none';
                                            e.currentTarget.style.borderColor = item.s === 'skip' ? '#bbf7d0' : item.s === 'focus' ? '#fecdd3' : item.s === 'bridge' ? '#fef3c7' : 'transparent';
                                        }}>

                                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[i % colors.length], boxShadow: `0 0 10px ${colors[i % colors.length]}50` }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                {item.n}
                                                {item.s === 'skip' && <Sparkles size={11} color="#22c55e" />}
                                                {item.h && <span style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginLeft: 'auto', background: C.border + '50', padding: '2px 6px', borderRadius: 4 }}>{item.h}h</span>}
                                            </div>
                                            {item.desc && (
                                                <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.5, fontWeight: 500, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {item.desc}
                                                </div>
                                            )}
                                        </div>
                                        <ChevronRight size={14} color={C.muted} style={{ opacity: 0.5 }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── ROADMAP VIEW COMPONENT ── */
const RoadmapView = ({
    roleId,
    dynamicRoadmap,
    onBack,
    viewMode,
    setViewMode,
    router
}: {
    roleId: string,
    dynamicRoadmap: any,
    onBack: () => void,
    viewMode: 'list' | 'mindmap',
    setViewMode: (v: 'list' | 'mindmap') => void,
    router: any
}) => {
    const [selectedTopic, setSelectedTopic] = useState<any>(null);
    const data = (dynamicRoadmap && dynamicRoadmap.steps) ? dynamicRoadmap : { title: `${roleId.charAt(0).toUpperCase() + roleId.slice(1)} Roadmap`, steps: [] };
    const isFrontend = roleId === 'frontend' || (dynamicRoadmap?.title?.toLowerCase().includes('frontend'));

    // Reset scroll when view mode changes to re-trigger animations
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [viewMode]);

    return (
        <div style={{ position: 'relative' }}>
            {selectedTopic && <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 999, animation: 'fadeIn 0.3s ease' }} onClick={() => setSelectedTopic(null)} />}
            <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

            <TopicSidebar topic={selectedTopic} onClose={() => setSelectedTopic(null)} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
                <button
                    onClick={onBack}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: C.accent, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                >
                    <ArrowLeft size={18} />
                    Back to Roles
                </button>

                <div style={{ background: C.border, padding: 4, borderRadius: 12, display: 'flex', gap: 4 }}>
                    <button
                        onClick={() => setViewMode('list')}
                        style={{
                            background: viewMode === 'list' ? '#fff' : 'none', border: 'none', padding: '8px 16px', borderRadius: 8,
                            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            color: viewMode === 'list' ? C.accent : C.muted, boxShadow: viewMode === 'list' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <Layout size={16} /> List
                    </button>
                    <button
                        onClick={() => setViewMode('mindmap')}
                        style={{
                            background: viewMode === 'mindmap' ? '#fff' : 'none', border: 'none', padding: '8px 16px', borderRadius: 8,
                            display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                            color: viewMode === 'mindmap' ? C.accent : C.muted, boxShadow: viewMode === 'mindmap' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <MapIcon size={16} /> Mind Map
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
                <div>
                    <h2 style={{ fontWeight: 900, fontSize: 32, color: C.ink, marginBottom: 12 }}>{data.title}</h2>
                    <p style={{ color: C.muted, fontWeight: 500, margin: 0 }}>Master {data.title} landscape to become a world-class engineer.</p>
                </div>
                {(data.readiness_score !== undefined || isFrontend) && (
                    <div style={{
                        background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '12px 24px',
                        display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}>
                        <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 4 }}>Readiness Score</p>
                            <p style={{ fontSize: 24, fontWeight: 900, color: C.accent, margin: 0 }}>{data.readiness_score || 0}%</p>
                        </div>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: C.accent + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                            <Sparkles size={20} />
                        </div>
                    </div>
                )}
            </div>

            {viewMode === 'mindmap' ? (
                <MindMap key={`mindmap-${roleId}-${viewMode}`} data={data} onTopicSelect={(t) => setSelectedTopic(t)} />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', paddingLeft: 30 }}>
                    <div style={{ position: 'absolute', top: 0, left: 6, bottom: 0, width: 2, background: `linear-gradient(to bottom, ${C.accent}, transparent)` }} />
                    {data.steps.map((step: any, i: number) => (
                        <div key={i} style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: -30, top: 2, width: 14, height: 14, borderRadius: '50%', background: C.accent, border: '3px solid #fff', zIndex: 2 }} />
                            <h4 style={{ fontWeight: 800, fontSize: 18, color: C.ink, margin: '0 0 12px' }}>{step.name}</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                                {step.items.map((item: any, j: number) => (
                                    <div key={j}
                                        onClick={() => setSelectedTopic(item)}
                                        style={{
                                            background: item.s === 'skip' ? '#f0fdf4' : item.s === 'focus' ? '#fff1f2' : item.s === 'bridge' ? '#fffbeb' : '#fff',
                                            border: `1px solid ${item.s === 'skip' ? '#bbf7d0' : item.s === 'focus' ? '#fecdd3' : item.s === 'bridge' ? '#fef3c7' : C.border}`,
                                            borderRadius: 16, padding: '12px 20px',
                                            fontSize: 13, fontWeight: 600, color: C.ink, boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                            cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.2s',
                                            minWidth: 200, flex: '1 1 300px'
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.borderColor = item.s === 'skip' ? '#bbf7d0' : item.s === 'focus' ? '#fecdd3' : item.s === 'bridge' ? '#fef3c7' : C.border; e.currentTarget.style.transform = 'none'; }}>

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                {item.s === 'skip' && <span style={{ color: '#22c55e' }}><Sparkles size={14} /></span>}
                                                <span style={{ fontWeight: 800 }}>{item.n}</span>
                                            </div>
                                            {item.h && <span style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>{item.h}h</span>}
                                        </div>

                                        {item.desc && (
                                            <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, lineHeight: 1.4 }}>
                                                {item.desc}
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                                            <span style={{
                                                fontSize: 9, fontWeight: 900,
                                                color: item.s === 'skip' ? '#22c55e' : item.s === 'focus' ? '#ef4444' : item.s === 'bridge' ? '#f59e0b' : C.muted,
                                                textTransform: 'uppercase'
                                            }}>
                                                {item.s || 'Standard'}
                                            </span>
                                            <ChevronRight size={12} color={C.accent} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* APPLY SUITE for Frontend */}
            {isFrontend && (
                <div style={{ marginTop: 60, background: C.ink, borderRadius: 32, padding: 48, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 40, boxShadow: '0 20px 40px rgba(15,23,42,0.15)' }}>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ fontWeight: 900, fontSize: 32, marginBottom: 12 }}>Ready to <span style={{ color: '#a78bfa' }}>Apply</span>?</h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, lineHeight: 1.6, marginBottom: 0 }}>
                            You've mastered the roadmap. Now, let AIRO bridge the gap between learning and landing your dream job.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button onClick={() => router.push('/resume')} style={{ background: '#a78bfa', color: '#fff', border: 'none', borderRadius: 16, padding: '16px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <FileText size={18} /> Tailor Resume
                        </button>
                        <button style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: '16px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Sparkles size={18} /> Mock Interview
                        </button>
                    </div>
                </div>
            )}

            {data.steps.length === 0 && (
                <div style={{ background: C.accentSoft, borderRadius: 20, padding: 40, textAlign: 'center' }}>
                    <Compass size={48} color={C.accent} style={{ marginBottom: 16 }} />
                    <p style={{ fontWeight: 700, color: C.accent }}>Roadmap coming soon for this role!</p>
                    <p style={{ fontSize: 13, color: C.muted }}>Our AI is still crafting the perfect path for the selected role.</p>
                </div>
            )}
        </div>
    );
};

/* ── MAIN PAGE COMPONENT ── */
export default function RoadmapPage() {
    const router = useRouter();
    const [auth, setAuth] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [sbHover, setSbHover] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'mindmap'>('mindmap');
    const [externalRoadmaps, setExternalRoadmaps] = useState<any[]>([]);
    const [loadingRoadmap, setLoadingRoadmap] = useState(false);
    const [generatingAI, setGeneratingAI] = useState(false);
    const [dynamicRoadmap, setDynamicRoadmap] = useState<any>(null);

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

            // Fetch standard roadmaps list
            apiGet('/roadmap/list')
                .then(data => {
                    if (Array.isArray(data)) setExternalRoadmaps(data);
                })
                .catch(() => { });
        }
    }, [router]);

    const generateAIRoadmap = async (roleName: string) => {
        setGeneratingAI(true);
        setSelectedRole(roleName);
        try {
            const data = await apiGet(`/roadmap/generate/${encodeURIComponent(roleName)}`);
            setDynamicRoadmap(data);
        } catch (err) {
            console.error("Failed to generate AI roadmap", err);
            setSelectedRole(null);
        } finally {
            setGeneratingAI(false);
        }
    };

    const selectRole = async (roleId: string) => {
        setLoadingRoadmap(true);
        setDynamicRoadmap(null); // Clear previous
        setSelectedRole(roleId);
        try {
            const data = await apiGet(`/roadmap/detail/${roleId}`);
            setDynamicRoadmap(data);
        } catch (err) {
            console.error("Failed to fetch roadmap detail", err);
            setDynamicRoadmap(null);
        } finally {
            setLoadingRoadmap(false);
        }
    };

    const logout = () => { clearAuth(); router.push('/login'); };
    const displayName = profile?.full_name || auth?.name || auth?.email?.split('@')[0] || 'User';
    const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

    return (
        <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: "'Fira Code', monospace" }}>
            <Navbar active="Roadmap" />

            {/* SIDEBAR */}
            <aside
                onMouseEnter={() => setSbHover(true)}
                onMouseLeave={() => setSbHover(false)}
                style={{
                    position: 'fixed', top: NAV_H, left: 0, width: sbHover ? SB_MAX : SB_MIN, height: `calc(100vh - ${NAV_H}px)`,
                    overflowX: 'hidden', overflowY: 'auto', borderRight: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)',
                    backdropFilter: 'blur(20px)', padding: sbHover ? '40px 24px 40px 24px' : '40px 14px', display: 'flex',
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
                        background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, padding: sbHover ? '10px 14px' : '0', fontFamily: "'Fira Code', monospace",
                        fontSize: 13.5, fontWeight: 600, cursor: 'pointer', color: C.muted, transition: 'all 0.2s', flexShrink: 0
                    }} title={!sbHover ? 'Logout' : ''}>
                    <LogOut size={18} />
                    {sbHover && <span>Logout</span>}
                </button>
            </aside>

            {/* MAIN CONTENT */}
            <main style={{
                marginLeft: sbHover ? SB_MAX : SB_MIN, paddingTop: NAV_H + 40, paddingBottom: 100,
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0, 1)', minHeight: '100vh',
            }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px', position: 'relative' }}>

                    {/* LOADING OVERLAY */}
                    {(loadingRoadmap || generatingAI) && (
                        <div style={{
                            position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(255,255,255,0.85)',
                            backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', gap: 28,
                            animation: 'fadeIn 0.3s ease'
                        }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: 100, height: 100, borderRadius: '50%', border: `4px solid ${C.paper}`, borderTopColor: C.accent, animation: 'spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite' }} />
                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent }}>
                                    {generatingAI ? <Sparkles size={32} /> : <Compass size={32} />}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <h3 style={{ fontWeight: 900, fontSize: 24, color: C.ink, margin: '0 0 10px', letterSpacing: '-0.5px' }}>
                                    {generatingAI ? 'Crafting Your Future Path' : 'Unlocking Roadmap'}
                                </h3>
                                <p style={{ color: C.muted, fontSize: 16, fontWeight: 500, maxWidth: 300 }}>
                                    {generatingAI
                                        ? 'Our AI is analyzing your resume gaps to build a personalized 8-step journey...'
                                        : 'Fetching standard community patterns to guide your professional growth...'}
                                </p>
                            </div>
                            <style>{`
                                @keyframes spin { to { transform: rotate(360deg); } }
                                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                            `}</style>
                        </div>
                    )}

                    {!selectedRole ? (
                        <>
                            <div style={{ textAlign: 'center', marginBottom: 80 }}>
                                <h1 style={{ fontWeight: 900, fontSize: 56, color: C.ink, margin: '0 0 20px', letterSpacing: '-2.5px', lineHeight: 1 }}>
                                    Career <span style={{ color: C.accent }}>Discovery</span> Hub
                                </h1>
                                <p style={{ fontSize: 20, color: C.muted, fontWeight: 500, maxWidth: 650, margin: '0 auto', lineHeight: 1.6 }}>
                                    Master industry standard patterns or forge a personalized path with AI-driven career guidance.
                                </p>
                            </div>

                            {/* SECTION: COMMUNITY COLLECTIONS */}
                            <div style={{ marginBottom: 80 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                                    <div style={{ width: 40, height: 2, background: C.muted, borderRadius: 2, opacity: 0.3 }} />
                                    <h2 style={{ fontWeight: 900, fontSize: 24, color: C.ink, margin: 0, opacity: 0.8, letterSpacing: '-1px' }}>Community Collections</h2>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                                    {[
                                        { n: "Absolute Beginners", u: "https://roadmap.sh/roadmaps", i: <Compass size={18} /> },
                                        { n: "Web Development", u: "https://roadmap.sh/full-stack", i: <Layout size={18} /> },
                                        { n: "AI & Machine Learning", u: "https://roadmap.sh/ai-data-scientist", i: <Cpu size={18} /> },
                                        { n: "DevOps", u: "https://roadmap.sh/devops", i: <Cloud size={18} /> },
                                        { n: "Mobile Development", u: "https://roadmap.sh/android", i: <Smartphone size={18} /> },
                                        { n: "Databases", u: "https://roadmap.sh/postgresql-dba", i: <Database size={18} /> },
                                        { n: "Cyber Security", u: "https://roadmap.sh/cyber-security", i: <Shield size={18} /> },
                                        { n: "Blockchain", u: "https://roadmap.sh/blockchain", i: <Layers size={18} /> },
                                        { n: "Best Practices", u: "https://roadmap.sh/guides", i: <Sparkles size={18} /> }
                                    ].map((cat, i) => (
                                        <a key={i} href={cat.u} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                                            <div style={{
                                                background: 'rgba(255,255,255,0.4)', border: `1px solid ${C.border}`, borderRadius: 20, padding: '20px 24px',
                                                transition: 'all 0.3s', display: 'flex', alignItems: 'center', gap: 16, backdropFilter: 'blur(10px)'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.transform = 'translateX(4px)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'none'; }}>
                                                <div style={{ width: 40, height: 40, borderRadius: 12, background: C.paper, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted }}>
                                                    {cat.i}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14, color: C.ink }}>{cat.n}</div>
                                                </div>
                                                <ExternalLink size={14} color={C.muted} style={{ opacity: 0.5 }} />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* SECTION: AI SPECIALIZATIONS */}
                            <div style={{ marginBottom: 100 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                                    <div style={{ width: 40, height: 2, background: C.accent, borderRadius: 2 }} />
                                    <h2 style={{ fontWeight: 900, fontSize: 24, color: C.ink, margin: 0, letterSpacing: '-1px' }}>AI-Powered Specializations</h2>
                                </div>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                                    {ROLES.map((role, i) => (
                                        <div key={role.id} 
                                            style={{
                                                background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: '24px 28px',
                                                transition: 'all 0.4s cubic-bezier(0.22, 1, 0.36, 1)', display: 'flex', alignItems: 'center', gap: 20,
                                                boxShadow: '0 4px 12px rgba(15,23,42,0.03)', position: 'relative', overflow: 'hidden'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.boxShadow = '0 20px 40px rgba(124, 58, 237, 0.12)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.03)'; }}>
                                            
                                            <div style={{ width: 52, height: 52, borderRadius: 16, background: `${role.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: role.color }}>
                                                {role.icon}
                                            </div>

                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800, fontSize: 17, color: C.ink, marginBottom: 4 }}>{role.name}</div>
                                                <div style={{ display: 'flex', gap: 10 }}>
                                                    <button 
                                                        onClick={() => selectRole(role.id)}
                                                        style={{ background: 'none', border: 'none', color: C.accent, fontSize: 13, fontWeight: 700, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        Standard <ChevronRight size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => generateAIRoadmap(role.name)}
                                                        style={{ background: C.accentSoft, color: C.accent, border: 'none', borderRadius: 8, padding: '2px 10px', fontSize: 11, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Sparkles size={11} /> AI Guide
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* FOOTER CTA */}
                            <div style={{ padding: 48, borderRadius: 32, background: C.ink, textAlign: 'center', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, background: C.accent, borderRadius: '50%', filter: 'blur(120px)', opacity: 0.2 }} />
                                <h3 style={{ fontWeight: 800, fontSize: 28, marginBottom: 16, position: 'relative' }}>Can't find your path?</h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 32, fontSize: 16, maxWidth: 500, margin: '0 auto 32px' }}>Explore the full library of 60+ architectural roadmaps and specialized language tracks.</p>
                                <a href="https://roadmap.sh/roadmaps" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', position: 'relative' }}>
                                    <button style={{ background: C.accent, color: '#fff', border: 'none', borderRadius: 12, padding: '14px 32px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 12, margin: '0 auto' }}>
                                        View Full Library <ExternalLink size={18} />
                                    </button>
                                </a>
                            </div>
                        </>
                    ) : (
                        <RoadmapView
                            roleId={selectedRole}
                            dynamicRoadmap={dynamicRoadmap}
                            onBack={() => { setSelectedRole(null); setDynamicRoadmap(null); }}
                            viewMode={viewMode}
                            setViewMode={setViewMode}
                            router={router}
                        />
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}
