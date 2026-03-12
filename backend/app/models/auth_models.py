"""
auth_models.py — Pydantic Models for Authentication
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


# ── Standard Authentication ──────────────────────────────────────────────────

class LoginRequest(BaseModel):
    """Email/password login"""
    email: EmailStr
    password: str


class SignupRequest(BaseModel):
    """Email/password signup"""
    full_name: str
    email: EmailStr
    password: str
    otp: str


class SendOTP(BaseModel):
    """Send OTP to email"""
    email: EmailStr


class VerifyOTP(BaseModel):
    """Verify OTP"""
    email: EmailStr
    otp: str


# ── OAuth ────────────────────────────────────────────────────────────────────

class OAuthCallbackResponse(BaseModel):
    """OAuth callback response (Google/GitHub)"""
    access_token: str
    email: EmailStr
    full_name: str
    avatar_url: Optional[str] = None
    is_new: bool
    provider: str  # 'google' or 'github'


class OAuthLinkRequest(BaseModel):
    """Link OAuth provider to account"""
    email: EmailStr
    provider: str  # 'google' or 'github'
    provider_id: str