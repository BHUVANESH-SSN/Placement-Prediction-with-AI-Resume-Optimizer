# ============================================================
#  eda.py — Exploratory Data Analysis & visualisations
# ============================================================

import os
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.ticker as mtick
import seaborn as sns
import pandas as pd

from config import TIER_ORDER, TIER_COLORS, PLOTS_DIR

plt.rcParams.update({
    'figure.dpi'        : 130,
    'font.size'         : 11,
    'axes.spines.top'   : False,
    'axes.spines.right' : False,
})


def _ensure_plots_dir():
    os.makedirs(PLOTS_DIR, exist_ok=True)


# ── Plot 1: Target distribution ──────────────────────────────
def plot_target_distribution(df: pd.DataFrame) -> None:
    """Bar charts for 'placed' and 'company_tier'."""
    _ensure_plots_dir()
    fig, axes = plt.subplots(1, 2, figsize=(13, 4))

    # Placement binary
    placed_counts = df['placed'].value_counts()
    axes[0].bar(
        ['Not Placed', 'Placed'], placed_counts.values,
        color=['#ef4444', '#22c55e'], edgecolor='white', linewidth=1.5
    )
    axes[0].set_title('Placed vs Not Placed', fontweight='bold')
    axes[0].set_ylabel('Count')
    for i, v in enumerate(placed_counts.values):
        axes[0].text(i, v + 30, f'{v:,}\n({v/len(df)*100:.1f}%)',
                     ha='center', fontsize=10)

    # Company tier
    tier_counts = df['company_tier'].value_counts().reindex(TIER_ORDER)
    colors      = [TIER_COLORS[t] for t in TIER_ORDER]
    axes[1].barh(TIER_ORDER, tier_counts.values, color=colors, edgecolor='white')
    axes[1].set_title('Company Tier Distribution', fontweight='bold')
    axes[1].set_xlabel('Count')
    for i, v in enumerate(tier_counts.values):
        axes[1].text(v + 20, i, f'{v:,} ({v/len(df)*100:.1f}%)',
                     va='center', fontsize=10)

    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_target_distribution.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Plot 2: Feature distributions by tier ────────────────────
def plot_feature_distributions(df: pd.DataFrame) -> None:
    """Overlapping histograms for key numeric features split by company tier."""
    _ensure_plots_dir()
    features_to_plot = [
        'cgpa', 'backlog_count', 'internship_count',
        'project_count', 'leetcode_problems_solved',
        'github_contributions', 'skill_diversity_score', 'certification_count'
    ]

    fig, axes = plt.subplots(2, 4, figsize=(18, 8))
    axes = axes.flatten()

    for idx, feat in enumerate(features_to_plot):
        for tier in TIER_ORDER:
            data = df[df['company_tier'] == tier][feat]
            axes[idx].hist(data, bins=25, alpha=0.55, label=tier,
                           color=TIER_COLORS[tier], edgecolor='none')
        axes[idx].set_title(feat.replace('_', ' ').title(), fontweight='bold')
        axes[idx].set_ylabel('Count')
        if idx == 0:
            axes[idx].legend(fontsize=8)

    plt.suptitle('Feature Distributions by Company Tier',
                 fontsize=14, fontweight='bold', y=1.01)
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_feature_distributions.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Plot 3: Correlation heatmap ───────────────────────────────
def plot_correlation_heatmap(df: pd.DataFrame) -> None:
    """Lower-triangle correlation heatmap for numeric features."""
    _ensure_plots_dir()
    num_cols = [
        'cgpa', 'backlog_count', 'internship_count', 'internship_duration_months',
        'project_count', 'project_complexity_score', 'certification_count',
        'skill_diversity_score', 'github_contributions', 'github_repo_count',
        'leetcode_problems_solved', 'leetcode_contest_rating', 'placed'
    ]
    corr = df[num_cols].corr()
    mask = np.triu(np.ones_like(corr, dtype=bool))

    fig, ax = plt.subplots(figsize=(12, 9))
    sns.heatmap(corr, mask=mask, annot=True, fmt='.2f', cmap='RdYlGn',
                center=0, linewidths=0.5, ax=ax, annot_kws={'size': 8},
                cbar_kws={'shrink': 0.8})
    ax.set_title('Feature Correlation Matrix', fontsize=14,
                 fontweight='bold', pad=15)
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_correlation_heatmap.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Plot 4: Placement rate by branch ─────────────────────────
def plot_branch_placement_rate(df: pd.DataFrame) -> None:
    """Horizontal bar chart of placement rate by degree branch."""
    _ensure_plots_dir()
    branch_rate = (
        df.groupby('degree_branch')['placed'].mean().sort_values(ascending=False) * 100
    )

    colors = [
        '#6366f1' if r > 60 else
        '#3b82f6' if r > 40 else
        '#f97316' if r > 20 else
        '#ef4444'
        for r in branch_rate.values
    ]

    fig, ax = plt.subplots(figsize=(9, 4))
    bars = ax.barh(branch_rate.index, branch_rate.values,
                   color=colors, edgecolor='white')
    ax.set_xlabel('Placement Rate (%)')
    ax.set_title('Placement Rate by Degree Branch', fontweight='bold')
    ax.xaxis.set_major_formatter(mtick.PercentFormatter())
    for bar, val in zip(bars, branch_rate.values):
        ax.text(val + 0.5, bar.get_y() + bar.get_height() / 2,
                f'{val:.1f}%', va='center', fontsize=10)
    plt.tight_layout()
    path = f'{PLOTS_DIR}/plot_branch_placement_rate.png'
    plt.savefig(path, bbox_inches='tight')
    plt.show()
    print(f"  Saved: {path}")


# ── Run all EDA plots ─────────────────────────────────────────
def run_eda(df: pd.DataFrame) -> None:
    """Run all four EDA visualisations in sequence."""
    print("\n📊 Running EDA...")
    plot_target_distribution(df)
    plot_feature_distributions(df)
    plot_correlation_heatmap(df)
    plot_branch_placement_rate(df)
    print("  ✅ EDA complete.\n")


if __name__ == "__main__":
    from data_loader import load_data
    df = load_data()
    run_eda(df)
