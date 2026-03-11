"""
leetcode_service.py — LeetCode Integration Service
Handles verification code generation, bio-check verification,
data fetching, and persistence for LeetCode account linking.
"""

import random
import string

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.repositories import user_repo
from app.services.external_fetch.leetcode_fetch import fetch_leetcode


def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def request_leetcode_verification(
    db: AsyncIOMotorDatabase, email: str, leetcode_id: str
) -> str:
    """Generate and store a bio-verification code. Returns the code."""
    code = _generate_code()
    await user_repo.upsert_leetcode_verification(db, email, leetcode_id, code)
    return code


async def verify_and_link_leetcode(
    db: AsyncIOMotorDatabase, email: str, leetcode_id: str, code: str
) -> None:
    """
    Verify that the user placed `code` in their LeetCode bio/About,
    then save their LeetCode profile data to the dev collection.
    Raises HTTPException on failure.
    """
    record = await user_repo.find_leetcode_verification(db, email, leetcode_id, code)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    leetcode_data = await fetch_leetcode(leetcode_id)
    if not leetcode_data or "error" in leetcode_data:
        raise HTTPException(status_code=404, detail="LeetCode user not found")

    bio = leetcode_data.get("about") or ""
    if code not in bio:
        raise HTTPException(status_code=401, detail="Code not found in LeetCode bio")

    await user_repo.upsert_dev_fields(db, email, {"leetcode": leetcode_data})
    await user_repo.delete_leetcode_verification(db, email)


async def refresh_leetcode_data(db: AsyncIOMotorDatabase, email: str) -> None:
    """Re-fetch and update stored LeetCode data for an already-linked account."""
    record = await user_repo.find_dev_by_email(db, email)
    if not record or "leetcode" not in record:
        raise HTTPException(status_code=404, detail="LeetCode account not linked")

    leetcode_id = record["leetcode"].get("username")
    leetcode_data = await fetch_leetcode(leetcode_id)
    if not leetcode_data or "error" in leetcode_data:
        raise HTTPException(status_code=404, detail="LeetCode user not found")

    await user_repo.upsert_dev_fields(db, email, {"leetcode": leetcode_data})
