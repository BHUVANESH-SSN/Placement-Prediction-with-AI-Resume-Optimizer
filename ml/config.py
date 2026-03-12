# ============================================================
#  config.py — Central configuration for Placement Predictor
# ============================================================

# ── Paths ────────────────────────────────────────────────────
DATA_PATH   = 'student_placement_10k.csv'
MODELS_DIR  = 'models'
PLOTS_DIR   = 'plots'

# ── Training ─────────────────────────────────────────────────
TEST_SIZE   = 0.20
RANDOM_SEED = 42

# ── Feature sets ─────────────────────────────────────────────
RAW_FEATURES = [
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

DERIVED_FEATURES = [
    'coding_strength',
    'github_activity',
    'experience_score',
    'academic_score',
]

ALL_FEATURES = RAW_FEATURES + DERIVED_FEATURES

# ── Company tier order & colors ───────────────────────────────
TIER_ORDER  = ['FAANG', 'Mid-tier', 'Mass Recruiter', 'Not Placed']
TIER_COLORS = {
    'FAANG'        : '#6366f1',
    'Mid-tier'     : '#3b82f6',
    'Mass Recruiter': '#10b981',
    'Not Placed'   : '#ef4444',
}

# ── XGBoost hyperparameters ───────────────────────────────────
XGB_PARAMS = dict(
    n_estimators     = 300,
    max_depth        = 6,
    learning_rate    = 0.08,
    subsample        = 0.85,
    colsample_bytree = 0.85,
    min_child_weight = 3,
    gamma            = 0.1,
    reg_alpha        = 0.05,
    reg_lambda       = 1.5,
    objective        = 'binary:logistic',
    eval_metric      = 'auc',
    random_state     = RANDOM_SEED,
    n_jobs           = -1,
)

# ── Random Forest hyperparameters (tier classifier) ───────────
RF_TIER_PARAMS = dict(
    n_estimators      = 300,
    max_depth         = 18,
    min_samples_leaf  = 4,
    min_samples_split = 8,
    max_features      = 'sqrt',
    class_weight      = 'balanced',
    random_state      = RANDOM_SEED,
    n_jobs            = -1,
)

# ── Random Forest hyperparameters (binary baseline) ───────────
RF_BIN_PARAMS = dict(
    n_estimators = 200,
    random_state = RANDOM_SEED,
    n_jobs       = -1,
)
