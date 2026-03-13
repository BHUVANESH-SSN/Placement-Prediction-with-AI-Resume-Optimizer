'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function OAuthCallbackInner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('code');
    const token = params.get('token');
    const email = params.get('email');
    const error = params.get('error');

    if (error) {
      router.push('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      localStorage.setItem('access_token', token);
      if (email) localStorage.setItem('user_email', email);
      router.push('/home');
      return;
    }

    if (code) {
      const provider = pathname?.includes('github') ? 'github' : 'google';
      window.location.href = `${API_BASE}/auth/callback/${provider}?code=${encodeURIComponent(code)}`;
      return;
    }

    router.push('/login');
  }, [params, pathname, router]);

  return null;
}

export default function OAuthCallback() {
  return (
    <Suspense fallback={<p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Montserrat', sans-serif", color: '#6b7280' }}>Signing you in…</p>}>
      <OAuthCallbackInner />
    </Suspense>
  );
}
