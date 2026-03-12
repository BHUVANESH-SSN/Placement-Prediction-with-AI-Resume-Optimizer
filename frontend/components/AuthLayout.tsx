'use client';
import Link from 'next/link';

export function AuthRight() {
  return (
    <div className="auth-right group" style={{
      margin: '16px 16px 16px 0',
      borderRadius: '24px',
      background: 'linear-gradient(135deg, #5B3FD3 0%, #3A3F9F 35%, #1E2A78 70%, #F2994A 100%)',
      padding: '52px 44px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      color: 'white'
    }}>
      {/* Decorative Blobs */}
      <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-white opacity-[0.07] pointer-events-none blur-3xl"></div>
      <div className="absolute -bottom-16 -left-16 w-[240px] h-[240px] rounded-full bg-white opacity-[0.05] pointer-events-none blur-2xl"></div>

      <div className="relative z-10">
        <h2 className="font-extrabold leading-[1.15] tracking-[-1.5px] mb-3.5 drop-shadow-sm transition-all duration-500 group-hover:tracking-[-2px]" style={{
          fontFamily: "'Fira Code', monospace",
          fontSize: '42px',
          color: 'white',
          fontWeight: 800,
        }}>
          Transform Job<br />Applications<br />Intelligently.
        </h2>
        <p className="leading-[1.7] max-w-[340px] transition-opacity duration-500" style={{ color: 'white', fontWeight: 700, fontSize: '17px' }}>
          AI-powered resume tailoring, ATS optimization, and career insights designed to help you land interviews faster.
        </p>
      </div>

      <div className="flex flex-col gap-4 relative z-10 mt-8">
        {[
          { title: 'Predict Placement with Students Data', desc: 'Predict your placement chances using real student placement datasets and ML models.' },
          { title: 'ATS Optimization Engine', desc: 'Automatically aligns resumes with job description keywords.' },
          { title: 'Skill Gap Intelligence', desc: 'Identifies missing skills required for your target role.' },
          { title: 'Instant Tailoring', desc: 'Generate role-specific, ATS-friendly resumes in seconds.' }
        ].map((f, i) => (
          <div key={i} className="flex items-start gap-3.5 group/item transition-all duration-300 hover:translate-x-2">
            <div className="flex flex-col">
              <strong className="mb-0.5 tracking-tight" style={{ color: 'white', fontWeight: 700, fontSize: '16px' }}>{f.title}</strong>
              <span className="leading-[1.4]" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: '14px' }}>{f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-8 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        <div className="flex justify-between items-center">
          {[
            { val: '3x', label: 'ATS Match' },
            { val: '<2s', label: 'Generation' },
            { val: '100%', label: 'Fact-Based' }
          ].map((stat, i) => (
            <div key={i} className="text-center group-hover:scale-105 transition-transform duration-300">
              <div className="font-extrabold tracking-[-1px]" style={{
                fontFamily: "'Fira Code', monospace",
                fontSize: '24px',
                color: 'white',
                fontWeight: 800,
              }}>{stat.val}</div>
              <div className="mt-0.5 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 700, fontSize: '13px' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AiroLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="8 7 2 12 8 17" />
        <polyline points="16 7 22 12 16 17" />
      </svg>
      <span style={{
        fontFamily: "'Fira Code', monospace",
        fontWeight: 900,
        fontSize: '28px',
        letterSpacing: '-0.5px',
        color: '#0d0d14',
        display: 'flex',
        alignItems: 'baseline',
        lineHeight: 1,
      }}>
        AIRO
        <div style={{
          width: '8px',
          height: '8px',
          backgroundColor: '#6c47ff',
          marginLeft: '5px'
        }} />
      </span>
    </div>
  );
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-scene overflow-hidden bg-[#F4F2EE]">
      {/* Scrollable container for the form */}
      <div className="auth-left relative flex flex-col min-h-screen overflow-y-auto">
        {/* Fixed Header/Logo */}
        <header className="fixed top-0 left-0 w-full lg:w-1/2 z-50 px-6 sm:px-12 py-8 pointer-events-none">
          <div className="pointer-events-auto inline-block">
            <Link href="/" className="no-underline transition-opacity hover:opacity-80">
              <AiroLogo />
            </Link>
          </div>
        </header>

        {/* Content Centering Wrapper */}
        <main className="flex-1 flex flex-col justify-center items-center px-6 sm:px-12 md:px-16 py-32">
          <div className="w-full max-w-[460px]">
            {children}
          </div>
        </main>
      </div>
      <AuthRight />
    </div>
  );
}