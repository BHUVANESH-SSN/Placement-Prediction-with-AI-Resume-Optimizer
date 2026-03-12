from pydantic import BaseModel, Field
from typing import Optional


class PredictRequest(BaseModel):
    # Academic
    cgpa: float = Field(..., ge=0.0, le=10.0, description="CGPA on a 10-point scale")
    backlog_count: int = Field(..., ge=0, description="Number of backlogs/arrears")
    degree_branch: str = Field(..., description="Engineering branch e.g. 'Computer Science'")

    # Internships & Projects
    internship_count: int = Field(..., ge=0)
    internship_duration_months: float = Field(..., ge=0.0)
    project_count: int = Field(..., ge=0)
    project_complexity_score: float = Field(..., ge=0.0, le=10.0)

    # Skills & Certifications
    certification_count: int = Field(..., ge=0)
    skill_diversity_score: float = Field(..., ge=0.0, le=10.0)

    # GitHub
    github_contributions: int = Field(..., ge=0)
    github_repo_count: int = Field(..., ge=0)

    # LeetCode
    leetcode_problems_solved: int = Field(..., ge=0)
    leetcode_contest_rating: int = Field(..., ge=0)

    # Optional: number of top gaps/strengths to return
    top_n: Optional[int] = Field(5, ge=1, le=10)


class FeatureImpact(BaseModel):
    feature: str
    shap_value: float


class Recommendation(BaseModel):
    priority: str
    action: str


class PredictResponse(BaseModel):
    placement_probability_pct: float
    predicted_company_tier: str
    strengths: list[FeatureImpact]
    gaps: list[FeatureImpact]
    recommendations: list[Recommendation]
