"""
github_service.py — GitHub Integration Service
Handles verification code generation, bio-check verification,
data fetching, and persistence for GitHub account linking.
"""

import random
import string
from datetime import datetime

import httpx
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import settings
from app.repositories import user_repo
from app.services.external_fetch.github_fetch import fetch_github


def _generate_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


async def request_github_verification(
    db: AsyncIOMotorDatabase, email: str, github_id: str
) -> str:
    """Generate and store a bio-verification code. Returns the code."""
    code = _generate_code()
    await user_repo.upsert_github_verification(db, email, github_id, code)
    return code


async def verify_and_link_github(
    db: AsyncIOMotorDatabase, email: str, github_id: str, code: str
) -> None:
    """
    Verify that the user placed `code` in their GitHub bio,
    then save their GitHub profile data to the dev collection.
    Raises HTTPException on failure.
    """
    record = await user_repo.find_github_verification(db, email, github_id, code)
    if not record:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    github_data = await fetch_github(github_id, settings.GITHUB_TOKEN)  # single call — no duplicate
    if not github_data or "error" in github_data:
        raise HTTPException(status_code=404, detail="GitHub user not found")

    bio = github_data.get("bio") or ""
    if code not in bio:
        raise HTTPException(status_code=401, detail="Code not found in GitHub bio")

    await user_repo.upsert_dev_fields(db, email, {"github": github_data})
    await user_repo.delete_github_verification(db, email)


async def refresh_github_data(db: AsyncIOMotorDatabase, email: str) -> None:
    """Re-fetch and update stored GitHub data for an already-linked account."""
    record = await user_repo.find_dev_by_email(db, email)
    if not record or "github" not in record:
        raise HTTPException(status_code=404, detail="GitHub account not linked")

    github_id = record["github"].get("username") or record["github"].get("login")
    github_data = await fetch_github(github_id, settings.GITHUB_TOKEN)
    if not github_data or "error" in github_data:
        raise HTTPException(status_code=404, detail="GitHub user not found")

    await user_repo.upsert_dev_fields(db, email, {"github": github_data})


async def get_contribution_heatmap(username: str, github_token: str) -> dict:
    """Fetch GitHub contribution calendar via GraphQL API."""
    query = """
    query($login: String!) {
      user(login: $login) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
              }
            }
          }
        }
      }
    }
    """
    LEVEL_MAP = {
        "NONE": 0,
        "FIRST_QUARTILE": 1,
        "SECOND_QUARTILE": 2,
        "THIRD_QUARTILE": 3,
        "FOURTH_QUARTILE": 4,
    }

    headers = {
        "Authorization": f"bearer {github_token}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.post(
            "https://api.github.com/graphql",
            json={"query": query, "variables": {"login": username}},
            headers=headers,
        )

    if res.status_code != 200:
        raise HTTPException(status_code=502, detail="GitHub API error")

    data = res.json()
    if "errors" in data:
        raise HTTPException(status_code=404, detail="GitHub user not found")

    calendar = data["data"]["user"]["contributionsCollection"]["contributionCalendar"]

    weeks = [
        {
            "days": [
                {
                    "date": day["date"],
                    "count": day["contributionCount"],
                    "level": LEVEL_MAP.get(day["contributionLevel"], 0),
                }
                for day in week["contributionDays"]
            ]
        }
        for week in calendar["weeks"]
    ]

    return {
        "total_contributions": calendar["totalContributions"],
        "weeks": weeks,
    }
