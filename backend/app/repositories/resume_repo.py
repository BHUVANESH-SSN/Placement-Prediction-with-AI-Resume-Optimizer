"""
resume_repo.py — Resume Version Repository
All MongoDB queries for the resume_versions collection.
"""

from datetime import datetime
from typing import Optional
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase


async def get_latest_version_number(db: AsyncIOMotorDatabase, user_id: str) -> int:
    last = await db.resume_versions.find_one(
        {"user_id": ObjectId(user_id)},
        sort=[("version", -1)]
    )
    return last["version"] if last else 0


async def insert_resume_version(db: AsyncIOMotorDatabase, document: dict) -> str:
    result = await db.resume_versions.insert_one(document)
    return str(result.inserted_id)


async def get_resume_history(db: AsyncIOMotorDatabase, user_id: str) -> list:
    history = await db.resume_versions.find(
        {"user_id": ObjectId(user_id)},
        {"version": 1, "resume_url": 1, "match_score": 1, "created_at": 1}
    ).sort("version", -1).to_list(100)

    for h in history:
        h["_id"] = str(h["_id"])
        h["user_id"] = str(h["user_id"])

    return history


async def get_resume_version_by_id(
    db: AsyncIOMotorDatabase, version_id: str
) -> Optional[dict]:
    resume = await db.resume_versions.find_one({"_id": ObjectId(version_id)})
    if resume:
        resume["_id"] = str(resume["_id"])
        resume["user_id"] = str(resume["user_id"])
    return resume
