"""
career_coach_service.py — resuMate, AI Career Chatbot

Streams career analysis and handles follow-up questions about the user's profile.
"""

import os
from typing import AsyncGenerator

from groq import AsyncGroq

from app.services.ai.tailoring.config import GROQ_API_KEY, GROQ_FALLBACK_MODELS

_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

_PERSONA = """
You are resuMate, a friendly and expert AI career coach helping students and fresh graduates
land jobs at top tech companies and MNCs.

Deep expertise in: resume writing, ATS optimization, skill gap analysis, project portfolio
evaluation, and placement preparation.

Communication style:
- Talk like a friendly senior mentor, not a corporate robot
- Simple English — feel like a friend reviewing their work
- Honest but kind — give a solution with every criticism
- Specific — never say "improve your resume", say exactly what to fix with examples
- Encouraging — remind them that improvement is always possible

Formatting rules:
- Use ## for main section headings (no emojis in headings)
- Use **bold** for important terms or key advice
- Use - for bullet points
- Use numbered lists (1. 2. 3.) for action steps
- Keep it conversational and easy to read
""".strip()

_ANALYSIS_FORMAT = """
Give your report in this exact structure:

## Quick Summary
Write 2-3 honest lines about the student's overall profile strength.

## Resume Analysis
**What's working well**
List the genuine strengths clearly.

**What needs improvement**
Identify weaknesses kindly, with solutions.

**Specific fixes with examples**
Give exact before/after suggestions. For example, change "Worked on backend" to "Built REST APIs with FastAPI serving 500+ concurrent users".

## Skills Analysis
**Strong and relevant skills**
List skills they have that are marketable right now.

**Missing skills for placements**
Name specific in-demand skills they don't have yet.

**What to learn next and why**
Prioritized list of 3-4 skills with brief market reasoning.

## Project Portfolio
Review each project: what's good about it, how to describe it better on a resume, and what impact metric to add.

## Your Action Plan This Week
Give exactly 5 numbered, specific, actionable tasks in priority order.

## A Note For You
End with 2-3 lines of genuine, personalized encouragement specific to their profile.
""".strip()


def _build_profile_text(profile: dict) -> str:
    """Build a full profile text block for the analysis prompt."""
    name = profile.get("name") or "Student"
    lines = []

    if profile.get("professional_summary"):
        lines.append(f"Professional Summary: {profile['professional_summary']}")

    edu = profile.get("education") or []
    if edu:
        lines.append("\nEducation:")
        for e in edu:
            parts = [e.get("degree", ""), e.get("branch", ""), "@", e.get("institution", "")]
            if e.get("cgpa"):
                parts.append(f"| CGPA: {e['cgpa']}")
            if e.get("graduation_year"):
                parts.append(f"| Year: {e['graduation_year']}")
            lines.append("  - " + " ".join(str(x) for x in parts if x and x != "@"))

    exp = profile.get("experience") or []
    if exp:
        lines.append("\nExperience:")
        for x in exp:
            role = x.get("role", x.get("title", ""))
            comp = x.get("company", "")
            dur = x.get("duration", "")
            desc = x.get("description", "")
            lines.append(f"  - {role} @ {comp} ({dur}): {desc}".strip())

    for section, key in [("Certifications", "certifications"), ("Achievements", "achievements")]:
        items = profile.get(key) or []
        if items:
            lines.append(f"\n{section}:")
            for item in items:
                if isinstance(item, dict):
                    name_val = item.get("name") or item.get("title") or ""
                    extra = item.get("issuer") or item.get("description") or ""
                    lines.append(f"  - {name_val} {('— ' + extra) if extra else ''}".strip())
                else:
                    lines.append(f"  - {item}")

    skills_raw = profile.get("skills") or []
    skill_names = [s.get("name", s) if isinstance(s, dict) else str(s) for s in skills_raw]
    skills_text = ", ".join(n for n in skill_names if n) or "No skills listed."

    projects = profile.get("projects") or []
    proj_lines = []
    for p in projects:
        title = p.get("title", p.get("name", "Untitled"))
        desc = p.get("description", "")
        tech = p.get("technologies", p.get("tech_stack", []))
        tech_str = ", ".join(tech) if isinstance(tech, list) else str(tech)
        proj_lines.append(f"  - {title}: {desc} [Tech: {tech_str}]".strip())
    projects_text = "\n".join(proj_lines) if proj_lines else "No projects listed."

    extra = []
    github = profile.get("github") or {}
    leetcode = profile.get("leetcode") or {}
    if isinstance(github, dict) and github.get("public_repos"):
        extra.append(f"GitHub: {github['public_repos']} public repos, {github.get('total_stars', 0)} total stars")
    if isinstance(leetcode, dict) and leetcode.get("total_solved"):
        lc = (f"LeetCode: {leetcode['total_solved']} problems "
              f"(Easy: {leetcode.get('easy_solved', 0)}, "
              f"Medium: {leetcode.get('medium_solved', 0)}, "
              f"Hard: {leetcode.get('hard_solved', 0)})")
        rating = (leetcode.get("contest") or {}).get("rating")
        if rating:
            lc += f", Contest Rating: {int(rating)}"
        extra.append(lc)

    resume_text = "\n".join(lines) if lines else "No resume data provided."
    extra_section = ("\nDEVELOPER STATS:\n" + "\n".join(extra)) if extra else ""

    return (
        f"Student Name: {name}\n\n"
        f"RESUME:\n{resume_text}\n\n"
        f"SKILLS:\n{skills_text}\n\n"
        f"PROJECTS:\n{projects_text}"
        f"{extra_section}"
    )


def _build_chat_system_prompt(profile: dict) -> str:
    """System prompt for follow-up chat that includes a concise profile snapshot."""
    name = profile.get("name") or "the student"
    lines = [f"Student: {name}"]

    edu = (profile.get("education") or [])
    if edu:
        e = edu[-1]
        lines.append(
            f"Education: {e.get('degree', '')} {e.get('branch', '')} "
            f"at {e.get('institution', '')} | CGPA: {e.get('cgpa', 'N/A')}"
        )

    skills_raw = profile.get("skills") or []
    skill_names = [s.get("name", s) if isinstance(s, dict) else str(s) for s in skills_raw]
    if skill_names:
        lines.append("Skills: " + ", ".join(skill_names[:15]))

    projects = profile.get("projects") or []
    if projects:
        titles = [p.get("title", p.get("name", "")) for p in projects[:5]]
        lines.append("Projects: " + ", ".join(t for t in titles if t))

    experience = profile.get("experience") or []
    if experience:
        roles = [f"{x.get('role', '')} at {x.get('company', '')}".strip(" at") for x in experience[:3]]
        lines.append("Experience: " + "; ".join(r for r in roles if r))

    github = profile.get("github") or {}
    leetcode = profile.get("leetcode") or {}
    if isinstance(github, dict) and github.get("public_repos"):
        lines.append(f"GitHub: {github['public_repos']} repos, {github.get('total_stars', 0)} stars")
    if isinstance(leetcode, dict) and leetcode.get("total_solved"):
        lc = (f"LeetCode: {leetcode['total_solved']} problems "
              f"(E:{leetcode.get('easy_solved',0)} M:{leetcode.get('medium_solved',0)} "
              f"H:{leetcode.get('hard_solved',0)})")
        rating = (leetcode.get("contest") or {}).get("rating")
        if rating:
            lc += f", Rating: {int(rating)}"
        lines.append(lc)

    profile_summary = "\n".join(lines)

    return (
        f"{_PERSONA}\n\n"
        "You are in a follow-up chat with this student. They have already received "
        "their full career analysis report.\n\n"
        f"THEIR PROFILE:\n{profile_summary}\n\n"
        "Answer their follow-up questions specifically and helpfully. "
        "Reference their actual profile data when relevant. "
        "Keep answers concise unless detail is needed."
    )


async def _stream_groq(
    system: str,
    messages: list[dict],
    max_tokens: int = 2800,
) -> AsyncGenerator[str, None]:
    """Core streaming helper — tries primary model then fallbacks, yields SSE chunks."""
    api_key = GROQ_API_KEY
    if not api_key:
        yield "data: [ERROR] Groq API key not configured.\n\n"
        return

    client = AsyncGroq(api_key=api_key)
    models = [_MODEL] + list(GROQ_FALLBACK_MODELS)
    last_err: Exception | None = None

    for model in models:
        try:
            stream = await client.chat.completions.create(
                model=model,
                messages=[{"role": "system", "content": system}, *messages],
                temperature=0.5,
                max_tokens=max_tokens,
                stream=True,
            )
            async for chunk in stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    yield f"data: {delta.replace(chr(10), chr(92) + 'n')}\n\n"
            yield "data: [DONE]\n\n"
            return
        except Exception as e:
            last_err = e
            continue

    yield f"data: [ERROR] All models failed: {last_err}\n\n"


async def stream_coach_analysis(profile: dict) -> AsyncGenerator[str, None]:
    """Stream the initial full profile analysis report."""
    profile_text = _build_profile_text(profile)
    user_prompt = (
        f"Analyze this student's profile and give a detailed career improvement report.\n\n"
        f"{profile_text}\n\n"
        f"{_ANALYSIS_FORMAT}"
    )
    async for chunk in _stream_groq(_PERSONA, [{"role": "user", "content": user_prompt}]):
        yield chunk


async def stream_chat_reply(
    profile: dict,
    history: list[dict],
    question: str,
) -> AsyncGenerator[str, None]:
    """Stream a follow-up answer using profile context + conversation history."""
    system = _build_chat_system_prompt(profile)

    # Sanitize and limit history to avoid prompt injection via crafted history
    safe_history: list[dict] = []
    for item in history[-8:]:
        role = item.get("role", "")
        content = str(item.get("content", ""))[:2000]
        if role in ("user", "assistant") and content.strip():
            safe_history.append({"role": role, "content": content})

    safe_history.append({"role": "user", "content": question[:1500]})

    async for chunk in _stream_groq(system, safe_history, max_tokens=1500):
        yield chunk
