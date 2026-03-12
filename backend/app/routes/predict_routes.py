from fastapi import APIRouter, Depends, Request
from typing import Annotated
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime, timezone

from app.models.predict_models import PredictRequest, PredictResponse
from app.services.predict_service import run_prediction
from app.services.placement_scorer import placement_feature_score
from app.db.connection import get_db
from app.repositories import user_repo

predict_router = APIRouter(prefix="/predict", tags=["Placement Prediction"])

# Canonical branch names accepted by the ML encoder
_BRANCH_ALIASES: dict[str, str] = {
    "cse": "CS", "cs": "CS", "computer science": "CS", "computer science and engineering": "CS",
    "it": "IT", "information technology": "IT",
    "ece": "ECE", "electronics": "ECE", "electronics and communication": "ECE",
    "eee": "EEE", "electrical": "EEE", "electrical and electronics": "EEE",
    "mech": "Mechanical", "mechanical": "Mechanical", "mechanical engineering": "Mechanical",
    "chem": "Chemical", "chemical": "Chemical", "chemical engineering": "Chemical",
    "civil": "Civil", "civil engineering": "Civil",
    "biotech": "Biotech", "biotechnology": "Biotech", "bio technology": "Biotech",
}
_KNOWN_BRANCHES = {"CS", "IT", "ECE", "EEE", "Mechanical", "Chemical", "Civil", "Biotech"}


def _normalise_branch(raw: str | None) -> str | None:
    if not raw:
        return None
    normalised = _BRANCH_ALIASES.get(raw.strip().lower())
    if normalised:
        return normalised
    # Try prefix match for degree strings like "B.E. Computer Science"
    raw_lower = raw.lower()
    for alias, canonical in _BRANCH_ALIASES.items():
        if alias in raw_lower:
            return canonical
    return None


def _months_between(start, end) -> float:
    """Return fractional months between two date-like values (datetime or ISO string)."""
    def _to_dt(val):
        if isinstance(val, datetime):
            return val
        if isinstance(val, str):
            for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d"):
                try:
                    return datetime.strptime(val[:19], fmt)
                except ValueError:
                    pass
        return None

    s = _to_dt(start)
    e = _to_dt(end) or datetime.now(timezone.utc).replace(tzinfo=None)
    if not s:
        return 0.0
    delta = (e.year - s.year) * 12 + (e.month - s.month)
    return max(0.0, float(delta))


def _extract_profile_prefill(user: dict) -> dict:
    """
    Derive prediction form fields from the stored user profile document.
    Returns a dict with keys matching the PredictRequest fields (or None if unknown).
    """
    result: dict = {}

    # ── Academic ──────────────────────────────────────────────
    education: list = user.get("education") or []
    # Pick the most recent / only entry
    latest_edu = education[-1] if education else {}
    result["cgpa"] = latest_edu.get("cgpa")
    result["branch"] = _normalise_branch(
        latest_edu.get("branch") or latest_edu.get("degree")
    )

    # ── Experience / Internships ──────────────────────────────
    experience: list = user.get("experience") or []
    internship_entries = [
        e for e in experience
        if "intern" in (e.get("role") or "").lower()
    ]
    result["internship_count"] = len(internship_entries) if internship_entries else (
        len(experience) if experience else None
    )
    total_months = sum(
        _months_between(e.get("start_date"), e.get("end_date"))
        for e in internship_entries
    )
    result["internship_duration_months"] = round(total_months, 1) if internship_entries else None

    # ── Projects + Skills (scored via placement_scorer) ─────
    projects: list = user.get("projects") or []
    result["project_count"] = len(projects) if projects else None

    # Extract skill name strings (DB stores skill objects with 'name')
    raw_skills = user.get("skills") or []
    skill_names: list[str] = [
        s.get("name") if isinstance(s, dict) else str(s)
        for s in raw_skills
        if s
    ]

    if projects or skill_names:
        scored = placement_feature_score(projects, skill_names)
        if projects:
            result["project_complexity_score"] = scored["project_complexity"]
        if skill_names:
            result["skill_diversity_score"] = scored["skills_diversity"]

    # ── Certifications ────────────────────────────────────────
    certs: list = user.get("certifications") or []
    result["certification_count"] = len(certs) if certs is not None else None

    return result


@predict_router.post("", response_model=PredictResponse, summary="Predict placement probability")
def predict_placement(body: PredictRequest):
    """
    Run ML inference on a student profile and return:
    - **placement_probability_pct** — likelihood of placement (0-100)
    - **predicted_company_tier** — FAANG / Mid-tier / Mass Recruiter / Not Placed
    - **strengths** — features that positively impact the prediction (SHAP)
    - **gaps** — features that negatively impact the prediction (SHAP)
    - **recommendations** — prioritised action items to improve placement chances
    """
    result = run_prediction(body.model_dump(), top_n=body.top_n or 5)
    return result


@predict_router.get("/prefill", summary="Pre-fill predict form from profile, GitHub & LeetCode")
async def prefill_predict(
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """
    Returns pre-filled values for all 17 ML features by combining:
    - **Profile data** — education, projects, experience, skills, certifications
    - **GitHub stats** — public_repos, total_contributions
    - **LeetCode stats** — total_solved, contest_rating

    Fields are `null` when no data is available for that field.
    """
    email = req.state.user["email"]

    user, dev = await user_repo.find_user_by_email(db, email), None
    dev = await user_repo.find_dev_by_email(db, email)

    github = dev.get("github", {}) if dev else {}
    leetcode = dev.get("leetcode", {}) if dev else {}

    # ── GitHub ────────────────────────────────────────────────
    github_repo_count = github.get("public_repos")
    github_contributions = github.get("total_contributions")

    # ── LeetCode ──────────────────────────────────────────────
    leetcode_problems_solved = leetcode.get("total_solved")
    leetcode_ranking = leetcode.get("ranking")

    # ── Profile ───────────────────────────────────────────────
    profile_prefill = _extract_profile_prefill(user or {})

    return {
        "github_linked": bool(github),
        "leetcode_linked": bool(leetcode),
        "profile_linked": bool(user),
        "prefill": {
            # Academic
            "cgpa": profile_prefill.get("cgpa"),
            "backlog_count": None,          # not stored in profile form
            "branch": profile_prefill.get("branch"),
            # Experience
            "internship_count": profile_prefill.get("internship_count"),
            "internship_duration_months": profile_prefill.get("internship_duration_months"),
            # Projects
            "project_count": profile_prefill.get("project_count"),
            "project_complexity_score": profile_prefill.get("project_complexity_score"),
            # Skills & certs
            "certification_count": profile_prefill.get("certification_count"),
            "skill_diversity_score": profile_prefill.get("skill_diversity_score"),
            # GitHub
            "github_repo_count": github_repo_count,
            "github_contributions": github_contributions,
            # LeetCode
            "leetcode_problems_solved": leetcode_problems_solved,
            "leetcode_ranking": leetcode_ranking,
        },
        "github_username": github.get("username"),
        "leetcode_username": leetcode.get("username"),
    }
