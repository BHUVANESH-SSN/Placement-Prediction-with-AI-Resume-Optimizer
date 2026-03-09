from fastapi import APIRouter, Depends, HTTPException
from app.db.connection import get_db
from app.models.auth_models import LoginRequest, SendOTP, SignupRequest
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated

from app.services import auth_service
from app.services.otp_service import create_otp, send_otp_email

auth_router = APIRouter(prefix='/auth', tags=["Authentication"])

@auth_router.post('/login')
async def login(
    data: LoginRequest, 
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    return await auth_service.login_user(db, data.email, data.password)


@auth_router.post("/send-otp")
async def send_otp(data: SendOTP):
    try:
        otp = await create_otp(data.email)
        if not otp:
            raise HTTPException(400, "OTP generation failed")
        await send_otp_email(data.email, otp)
        return {"message": "OTP sent successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to send OTP: {str(e)}")


@auth_router.post("/signup")
async def signup(
    data: SignupRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
):
    await auth_service.register_user(db, data.full_name, data.email, data.password, data.otp)
    return {"message": "Account created successfully"}
