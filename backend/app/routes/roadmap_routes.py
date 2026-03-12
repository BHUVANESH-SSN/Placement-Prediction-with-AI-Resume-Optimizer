from fastapi import APIRouter, Depends, Request, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, List, Dict, Any
from app.db.connection import get_db
from app.services import roadmap_service

roadmap_router = APIRouter(prefix="/roadmap", tags=["Roadmap"])

@roadmap_router.get("/list")
async def get_roadmaps():
    """Get a list of standard roadmaps."""
    return await roadmap_service.fetch_standard_roadmaps()

@roadmap_router.get("/detail/{roadmap_id}")
async def get_roadmap_detail(roadmap_id: str):
    """Get detail for a specific standard roadmap."""
    detail = await roadmap_service.get_roadmap_detail(roadmap_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Roadmap detail not found")
    return detail

@roadmap_router.get("/generate/{role}")
async def generate_personalized_roadmap(
    role: str,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    """Generate a personalized AI roadmap for the current user."""
    try:
        email = req.state.user["email"]
        return await roadmap_service.generate_ai_roadmap(db, email, role)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
