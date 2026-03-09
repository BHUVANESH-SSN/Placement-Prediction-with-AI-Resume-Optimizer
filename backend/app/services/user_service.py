"""
user_service.py — User / Profile Business Logic
All profile operations go through this layer, which calls user_repo for DB access.
Routes should call these functions, not query the DB directly.
"""

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.repositories import user_repo


async def get_full_profile(db: AsyncIOMotorDatabase, email: str) -> dict:
    """Fetch user profile merged with dev data (GitHub/LeetCode/LinkedIn)."""
    user_data = await user_repo.find_user_by_email(db, email)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    user_data.pop("_id", None)
    user_data.pop("password_hash", None)  # Never expose hashed password

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
    """Assemble a structured resume-ready dict from user + dev collections."""
    user = await user_repo.find_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    dev = await user_repo.find_dev_by_email(db, email)

    def safe(val, default):
        return val if val else default

    return {
        "id": str(user.get("_id", "")),
        "name": safe(user.get("full_name"), ""),
        "phone": safe(user.get("phone"), ""),
        "email": safe(user.get("email"), ""),
        "github": safe(dev.get("github", {}).get("username") if dev else "", ""),
        "linkedin": safe(user.get("links", {}).get("linkedin"), ""),
        "professional_summary": safe(user.get("professional_summary"), ""),
        "education": safe(user.get("education"), []),
        "skills": [s.get("name") for s in user.get("skills", [])] if user.get("skills") else [],
        "skills_categorized": {},
        "experience": safe(user.get("experience"), []),
        "projects": safe(user.get("projects"), []),
        "certifications": safe(user.get("certifications"), []),
        "achievements": safe(user.get("achievements"), []),
    }
