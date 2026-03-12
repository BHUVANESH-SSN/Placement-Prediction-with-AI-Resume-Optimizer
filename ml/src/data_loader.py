# ============================================================
#  data_loader.py — Load & validate the raw dataset
# ============================================================

import pandas as pd
from config import DATA_PATH


def load_data(path: str = DATA_PATH) -> pd.DataFrame:
    """
    Load the CSV dataset and print basic info.

    Returns
    -------
    df : pd.DataFrame
        Raw dataframe with all original columns.
    """
    df = pd.read_csv(path)

    print("=" * 45)
    print("  DATA LOADING SUMMARY")
    print("=" * 45)
    print(f"  Shape        : {df.shape}")
    print(f"  Null values  : {df.isnull().sum().sum()}")
    print(f"  Columns      : {list(df.columns)}")
    print("=" * 45)

    _validate(df)
    return df


def _validate(df: pd.DataFrame) -> None:
    """
    Raise an error if required columns are missing.
    """
    required = [
        'cgpa', 'backlog_count', 'internship_count',
        'internship_duration_months', 'project_count',
        'project_complexity_score', 'certification_count',
        'skill_diversity_score', 'github_contributions',
        'github_repo_count', 'leetcode_problems_solved',
        'leetcode_contest_rating', 'degree_branch',
        'placed', 'company_tier',
    ]
    missing = [c for c in required if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")
    print("  ✅ All required columns present.")


if __name__ == "__main__":
    df = load_data()
    print(df.head())
    print(df.describe().round(2))
