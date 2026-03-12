# ============================================================
#  predict.py — Inference + SHAP gap analysis for FastAPI
# ============================================================

import pandas as pd
import numpy as np

from config import ALL_FEATURES


def analyze_student_gaps(
    student_features: dict,
    xgb_model,
    rf_model,
    le_tier,
    explainer,
    top_n: int = 5,
) -> dict:
    """
    Full analysis for a single student.

    Parameters
    ----------
    student_features : dict
        Must contain all keys in ALL_FEATURES (17 values).
    xgb_model        : trained XGBClassifier
    rf_model         : trained RandomForestClassifier (tier)
    le_tier          : fitted LabelEncoder for company tier
    explainer        : shap.TreeExplainer
    top_n            : number of top gaps / strengths to return

    Returns
    -------
    dict with keys:
        placement_probability_pct  : float
        predicted_company_tier     : str
        strengths                  : list of {feature, shap_value}
        gaps                       : list of {feature, shap_value}
        recommendations            : list of {priority, action}
    """
    # ── Build feature row ────────────────────────────────────
    student_df = pd.DataFrame([student_features])[ALL_FEATURES]

    # ── Predictions ──────────────────────────────────────────
    prob     = float(xgb_model.predict_proba(student_df)[0][1])
    tier_enc = rf_model.predict(student_df)[0]
    tier     = le_tier.inverse_transform([tier_enc])[0]

    # ── SHAP values ───────────────────────────────────────────
    sv = explainer.shap_values(student_df)[0]

    impacts = pd.DataFrame({
        'feature'      : ALL_FEATURES,
        'shap_value'   : sv,
        'feature_value': student_df.iloc[0].values,
    }).sort_values('shap_value')

    gaps      = impacts[impacts['shap_value'] < 0].head(top_n)
    strengths = impacts[impacts['shap_value'] > 0].tail(top_n)

    # ── Rule-based recommendations ────────────────────────────
    recommendations = _build_recommendations(student_features)

    return {
        'placement_probability_pct': round(prob * 100, 1),
        'predicted_company_tier'   : tier,
        'strengths' : strengths[['feature', 'shap_value']].to_dict('records'),
        'gaps'      : gaps[['feature', 'shap_value']].to_dict('records'),
        'recommendations': recommendations,
    }


def _build_recommendations(f: dict) -> list:
    """
    Rule-based actionable recommendations based on student profile.
    Returns a list sorted by priority (HIGH first).
    """
    recs = []

    if f.get('leetcode_problems_solved', 0) < 100:
        recs.append({'priority': 'HIGH',
                     'action': 'Solve at least 150 LeetCode problems (focus on Easy + Medium)'})

    if f.get('internship_count', 0) == 0:
        recs.append({'priority': 'HIGH',
                     'action': 'Apply to at least 1 internship (even 1-2 months counts)'})

    if f.get('github_contributions', 0) < 50:
        recs.append({'priority': 'HIGH',
                     'action': 'Push at least 3–5 projects to GitHub with proper READMEs'})

    if f.get('project_count', 0) < 2:
        recs.append({'priority': 'HIGH',
                     'action': 'Build 2 more end-to-end projects with deployment'})

    if f.get('backlog_count', 0) > 2:
        recs.append({'priority': 'HIGH',
                     'action': 'Clear pending backlogs — they filter you at resume screening'})

    if f.get('certification_count', 0) < 2:
        recs.append({'priority': 'MEDIUM',
                     'action': 'Complete 2 domain certifications (AWS, Google, Coursera)'})

    if f.get('skill_diversity_score', 0) < 4:
        recs.append({'priority': 'MEDIUM',
                     'action': 'Expand skill set: add 1 backend + 1 cloud + 1 database technology'})

    if f.get('project_complexity_score', 0) < 4:
        recs.append({'priority': 'MEDIUM',
                     'action': 'Upgrade projects: add REST APIs, deployment, or ML components'})

    # Sort: HIGH before MEDIUM
    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    return sorted(recs, key=lambda x: priority_order.get(x['priority'], 3))


def print_gap_report(result: dict) -> None:
    """Pretty-print a gap analysis result dict."""
    print(f"\n{'='*52}")
    print(f"  STUDENT GAP ANALYSIS REPORT")
    print(f"{'='*52}")
    print(f"  Placement Probability : {result['placement_probability_pct']}%")
    print(f"  Predicted Tier        : {result['predicted_company_tier']}")

    print(f"\n  TOP STRENGTHS:")
    for s in result['strengths']:
        print(f"    ✅ {s['feature']:<30} +{s['shap_value']:.4f}")

    print(f"\n  TOP GAPS (what's hurting you):")
    for g in result['gaps']:
        print(f"    ❌ {g['feature']:<30} {g['shap_value']:.4f}")

    print(f"\n  RECOMMENDATIONS:")
    for r in result['recommendations']:
        icon = '🔴' if r['priority'] == 'HIGH' else '🟡'
        print(f"    {icon} [{r['priority']}] {r['action']}")
    print(f"{'='*52}\n")
