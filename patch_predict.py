import re

with open("frontend/app/predict/page.tsx", "r") as f:
    content = f.read()

# 1. Add state for EDA modal
state_injection = """  const [result, setResult] = useState<any>(null);
  const [showEDA, setShowEDA] = useState(false);"""
content = re.sub(r'  const \[result, setResult\] = useState<any>\(null\);', state_injection, content)

# 2. Add 'View EDA Plots' button next to 'Predict Placement' button
btn_injection = """              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setShowEDA(true)} disabled={loading}
                  style={{
                    padding: '14px 24px', borderRadius: 12, border: `1.5px solid ${C.accent}`, cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'transparent',
                    color: C.accent, fontFamily: "'Fira Code', monospace", fontSize: 15, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    transition: 'all 0.2s', flex: 1
                  }}>
                  <BarChart2 size={16} /> View EDA Plots
                </button>
                <button onClick={handleSubmit} disabled={loading}
                  style={{
                    padding: '14px 24px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                    background: loading ? C.muted : 'linear-gradient(135deg, #A78BFA 0%, #6c47ff 50%, #1a1a2e 100%)',
                    color: 'white', fontFamily: "'Fira Code', monospace", fontSize: 15, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: loading ? 'none' : '0 4px 14px rgba(124,58,237,0.35)',
                    transition: 'all 0.2s', flex: 1
                  }}>
                  {loading ? ("""

content = re.sub(r' *<button onClick=\{handleSubmit}.*?style=\{\{.*?(?=\{loading \?)', btn_injection, content, flags=re.DOTALL)

# Complete the div for the buttons block
btn_end_injection = """                  <><Brain size={16} /> Predict Placement</>
                )}
              </button>
            </div>"""

content = re.sub(r' *<><Brain size=\{16\} /> Predict Placement</>\n *.*\n *</button>', btn_end_injection, content)

# 3. Add SHAP plots to the Results panel
shap_injection = """                </div>
              </div>

              {/* POST-PREDICTION SHAP PLOTS */}
              <div style={{ marginTop: 32 }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: C.ink, marginBottom: 16, fontFamily: "'Fira Code', monospace" }}>Model Explainability (SHAP)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <img src="http://localhost:5000/plots/plot_shap_waterfall_student0.png" alt="SHAP Waterfall" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <img src="http://localhost:5000/plots/plot_shap_summary.png" alt="SHAP Summary" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
                    <img src="http://localhost:5000/plots/plot_shap_importance_bar.png" alt="SHAP Importance" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
                  </div>
                </div>
              </div>
            </div>
            
          </div>"""

# Find where the results render ends (after recommendations)
content = content.replace("                </div>\n              </div>\n            </div>\n            \n          </div>", shap_injection)

# 4. Add BarChart2 to lucide-react imports
content = content.replace('import { Brain, Sparkles, TrendingUp, Search, Lock, User, Github, AlertTriangle, Play, Menu, X, Rocket, Map, Target, Briefcase } from "lucide-react";', 'import { Brain, Sparkles, TrendingUp, Search, Lock, User, Github, AlertTriangle, Play, Menu, X, Rocket, Map, Target, Briefcase, BarChart2 } from "lucide-react";')

# 5. Add Modal HTML for EDA at the end of the file
eda_modal = """
      {showEDA && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24
        }} onClick={() => setShowEDA(false)}>
          <div style={{
            background: C.surface, width: '100%', maxWidth: 900, maxHeight: '90vh',
            borderRadius: 24, padding: 32, overflowY: 'auto', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowEDA(false)} style={{
              position: 'absolute', top: 24, right: 24, background: C.paper, border: 'none',
              width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.ink
            }}>
              <X size={18} />
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: C.ink, marginBottom: 24, fontFamily: "'Fira Code', monospace" }}>Exploratory Data Analysis</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Target Distribution</h3>
                <img src="http://localhost:5000/plots/plot_target_distribution.png" alt="Target Distribution" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Feature Distributions</h3>
                <img src="http://localhost:5000/plots/plot_feature_distributions.png" alt="Feature Distributions" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Correlation Heatmap</h3>
                <img src="http://localhost:5000/plots/plot_correlation_heatmap.png" alt="Correlation Heatmap" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Branch Placement Rate</h3>
                <img src="http://localhost:5000/plots/plot_branch_placement_rate.png" alt="Branch Placement Rate" style={{ width: '100%', borderRadius: 12, border: `1px solid ${C.border}` }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
"""

content = content.replace("    </div>\n  );\n}", eda_modal)

with open("frontend/app/predict/page.tsx", "w") as f:
    f.write(content)
