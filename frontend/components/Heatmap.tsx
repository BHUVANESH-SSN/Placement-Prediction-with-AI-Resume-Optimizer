"use client"

const C = {
  ink: '#0f172a',
  accent: '#7c3aed',
  accentSoft: '#ede9fe',
  success: '#16a34a',
  successSoft: '#dcfce7',
  danger: '#dc2626',
  dangerSoft: '#fee2e2',
  warn: '#d97706',
  warnSoft: '#fef3c7',
  muted: '#64748b',
  border: '#e2e8f0',
  surface: '#ffffff',
  card: '#f8fafc',
};

interface AtsKeywords {
  matched: string[];
  missing: string[];
  section_heatmap: Record<string, number>;
}

interface HeatmapProps {
  gapData: any;
  atsKeywords?: AtsKeywords | null;
}

const Heatmap = ({ gapData, atsKeywords }: HeatmapProps) => {
  const hasAts = atsKeywords && (
    (atsKeywords.matched?.length ?? 0) + (atsKeywords.missing?.length ?? 0) > 0
  );
  const hasGap = gapData?.skill_gap_scores?.length > 0;

  if (!hasAts && !hasGap) return null;

  const sectionEntries = hasAts
    ? Object.entries(atsKeywords!.section_heatmap).filter(([, v]) => typeof v === 'number')
    : [];

  return (
    <div style={{
      background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24,
      padding: '32px 36px', boxShadow: '0 4px 28px rgba(15,23,42,0.05)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, background: C.accentSoft,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        </div>
        <h2 style={{ fontFamily: "'Fira Code', monospace", fontWeight: 800, fontSize: 20, color: C.ink, margin: 0 }}>
          ATS Keyword Heatmap
        </h2>
      </div>

      {/* ── ATS Keywords section ── */}
      {hasAts && (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700, color: C.success }}>
              ✓ {atsKeywords!.matched.length} Matched
            </span>
            <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700, color: C.danger }}>
              ✗ {atsKeywords!.missing.length} Missing
            </span>
          </div>

          <div style={{
            maxHeight: 160, overflowY: 'auto', background: C.card, borderRadius: 14,
            padding: '14px 16px', marginBottom: 24, border: `1px solid ${C.border}`,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {atsKeywords!.matched.map((kw, i) => (
                <span key={`m-${i}`} style={{
                  background: C.successSoft, color: C.success,
                  border: `1px solid #86efac`, borderRadius: 8,
                  padding: '4px 10px', fontSize: 12, fontWeight: 700,
                  fontFamily: "'Fira Code', monospace",
                }}>
                  {kw}
                </span>
              ))}
              {atsKeywords!.missing.map((kw, i) => (
                <span key={`x-${i}`} style={{
                  background: C.dangerSoft, color: C.danger,
                  border: `1px solid #fca5a5`, borderRadius: 8,
                  padding: '4px 10px', fontSize: 12, fontWeight: 700,
                  fontFamily: "'Fira Code', monospace",
                }}>
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {/* ── Section Coverage ── */}
          {sectionEntries.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
                Section Coverage
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionEntries.map(([section, pct]) => {
                  const barColor = pct >= 60 ? C.success : pct >= 30 ? C.warn : C.danger;
                  return (
                    <div key={section}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 600, color: C.ink, textTransform: 'capitalize' }}>
                          {section.replace(/_/g, ' ')}
                        </span>
                        <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 12, fontWeight: 700, color: barColor }}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                      <div style={{ height: 7, background: C.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${Math.min(pct, 100)}%`,
                          background: barColor, borderRadius: 99,
                          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Skill Gap section ── */}
      {hasGap && (
        <>
          {hasAts && (
            <div style={{ borderTop: `1px solid ${C.border}`, margin: '4px 0 20px' }} />
          )}
          <p style={{ fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12 }}>
            Skill Gap Analysis
          </p>
          <div style={{
            maxHeight: 160, overflowY: 'auto', background: C.card, borderRadius: 14,
            padding: '14px 16px', border: `1px solid ${C.border}`,
          }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {gapData.skill_gap_scores.map((gs: any, i: number) => {
                const bg = gs.gap > 0.6 ? C.dangerSoft : gs.gap > 0.2 ? C.warnSoft : C.successSoft;
                const fg = gs.gap > 0.6 ? C.danger : gs.gap > 0.2 ? C.warn : C.success;
                const br = gs.gap > 0.6 ? '#fca5a5' : gs.gap > 0.2 ? '#fcd34d' : '#86efac';
                return (
                  <span
                    key={i}
                    title={`Gap: ${(gs.gap * 100).toFixed(0)}% | ${gs.tier} | ${gs.evidence}`}
                    style={{
                      background: bg, color: fg, border: `1px solid ${br}`,
                      borderRadius: 8, padding: '4px 10px', fontSize: 12,
                      fontWeight: 700, fontFamily: "'Fira Code', monospace", cursor: 'default',
                    }}
                  >
                    {gs.skill}
                  </span>
                );
              })}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <LegendDot color={C.success} label="Covered" />
            <LegendDot color={C.warn} label="Partial gap" />
            <LegendDot color={C.danger} label="Missing" />
          </div>
        </>
      )}
    </div>
  );
};

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block' }} />
      <span style={{ fontFamily: "'Fira Code', monospace", fontSize: 11, color: '#64748b' }}>{label}</span>
    </span>
  );
}

export default Heatmap;

