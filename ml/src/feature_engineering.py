# ============================================================
#  feature_engineering.py — Encode, engineer & split data
# ============================================================

import numpy as np
import pandas as pd
from sklearn.model_selection  import train_test_split
from sklearn.preprocessing    import LabelEncoder
from imblearn.over_sampling   import SMOTE

from config import ALL_FEATURES, TEST_SIZE, RANDOM_SEED


def encode_branch(df: pd.DataFrame):
    """
    Label-encode 'degree_branch' column.

    Returns
    -------
    df        : DataFrame with new 'branch_encoded' column
    le_branch : fitted LabelEncoder (save this for inference)
    """
    le_branch = LabelEncoder()
    df = df.copy()
    df['branch_encoded'] = le_branch.fit_transform(df['degree_branch'])
    print("  Branch classes:", dict(zip(
        le_branch.classes_,
        le_branch.transform(le_branch.classes_)
    )))
    return df, le_branch


def add_derived_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Create four composite scores from raw features.

    New columns
    -----------
    coding_strength  : LeetCode problems (60%) + contest rating (40%)
    github_activity  : contributions (65%)    + repo count (35%)
    experience_score : internship count (60%) + duration normalised (40%)
    academic_score   : CGPA/10 − backlogs * 0.04  (clipped 0-1)
    """
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

    print("\n  Derived feature stats:")
    print(df[['coding_strength', 'github_activity',
              'experience_score', 'academic_score']].describe().round(3))
    return df


def encode_tier(df: pd.DataFrame):
    """
    Label-encode 'company_tier' target column.

    Returns
    -------
    y_tier   : encoded array
    le_tier  : fitted LabelEncoder
    """
    le_tier = LabelEncoder()
    y_tier  = le_tier.fit_transform(df['company_tier'])
    print("\n  Tier classes:", list(le_tier.classes_))
    print("  Tier distribution:",
          dict(zip(le_tier.classes_, np.bincount(y_tier))))
    return y_tier, le_tier


def make_splits(df_model: pd.DataFrame, y_tier: np.ndarray):
    """
    Create stratified train/test splits for binary and multi-class tasks.

    Returns
    -------
    X_train_b, X_test_b, y_train_b, y_test_b  : binary placement splits
    X_train_t, X_test_t, y_train_t, y_test_t  : company-tier splits
    """
    X = df_model[ALL_FEATURES]
    y_bin = df_model['placed']

    X_train_b, X_test_b, y_train_b, y_test_b = train_test_split(
        X, y_bin,
        test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y_bin
    )
    X_train_t, X_test_t, y_train_t, y_test_t = train_test_split(
        X, y_tier,
        test_size=TEST_SIZE, random_state=RANDOM_SEED, stratify=y_tier
    )

    print(f"\n  Binary → Train: {len(X_train_b):,}  |  Test: {len(X_test_b):,}")
    print(f"  Tier   → Train: {len(X_train_t):,}  |  Test: {len(X_test_t):,}")
    return X_train_b, X_test_b, y_train_b, y_test_b, \
           X_train_t, X_test_t, y_train_t, y_test_t


def apply_smote(X_train_b, y_train_b, X_train_t, y_train_t, le_tier):
    """
    Apply SMOTE oversampling to training sets to fix class imbalance.

    Returns
    -------
    X_train_b_sm, y_train_b_sm : balanced binary training data
    X_train_t_sm, y_train_t_sm : balanced tier training data
    """
    smote = SMOTE(random_state=RANDOM_SEED)

    X_train_b_sm, y_train_b_sm = smote.fit_resample(X_train_b, y_train_b)
    X_train_t_sm, y_train_t_sm = smote.fit_resample(X_train_t, y_train_t)

    print("\n  After SMOTE (binary):")
    unique, counts = np.unique(y_train_b_sm, return_counts=True)
    for u, c in zip(unique, counts):
        print(f"    {'Placed' if u == 1 else 'Not Placed'}: {c:,}")

    print("\n  After SMOTE (tier):")
    for cls, cnt in zip(le_tier.classes_, np.bincount(y_train_t_sm)):
        print(f"    {cls}: {cnt:,}")

    return X_train_b_sm, y_train_b_sm, X_train_t_sm, y_train_t_sm


def build_feature_pipeline(df: pd.DataFrame):
    """
    Master function — runs the full feature engineering pipeline.

    Returns everything needed for training.
    """
    print("\n⚙️  Running Feature Engineering...")
    df, le_branch = encode_branch(df)
    df            = add_derived_features(df)
    y_tier, le_tier = encode_tier(df)

    (X_train_b, X_test_b, y_train_b, y_test_b,
     X_train_t, X_test_t, y_train_t, y_test_t) = make_splits(df, y_tier)

    (X_train_b_sm, y_train_b_sm,
     X_train_t_sm, y_train_t_sm) = apply_smote(
        X_train_b, y_train_b, X_train_t, y_train_t, le_tier
    )

    print("  ✅ Feature engineering complete.\n")
    return {
        'df_model'     : df,
        'le_branch'    : le_branch,
        'le_tier'      : le_tier,
        'X_train_b_sm' : X_train_b_sm,
        'y_train_b_sm' : y_train_b_sm,
        'X_test_b'     : X_test_b,
        'y_test_b'     : y_test_b,
        'X_train_t_sm' : X_train_t_sm,
        'y_train_t_sm' : y_train_t_sm,
        'X_test_t'     : X_test_t,
        'y_test_t'     : y_test_t,
    }
