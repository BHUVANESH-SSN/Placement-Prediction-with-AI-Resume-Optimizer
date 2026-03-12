"use client"

import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onHistoryClick?: () => void;
  onGoBack?: () => void;
}

const Header = ({ onHistoryClick, onGoBack }: HeaderProps) => {
  const router = useRouter();

  const handleGoBack = () => {
    if (onGoBack) onGoBack();
    router.push("/home");
  };

  return (
    <header className="home-nav">
      {/* Logo */}
      <div className="home-nav-logo" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6c47ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="8 7 2 12 8 17" />
          <polyline points="16 7 22 12 16 17" />
        </svg>
        <span style={{
          fontFamily: "'Fira Code', sans-serif",
          fontWeight: 900,
          fontSize: "20px",
          letterSpacing: "-0.5px",
          color: "var(--ink)",
          display: "flex",
          alignItems: "baseline",
          lineHeight: 1,
        }}>
          AIRO
          <div style={{ width: "6px", height: "6px", backgroundColor: "#6c47ff", marginLeft: "4px" }} />
        </span>
      </div>

      {/* Center badge */}
      <div className="home-nav-links">
        <span className="jwt-badge" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Sparkles size={13} />
          AI Resume Optimizer
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          className="neu-btn"
          onClick={onHistoryClick}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            fontFamily: "'Fira Code', sans-serif",
            fontWeight: 700,
            color: "var(--accent)",
            background: "rgba(108,71,255,0.06)",
            border: "1.5px solid rgba(108,71,255,0.18)",
            cursor: "pointer",
            padding: "9px 18px",
          }}
        >
          <Clock size={14} />
          <span>History</span>
        </button>

        <button
          className="neu-btn"
          onClick={handleGoBack}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            fontSize: 13,
            fontFamily: "'Fira Code', sans-serif",
            fontWeight: 700,
            color: "var(--ink)",
            background: "var(--color-card, #eef0f5)",
            border: "none",
            cursor: "pointer",
            padding: "9px 18px",
          }}
        >
          <ArrowLeft size={14} />
          <span>Go Back</span>
        </button>
      </div>
    </header>
  );
};

export default Header;