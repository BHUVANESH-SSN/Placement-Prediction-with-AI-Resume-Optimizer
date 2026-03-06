from pydantic import BaseModel
from typing import Optional


class ResumeVersionCreate(BaseModel):
    user_id: str
    resume_url: str
    original_resume_url: Optional[str] = None
    jd_qdrant_id: str
    match_score: Optional[float] = None