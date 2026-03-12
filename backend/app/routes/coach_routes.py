"""
coach_routes.py — Career Coach Router (/coach)

GET  /coach/analyze  — SSE stream of Alex's career analysis for the authenticated user.
POST /coach/analyze  — Same, but accepts an optional extra_context body for follow-up questions.
"""

from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated
from pydantic import BaseModel

from app.db.connection import get_db
from app.services.user_service import get_full_profile
from app.services.career_coach_service import stream_coach_analysis

coach_router = APIRouter(prefix="/coach", tags=["Career Coach"])


class FollowUpRequest(BaseModel):
    question: str = ""


@coach_router.get("/analyze")
async def analyze_profile_get(
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Stream a full career analysis report for the logged-in user (SSE)."""
    email = req.state.user["email"]
    profile = await get_full_profile(db, email)

    return StreamingResponse(
        stream_coach_analysis(profile),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@coach_router.post("/analyze")
async def analyze_profile_post(
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Stream a full career analysis report (POST variant, same logic)."""
    email = req.state.user["email"]
    profile = await get_full_profile(db, email)

    return StreamingResponse(
        stream_coach_analysis(profile),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
