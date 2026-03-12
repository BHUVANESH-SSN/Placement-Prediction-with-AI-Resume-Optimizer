# ============================================================
#  train.py — Train XGBoost, Random Forest & baseline models
# ============================================================

import numpy as np
from sklearn.ensemble     import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

from config import XGB_PARAMS, RF_TIER_PARAMS, RF_BIN_PARAMS, RANDOM_SEED


# ── Model 1: XGBoost (binary placement probability) ──────────
def train_xgboost(X_train, y_train, X_val, y_val):
    """
    Train XGBoost classifier for binary placement prediction.

    Parameters
    ----------
    X_train, y_train : SMOTE-balanced training data
    X_val,   y_val   : raw test data used as eval_set (no leakage)

    Returns
    -------
    xgb_model : fitted XGBClassifier
    """
    print("🤖 Training XGBoost...")
    model = xgb.XGBClassifier(**XGB_PARAMS)
    model.fit(
        X_train, y_train,
        eval_set=[(X_val, y_val)],
        verbose=50,
    )
    print("  ✅ XGBoost training complete.\n")
    return model


# ── Model 2: Random Forest (company tier multi-class) ────────
def train_random_forest_tier(X_train, y_train):
    """
    Train Random Forest for multi-class company tier prediction.

    Returns
    -------
    rf_model : fitted RandomForestClassifier
    """
    print("🏢 Training Random Forest (Tier Classifier)...")
    model = RandomForestClassifier(**RF_TIER_PARAMS)
    model.fit(X_train, y_train)
    print("  ✅ Random Forest training complete.\n")
    return model


# ── Baseline models for comparison ───────────────────────────
def train_baselines(X_train, y_train, X_test):
    """
    Train Logistic Regression and a basic Random Forest
    as baseline comparisons for the binary task.

    Returns
    -------
    lr_model       : fitted LogisticRegression
    rf_bin_model   : fitted RandomForestClassifier (binary)
    scaler         : fitted StandardScaler (needed for LR inference)
    X_test_scaled  : scaled test features for LR evaluation
    """
    print("📏 Training baseline models...")

    # Scale for Logistic Regression
    scaler         = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # Logistic Regression
    lr_model = LogisticRegression(
        max_iter=1000, random_state=RANDOM_SEED, n_jobs=-1
    )
    lr_model.fit(X_train_scaled, y_train)

    # Binary Random Forest
    rf_bin_model = RandomForestClassifier(**RF_BIN_PARAMS)
    rf_bin_model.fit(X_train, y_train)

    print("  ✅ Baselines training complete.\n")
    return lr_model, rf_bin_model, scaler, X_test_scaled
