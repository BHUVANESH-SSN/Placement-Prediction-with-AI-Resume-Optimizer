# ============================================================
#  evaluate.py — Metrics, plots & cross-validation
# ============================================================

import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import StratifiedKFold, cross_val_score
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, confusion_matrix,
    classification_report, ConfusionMatrixDisplay, RocCurveDisplay,
)

from config import PLOTS_DIR, RANDOM_SEED

plt.rcParams.update({
    'figure.dpi'        : 130,
    'font.size'         : 11,
    'axes.spines.top'   : False,
    'axes.spines.right' : False,
})


def _ensure_plots_dir():
    os.makedirs(PLOTS_DIR, exist_ok=True)


# ── XGBoost binary evaluation ─────────────────────────────────
def evaluate_xgboost(model, X_test, y_test) -> dict:
    """
    Print & return binary classification metrics for XGBoost.
    """
    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics = {
        'Accuracy'  : accuracy_score(y_test, y_pred),
        'Precision' : precision_score(y_test, y_pred),
        'Recall'    : recall_score(y_test, y_pred),
        'F1-Score'  : f1_score(y_test, y_pred),
        'ROC-AUC'   : roc_auc_score(y_test, y_prob),
    }

    print("─" * 40)
    print("  XGBoost — Binary Placement Results")
    print("─" * 40)
    for k, v in metrics.items():
        bar = '█' * int(v * 20)
        print(f"  {k:<12}: {v:.4f}  {bar}")
    print("─" * 40)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred,
                                target_names=['Not Placed', 'Placed']))
    return metrics, y_pred, y_prob


# ── Confusion Matrix + ROC curve ─────────────────────────────
def plot_xgb_evaluation(y_test, y_pred, y_prob, roc_auc: float) -> None:
    _ensure_plots_dir()
    fig, axes = plt.subplots(1, 2, figsize=(13, 5))

    cm = confusion_matrix(y_test, y_pred)
    ConfusionMatrixDisplay(cm, display_labels=['Not Placed', 'Placed']).plot(
        ax=axes[0], cmap='Blues', colorbar=False
    )
    axes[0].set_title('XGBoost — Confusion Matrix', fontweight='bold')

    RocCurveDisplay.from_predictions(
        y_test, y_prob, ax=axes[1],
        color='#6366f1', lw=2,
        name=f'XGBoost (AUC={roc_auc:.3f})'
    )
    axes[1].plot([0, 1], [0, 1], '--', color='gray', lw=1)
    axes[1].set_title('ROC Curve — Placement Prediction', fontweight='bold')

    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_xgb_evaluation.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Cross-validation ──────────────────────────────────────────
def cross_validate_xgboost(model, X, y) -> np.ndarray:
    """
    5-fold stratified cross-validation, scored by ROC-AUC.
    """
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_SEED)
    cv_scores = cross_val_score(model, X, y, cv=cv, scoring='roc_auc', n_jobs=-1)

    print(f"\n5-Fold CV ROC-AUC: {cv_scores.round(4)}")
    print(f"  Mean : {cv_scores.mean():.4f}")
    print(f"  Std  : {cv_scores.std():.4f}")

    _ensure_plots_dir()
    fig, ax = plt.subplots(figsize=(7, 3))
    ax.bar(range(1, 6), cv_scores, color='#6366f1', edgecolor='white', alpha=0.85)
    ax.axhline(cv_scores.mean(), color='#f97316', linestyle='--', lw=2,
               label=f'Mean={cv_scores.mean():.3f}')
    ax.set_xlabel('Fold')
    ax.set_ylabel('ROC-AUC')
    ax.set_title('5-Fold Cross-Validation — XGBoost', fontweight='bold')
    ax.set_ylim(0.5, 1.0)
    ax.legend()
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_cross_validation.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")
    return cv_scores


# ── Random Forest tier evaluation ────────────────────────────
def evaluate_random_forest(model, X_test, y_test, le_tier) -> dict:
    y_pred = model.predict(X_test)

    metrics = {
        'Accuracy'    : accuracy_score(y_test, y_pred),
        'F1 (macro)'  : f1_score(y_test, y_pred, average='macro'),
        'F1 (weighted)': f1_score(y_test, y_pred, average='weighted'),
    }

    print("─" * 44)
    print("  Random Forest — Tier Classification")
    print("─" * 44)
    for k, v in metrics.items():
        print(f"  {k:<16}: {v:.4f}")
    print("─" * 44)
    print(classification_report(y_test, y_pred, target_names=le_tier.classes_))
    return metrics, y_pred


def plot_rf_confusion_matrix(y_test, y_pred, le_tier) -> None:
    _ensure_plots_dir()
    fig, ax = plt.subplots(figsize=(7, 6))
    cm = confusion_matrix(y_test, y_pred)
    ConfusionMatrixDisplay(cm, display_labels=le_tier.classes_).plot(
        ax=ax, cmap='Purples', colorbar=False, xticks_rotation=30
    )
    ax.set_title('Random Forest — Company Tier Confusion Matrix',
                 fontweight='bold')
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_rf_confusion_matrix.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Model comparison bar chart ────────────────────────────────
def compare_models(xgb_model, lr_model, rf_bin_model, scaler,
                   X_test_b, y_test_b,
                   y_pred_b, y_prob_b) -> pd.DataFrame:
    """
    Compare XGBoost, Logistic Regression, and Random Forest on binary task.
    """
    X_test_scaled = scaler.transform(X_test_b)

    models_eval = {
        'Logistic Regression': (
            lr_model.predict(X_test_scaled),
            lr_model.predict_proba(X_test_scaled)[:, 1],
        ),
        'Random Forest (bin)': (
            rf_bin_model.predict(X_test_b),
            rf_bin_model.predict_proba(X_test_b)[:, 1],
        ),
        'XGBoost': (y_pred_b, y_prob_b),
    }

    comparison = []
    for name, (pred, prob) in models_eval.items():
        comparison.append({
            'Model'    : name,
            'Accuracy' : round(accuracy_score(y_test_b, pred), 4),
            'Precision': round(precision_score(y_test_b, pred), 4),
            'Recall'   : round(recall_score(y_test_b, pred), 4),
            'F1-Score' : round(f1_score(y_test_b, pred), 4),
            'ROC-AUC'  : round(roc_auc_score(y_test_b, prob), 4),
        })

    comp_df = pd.DataFrame(comparison).set_index('Model')
    print(comp_df.to_string())

    _ensure_plots_dir()
    fig, ax = plt.subplots(figsize=(11, 4))
    x        = np.arange(len(comp_df.columns))
    width    = 0.25
    colors_m = ['#94a3b8', '#10b981', '#6366f1']

    for i, (model, row) in enumerate(comp_df.iterrows()):
        bars = ax.bar(x + i * width, row.values, width,
                      label=model, color=colors_m[i],
                      edgecolor='white', alpha=0.9)
        for bar in bars:
            ax.text(bar.get_x() + bar.get_width() / 2,
                    bar.get_height() + 0.005,
                    f'{bar.get_height():.3f}',
                    ha='center', va='bottom', fontsize=7.5)

    ax.set_xticks(x + width)
    ax.set_xticklabels(comp_df.columns)
    ax.set_ylim(0.5, 1.05)
    ax.set_ylabel('Score')
    ax.set_title('Model Comparison — Binary Placement Classification',
                 fontweight='bold')
    ax.legend()
    ax.axhline(1.0, color='gray', linestyle=':', lw=0.8)
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_model_comparison.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")
    return comp_df
