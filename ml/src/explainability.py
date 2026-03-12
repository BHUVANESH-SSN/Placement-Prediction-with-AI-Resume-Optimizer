# ============================================================
#  explainability.py — SHAP analysis & student gap reporting
# ============================================================

import os
import pandas as pd
import matplotlib.pyplot as plt
import shap

from config import ALL_FEATURES, PLOTS_DIR

plt.rcParams.update({'figure.dpi': 130, 'font.size': 11})


def _ensure_plots_dir():
    os.makedirs(PLOTS_DIR, exist_ok=True)


# ── Build SHAP explainer ──────────────────────────────────────
def build_explainer(xgb_model):
    """
    Create a TreeExplainer for the XGBoost model.

    Returns
    -------
    explainer : shap.TreeExplainer
    """
    print("\n🔍 Building SHAP TreeExplainer...")
    explainer = shap.TreeExplainer(xgb_model)
    print("  ✅ Explainer ready.")
    return explainer


# ── Global feature importance — summary plot ─────────────────
def plot_shap_summary(explainer, X_test) -> None:
    """Beeswarm summary plot — shows direction + magnitude per feature."""
    _ensure_plots_dir()
    shap_vals = explainer.shap_values(X_test)
    print(f"  SHAP values shape: {shap_vals.shape}")

    plt.figure(figsize=(10, 7))
    shap.summary_plot(
        shap_vals, X_test,
        feature_names=ALL_FEATURES,
        show=False, plot_size=(10, 7)
    )
    plt.title('SHAP Summary — Feature Impact on Placement Probability',
              fontsize=13, fontweight='bold')
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_shap_summary.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")
    return shap_vals


# ── Global feature importance — bar plot ─────────────────────
def plot_shap_bar(explainer, X_test) -> None:
    """Bar chart of mean absolute SHAP values."""
    _ensure_plots_dir()
    shap_vals = explainer.shap_values(X_test)

    plt.figure(figsize=(9, 6))
    shap.summary_plot(
        shap_vals, X_test,
        feature_names=ALL_FEATURES,
        plot_type='bar', show=False
    )
    plt.title('SHAP — Mean Absolute Feature Importance',
              fontsize=13, fontweight='bold')
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_shap_importance_bar.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Individual waterfall plot ─────────────────────────────────
def plot_shap_waterfall(explainer, xgb_model, X_test, y_test,
                        student_idx: int = 0) -> None:
    """
    Waterfall chart explaining a single student's prediction.
    """
    _ensure_plots_dir()
    shap_vals = explainer.shap_values(X_test)

    explanation = shap.Explanation(
        values        = shap_vals[student_idx],
        base_values   = explainer.expected_value,
        data          = X_test.iloc[student_idx].values,
        feature_names = ALL_FEATURES,
    )

    prob   = xgb_model.predict_proba(X_test.iloc[[student_idx]])[0][1]
    actual = y_test.iloc[student_idx]

    print(f"\n  Student #{student_idx}")
    print(f"  Predicted probability : {prob*100:.1f}%")
    print(f"  Actual placement      : {'Placed' if actual == 1 else 'Not Placed'}")

    plt.figure(figsize=(10, 6))
    shap.waterfall_plot(explanation, show=False)
    plt.title(
        f'SHAP Waterfall — Student #{student_idx}  |  P(Placed) = {prob*100:.1f}%',
        fontsize=12, fontweight='bold'
    )
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_shap_waterfall_student{student_idx}.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Run all SHAP analyses ─────────────────────────────────────
def run_shap_analysis(explainer, xgb_model, X_test, y_test) -> None:
    """Run summary, bar, and waterfall SHAP plots."""
    print("\n🔎 Running SHAP explainability...")
    plot_shap_summary(explainer, X_test)
    plot_shap_bar(explainer, X_test)
    plot_shap_waterfall(explainer, xgb_model, X_test, y_test, student_idx=0)
    print("  ✅ SHAP analysis complete.\n")
