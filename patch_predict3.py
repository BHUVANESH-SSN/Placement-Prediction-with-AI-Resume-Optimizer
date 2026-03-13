import re
with open("frontend/app/predict/page.tsx", "r") as f:
    text = f.read()

# 1. Remove the old View EDA Plots button next to Predict Placement
text = re.sub(
    r'<button type="button" onClick=\{[^}]+\} disabled=\{loading\}\n\s*style=\{\{\n\s*padding: .*\n\s*background: .*\n\s*color: .*\n\s*display: .*\n\s*transition: .*\n\s*\}\}>\n\s*<BarChart2 size=\{16\} /> View EDA Plots\n\s*</button>',
    '',
    text
)

# 2. Add View EDA Plots button inside the results header
new_results_header = """              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px' }}>
                <h2 style={{ fontFamily: "'Fira Code', monospace", fontSize: 16, fontWeight: 800, color: C.ink, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <Trophy size={16} color={C.accent} /> Analysis Results
                </h2>
                <button type="button" onClick={() => setShowEDA(true)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: `1.5px solid ${C.accent}`, cursor: 'pointer',
                    background: 'transparent', color: C.accent, fontFamily: "'Fira Code', monospace", fontSize: 13, fontWeight: 700,
                    display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s',
                  }}>
                  <BarChart2 size={14} /> View EDA Plots
                </button>
              </div>"""

text = re.sub(
    r'<h2 style=\{\{\s*fontFamily: "\'Fira Code\', monospace", fontSize: 16, fontWeight: 800, color: C.ink, margin: \'0 0 20px\', display: \'flex\', alignItems: \'center\', gap: 8\s*\}\}>\s*<Trophy size=\{16\} color=\{C.accent\} /> Analysis Results\s*</h2>',
    new_results_header,
    text,
    count=1
)

# 3. Replace the image-based SHAP section with dynamic UI components map
shap_section_old = r'\{\/\* SHAP PLOTS \*\/\}.*?<div style=\{\{[^}]+\}\}>\s*<h3[^>]+>Model Explainability \(SHAP\)<\/h3>.*?<\/div>\s*<\/div>\s*<\/div>'

shap_section_new = """              {/* SHAP PLOTS */}
              <div style={{ background: '#ffffff', border: `1px solid #e2e8f0`, borderRadius: 20, padding: '24px 28px', marginTop: 24, boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
                <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Your Personal Model Explainability (SHAP)</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 700, color: '#64748b' }}>Feature</div>
                    <div style={{ flex: 2, fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'center' }}>Impact on Placement Chance</div>
                    <div style={{ width: 60, fontSize: 12, fontWeight: 700, color: '#64748b', textAlign: 'right' }}>Value</div>
                  </div>
                  
                  {(() => {
                    const allFeatures = [...result.gaps, ...result.strengths].sort((a,b) => b.shap_value - a.shap_value);
                    const maxAbs = Math.max(...allFeatures.map(f => Math.abs(f.shap_value)));
                    
                    return allFeatures.map((f, i) => {
                      const isStrength = f.shap_value > 0;
                      const widthPct = Math.max(2, (Math.abs(f.shap_value) / maxAbs) * 100);
                      
                      return (
                        <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                          <div style={{ flex: 1, fontSize: 12, fontFamily: "'Fira Code', monospace", color: '#0f172a' }}>
                            {f.feature.replace(/_/g, ' ')}
                          </div>
                          
                          <div style={{ flex: 2, display: 'flex', alignItems: 'center', height: 24, position: 'relative' }}>
                            {/* Zero Center Line */}
                            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: '#cbd5e1', zIndex: 0 }}></div>
                            
                            {/* Bar container divided in 2 halves */}
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', paddingRight: 2 }}>
                              {!isStrength && (
                                <div style={{ height: 16, width: `${widthPct}%`, background: '#f87171', borderRadius: '4px 0 0 4px', zIndex: 1 }} />
                              )}
                            </div>
                            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-start', paddingLeft: 2 }}>
                              {isStrength && (
                                <div style={{ height: 16, width: `${widthPct}%`, background: '#4ade80', borderRadius: '0 4px 4px 0', zIndex: 1 }} />
                              )}
                            </div>
                          </div>
                          
                          <div style={{ width: 60, fontSize: 12, fontFamily: "'Fira Code', monospace", fontWeight: 700, color: isStrength ? '#16a34a' : '#ef4444', textAlign: 'right' }}>
                            {isStrength ? '+' : ''}{f.shap_value.toFixed(3)}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>"""

text = re.sub(shap_section_old, shap_section_new, text, flags=re.DOTALL)

with open("frontend/app/predict/page.tsx", "w") as f:
    f.write(text)

