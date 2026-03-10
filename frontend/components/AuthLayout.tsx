'use client';
import Image from 'next/image';
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
        <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 backdrop-blur-md rounded-full py-1.5 px-3.5 text-xs font-medium text-white/90 mb-7 shadow-sm transition-transform hover:scale-105 cursor-default">
          <div className="w-1.5 h-1.5 rounded-full bg-[#86EFAC] shrink-0 animate-pulse"></div>
          Trusted by 50,000+ professionals
        </div>
        <h2 className="text-[34px] font-extrabold leading-[1.15] tracking-[-1.5px] mb-3.5 drop-shadow-sm transition-all duration-500 group-hover:tracking-[-2px]" style={{ fontFamily: "'Syne', sans-serif" }}>
          Your next<br />big opportunity<br />starts here.
        </h2>
        <p className="text-[14px] text-white/72 leading-[1.7] max-w-[340px] transition-opacity duration-500 group-hover:text-white/90">
          AIRO matches you with roles that fit your skills, experience, and ambitions — not just keywords.
        </p>
      </div>

      <div className="flex flex-col gap-3.5 relative z-10 mt-9">
        {[
          { icon: '🎯', title: 'AI-Powered Matching', desc: 'Personalized job recommendations that get smarter over time' },
          { icon: '📊', title: 'Career Analytics', desc: 'Track your application progress and market positioning' },
          { icon: '🤝', title: '1-Click Apply', desc: 'Auto-fill applications using your smart career profile' }
        ].map((f, i) => (
          <div key={i} className="flex items-start gap-3.5 group/item transition-all duration-300 hover:translate-x-2">
            <div className="w-[38px] h-[38px] rounded-xl bg-white/15 grid place-items-center shrink-0 text-base shadow-inner backdrop-blur-sm group-hover/item:scale-110 transition-transform">
              {f.icon}
            </div>
            <div className="flex flex-col">
              <strong className="text-[14px] font-semibold text-white mb-0.5">{f.title}</strong>
              <span className="text-[12.5px] text-white/60 leading-[1.5] group-hover/item:text-white/80">{f.desc}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="relative z-10 mt-9">
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { val: '50K+', label: 'Members' },
            { val: '12K', label: 'Open Roles' },
            { val: '94%', label: 'Match Rate' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/12 border border-white/18 rounded-2xl p-[14px_12px] text-center backdrop-blur-md transition-all hover:bg-white/20 hover:scale-105 shadow-sm">
              <div className="text-[22px] font-extrabold tracking-[-1px] text-white" style={{ fontFamily: "'Syne', sans-serif" }}>{stat.val}</div>
              <div className="text-[11px] text-white/60 mt-0.5 uppercase tracking-wider font-bold">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 relative z-10">
          <div className="flex -space-x-2">
            {[
              { bg: '#F59E0B', l: 'A' },
              { bg: '#EF4444', l: 'M' },
              { bg: '#22C55E', l: 'J' },
              { bg: '#3B82F6', l: 'K' }
            ].map((av, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 border-[#6B4FE8] flex items-center justify-center font-bold text-[13px] shadow-sm transform transition-transform hover:-translate-y-1 hover:z-20 cursor-default text-white"
                style={{ backgroundColor: av.bg }}
              >
                {av.l}
              </div>
            ))}
          </div>
          <div className="ml-4 text-[12.5px] text-white/80">
            <strong className="text-white font-bold transition-colors group-hover:text-green-300">+2,400 joined</strong> this week
          </div>
        </div>
      </div>
    </div>
  );
}

export function AiroLogo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <Image
        src="/airo-logo.png"
        alt="AIRO"
        width={52}
        height={52}
        priority
        style={{ objectFit: 'contain' }}
      />
      <span style={{
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 900,
        fontSize: '26px',
        letterSpacing: '-0.5px',
        color: '#0d0d14',
      }}>
        AIR<span style={{ color: '#6c47ff' }}>O</span>
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