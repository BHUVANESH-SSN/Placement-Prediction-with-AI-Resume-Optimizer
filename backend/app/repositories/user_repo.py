"""
user_repo.py — User Repository
All MongoDB queries for the users and dev collections are isolated here.
Routes and services should never call the DB directly — use this module.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from motor.motor_asyncio import AsyncIOMotorDatabase


# ── Users Collection ─────────────────────────────────────────────────────────

async def find_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[Dict[str, Any]]:
    """Find a user by email address."""
    result: Optional[Dict[str, Any]] = await db.users.find_one({"email": email})
    return result


async def create_user(db: AsyncIOMotorDatabase, user_doc: Dict[str, Any]) -> str:
    """Create a new user and return the ID."""
    result = await db.users.insert_one(user_doc)
    return str(result.inserted_id)


async def update_user_fields(db: AsyncIOMotorDatabase, email: str, fields: Dict[str, Any]) -> int:
    """Update user fields by email."""
    result = await db.users.update_one(
        {"email": email},
        {"$set": {**fields, "updated_at": datetime.utcnow()}}
    )
    return result.matched_count


async def update_user_by_email(db: AsyncIOMotorDatabase, email: str, fields: Dict[str, Any]) -> int:
    """
    Update user fields by email. Used for OAuth linking and other updates.
    
    Args:
        db: AsyncIOMotorDatabase instance
        email: User's email address
        fields: Dictionary of fields to update
    
    Returns:
        Number of matched documents
    """
    result = await db.users.update_one(
        {"email": email},
        {"$set": {**fields, "updated_at": datetime.now()}}
    )
    return result.matched_count


async def push_education(db: AsyncIOMotorDatabase, email: str, education_docs: List[Dict[str, Any]]) -> None:
    """Add education entries to user's education array."""
    await db.users.update_one(
        {"email": email},
        {"$push": {"education": {"$each": education_docs}}}
    )


# ── Dev Collection (GitHub / LeetCode / LinkedIn) ────────────────────────────

async def find_dev_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[Dict[str, Any]]:
    """Find dev profile by email address."""
    result: Optional[Dict[str, Any]] = await db.dev.find_one({"email": email})
    return result


async def upsert_dev_fields(db: AsyncIOMotorDatabase, email: str, fields: Dict[str, Any]) -> None:
    """Create or update dev profile fields."""
    await db.dev.update_one(
        {"email": email},
        {
            "$set": {"email": email, **fields, "updated_at": datetime.utcnow()},
            "$setOnInsert": {"created_at": datetime.utcnow()}
        },
        upsert=True
    )


# ── OTP Store ─────────────────────────────────────────────────────────────────

async def delete_otps_for_email(db: AsyncIOMotorDatabase, email: str) -> None:
    """Delete all OTP records for an email address."""
    await db.otp_store.delete_many({"email": email})


# ── GitHub Verification ───────────────────────────────────────────────────────

async def upsert_github_verification(
    db: AsyncIOMotorDatabase, 
    email: str, 
    github_id: str, 
    code: str
) -> None:
    """Create or update GitHub verification record."""
    await db.github_verification.update_one(
        {"email": email},
        {"$set": {"email": email, "github_id": github_id, "code": code, "created_at": datetime.now()}},
        upsert=True
    )


async def find_github_verification(
    db: AsyncIOMotorDatabase, 
    email: str, 
    github_id: str, 
    code: str
) -> Optional[Dict[str, Any]]:
    """Find GitHub verification record."""
    result: Optional[Dict[str, Any]] = await db.github_verification.find_one(
        {"email": email, "github_id": github_id, "code": code}
    )
    return result


async def delete_github_verification(db: AsyncIOMotorDatabase, email: str) -> None:
    """Delete all GitHub verification records for an email."""
    await db.github_verification.delete_many({"email": email})


# ── LeetCode Verification ─────────────────────────────────────────────────────

async def upsert_leetcode_verification(
    db: AsyncIOMotorDatabase, 
    email: str, 
    leetcode_id: str, 
    code: str
) -> None:
    """Create or update LeetCode verification record."""
    await db.leetcode_verification.update_one(
        {"email": email},
        {"$set": {"email": email, "leetcode_id": leetcode_id, "code": code, "created_at": datetime.utcnow()}},
        upsert=True
    )


async def find_leetcode_verification(
    db: AsyncIOMotorDatabase, 
    email: str, 
    leetcode_id: str, 
    code: str
) -> Optional[Dict[str, Any]]:
    """Find LeetCode verification record."""
    result: Optional[Dict[str, Any]] = await db.leetcode_verification.find_one(
        {"email": email, "leetcode_id": leetcode_id, "code": code}
    )
    return result


async def delete_leetcode_verification(db: AsyncIOMotorDatabase, email: str) -> None:
    """Delete all LeetCode verification records for an email."""
    await db.leetcode_verification.delete_many({"email": email})