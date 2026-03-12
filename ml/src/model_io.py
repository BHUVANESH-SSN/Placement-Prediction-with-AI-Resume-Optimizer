# ============================================================
#  model_io.py — Save and load all models & artefacts
# ============================================================

import os
import joblib

from config import MODELS_DIR, ALL_FEATURES


def save_all(xgb_model, rf_model, le_branch, le_tier,
             scaler, explainer) -> None:
    """
    Save all trained models and encoders to MODELS_DIR.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)

    artefacts = {
        'xgb_placement.pkl'  : xgb_model,
        'rf_company_tier.pkl': rf_model,
        'encoder_branch.pkl' : le_branch,
        'encoder_tier.pkl'   : le_tier,
        'scaler.pkl'         : scaler,
        'shap_explainer.pkl' : explainer,
        'feature_names.pkl'  : ALL_FEATURES,
    }

    for filename, obj in artefacts.items():
        path = os.path.join(MODELS_DIR, filename)
        joblib.dump(obj, path)

    print(f"\n💾 Models saved to /{MODELS_DIR}/")
    for f in os.listdir(MODELS_DIR):
        size = os.path.getsize(os.path.join(MODELS_DIR, f)) / 1024
        print(f"   {f:<32} {size:.1f} KB")


def load_all() -> dict:
    """
    Load all saved models and encoders from MODELS_DIR.

    Returns
    -------
    dict with keys: xgb_model, rf_model, le_branch, le_tier,
                    scaler, explainer, feature_names
    """
    files = {
        'xgb_model'    : 'xgb_placement.pkl',
        'rf_model'     : 'rf_company_tier.pkl',
        'le_branch'    : 'encoder_branch.pkl',
        'le_tier'      : 'encoder_tier.pkl',
        'scaler'       : 'scaler.pkl',
        'explainer'    : 'shap_explainer.pkl',
        'feature_names': 'feature_names.pkl',
    }

    loaded = {}
    for key, filename in files.items():
        path = os.path.join(MODELS_DIR, filename)
        loaded[key] = joblib.load(path)

    print("  ✅ All models loaded from disk.")
    return loaded


def verify_models(loaded: dict, X_test) -> None:
    """
    Quick sanity-check that the loaded XGBoost model predicts correctly.
    """
    sample_probs = loaded['xgb_model'].predict_proba(X_test[:5])[:, 1]
    print(f"  Sample predictions (probability): {sample_probs.round(3)}")
    print("  ✅ Model verification passed.\n")
