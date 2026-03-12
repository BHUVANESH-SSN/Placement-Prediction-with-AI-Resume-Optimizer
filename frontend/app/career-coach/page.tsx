'use client';

import { clearAuth, getAuth } from '@/lib/api';
import { Bot, LogOut, RotateCcw, Send, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

/* ── DESIGN TOKENS ── */
const C = {
  ink: '#0f172a',
  paper: '#f8fafc',
  surface: '#ffffff',
  accent: '#7c3aed',
  accentSoft: '#ede9fe',
  muted: '#64748b',
  border: '#e2e8f0',
  botBg: '#f1f5f9',
  success: '#16a34a',
  accent2: '#ef4444',
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/* ── TYPES ── */
interface ChatMessage {
  id: string;
  role: 'bot' | 'user';
  content: string; // \\n-encoded while streaming
  streaming?: boolean;
  isWelcome?: boolean;
}

/* ── SSE STREAMING HELPER ── */
async function* streamSSE(
  url: string,
  method: string,
  body: unknown,
  token: string,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
    signal,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') return;
      if (payload.startsWith('[ERROR]')) throw new Error(payload.slice(7));
      yield payload;
    }
  }
}

/* ── NAVBAR ── */
function Navbar({ active }: { active?: string }) {
  const router = useRouter();
  const NAV = ['Dashboard', 'Development', 'Resume Builder', 'DSA', 'Predict', 'Nova AI'];
  const paths: Record<string, string> = {
    Dashboard: '/home', Development: '/development',
    'Resume Builder': '/resume', DSA: '/dsa',
    Predict: '/predict', 'Nova AI': '/career-coach',
  };
  return (
    <nav style={{ display: 'flex', alignItems: 'center', height: 60, padding: '0 34px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(16px)', borderBottom: `1px solid ${C.border}`, position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flexShrink: 0 }} onClick={() => router.push('/home')}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 7 2 12 8 17" /><polyline points="16 7 22 12 16 17" />
        </svg>
        <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: '18px', letterSpacing: '-0.5px', color: '#0d0d14', display: 'flex', alignItems: 'baseline', lineHeight: 1 }}>
          AIRO<div style={{ width: '6px', height: '6px', backgroundColor: '#7c3aed', marginLeft: '4px' }} />
        </span>
      </div>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 32, marginRight: '60px' }}>
        {NAV.map(label => (
          <button key={label} onClick={() => router.push(paths[label] || '/home')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Fira Code', monospace", fontSize: 14, color: active === label ? C.accent : C.muted, fontWeight: active === label ? 700 : 500, borderBottom: active === label ? `2.5px solid ${C.accent}` : '2.5px solid transparent', paddingBottom: 4, transition: 'all 0.2s' }}>
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/* ── MARKDOWN RENDERER ── */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') && p.length > 4
          ? <strong key={i} style={{ fontWeight: 800, color: C.ink }}>{p.slice(2, -2)}</strong>
          : <span key={i}>{p}</span>
      )}
    </>
  );
}

function renderMarkdown(raw: string): React.ReactNode[] {
  const text = raw.replace(/\\n/g, '\n');
  const nodes: React.ReactNode[] = [];

  text.split('\n').forEach((line, i) => {
    const t = line.trim();
    if (!t) { nodes.push(<div key={i} style={{ height: 5 }} />); return; }

    // ## Section heading
    if (t.startsWith('## ')) {
      nodes.push(
        <h3 key={i} style={{ fontFamily: "'Fira Code', monospace", fontWeight: 800, fontSize: 14.5, color: C.ink, margin: '20px 0 8px', borderBottom: `1.5px solid ${C.accentSoft}`, paddingBottom: 5, letterSpacing: '-0.2px' }}>
          {t.slice(3)}
        </h3>
      );
      return;
    }

    // **Bold standalone line**
    if (t.startsWith('**') && t.endsWith('**') && t.length > 4) {
      nodes.push(
        <p key={i} style={{ fontFamily: "'Fira Code', monospace", fontSize: 13.5, fontWeight: 800, color: C.ink, margin: '10px 0 4px' }}>
          {t.slice(2, -2)}
        </p>
      );
      return;
    }

    // - Bullet
    if (t.startsWith('- ')) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 5, paddingLeft: 4 }}>
          <span style={{ color: C.accent, flexShrink: 0, marginTop: 4, fontSize: 10 }}>▸</span>
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13.5, color: '#334155', lineHeight: 1.75 }}>
            {renderInline(t.slice(2))}
          </span>
        </div>
      );
      return;
    }

    // 1. Numbered
    const numMatch = t.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      nodes.push(
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
          <span style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 11, color: '#fff', background: C.accent, borderRadius: '50%', minWidth: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            {numMatch[1]}
          </span>
          <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 13.5, color: '#334155', lineHeight: 1.75 }}>
            {renderInline(numMatch[2])}
          </span>
        </div>
      );
      return;
    }

    // Regular paragraph
    nodes.push(
      <p key={i} style={{ fontFamily: "'Fira Code', monospace", fontSize: 13.5, color: '#334155', lineHeight: 1.8, margin: '3px 0' }}>
        {renderInline(t)}
      </p>
    );
  });

  return nodes;
}

/* ── AVATARS ── */
function BotAvatar() {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, boxShadow: `0 3px 10px ${C.accent}40` }}>
      <Bot size={17} />
    </div>
  );
}

function UserAvatar({ initial }: { initial: string }) {
  return (
    <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontFamily: "'Fira Code', monospace", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
      {initial.toUpperCase()}
    </div>
  );
}

/* ── MESSAGE BUBBLE ── */
function MessageBubble({
  message, userInitial, onAnalyze, analyzing, analyzed,
}: {
  message: ChatMessage;
  userInitial: string;
  onAnalyze?: () => void;
  analyzing?: boolean;
  analyzed?: boolean;
}) {
  const isBot = message.role === 'bot';

  return (
    <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'flex-start', flexDirection: isBot ? 'row' : 'row-reverse' }}>
      {isBot ? <BotAvatar /> : <UserAvatar initial={userInitial} />}

      <div style={{ maxWidth: '78%', minWidth: 60 }}>
        {isBot && (
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 10, fontWeight: 700, color: C.accent, margin: '0 0 5px', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
            Nova AI
          </p>
        )}

        <div style={{
          background: isBot ? C.botBg : C.accent,
          color: isBot ? C.ink : '#fff',
          border: isBot ? `1px solid ${C.border}` : 'none',
          borderRadius: isBot ? '3px 16px 16px 16px' : '16px 3px 16px 16px',
          padding: '13px 17px',
          boxShadow: '0 2px 8px rgba(15,23,42,0.07)',
          wordBreak: 'break-word',
        }}>
          {isBot ? (
            <>
              {renderMarkdown(message.content)}
              {message.streaming && <span className="rm-cursor">▌</span>}
            </>
          ) : (
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 14, margin: 0, lineHeight: 1.6 }}>
              {message.content}
            </p>
          )}
        </div>

        {/* Analyze button attached below welcome message */}
        {message.isWelcome && !analyzed && (
          <div style={{ marginTop: 10 }}>
            <button
              onClick={onAnalyze}
              disabled={analyzing}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: analyzing ? C.muted : 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', border: 'none', borderRadius: 12, fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 700, color: '#fff', cursor: analyzing ? 'not-allowed' : 'pointer', boxShadow: analyzing ? 'none' : `0 4px 14px ${C.accent}40`, transition: 'all 0.2s' }}
            >
              {analyzing
                ? <><RefreshCw size={14} className="rm-spin" /> Analyzing...</>
                : <>✦ Analyze My Profile</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── MAIN PAGE ── */
export default function ChatbotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [userInitial, setUserInitial] = useState('U');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function getToken() {
    return typeof window !== 'undefined' ? (localStorage.getItem('access_token') || '') : '';
  }

  // Auth check
  useEffect(() => {
    const auth = getAuth();
    if (!auth) { router.push('/login'); return; }
    setUserInitial(auth.name?.[0] || auth.email?.[0] || 'U');
  }, [router]);

  // Initial welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'bot',
      content: "Hi! I'm **Nova AI** — your personal AI career coach.\\n\\nI'll analyze your complete profile including your resume, skills, projects, GitHub and LeetCode stats, then give you a detailed and honest improvement report.\\n\\nAfter the analysis, feel free to ask me anything about your career, skills, or profile!",
      isWelcome: true,
    }]);
  }, []);

  // Auto-scroll on new messages or content change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function logout() { clearAuth(); router.push('/login'); }

  function resetChat() {
    abortRef.current?.abort();
    setMessages([{
      id: 'welcome',
      role: 'bot',
      content: "Hi! I'm **Nova AI** — your personal AI career coach.\\n\\nI'll analyze your complete profile including your resume, skills, projects, GitHub and LeetCode stats, then give you a detailed and honest improvement report.\\n\\nAfter the analysis, feel free to ask me anything about your career, skills, or profile!",
      isWelcome: true,
    }]);
    setAnalyzing(false);
    setAnalyzed(false);
    setChatting(false);
    setInput('');
  }

  const startAnalysis = useCallback(async () => {
    const token = getToken();
    if (!token) { router.push('/login'); return; }
    if (analyzing || analyzed) return;

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const uid = `u-${Date.now()}`;
    const bid = `b-${Date.now()}`;

    setMessages(prev => [
      ...prev,
      { id: uid, role: 'user', content: 'Analyze my profile' },
      { id: bid, role: 'bot', content: '', streaming: true },
    ]);
    setAnalyzing(true);

    try {
      for await (const chunk of streamSSE(`${API_BASE}/chatbot/analyze`, 'GET', null, token, ctrl.signal)) {
        setMessages(prev => prev.map(m => m.id === bid ? { ...m, content: m.content + chunk } : m));
      }
      setMessages(prev => prev.map(m => m.id === bid ? { ...m, streaming: false } : m));
      setAnalyzed(true);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === bid ? { ...m, content: 'Something went wrong. Please try the analysis again.', streaming: false } : m
        ));
      }
    } finally {
      setAnalyzing(false);
    }
  }, [analyzed, analyzing, router]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || chatting || analyzing || !analyzed) return;
    setInput('');

    const token = getToken();
    if (!token) { router.push('/login'); return; }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const uid = `u-${Date.now()}`;
    const bid = `b-${Date.now() + 1}`;

    // Build conversation history from current messages (last 8, fully received)
    const history = messages
      .filter(m => !m.streaming && m.id !== 'welcome')
      .slice(-8)
      .map(m => ({
        role: m.role === 'bot' ? 'assistant' : 'user',
        content: m.content.replace(/\\n/g, '\n').slice(0, 1800),
      }));

    setMessages(prev => [
      ...prev,
      { id: uid, role: 'user', content: text },
      { id: bid, role: 'bot', content: '', streaming: true },
    ]);
    setChatting(true);

    try {
      for await (const chunk of streamSSE(
        `${API_BASE}/chatbot/chat`, 'POST',
        { message: text, history }, token, ctrl.signal,
      )) {
        setMessages(prev => prev.map(m => m.id === bid ? { ...m, content: m.content + chunk } : m));
      }
      setMessages(prev => prev.map(m => m.id === bid ? { ...m, streaming: false } : m));
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setMessages(prev => prev.map(m =>
          m.id === bid ? { ...m, content: 'Something went wrong. Please try again.', streaming: false } : m
        ));
      }
    } finally {
      setChatting(false);
    }
  }

  const isLoading = analyzing || chatting;
  const inputDisabled = !analyzed || isLoading;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg,#f8fafc 0%,#eef2ff 60%,#f5f3ff 100%)', fontFamily: "'Fira Code', monospace", overflow: 'hidden' }}>
      <Navbar active="Nova AI" />

      {/* ICON SIDEBAR */}
      <aside style={{ position: 'fixed', top: 60, left: 0, width: 72, height: 'calc(100vh - 60px)', borderRight: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', zIndex: 100, gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
          <Bot size={19} />
        </div>
        <div style={{ flex: 1 }} />
        <button onClick={resetChat} title="New Chat"
          onMouseEnter={e => { e.currentTarget.style.color = C.accent; e.currentTarget.style.borderColor = C.accent; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
          style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, transition: 'all 0.2s', marginBottom: 8 }}>
          <RotateCcw size={14} />
        </button>
        <button onClick={logout} title="Logout"
          onMouseEnter={e => { e.currentTarget.style.color = C.accent2; e.currentTarget.style.borderColor = C.accent2 + '60'; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
          style={{ width: 38, height: 38, borderRadius: 10, border: `1.5px solid ${C.border}`, background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, transition: 'all 0.2s' }}>
          <LogOut size={14} />
        </button>
      </aside>

      {/* CHAT AREA */}
      <div style={{ marginLeft: 72, paddingTop: 60, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Chat header bar */}
        <div style={{ padding: '12px 36px', borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #9f67ff)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Bot size={18} />
          </div>
          <div>
            <p style={{ fontFamily: "'Fira Code', monospace", fontWeight: 900, fontSize: 15, color: C.ink, margin: 0 }}>Nova AI</p>
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: isLoading ? C.accent : C.success, margin: 0, fontWeight: 600 }}>
              {analyzing ? '● analyzing your profile...' : chatting ? '● typing...' : '● online'}
            </p>
          </div>
        </div>

        {/* Messages scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '28px 44px 12px', scrollbarWidth: 'thin', scrollbarColor: `${C.border} transparent` }}>
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              userInitial={userInitial}
              onAnalyze={startAnalysis}
              analyzing={analyzing}
              analyzed={analyzed}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div style={{ flexShrink: 0, borderTop: `1px solid ${C.border}`, padding: '12px 44px 16px', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)' }}>
          {!analyzed && !analyzing && (
            <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: C.muted, margin: '0 0 8px', textAlign: 'center', letterSpacing: '0.2px' }}>
              Click <strong style={{ color: C.accent }}>Analyze My Profile</strong> above to unlock the chat
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              disabled={inputDisabled}
              placeholder={analyzed ? 'Ask Nova AI about your skills, projects, career path...' : 'Analyze your profile first to start chatting'}
              style={{ flex: 1, padding: '11px 16px', borderRadius: 14, border: `1.5px solid ${inputDisabled ? C.border : C.border}`, fontFamily: "'Fira Code', monospace", fontSize: 14, color: C.ink, background: inputDisabled ? '#f8fafc' : C.surface, outline: 'none', transition: 'border-color 0.2s', opacity: inputDisabled ? 0.55 : 1 }}
              onFocus={e => { if (!inputDisabled) e.currentTarget.style.borderColor = C.accent; }}
              onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
            />
            <button
              onClick={sendMessage}
              disabled={inputDisabled || !input.trim()}
              style={{ width: 44, height: 44, borderRadius: 12, background: (inputDisabled || !input.trim()) ? C.border : 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)', border: 'none', cursor: (inputDisabled || !input.trim()) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: (inputDisabled || !input.trim()) ? 'none' : `0 4px 12px ${C.accent}40`, flexShrink: 0 }}
            >
              {chatting
                ? <RefreshCw size={16} color="#fff" className="rm-spin" />
                : <Send size={16} color={(inputDisabled || !input.trim()) ? C.muted : '#fff'} />}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rm-spin { to { transform: rotate(360deg); } }
        .rm-spin { animation: rm-spin 1s linear infinite; }
        @keyframes rm-blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
        .rm-cursor { animation: rm-blink 0.7s step-end infinite; font-weight:900; color:${C.accent}; }
      `}</style>
    </div>
  );
}

