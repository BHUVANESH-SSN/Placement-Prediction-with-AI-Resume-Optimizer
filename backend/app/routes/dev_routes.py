"""
dev_routes.py — Developer Integrations Router (/dev)
Handles GitHub, LeetCode, and LinkedIn account linking.
Split from form_routes.py for cleaner separation of concerns.

All business logic is delegated to github_service / leetcode_service.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated
import os

from app.db.connection import get_db
from app.models.form_models import (
    LeetcodeCodeRequest, LeetcodeLinkRequest, LinkedinAddRequest
)
from app.models.dev_models import GithubLinkRequest, GithubCodeRequest
from app.services import github_service, leetcode_service
from app.repositories import user_repo

dev_router = APIRouter(prefix="/dev", tags=["Developer Integrations"])

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")


# ── GitHub ────────────────────────────────────────────────────────────────────

@dev_router.post("/github/getcode")
async def get_github_code(
    data: GithubCodeRequest,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Generate a bio-verification code for GitHub account linking."""
    email = req.state.user["email"]
    code = await github_service.request_github_verification(db, email, data.github_id)
    return {"verification_code": code}


@dev_router.post("/github/link")
async def link_github(
    data: GithubLinkRequest,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Verify bio code and link the GitHub account to the user's profile."""
    email = req.state.user["email"]
    try:
        await github_service.verify_and_link_github(db, email, data.github_id, data.code)
        return {"message": "GitHub linked successfully"}
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"message": e.detail})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {e}"})


@dev_router.patch("/github/update")
async def update_github(
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Refresh stored GitHub stats for the linked account."""
    email = req.state.user["email"]
    try:
        await github_service.refresh_github_data(db, email)
        return {"message": "GitHub data updated successfully"}
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"message": e.detail})
    except Exception:
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


@dev_router.get("/github/contributions/{username}")
async def get_github_contributions(username: str):
    """Retrieve GitHub contribution heatmap data via GraphQL."""
    if not GITHUB_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_TOKEN is not configured. Set it in your .env file."
        )
    try:
        return await github_service.get_contribution_heatmap(username, GITHUB_TOKEN)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {e}")


# ── LeetCode ──────────────────────────────────────────────────────────────────

@dev_router.post("/leetcode/getcode")
async def get_leetcode_code(
    data: LeetcodeCodeRequest,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Generate a bio-verification code for LeetCode account linking."""
    email = req.state.user["email"]
    code = await leetcode_service.request_leetcode_verification(db, email, data.leetcode_id)
    return {"verification_code": code}


@dev_router.post("/leetcode/link")
async def link_leetcode(
    data: LeetcodeLinkRequest,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Verify bio code and link the LeetCode account to the user's profile."""
    email = req.state.user["email"]
    try:
        await leetcode_service.verify_and_link_leetcode(db, email, data.leetcode_id, data.code)
        return {"message": "LeetCode linked successfully"}
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"message": e.detail})
    except Exception as e:
        return JSONResponse(status_code=500, content={"message": f"Internal server error: {e}"})


@dev_router.patch("/leetcode/update")
async def update_leetcode(
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Refresh stored LeetCode stats for the linked account."""
    email = req.state.user["email"]
    try:
        await leetcode_service.refresh_leetcode_data(db, email)
        return {"message": "LeetCode data updated successfully"}
    except HTTPException as e:
        return JSONResponse(status_code=e.status_code, content={"message": e.detail})
    except Exception:
        return JSONResponse(status_code=500, content={"message": "Internal server error"})


# ── LinkedIn ──────────────────────────────────────────────────────────────────

@dev_router.post("/linkedin/add")
async def add_linkedin(
    data: LinkedinAddRequest,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Store a LinkedIn profile URL for the user."""
    email = req.state.user["email"]
    try:
        await user_repo.upsert_dev_fields(db, email, {"linkedin": data.linkedin_url})
        return {"message": "LinkedIn link added successfully"}
    except Exception:
        return JSONResponse(status_code=500, content={"message": "Internal server error"})
