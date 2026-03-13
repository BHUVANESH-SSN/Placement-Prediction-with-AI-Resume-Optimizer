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
def merge_resumes(db_res: dict, file_res: dict) -> dict:
    """Merge uploaded resume data with dashboard data, giving DB (dashboard) priority."""
    import copy
    merged = {}
    
    # 1. Scalar fields (DB > File)
    for field in ["id", "name", "phone", "email", "github", "linkedin", "professional_summary"]:
        db_val = db_res.get(field, "")
        if isinstance(db_val, str) and db_val.strip():
            merged[field] = db_val
        else:
            merged[field] = file_res.get(field, "")

    # 2. Lists (Merge unique, prioritizing DB logic if needed, but here we just union them to not lose data, keeping DB items first)
    
    # Skills (List of strings)
    db_skills = [s.lower() for s in (db_res.get("skills") or []) if isinstance(s, str)]
    merged_skills = list((db_res.get("skills") or []))
    for s in (file_res.get("skills") or []):
        if isinstance(s, str) and s.lower() not in db_skills:
            merged_skills.append(s)
            db_skills.append(s.lower())
    merged["skills"] = merged_skills
    
    # Education
    db_edu_titles = [f'{e.get('degree', '')} {e.get('institution', '')}'.lower() for e in (db_res.get("education") or [])]
    merged_edu = list((db_res.get("education") or []))
    for e in (file_res.get("education") or []):
        title = f'{e.get('degree', '')} {e.get('institution', '')}'.lower()
        if title not in db_edu_titles:
            merged_edu.append(e)
            db_edu_titles.append(title)
    merged["education"] = merged_edu

    # Experience
    db_exp_titles = [f'{e.get('role', '')} {e.get('company', '')}'.lower() for e in (db_res.get("experience") or [])]
    merged_exp = list((db_res.get("experience") or []))
    for e in (file_res.get("experience") or []):
        title = f'{e.get('role', '')} {e.get('company', '')}'.lower()
        if title not in db_exp_titles:
            merged_exp.append(e)
            db_exp_titles.append(title)
    merged["experience"] = merged_exp

    # Projects
    db_proj_titles = [p.get("title", "").lower() for p in (db_res.get("projects") or [])]
    merged_proj = list((db_res.get("projects") or []))
    for p in (file_res.get("projects") or []):
        title = p.get("title", "").lower()
        if title not in db_proj_titles:
            merged_proj.append(p)
            db_proj_titles.append(title)
    merged["projects"] = merged_proj

    # Certifications
    db_cert_titles = [c.get("title", "").lower() for c in (db_res.get("certifications") or [])]
    merged_cert = list((db_res.get("certifications") or []))
    for c in (file_res.get("certifications") or []):
        title = c.get("title", "").lower()
        if title not in db_cert_titles:
            merged_cert.append(c)
            db_cert_titles.append(title)
    merged["certifications"] = merged_cert

    # Achievements
    db_ach_titles = [a.get("title", "").lower() for a in (db_res.get("achievements") or [])]
    merged_ach = list((db_res.get("achievements") or []))
    for a in (file_res.get("achievements") or []):
        title = a.get("title", "").lower()
        if title not in db_ach_titles:
            merged_ach.append(a)
            db_ach_titles.append(title)
    merged["achievements"] = merged_ach

    merged["skills_categorized"] = (db_res.get("skills_categorized") or {})
    return merged

