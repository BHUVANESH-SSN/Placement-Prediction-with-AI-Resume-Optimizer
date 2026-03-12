# ============================================================
#  predict_service.py — ML model loading & inference for /predict
# ============================================================
#
#  Models are loaded once at startup (lazy singleton) from the
#  directory pointed to by the ML_MODELS_DIR environment variable
#  (default: <repo_root>/ml/models).
# ============================================================

import os
import numpy as np
import pandas as pd
import joblib

from fastapi import HTTPException

# ── Constants mirrored from ml/config.py ─────────────────────
_RAW_FEATURES = [
    'cgpa',
    'backlog_count',
    'internship_count',
    'internship_duration_months',
    'project_count',
    'project_complexity_score',
    'certification_count',
    'skill_diversity_score',
    'github_contributions',
    'github_repo_count',
    'leetcode_problems_solved',
    'leetcode_contest_rating',
    'branch_encoded',
]

_DERIVED_FEATURES = [
    'coding_strength',
    'github_activity',
    'experience_score',
    'academic_score',
]

ALL_FEATURES = _RAW_FEATURES + _DERIVED_FEATURES

# ── Model file names (produced by ml/src/model_io.py) ────────
_MODEL_FILES = {
    'xgb_model'    : 'xgb_placement.pkl',
    'rf_model'     : 'rf_company_tier.pkl',
    'le_branch'    : 'encoder_branch.pkl',
    'le_tier'      : 'encoder_tier.pkl',
    'explainer'    : 'shap_explainer.pkl',
}

# ── Lazy-loaded singleton ─────────────────────────────────────
_models: dict | None = None


def _get_models_dir() -> str:
    """
    Return the directory containing saved ML artefacts.
    Override by setting the ML_MODELS_DIR environment variable.
    """
    default = os.path.join(
        os.path.dirname(__file__),   # backend/app/services/
        '..', '..', '..',             # → repo root  (3 levels: services→app→backend→root)
        'ml', 'models'
    )
    return os.getenv('ML_MODELS_DIR', os.path.normpath(default))


def _load_models() -> dict:
    models_dir = _get_models_dir()
    loaded: dict = {}
    for key, filename in _MODEL_FILES.items():
        path = os.path.join(models_dir, filename)
        if not os.path.exists(path):
            raise FileNotFoundError(
                f"ML model file not found: {path}. "
                "Train the model first by running `python main.py` inside ml/."
            )
        loaded[key] = joblib.load(path)
    return loaded


def get_models() -> dict:
    global _models
    if _models is None:
        _models = _load_models()
    return _models


# ── Derived feature computation (mirrors feature_engineering.py) ─
def _add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['coding_strength'] = (
        np.clip(df['leetcode_problems_solved'] / 500, 0, 1) * 0.6 +
        np.clip(df['leetcode_contest_rating']  / 2200, 0, 1) * 0.4
    ).round(4)

    df['github_activity'] = (
        np.clip(df['github_contributions'] / 600, 0, 1) * 0.65 +
        np.clip(df['github_repo_count']     / 30,  0, 1) * 0.35
    ).round(4)

    df['experience_score'] = (
        df['internship_count'] * 0.6 +
        np.clip(df['internship_duration_months'] / 12, 0, 1) * 0.4
    ).round(4)

    df['academic_score'] = (
        (df['cgpa'] / 10) - (df['backlog_count'] * 0.04)
    ).clip(0, 1).round(4)

    return df


# ── Rule-based recommendations (mirrors ml/src/predict.py) ───
def _build_recommendations(f: dict) -> list:
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

    priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
    return sorted(recs, key=lambda x: priority_order.get(x['priority'], 3))


# ── Main inference function ───────────────────────────────────
def run_prediction(request_data: dict, top_n: int = 5) -> dict:
    """
    Encode inputs, compute derived features, run both models,
    compute SHAP values, and return the full analysis dict.

    Parameters
    ----------
    request_data : dict
        Must contain all API request fields including 'degree_branch'.
    top_n : int
        Number of top gaps / strengths to surface.

    Returns
    -------
    dict matching PredictResponse schema.
    """
    try:
        models = get_models()
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc))

    # ── Encode branch ─────────────────────────────────────────
    le_branch = models['le_branch']
    branch_name = request_data.get('degree_branch', '')
    known_classes = list(le_branch.classes_)

    if branch_name not in known_classes:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Unknown degree_branch '{branch_name}'. "
                f"Valid options: {known_classes}"
            ),
        )

    branch_encoded = int(le_branch.transform([branch_name])[0])

    # ── Build raw feature dict ────────────────────────────────
    raw: dict = {
        'cgpa'                      : float(request_data['cgpa']),
        'backlog_count'             : int(request_data['backlog_count']),
        'internship_count'          : int(request_data['internship_count']),
        'internship_duration_months': float(request_data['internship_duration_months']),
        'project_count'             : int(request_data['project_count']),
        'project_complexity_score'  : float(request_data['project_complexity_score']),
        'certification_count'       : int(request_data['certification_count']),
        'skill_diversity_score'     : float(request_data['skill_diversity_score']),
        'github_contributions'      : int(request_data['github_contributions']),
        'github_repo_count'         : int(request_data['github_repo_count']),
        'leetcode_problems_solved'  : int(request_data['leetcode_problems_solved']),
        'leetcode_contest_rating'   : int(request_data['leetcode_contest_rating']),
        'branch_encoded'            : branch_encoded,
    }

    # ── Add derived features ──────────────────────────────────
    df = pd.DataFrame([raw])
    df = _add_derived_features(df)
    student_df = df[ALL_FEATURES]

    # ── Predict ───────────────────────────────────────────────
    xgb_model = models['xgb_model']
    rf_model  = models['rf_model']
    le_tier   = models['le_tier']
    explainer = models['explainer']

    prob      = float(xgb_model.predict_proba(student_df)[0][1])
    tier_enc  = rf_model.predict(student_df)[0]
    tier      = le_tier.inverse_transform([tier_enc])[0]

    # ── SHAP values ───────────────────────────────────────────
    shap_vals = explainer.shap_values(student_df)
    # TreeExplainer returns array[n_samples, n_features]; take first row
    sv = shap_vals[0] if shap_vals.ndim == 2 else shap_vals

    impacts = pd.DataFrame({
        'feature'   : ALL_FEATURES,
        'shap_value': sv,
    }).sort_values('shap_value')

    gaps      = impacts[impacts['shap_value'] < 0].head(top_n)
    strengths = impacts[impacts['shap_value'] > 0].tail(top_n)

    # ── Recommendations ───────────────────────────────────────
    recommendations = _build_recommendations(raw)

    return {
        'placement_probability_pct': round(prob * 100, 1),
        'predicted_company_tier'   : tier,
        'strengths' : strengths[['feature', 'shap_value']].to_dict('records'),
        'gaps'      : gaps[['feature', 'shap_value']].to_dict('records'),
        'recommendations': recommendations,
    }
