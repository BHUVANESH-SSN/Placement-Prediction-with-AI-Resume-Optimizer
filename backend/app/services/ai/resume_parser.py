# ──────────────────────────────────────────────────────────
# resume_parser.py — Resume File → Structured JSON
#
# Accepts a PDF or DOCX resume file, extracts the plain text,
# then calls the Groq LLM to convert it into the same
# structured JSON schema that the rest of the pipeline uses.
#
# Public API:
#   async parse_resume_file(file: UploadFile) -> dict
# ──────────────────────────────────────────────────────────

import io
import json
from fastapi import HTTPException, UploadFile
from groq import Groq

from app.services.ai.tailoring.config import GROQ_API_KEY, GROQ_MODEL, GROQ_FALLBACK_MODELS


# ---------------------------------------------------------------------------
# Text extraction helpers
# ---------------------------------------------------------------------------

def _extract_text_from_pdf(content: bytes) -> str:
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}")


def _extract_text_from_docx(content: bytes) -> str:
    try:
        from docx import Document  # type: ignore[import-untyped]
        doc = Document(io.BytesIO(content))
        return "\n".join(para.text for para in doc.paragraphs)
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="python-docx is not installed. Run: pip install python-docx",
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read DOCX: {exc}")


# ---------------------------------------------------------------------------
# LLM parsing
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are a resume parsing assistant. Extract information from the provided resume text and return ONLY a valid JSON object — no markdown fences, no explanation.

The JSON must follow this exact schema (omit keys you cannot extract, never fabricate data):
{
  "name": "Full Name",
  "email": "email@example.com",
  "phone": "+91-9999999999",
  "github": "github_username_or_url",
  "linkedin": "linkedin_profile_url",
  "professional_summary": "2-4 sentence summary",
  "education": [
    {
      "degree": "B.Tech",
      "branch": "Computer Science",
      "institution": "University Name",
      "cgpa": 8.5,
      "start_year": 2020,
      "end_year": 2024
    }
  ],
  "skills": ["Python", "React", "SQL"],
  "skills_categorized": {},
  "experience": [
    {
      "role": "Software Engineer",
      "company": "Company Name",
      "start_date": "2023-06-01",
      "end_date": "2024-01-01",
      "description": "Worked on..."
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "What the project does",
      "tech_stack": ["React", "Node.js"],
      "github_link": "https://github.com/...",
      "live_link": null
    }
  ],
  "certifications": [
    {
      "title": "AWS Solutions Architect",
      "issuer": "Amazon",
      "issue_date": "2023-05-01",
      "link": null
    }
  ],
  "achievements": [
    {
      "title": "Won Hackathon",
      "description": "First place at XYZ hackathon 2023"
    }
  ]
}

Rules:
- Return ONLY the JSON object, nothing else.
- Use null for missing optional fields.
- Dates must be "YYYY-MM-DD" strings or null.
- cgpa/start_year/end_year must be numbers or null.
- skills must be a flat list of strings.
"""


def _call_groq_for_resume(resume_text: str) -> dict:
    """Call Groq API to parse resume text into structured JSON."""
    if not GROQ_API_KEY:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY is not configured.")

    client = Groq(api_key=GROQ_API_KEY)
    models_to_try = [GROQ_MODEL] + GROQ_FALLBACK_MODELS
    last_error = None

    for model in models_to_try:
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user", "content": f"Parse this resume:\n\n{resume_text[:12000]}"},
                ],
                temperature=0.1,
                max_tokens=3000,
            )
            raw = (response.choices[0].message.content or "").strip()

            # Strip markdown fences if present
            if raw.startswith("```"):
                lines = [l for l in raw.splitlines() if not l.strip().startswith("```")]
                raw = "\n".join(lines)

            parsed = json.loads(raw)
            if not isinstance(parsed, dict):
                raise ValueError("LLM returned non-dict JSON")
            return parsed

        except json.JSONDecodeError as exc:
            last_error = f"Model {model} returned invalid JSON: {exc}"
        except Exception as exc:
            last_error = f"Model {model} failed: {exc}"

    raise HTTPException(
        status_code=500,
        detail=f"Resume parsing failed after all models. Last error: {last_error}",
    )


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def parse_resume_file(file: UploadFile) -> dict:
    """
    Accept an uploaded PDF or DOCX resume file and return
    a structured JSON dict matching the pipeline's resume schema.
    """
    filename = (file.filename or "").lower()

    if filename.endswith(".pdf"):
        content = await file.read()
        text = _extract_text_from_pdf(content)
    elif filename.endswith(".docx"):
        content = await file.read()
        text = _extract_text_from_docx(content)
    else:
        raise HTTPException(
            status_code=400,
            detail="Resume file must be a .pdf or .docx file.",
        )

    if not text.strip():
        raise HTTPException(status_code=400, detail="Resume file appears to be empty or unreadable.")

    return _call_groq_for_resume(text)
