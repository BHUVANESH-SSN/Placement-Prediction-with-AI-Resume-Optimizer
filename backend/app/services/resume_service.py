"""
resume_service.py — Resume Generation / Optimization Service
Orchestrates the AI pipeline: JD parsing → LLM tailoring → ATS scoring → PDF.
"""

import io
from typing import Optional

from fastapi import HTTPException, UploadFile

from app.services.ai.generator import generate_tailored_resume
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

    return {
        "tailored_resume": tailored,
        "gap_analysis": gap_result,
        "ats_score": {"with_jd": ats_score_with, "without_jd": ats_score_without},
        "pdf_path": pdf_path,
    }
