"""
user_service.py — User / Profile Business Logic
All profile operations go through this layer, which calls user_repo for DB access.
Routes should call these functions, not query the DB directly.
"""

import json
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories import user_repo


# ---------------------------------------------------------------------------
# Auto-generation helpers (internal only)
# ---------------------------------------------------------------------------

def _build_profile_context(user: dict, dev: dict | None) -> dict:
    """Extract key facts from raw DB docs for use in LLM prompt."""
    skills = [s.get("name", "") for s in (user.get("skills") or []) if s.get("name")]

    education = user.get("education") or []
    edu_lines = []
    for e in education[:2]:
        degree  = e.get("degree", "")
        branch  = e.get("branch", "")
        inst    = e.get("institution") or e.get("college", "")
        cgpa    = e.get("cgpa", "")
        end_yr  = e.get("end_year", "")
        parts   = [f"{degree} {branch}".strip(), inst]
        if cgpa:   parts.append(f"CGPA {cgpa}")
        if end_yr: parts.append(f"({end_yr})")
        edu_lines.append(", ".join(p for p in parts if p))

    experience = user.get("experience") or []
    exp_lines = []
    for e in experience[:3]:
        role    = e.get("role", "")
        company = e.get("company", "")
        if role or company:
            exp_lines.append(f"{role} at {company}".strip(" at"))

    projects   = user.get("projects") or []
    proj_lines = [p.get("title", "") for p in projects[:4] if p.get("title")]

    achievements = user.get("achievements") or []
    ach_lines = []
    for a in achievements[:3]:
        if isinstance(a, dict):
            ach_lines.append(a.get("title") or a.get("description") or "")
        elif isinstance(a, str):
            ach_lines.append(a)

    return {
        "name":         user.get("full_name", ""),
        "skills":       skills,
        "education":    edu_lines,
        "experience":   exp_lines,
        "projects":     proj_lines,
        "achievements": [a for a in ach_lines if a],
        "github":       (dev or {}).get("github", {}).get("username", ""),
    }


def _rule_based_summary_and_objective(ctx: dict) -> tuple[str, str]:
    """
    Generate a professional_summary and career_objective purely from
    profile facts — no LLM call, always available as fallback.
    """
    skills = ctx["skills"]
    edu    = ctx["education"]
    exp    = ctx["experience"]
    projs  = ctx["projects"]

    skill_str = ", ".join(skills[:6]) if skills else "various technologies"

    if exp:
        summary = (
            f"Results-driven professional with hands-on experience as {exp[0]}. "
            f"Proficient in {skill_str}, with a solid foundation from "
            f"{edu[0] + '.' if edu else 'rigorous academic training.'}"
        )
    else:
        edu_str = f"Educated at {edu[0]}. " if edu else ""
        summary = (
            f"Motivated graduate skilled in {skill_str}. "
            f"{edu_str}"
            f"Eager to apply technical knowledge to solve real-world problems."
        ).strip()

    proj_str  = ", ".join(projs[:2]) if projs else "innovative software projects"
    objective = (
        f"To leverage expertise in {skill_str} to contribute meaningfully to a "
        f"forward-thinking organization, while building impactful solutions such as "
        f"{proj_str} and growing continuously as a professional."
    )

    return summary.strip(), objective.strip()


async def _auto_generate_summary_and_objective(ctx: dict) -> tuple[str, str]:
    """
    Call Groq LLM to produce professional_summary + career_objective.
    Falls back to rule-based generation if LLM is unavailable or fails.
    """
    from app.services.ai.tailoring.config import GROQ_API_KEY, GROQ_MODEL, GROQ_FALLBACK_MODELS

    if not GROQ_API_KEY:
        return _rule_based_summary_and_objective(ctx)

    system_prompt = """\
You are a professional resume writer. Given structured profile data, generate:
1. "professional_summary": 2-3 sentences, third-person, ATS-friendly. Highlights role, top skills, and education.
2. "career_objective": 1-2 sentences, forward-looking, names the domain/field the person wants to grow in.

Rules:
- Use ONLY facts present in the input. Do NOT fabricate companies, degrees, or metrics.
- Do NOT include the person's name in either field.
- Output ONLY a valid JSON object with exactly these two keys: "professional_summary" and "career_objective".
- No markdown fences, no preamble, no explanation.
"""
    user_prompt = f"Profile:\n{json.dumps(ctx, indent=2)}\n\nGenerate the JSON now."

    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)

    for model in ([GROQ_MODEL] + GROQ_FALLBACK_MODELS):
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": user_prompt},
                ],
                temperature=0.35,
                max_tokens=400,
            )
            raw = (resp.choices[0].message.content or "").strip()
            if raw.startswith("```"):
                raw = "\n".join(l for l in raw.splitlines() if not l.strip().startswith("```"))
            parsed    = json.loads(raw)
            summary   = parsed.get("professional_summary", "").strip()
            objective = parsed.get("career_objective", "").strip()
            if summary:
                return summary, objective
        except Exception:
            continue

    return _rule_based_summary_and_objective(ctx)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def get_full_profile(db: AsyncIOMotorDatabase, email: str) -> dict:
    """Fetch user profile merged with dev data (GitHub/LeetCode/LinkedIn)."""
    user_data = await user_repo.find_user_by_email(db, email)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    user_data.pop("_id", None)
    user_data.pop("password_hash", None)

    dev_data = await user_repo.find_dev_by_email(db, email)
    if dev_data:
        dev_data.pop("_id", None)
        dev_data.pop("email", None)
        dev_data.pop("created_at", None)
        dev_data.pop("updated_at", None)
        user_data.update(dev_data)

    return user_data


async def update_profile(db: AsyncIOMotorDatabase, email: str, fields: dict) -> None:
    """Update top-level user profile fields."""
    if not fields:
        raise HTTPException(status_code=400, detail="No data provided")

    matched = await user_repo.update_user_fields(db, email, fields)
    if matched == 0:
        raise HTTPException(status_code=404, detail="User not found")


async def add_education(db: AsyncIOMotorDatabase, email: str, education_docs: list) -> None:
    """Append new education entries to the user's education list."""
    user = await user_repo.find_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await user_repo.push_education(db, email, education_docs)


async def update_summary(db: AsyncIOMotorDatabase, email: str, summary: str) -> None:
    """Update the professional summary field."""
    if not summary.strip():
        raise HTTPException(status_code=400, detail="Summary cannot be empty")

    matched = await user_repo.update_user_fields(db, email, {"professional_summary": summary})
    if matched == 0:
        raise HTTPException(status_code=404, detail="User not found")


async def generate_resume_data(db: AsyncIOMotorDatabase, email: str) -> dict:
    """
    Assemble a structured resume-ready dict from user + dev collections.

    professional_summary and career_objective are auto-generated from the
    user's own profile data (via Groq LLM with rule-based fallback) when
    those fields are not already stored in the database.
    """
    user = await user_repo.find_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    dev = await user_repo.find_dev_by_email(db, email)

    def safe(val, default):
        return val if val else default

    existing_summary   = safe(user.get("professional_summary"), "").strip()
    existing_objective = safe(user.get("career_objective"), "").strip()

    # Auto-generate whichever fields are missing from the DB
    if not existing_summary or not existing_objective:
        ctx = _build_profile_context(user, dev)
        gen_summary, gen_objective = await _auto_generate_summary_and_objective(ctx)

        if not existing_summary:
            existing_summary = gen_summary
        if not existing_objective:
            existing_objective = gen_objective

    return {
        "id":                   str(user.get("_id", "")),
        "name":                 safe(user.get("full_name"), ""),
        "phone":                safe(user.get("phone"), ""),
        "email":                safe(user.get("email"), ""),
        "github":               safe(dev.get("github", {}).get("username") if dev else "", ""),
        "linkedin":             safe(user.get("links", {}).get("linkedin"), ""),
        "professional_summary": existing_summary,
        "career_objective":     existing_objective,
        "education":            safe(user.get("education"), []),
        "skills":               [s.get("name") for s in user.get("skills", [])] if user.get("skills") else [],
        "skills_categorized":   {},
        "experience":           safe(user.get("experience"), []),
        "projects":             safe(user.get("projects"), []),
        "certifications":       safe(user.get("certifications"), []),
        "achievements":         safe(user.get("achievements"), []),
    }