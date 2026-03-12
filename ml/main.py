# ============================================================
#  main.py — Orchestrates the full ML training pipeline
# ============================================================
#
#  Run with:
#      python main.py
#
#  Pipeline steps:
#    1. Load data
#    2. EDA  (optional — set RUN_EDA = False to skip)
#    3. Feature engineering + SMOTE
#    4. Train XGBoost + Random Forest + baselines
#    5. Evaluate all models
#    6. SHAP explainability
#    7. Gap analysis demo
#    8. Save models
# ============================================================

import sys
import os
_ML_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _ML_DIR)                                   # config.py lives here
sys.path.insert(0, os.path.join(_ML_DIR, "src"))              # all other modules

import warnings
import numpy as np
import matplotlib
matplotlib.use('Agg')          # headless — remove if running in Jupyter
warnings.filterwarnings('ignore')

# ── Project modules ───────────────────────────────────────────
from config               import ALL_FEATURES, RANDOM_SEED
from data_loader          import load_data
from eda                  import run_eda
from feature_engineering  import build_feature_pipeline
from train                import (train_xgboost,
                                  train_random_forest_tier,
                                  train_baselines)
from evaluate             import (evaluate_xgboost,
                                  plot_xgb_evaluation,
                                  cross_validate_xgboost,
                                  evaluate_random_forest,
                                  plot_rf_confusion_matrix,
                                  compare_models)
from explainability       import build_explainer, run_shap_analysis
from predict              import analyze_student_gaps, print_gap_report
from model_io             import save_all, load_all, verify_models


# ── Toggle flags ──────────────────────────────────────────────
RUN_EDA   = True    # set False to skip EDA plots
RUN_SHAP  = True    # set False to skip SHAP (faster run)


def main():
    print("\n" + "=" * 60)
    print("  🎓 STUDENT PLACEMENT PREDICTOR — TRAINING PIPELINE")
    print("=" * 60)

    # ── Step 1: Load ─────────────────────────────────────────
    df = load_data()

    # ── Step 2: EDA ──────────────────────────────────────────
    if RUN_EDA:
        run_eda(df)

    # ── Step 3: Feature Engineering ──────────────────────────
    fe = build_feature_pipeline(df)

    X_train_b_sm  = fe['X_train_b_sm']
    y_train_b_sm  = fe['y_train_b_sm']
    X_test_b      = fe['X_test_b']
    y_test_b      = fe['y_test_b']
    X_train_t_sm  = fe['X_train_t_sm']
    y_train_t_sm  = fe['y_train_t_sm']
    X_test_t      = fe['X_test_t']
    y_test_t      = fe['y_test_t']
    le_branch     = fe['le_branch']
    le_tier       = fe['le_tier']
    df_model      = fe['df_model']

    # Full feature matrix (for cross-val)
    X_all = df_model[ALL_FEATURES]
    y_all = df_model['placed']

    # ── Step 4: Train models ─────────────────────────────────
    xgb_model = train_xgboost(X_train_b_sm, y_train_b_sm,
                               X_test_b, y_test_b)

    rf_model  = train_random_forest_tier(X_train_t_sm, y_train_t_sm)

    lr_model, rf_bin_model, scaler, _ = train_baselines(
        X_train_b_sm, y_train_b_sm, X_test_b
    )

    # ── Step 5: Evaluate ─────────────────────────────────────
    print("\n📊 Evaluating XGBoost...")
    xgb_metrics, y_pred_b, y_prob_b = evaluate_xgboost(
        xgb_model, X_test_b, y_test_b
    )
    plot_xgb_evaluation(y_test_b, y_pred_b, y_prob_b,
                        xgb_metrics['ROC-AUC'])

    cv_scores = cross_validate_xgboost(xgb_model, X_all, y_all)

    print("\n📊 Evaluating Random Forest (Tier)...")
    rf_metrics, y_pred_t = evaluate_random_forest(
        rf_model, X_test_t, y_test_t, le_tier
    )
    plot_rf_confusion_matrix(y_test_t, y_pred_t, le_tier)

    print("\n📊 Model Comparison...")
    comp_df = compare_models(
        xgb_model, lr_model, rf_bin_model, scaler,
        X_test_b, y_test_b, y_pred_b, y_prob_b
    )

    # ── Step 6: SHAP ─────────────────────────────────────────
    explainer = build_explainer(xgb_model)
    if RUN_SHAP:
        run_shap_analysis(explainer, xgb_model, X_test_b, y_test_b)

    # ── Step 7: Gap analysis demo ─────────────────────────────
    print("\n🧪 Running gap analysis on a sample student...")
    sample_student = {
        'cgpa'                      : 7.4,
        'backlog_count'             : 1,
        'internship_count'          : 1,
        'internship_duration_months': 2,
        'project_count'             : 2,
        'project_complexity_score'  : 4.2,
        'certification_count'       : 2,
        'skill_diversity_score'     : 4.5,
        'github_contributions'      : 95,
        'github_repo_count'         : 7,
        'leetcode_problems_solved'  : 60,
        'leetcode_contest_rating'   : 1350,
        'branch_encoded'            : int(le_branch.transform(['CS'])[0]),
        # Derived
        'coding_strength'  : round(min(60/500, 1)*0.6 + min(1350/2200, 1)*0.4, 4),
        'github_activity'  : round(min(95/600, 1)*0.65 + min(7/30, 1)*0.35, 4),
        'experience_score' : round(1*0.6 + min(2/12, 1)*0.4, 4),
        'academic_score'   : round(7.4/10 - 1*0.04, 4),
    }

    result = analyze_student_gaps(
        sample_student, xgb_model, rf_model, le_tier, explainer
    )
    print_gap_report(result)

    # ── Step 8: Save ─────────────────────────────────────────
    save_all(xgb_model, rf_model, le_branch, le_tier, scaler, explainer)

    # ── Final summary ─────────────────────────────────────────
    print("=" * 60)
    print("  TRAINING COMPLETE — SUMMARY")
    print("=" * 60)
    print(f"  Dataset             : {len(df):,} students")
    print(f"  Features used       : {len(ALL_FEATURES)}")
    for k, v in xgb_metrics.items():
        print(f"  XGB {k:<14}: {v:.4f}")
    print(f"  RF Accuracy         : {rf_metrics['Accuracy']:.4f}")
    print(f"  RF F1 (weighted)    : {rf_metrics['F1 (weighted)']:.4f}")
    print(f"  CV ROC-AUC          : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")
    print("=" * 60)


if __name__ == "__main__":
    main()
