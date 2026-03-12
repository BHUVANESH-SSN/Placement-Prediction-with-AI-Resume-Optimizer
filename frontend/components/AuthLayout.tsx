'use client';
import Link from 'next/link';

export function AuthRight() {
  return (
    <div className="auth-right group" style={{
      margin: '16px 16px 16px 0',
      borderRadius: '24px',
      background: 'linear-gradient(145deg, #6B4FE8 0%, #8B72F5 50%, #A994FF 100%)',
      padding: '52px 44px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative',
      overflow: 'hidden',
      color: 'white'
    }}>
      {/* Decorative Blobs */}
      <div className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full bg-white opacity-[0.07] pointer-events-none blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-16 -left-16 w-[240px] h-[240px] rounded-full bg-white opacity-[0.05] pointer-events-none blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>

      <div className="relative z-10">
        <h2 className="text-[34px] font-extrabold leading-[1.15] tracking-[-1.5px] mb-3.5 drop-shadow-sm transition-all duration-500 group-hover:tracking-[-2px]" style={{ fontFamily: "'Syne', sans-serif" }}>
          Transform Job<br />Applications<br />Intelligently.
        </h2>
        <p className="text-[14.5px] text-white/80 leading-[1.7] max-w-[340px] transition-opacity duration-500 font-medium">
          AI-powered resume tailoring, ATS optimization, and career insights designed to help you land interviews faster.
        </p>
      </div>

      <div className="flex flex-col gap-4 relative z-10 mt-8">
        {[
          { icon: '🧠', title: 'Truth-Constrained AI', desc: 'Ensures resume tailoring only uses verified skills from your profile.' },
          { icon: '📄', title: 'ATS Optimization Engine', desc: 'Automatically aligns resumes with job description keywords.' },
          { icon: '📊', title: 'Skill Gap Intelligence', desc: 'Identifies missing skills required for your target role.' },
          { icon: '⚡', title: 'Instant Tailoring', desc: 'Generate role-specific, ATS-friendly resumes in seconds.' }
        ].map((f, i) => (
          <div key={i} className="flex items-start gap-3.5 group/item transition-all duration-300 hover:translate-x-2">
            <div className="w-[36px] h-[36px] mt-0.5 rounded-xl bg-white/10 grid place-items-center shrink-0 text-base shadow-inner backdrop-blur-sm group-hover/item:scale-110 transition-transform border border-white/10">
              {f.icon}
            </div>
            <div className="flex flex-col">
              <strong className="text-[14px] font-bold text-white mb-0.5 tracking-tight">{f.title}</strong>
              <span className="text-[12.5px] text-white/70 leading-[1.4] group-hover/item:text-white/90">{f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
        <div className="flex justify-between items-center mb-5">
          {[
            { val: '3x', label: 'ATS Match' },
            { val: '<2s', label: 'Generation' },
            { val: '100%', label: 'Fact-Based' }
          ].map((stat, i) => (
            <div key={i} className="text-center group-hover:scale-105 transition-transform duration-300">
              <div className="text-[18px] font-extrabold tracking-[-1px] text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{stat.val}</div>
              <div className="text-[10.5px] text-white/50 mt-0.5 uppercase tracking-wider font-bold">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 relative z-10 bg-white/5 p-3 rounded-xl border border-white/5 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 flex items-center justify-center shrink-0 shadow-lg">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          </div>
          <div className="text-[12px] text-white/80 leading-[1.4] font-medium">
            <strong className="text-white font-bold">Trusted by aspiring engineers</strong> preparing for top competitive tech companies.
          </div>
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