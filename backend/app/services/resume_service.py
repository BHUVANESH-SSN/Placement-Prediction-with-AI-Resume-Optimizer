"""
resume_service.py — Resume Generation / Optimization Service
Orchestrates the AI pipeline: JD parsing → LLM tailoring → ATS scoring → PDF.
"""

import io
from typing import Optional

from fastapi import HTTPException, UploadFile

from app.services.ai.generator import generate_resume, generate_tailored_resume
from app.services.ai.tailoring.gap_analyzer import analyze_gap
from app.services.ai.tailoring.ats_scorer import ats_with_jd, ats_without_jd, extract_noun_keywords
from app.services.ai.tailoring.jd_parser import parse_jd


async def process_jd_input(
    input_type: str,
    text: Optional[str],
    url: Optional[str],
    file: Optional[UploadFile],
) -> dict:
    """
    Accept JD from multiple sources and return a structured jd_info dict.
    Supports: text, url, pdf, docx, eml.
    """
    jd_text = ""

    if input_type == "text" and text:
        jd_text = text

    elif input_type == "url" and url:
        # TODO: Implement real URL scraping (e.g. httpx + BeautifulSoup)
        # For now we pass the URL as description — stub
        jd_text = f"Job listing at: {url}"

    elif input_type in ["pdf", "docx", "eml"] and file:
        content = await file.read()

        if input_type == "pdf":
            try:
                import PyPDF2
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
                jd_text = "".join([page.extract_text() or "" for page in pdf_reader.pages])
            except Exception as exc:
                raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {exc}")

        else:
            # docx / eml — placeholder for future parsers
            jd_text = content.decode("utf-8", errors="ignore")

    else:
        raise HTTPException(status_code=400, detail="Invalid input type or missing content")

    return {"role": "Extracted Role", "description": jd_text}


async def run_resume_pipeline(
    user_resume: dict,
    jd_info: dict,
    verbose: bool = False,
) -> dict:
    """
    Run the full AI resume optimization pipeline and return results.

    Returns:
        {
            tailored_resume: dict,
            gap_analysis: dict,
            ats_score: { with_jd: float, without_jd: float },
            pdf_path: str,
        }
    """
    pdf_path, template, tailored = generate_tailored_resume(
        user_resume, jd_info, verbose=verbose
    )

    gap_result = analyze_gap(user_resume, jd_info, verbose=verbose)

    jd_text = jd_info.get("description", "")

    # ATS score WITH JD
    try:
        extracted_kws = extract_noun_keywords(jd_text)
        jd_keywords = {kw: 2 for kw in extracted_kws}
        resume_sections = {k: str(v) for k, v in user_resume.items() if v and isinstance(v, (str, list, dict))}
        ats_with_res = ats_with_jd(jd_text, jd_keywords, resume_sections)
        ats_score_with = ats_with_res.get("ATS_score_with_JD", 60)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"ATS Analysis with JD failed: {exc}")

    # ATS score WITHOUT JD
    try:
        resume_sections = {k: str(v) for k, v in user_resume.items() if v and isinstance(v, (str, list, dict))}
        full_text = " ".join(resume_sections.values())
        ats_without_res = ats_without_jd(full_text)
        ats_score_without = ats_without_res.get("ATS_score_without_JD", 40)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"ATS Analysis without JD failed: {exc}")

    missing_kws = ats_with_res.get("missing_keywords", [])
    all_kws = list(jd_keywords.keys())
    matched_kws = [kw for kw in all_kws if kw not in set(missing_kws)]

    return {
        "tailored_resume": tailored,
        "gap_analysis": gap_result,
        "ats_score": {"with_jd": ats_score_with, "without_jd": ats_score_without},
        "ats_keywords": {
            "matched": matched_kws,
            "missing": missing_kws,
            "section_heatmap": ats_with_res.get("heatmap", {}),
        },
        "pdf_path": pdf_path,
    }


async def create_plain_resume(user_resume: dict) -> dict:
    """
    Generate an ATS-friendly resume PDF directly from the user's profile
    without any JD tailoring. Uses the same LaTeX pipeline.

    Returns:
        { resume_data: dict, pdf_path: str }
    """
    try:
        pdf_path, template = generate_resume(user_resume, verbose=False)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Resume generation failed: {exc}")

    return {
        "resume_data": user_resume,
        "pdf_path": pdf_path,
    }
def _norm(s: str) -> str:
    """Normalise a string for dedup comparison: lowercase, collapse whitespace."""
    return " ".join(str(s).lower().split())


def _cert_key(c) -> str:
    """Stable dedup key for a certification — handles 'name' vs 'title' key difference."""
    if isinstance(c, dict):
        return _norm(c.get("name") or c.get("title") or "")
    return _norm(str(c))


def _ach_key(a) -> str:
    """Stable dedup key for an achievement regardless of shape."""
    if isinstance(a, dict):
        return _norm(a.get("title") or a.get("description") or "")
    return _norm(str(a))


def merge_resumes(db_res: dict, file_res: dict) -> dict:
    """
    Merge uploaded-resume data with dashboard (DB) data.

    Rules:
    - Scalar identity fields (name, email, ...): DB wins if non-empty.
    - Experience / Projects: if DB has ANY entries, use DB exclusively.
      The uploaded file is only a supplement when the dashboard is empty.
    - Education / Certifications / Achievements: fuzzy-deduplicated union,
      DB items kept first; file items appended only when genuinely absent.
    - Skills: deduplicated flat union (DB first).
    """
    merged: dict = {}

    # 1. Scalar fields (DB > File)
    for field in ["id", "name", "phone", "email", "github", "linkedin",
                  "professional_summary", "career_objective"]:
        db_val = db_res.get(field, "")
        merged[field] = (db_val if isinstance(db_val, str) and db_val.strip()
                         else file_res.get(field, ""))

    # 2. Skills — deduplicated flat list
    seen_skills: set = set()
    merged_skills: list = []
    for s in list(db_res.get("skills") or []) + list(file_res.get("skills") or []):
        if isinstance(s, str):
            key = _norm(s)
            if key and key not in seen_skills:
                seen_skills.add(key)
                merged_skills.append(s)
    merged["skills"] = merged_skills

    # 3. Education — fuzzy-deduplicated union (degree + institution as key)
    db_edu = list(db_res.get("education") or [])
    seen_edu = {
        _norm("{} {}".format(e.get("degree", ""),
                             e.get("institution") or e.get("college", "")))
        for e in db_edu
    }
    for e in (file_res.get("education") or []):
        key = _norm("{} {}".format(e.get("degree", ""),
                                   e.get("institution") or e.get("college", "")))
        if key and key not in seen_edu:
            db_edu.append(e)
            seen_edu.add(key)
    merged["education"] = db_edu

    # 4. Experience — DB wins entirely if non-empty; avoids bullet duplication
    db_exp = list(db_res.get("experience") or [])
    merged["experience"] = db_exp if db_exp else list(file_res.get("experience") or [])

    # 5. Projects — same strategy as experience
    db_proj = list(db_res.get("projects") or [])
    merged["projects"] = db_proj if db_proj else list(file_res.get("projects") or [])

    # 6. Certifications — fuzzy-deduplicated union (handles name vs title key)
    db_certs = list(db_res.get("certifications") or [])
    seen_certs = {_cert_key(c) for c in db_certs}
    for c in (file_res.get("certifications") or []):
        key = _cert_key(c)
        if key and key not in seen_certs:
            db_certs.append(c)
            seen_certs.add(key)
    merged["certifications"] = db_certs

    # 7. Achievements — fuzzy-deduplicated union
    db_ach = list(db_res.get("achievements") or [])
    seen_ach = {_ach_key(a) for a in db_ach}
    for a in (file_res.get("achievements") or []):
        key = _ach_key(a)
        if key and key not in seen_ach:
            db_ach.append(a)
            seen_ach.add(key)
    merged["achievements"] = db_ach

    # 8. Categorised skills — DB wins; renderer will rebuild if empty
    merged["skills_categorized"] = db_res.get("skills_categorized") or {}

    return merged