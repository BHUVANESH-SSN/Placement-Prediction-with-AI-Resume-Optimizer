"use client";

import { useRouter } from "next/navigation";

interface NavbarProps {
    active?: string;
}

const C = {
    accent: '#7c3aed',
    muted: '#64748b',
    border: '#e2e8f0',
};

export const Navbar = ({ active }: NavbarProps) => {
    const router = useRouter();
    const NAV = [
        { label: 'Dashboard', path: '/home' },
        { label: 'Development', path: '/development' },
        { label: 'Resume Builder', path: '/resume' },
        { label: 'DSA', path: '/dsa' },
        { label: 'Roadmap', path: '/roadmap' },
        { label: 'Predict', path: '/predict' },
        { label: 'Nova AI', path: '/career-coach' },
    ];

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
                    fontFamily: "'Fira Code', monospace",
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
                {NAV.map(({ label, path }) => (
                    <button
                        key={label}
                        onClick={() => router.push(path)}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontFamily: "'Fira Code', monospace",
                            fontSize: 14,
                            color: active === label || (active === 'Resume Builder' && label === 'Resume Builder') ? C.accent : C.muted,
                            fontWeight: active === label || (active === 'Resume Builder' && label === 'Resume Builder') ? 700 : 500,
                            borderBottom: active === label || (active === 'Resume Builder' && label === 'Resume Builder') ? `2.5px solid ${C.accent}` : '2.5px solid transparent',
                            paddingBottom: 4,
                            transition: 'all 0.2s'
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default Navbar;
