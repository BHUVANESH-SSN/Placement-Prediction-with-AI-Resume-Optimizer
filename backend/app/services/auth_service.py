"""
auth_service.py — Authentication Business Logic
Handles login, signup, and OTP verification logic.
"""

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

from app.repositories import user_repo
from app.services.otp_service import verify_otp
from app.utils.hash import hash_password, verify_password
from app.utils.jwt_handler import create_token


async def login_user(db: AsyncIOMotorDatabase, email: str, password: str) -> dict:
    user = await user_repo.find_user_by_email(db, email)
    if not user:
        raise HTTPException(status_code=401, detail="Email doesn't exist")
    
    if not verify_password(password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    token = create_token({"email": user["email"]})
    return {
        "access_token": token,
        "message": "Login successful"
    }


async def register_user(db: AsyncIOMotorDatabase, full_name: str, email: str, password: str, otp: str) -> None:
    existing = await user_repo.find_user_by_email(db, email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    valid = await verify_otp(email, otp)
    if not valid:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    user_doc = {
        "full_name": full_name,
        "email": email,
        "password_hash": hash_password(password),
        "education": [],
        "skills": [],
        "projects": [],
        "experience": [],
        "certifications": [],
        "links": {},
        "achievements": [],
        "profile_score": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }

    await user_repo.create_user(db, user_doc)
    await user_repo.delete_otps_for_email(db, email)
