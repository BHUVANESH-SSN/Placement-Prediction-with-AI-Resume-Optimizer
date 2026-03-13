"""
auth_routes.py — Authentication Routes
Handles standard login/signup and OAuth authentication.

Callback endpoints:
  - GET /auth/callback/google
  - GET /auth/callback/github

(NOT /auth/oauth/callback/... or /api/auth/oauth/callback/...)
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from app.db.connection import get_db
from app.models.auth_models import LoginRequest, SendOTP, SignupRequest
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Annotated, Dict, Any

from app.services import auth_service
from app.services.otp_service import create_otp, send_otp_email
from app.utils.oauth_handler import (
    exchange_google_code,
    exchange_github_code,
    get_github_auth_url,
    get_google_auth_url,
)

auth_router = APIRouter(prefix='/auth', tags=["Authentication"])


# ══════════════════════════════════════════════════════════════════════════════
# STANDARD EMAIL/PASSWORD AUTHENTICATION
# ══════════════════════════════════════════════════════════════════════════════

@auth_router.post('/login')
async def login(
    data: LoginRequest,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> Dict[str, Any]:
    """Login user with email and password."""
    return await auth_service.login_user(db, data.email, data.password)


@auth_router.post("/send-otp")
async def send_otp(data: SendOTP) -> Dict[str, str]:
    """Send OTP to user's email for signup verification."""
    try:
        otp: str | None = await create_otp(data.email)
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
) -> Dict[str, str]:
    """Register new user with email, password, and OTP verification."""
    await auth_service.register_user(
        db,
        data.full_name,
        data.email,
        data.password,
        data.otp
    )
    return {"message": "Account created successfully"}


# ══════════════════════════════════════════════════════════════════════════════
# OAUTH AUTHENTICATION - GOOGLE
# ══════════════════════════════════════════════════════════════════════════════

@auth_router.get("/oauth/google/login")
async def google_login():
    """
    Initiates Google OAuth flow.
    
    Frontend button redirects to this endpoint.
    This endpoint redirects user to Google sign-in page.
    
    Endpoint: GET /auth/oauth/google/login
    
    Flow:
    1. User clicks "Sign in with Google"
    2. Frontend redirects to: /auth/oauth/google/login
    3. Backend redirects to: Google OAuth page
    4. User authorizes
    5. Google redirects to: /auth/callback/google?code=xxx
    6. OAuthCallback component intercepts and calls backend
    """
    auth_url = get_google_auth_url()
    if not auth_url:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth not configured. Check GOOGLE_OAUTH_CLIENT_ID in .env"
        )
    return RedirectResponse(url=auth_url)


@auth_router.get("/callback/google")
async def google_callback(
    code: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> RedirectResponse:
    """
    Google OAuth callback endpoint.
    
    Endpoint: GET /auth/callback/google?code=xxx
    
    Google redirects here after user authorizes.
    This is called DIRECTLY by the browser (not by React).
    
    Args:
        code: Authorization code from Google
        db: Database connection
        
    Returns:
        JSON with access_token, email, full_name, avatar_url, is_new, provider
    """
    try:
        print(f"[Google Callback] Received code: {code[:20]}...")
        
        # Exchange code for user data
        oauth_data: Dict[str, Any] | None = await exchange_google_code(code)

        if not oauth_data:
            print("[Google Callback] ❌ Failed to exchange code")
            raise HTTPException(
                status_code=400,
                detail="Failed to get user data from Google. Check your OAuth credentials."
            )

        print(f"[Google Callback] ✅ Got user data: {oauth_data.get('email')}")
        
        # Create or login user
        result: Dict[str, Any] = await auth_service.create_or_login_oauth_user(
            db, oauth_data
        )

        from fastapi.responses import RedirectResponse

        frontend_url = "https://placement-prediction-with-ai-resume.onrender.com"

        redirect_url = (
            f"{frontend_url}/oauth-success"
            f"?token={result['access_token']}"
            f"&email={oauth_data['email']}"
            f"&is_new={result.get('is_new', False)}"
        )

        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Google Callback] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Google auth failed: {str(e)}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# OAUTH AUTHENTICATION - GITHUB
# ══════════════════════════════════════════════════════════════════════════════

@auth_router.get("/oauth/github/login")
async def github_login():
    """
    Initiates GitHub OAuth flow.
    
    Frontend button redirects to this endpoint.
    This endpoint redirects user to GitHub sign-in page.
    
    Endpoint: GET /auth/oauth/github/login
    
    Flow:
    1. User clicks "Sign in with GitHub"
    2. Frontend redirects to: /auth/oauth/github/login
    3. Backend redirects to: GitHub OAuth page
    4. User authorizes
    5. GitHub redirects to: /auth/callback/github?code=xxx
    6. OAuthCallback component intercepts and calls backend
    """
    auth_url = get_github_auth_url()
    if not auth_url:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth not configured. Check GITHUB_OAUTH_CLIENT_ID in .env"
        )
    return RedirectResponse(url=auth_url)


@auth_router.get("/callback/github")
async def github_callback(
    code: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> RedirectResponse:
    """
    GitHub OAuth callback endpoint.
    
    Endpoint: GET /auth/callback/github?code=xxx
    
    GitHub redirects here after user authorizes.
    This is called DIRECTLY by the browser (not by React).
    
    Args:
        code: Authorization code from GitHub
        db: Database connection
        
    Returns:
        JSON with access_token, email, full_name, avatar_url, is_new, provider
    """
    try:
        print(f"[GitHub Callback] Received code: {code[:20]}...")
        
        # Exchange code for user data
        oauth_data: Dict[str, Any] | None = await exchange_github_code(code)

        if not oauth_data:
            print("[GitHub Callback] ❌ Failed to exchange code")
            raise HTTPException(
                status_code=400,
                detail="Failed to get user data from GitHub. Check your OAuth credentials."
            )

        print(f"[GitHub Callback] ✅ Got user data: {oauth_data.get('email')}")
        
        # Create or login user
        result: Dict[str, Any] = await auth_service.create_or_login_oauth_user(
            db, oauth_data
        )

        # Return token and user info as JSON
        response_data = {
            "access_token": result["access_token"],
            "email": oauth_data["email"],
            "full_name": oauth_data["full_name"],
            "avatar_url": oauth_data["avatar_url"],
            "is_new": result.get("is_new", False),
            "provider": "github"
        }
        
        print(f"[GitHub Callback] ✅ Returning: {response_data}")
        
        from fastapi.responses import RedirectResponse

        frontend_url = "https://placement-prediction-with-ai-resume.onrender.com"

        redirect_url = (
            f"{frontend_url}/oauth-success"
            f"?token={response_data['access_token']}"
            f"&email={response_data['email']}"
            f"&is_new={response_data['is_new']}"
        )

        return RedirectResponse(url=redirect_url)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[GitHub Callback] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"GitHub auth failed: {str(e)}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# OAUTH PROVIDER LINKING
# ══════════════════════════════════════════════════════════════════════════════

@auth_router.post("/oauth/link-provider")
async def link_oauth_provider(
    email: str,
    provider: str,
    provider_id: str,
    db: Annotated[AsyncIOMotorDatabase, Depends(get_db)]
) -> Dict[str, str]:
    """
    Link an OAuth provider to an existing user account.
    
    Allows users who signed up with email/password to later
    add OAuth providers to their account.
    
    Args:
        email: User's email
        provider: 'google' or 'github'
        provider_id: OAuth provider's user ID
        db: Database connection
        
    Returns:
        JSON with success message
    """
    try:
        result: Dict[str, str] = await auth_service.link_oauth_to_existing_user(
            db, email, provider, provider_id
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))