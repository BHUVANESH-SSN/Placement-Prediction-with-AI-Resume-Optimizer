"""
oauth_service.py — OAuth Business Logic
Handles OAuth user registration and login
"""

from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime
from typing import Dict, Optional, Any

from app.repositories import user_repo
from app.utils.jwt_handler import create_token


async def create_or_login_oauth_user(
    db: AsyncIOMotorDatabase,
    oauth_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Create a new user or login existing OAuth user.
    
    Args:
        db: AsyncIOMotorDatabase instance
        oauth_data: Dictionary with keys:
            - provider: 'google' or 'github'
            - provider_id: OAuth provider's user ID
            - email: User email
            - full_name: User's full name
            - avatar_url: User's avatar URL
    
    Returns:
        Dictionary with access_token, message, and is_new flag
    """
    
    email: str = oauth_data.get("email", "")
    provider: str = oauth_data.get("provider", "")
    provider_id: str = oauth_data.get("provider_id", "")
    
    if not all([email, provider, provider_id]):
        raise HTTPException(status_code=400, detail="Missing required OAuth data")
    
    # Check if user exists by email
    user: Optional[Dict[str, Any]] = await user_repo.find_user_by_email(db, email)
    
    if user:
        # User exists - update OAuth info if not already linked
        oauth_field: str = f"oauth_{provider}_id"
        
        if not user.get(oauth_field):
            await user_repo.update_user_by_email(
                db,
                email,
                {
                    oauth_field: provider_id,
                    "updated_at": datetime.now()
                }
            )
        
        # Generate token
        token: str = create_token({"email": email})
        return {
            "access_token": token,
            "message": "Login successful",
            "is_new": False
        }
    
    # Create new user
    user_doc: Dict[str, Any] = {
        "full_name": oauth_data.get("full_name", ""),
        "email": email,
        "avatar_url": oauth_data.get("avatar_url", ""),
        f"oauth_{provider}_id": provider_id,
        "password_hash": None,  # OAuth users don't have password
        "education": [],
        "skills": [],
        "projects": [],
        "experience": [],
        "certifications": [],
        "links": {},
        "achievements": [],
        "profile_score": 0,
        "created_at": datetime.now(),
        "updated_at": datetime.now()
    }
    
    await user_repo.create_user(db, user_doc)
    
    # Generate token
    token = create_token({"email": email})
    return {
        "access_token": token,
        "message": "Account created successfully",
        "is_new": True
    }


async def link_oauth_to_existing_user(
    db: AsyncIOMotorDatabase,
    email: str,
    provider: str,
    provider_id: str
) -> Dict[str, Any]:
    """
    Link an OAuth provider to an existing user account.
    
    Args:
        db: AsyncIOMotorDatabase instance
        email: User's email
        provider: 'google' or 'github'
        provider_id: OAuth provider's user ID
    
    Returns:
        Dictionary with success message
    """
    user: Optional[Dict[str, Any]] = await user_repo.find_user_by_email(db, email)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    oauth_field: str = f"oauth_{provider}_id"
    
    if user.get(oauth_field):
        raise HTTPException(
            status_code=400,
            detail=f"This account is already linked to {provider}"
        )
    
    await user_repo.update_user_by_email(
        db,
        email,
        {
            oauth_field: provider_id,
            "updated_at": datetime.now()
        }
    )
    
    return {"message": f"{provider} account linked successfully"}