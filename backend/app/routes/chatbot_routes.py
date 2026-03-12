"""
chatbot_routes.py — resuMate Chatbot Router (/chatbot)

GET  /chatbot/analyze  — SSE stream: full profile career analysis
POST /chatbot/chat     — SSE stream: follow-up question answer
"""

from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated
from pydantic import BaseModel, field_validator

from app.db.connection import get_db
from app.services.user_service import get_full_profile
from app.services.career_coach_service import stream_coach_analysis, stream_chat_reply

chatbot_router = APIRouter(prefix="/chatbot", tags=["resuMate Chatbot"])

_SSE_HEADERS = {
    "Cache-Control": "no-cache",
    "X-Accel-Buffering": "no",
}


class HistoryItem(BaseModel):
    role: str
    content: str

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: str) -> str:
        if v not in ("user", "assistant"):
            raise ValueError("role must be 'user' or 'assistant'")
        return v


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryItem] = []

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        stripped = v.strip()
        if not stripped:
            raise ValueError("message cannot be empty")
        return stripped[:1500]


@chatbot_router.get("/analyze")
async def analyze(
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Stream the full career analysis for the authenticated user."""
    email = req.state.user["email"]
    profile = await get_full_profile(db, email)
    return StreamingResponse(
        stream_coach_analysis(profile),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )


@chatbot_router.post("/chat")
async def chat(
    req: Request,
    data: ChatRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)],
):
    """Stream a follow-up answer using the user's profile + conversation history."""
    email = req.state.user["email"]
    profile = await get_full_profile(db, email)
    history = [{"role": item.role, "content": item.content} for item in data.history]
    return StreamingResponse(
        stream_chat_reply(profile, history, data.message),
        media_type="text/event-stream",
        headers=_SSE_HEADERS,
    )
