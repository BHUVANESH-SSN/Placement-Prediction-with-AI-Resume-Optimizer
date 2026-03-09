"""
user_repo.py — User Repository
All MongoDB queries for the users and dev collections are isolated here.
Routes and services should never call the DB directly — use this module.
"""

from datetime import datetime
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorDatabase


# ── Users Collection ─────────────────────────────────────────────────────────

async def find_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[dict]:
    return await db.users.find_one({"email": email})


async def create_user(db: AsyncIOMotorDatabase, user_doc: dict) -> str:
    result = await db.users.insert_one(user_doc)
    return str(result.inserted_id)


async def update_user_fields(db: AsyncIOMotorDatabase, email: str, fields: dict) -> int:
    result = await db.users.update_one(
        {"email": email},
        {"$set": {**fields, "updated_at": datetime.utcnow()}}
    )
    return result.matched_count


async def push_education(db: AsyncIOMotorDatabase, email: str, education_docs: list) -> None:
    await db.users.update_one(
        {"email": email},
        {"$push": {"education": {"$each": education_docs}}}
    )


# ── Dev Collection (GitHub / LeetCode / LinkedIn) ────────────────────────────

async def find_dev_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[dict]:
    return await db.dev.find_one({"email": email})


async def upsert_dev_fields(db: AsyncIOMotorDatabase, email: str, fields: dict) -> None:
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
    await db.otp_store.delete_many({"email": email})


# ── GitHub Verification ───────────────────────────────────────────────────────

async def upsert_github_verification(
    db: AsyncIOMotorDatabase, email: str, github_id: str, code: str
) -> None:
    await db.github_verification.update_one(
        {"email": email},
        {"$set": {"email": email, "github_id": github_id, "code": code, "created_at": datetime.now()}},
        upsert=True
    )


async def find_github_verification(
    db: AsyncIOMotorDatabase, email: str, github_id: str, code: str
) -> Optional[dict]:
    return await db.github_verification.find_one(
        {"email": email, "github_id": github_id, "code": code}
    )


async def delete_github_verification(db: AsyncIOMotorDatabase, email: str) -> None:
    await db.github_verification.delete_many({"email": email})


# ── LeetCode Verification ─────────────────────────────────────────────────────

async def upsert_leetcode_verification(
    db: AsyncIOMotorDatabase, email: str, leetcode_id: str, code: str
) -> None:
    await db.leetcode_verification.update_one(
        {"email": email},
        {"$set": {"email": email, "leetcode_id": leetcode_id, "code": code, "created_at": datetime.utcnow()}},
        upsert=True
    )


async def find_leetcode_verification(
    db: AsyncIOMotorDatabase, email: str, leetcode_id: str, code: str
) -> Optional[dict]:
    return await db.leetcode_verification.find_one(
        {"email": email, "leetcode_id": leetcode_id, "code": code}
    )


async def delete_leetcode_verification(db: AsyncIOMotorDatabase, email: str) -> None:
    await db.leetcode_verification.delete_many({"email": email})
