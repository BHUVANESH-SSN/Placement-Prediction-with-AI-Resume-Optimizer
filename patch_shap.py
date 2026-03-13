import sys
with open("frontend/app/predict/page.tsx", "r") as f:
    text = f.read()

anchor = """              </h2>
              <ResultCard result={result} />
            </div>
          )}"""

shap_html = """              </h2>
              <ResultCard result={result} />
              
              {/* SHAP PLOTS */}
              <div style={{ background: '#ffffff', border: `1px solid #e2e8f0`, borderRadius: 20, padding: '24px 28px', marginTop: 24, boxShadow: '0 4px 24px rgba(15,23,42,0.06)' }}>
                <h3 style={{ fontFamily: "'Fira Code', monospace", fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Model Explainability (SHAP)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <img src="http://localhost:5000/plots/plot_shap_waterfall_student0.png" alt="SHAP Waterfall" style={{ width: '100%', borderRadius: 12, border: `1px solid #e2e8f0` }} />
                  <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
                    <img src="http://localhost:5000/plots/plot_shap_summary.png" alt="SHAP Summary" style={{ width: '100%', borderRadius: 12, border: `1px solid #e2e8f0` }} />
                    <img src="http://localhost:5000/plots/plot_shap_importance_bar.png" alt="SHAP Importance" style={{ width: '100%', borderRadius: 12, border: `1px solid #e2e8f0` }} />
                  </div>
                </div>
              </div>

            </div>
          )}"""

text = text.replace(anchor, shap_html)

modal_anchor = """      </div>
    </div>
  );
}"""

modal_html = """      </div>
    </div>
    
      {/* EDA MODAL */}
      {showEDA && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24
        }} onClick={() => setShowEDA(false)}>
          <div style={{
            background: '#ffffff', width: '100%', maxWidth: 900, maxHeight: '90vh',
            borderRadius: 24, padding: 32, overflowY: 'auto', position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowEDA(false)} style={{
              position: 'absolute', top: 24, right: 24, background: '#f8fafc', border: 'none',
              width: 32, height: 32, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: '#0f172a'
            }}>
              X
            </button>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24, fontFamily: "'Fira Code', monospace" }}>Exploratory Data Analysis</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Target Distribution</h3>
                <img src="http://localhost:5000/plots/plot_target_distribution.png" alt="Target Distribution" style={{ width: '100%', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Feature Distributions</h3>
                <img src="http://localhost:5000/plots/plot_feature_distributions.png" alt="Feature Distributions" style={{ width: '100%', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Correlation Heatmap</h3>
                <img src="http://localhost:5000/plots/plot_correlation_heatmap.png" alt="Correlation Heatmap" style={{ width: '100%', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12, fontFamily: "'Fira Code', monospace" }}>Branch Placement Rate</h3>
                <img src="http://localhost:5000/plots/plot_branch_placement_rate.png" alt="Branch Placement Rate" style={{ width: '100%', borderRadius: 12, border: '1px solid #e2e8f0' }} />
              </div>
            </div>
          </div>
        </div>
      )}

  );
}"""

text = text.replace(modal_anchor, modal_html)

with open("frontend/app/predict/page.tsx", "w") as f:
    f.write(text)
