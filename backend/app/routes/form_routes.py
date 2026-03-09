from fastapi import APIRouter, Depends, Request, HTTPException
from fastapi.responses import JSONResponse
from typing import Annotated, List
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db.connection import get_db
from app.models.form_models import EducationModel, ProfileUpdate, SummaryUpdate
from app.services import user_service

form_router = APIRouter(prefix="/form", tags=["Profile Management"])

@form_router.get("/education/{email}")
async def get_education(
    email: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    profile = await user_service.get_full_profile(db, email)
    return {
        "email": email,
        "education": profile.get("education", [])
    }


@form_router.post("/education")
async def update_education(
    data: List[EducationModel],
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    user_email = req.state.user["email"]
    education_docs = [item.model_dump(exclude_none=True) for item in data]
    await user_service.add_education(db, user_email, education_docs)
    return {"message": "Education details updated successfully"}


@form_router.patch("/update-profile")
async def update_profile(
    data: ProfileUpdate,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    email = req.state.user["email"]
    update_data = data.model_dump(exclude_none=True)
    await user_service.update_profile(db, email, update_data)
    return {"message": "Profile updated successfully"}


@form_router.get("/get-profile/{email}")
async def get_profile(
    email: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    return await user_service.get_full_profile(db, email)


@form_router.get("/generate")
async def generate_profile(
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    email = req.state.user["email"]
    return await user_service.generate_resume_data(db, email)


@form_router.patch("/update-summary")
async def update_summary(
    data: SummaryUpdate,
    req: Request,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    email = req.state.user["email"]
    await user_service.update_summary(db, email, data.professional_summary)
    return {"message": "Professional summary updated successfully"}
