"""
oauth_handler.py — OAuth2 Token Exchange and User Data Retrieval
Handles Google and GitHub OAuth flows
"""

import httpx
import os
from typing import Optional, Dict
from urllib.parse import urlencode

# Get OAuth credentials from environment
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_OAUTH_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_OAUTH_CLIENT_SECRET")

# Redirect URIs - MUST match exactly what's in OAuth provider settings
REDIRECT_URI_GOOGLE = os.getenv(
    "REDIRECT_URI_GOOGLE",
    "http://localhost:5000/auth/callback/google"
)
REDIRECT_URI_GITHUB = os.getenv(
    "REDIRECT_URI_GITHUB",
    "http://localhost:5000/auth/callback/github"
)

# Validate credentials on startup
if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
    print("⚠️  WARNING: Google OAuth credentials not configured!")
    print("   Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env")
else:
    print("✅ Google OAuth credentials loaded")
    print(f"   Client ID: {GOOGLE_CLIENT_ID[:20]}...")

if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
    print("⚠️  WARNING: GitHub OAuth credentials not configured!")
    print("   Set GITHUB_OAUTH_CLIENT_ID and GITHUB_OAUTH_CLIENT_SECRET in .env")
else:
    print("✅ GitHub OAuth credentials loaded")
    print(f"   Client ID: {GITHUB_CLIENT_ID}")


async def exchange_google_code(code: str) -> Optional[Dict]:
    """
    Exchange Google authorization code for access token and user info
    
    Args:
        code: Authorization code from Google OAuth callback
        
    Returns:
        Dictionary with provider, provider_id, email, full_name, avatar_url
        or None if exchange fails
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        print("❌ Google OAuth credentials not configured")
        return None
        
    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Exchange code for token
            print(f"[Google] Exchanging authorization code...")
            print(f"[Google] Redirect URI: {REDIRECT_URI_GOOGLE}")
            
            token_response = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": REDIRECT_URI_GOOGLE,
                    "grant_type": "authorization_code",
                },
                timeout=10.0,
            )
            token_data = token_response.json()
            
            if "error" in token_data:
                print(f"❌ Google token error: {token_data.get('error')}")
                print(f"   Details: {token_data.get('error_description')}")
                return None
            
            access_token = token_data.get("access_token")
            if not access_token:
                print("❌ No access token in Google response")
                return None
            
            # Step 2: Get user info using access token
            print("[Google] Fetching user info...")
            user_response = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0,
            )
            user_data = user_response.json()
            
            result = {
                "provider": "google",
                "provider_id": user_data.get("id"),
                "email": user_data.get("email"),
                "full_name": user_data.get("name"),
                "avatar_url": user_data.get("picture"),
            }
            print(f"✅ Google auth successful for {result['email']}")
            return result
            
    except Exception as e:
        print(f"❌ Error exchanging Google code: {e}")
        import traceback
        traceback.print_exc()
        return None


async def exchange_github_code(code: str) -> Optional[Dict]:
    """
    Exchange GitHub authorization code for access token and user info
    
    Args:
        code: Authorization code from GitHub OAuth callback
        
    Returns:
        Dictionary with provider, provider_id, email, full_name, avatar_url
        or None if exchange fails
    """
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        print("❌ GitHub OAuth credentials not configured")
        return None
        
    try:
        async with httpx.AsyncClient() as client:
            # Step 1: Exchange code for token
            print(f"[GitHub] Exchanging authorization code...")
            print(f"[GitHub] Redirect URI: {REDIRECT_URI_GITHUB}")
            
            token_response = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "code": code,
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "redirect_uri": REDIRECT_URI_GITHUB,
                },
                headers={"Accept": "application/json"},
                timeout=10.0,
            )
            token_data = token_response.json()
            
            if "error" in token_data:
                print(f"❌ GitHub token error: {token_data.get('error')}")
                return None
            
            access_token = token_data.get("access_token")
            if not access_token:
                print("❌ No access token in GitHub response")
                return None
            
            # Step 2: Get user info using access token
            print("[GitHub] Fetching user info...")
            user_response = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}"},
                timeout=10.0,
            )
            user_data = user_response.json()
            
            # Step 3: Get user email (might be private)
            email = user_data.get("email")
            if not email:
                print("[GitHub] User email not public, fetching from /user/emails endpoint...")
                email_response = await client.get(
                    "https://api.github.com/user/emails",
                    headers={"Authorization": f"Bearer {access_token}"},
                    timeout=10.0,
                )
                emails = email_response.json()
                for email_obj in emails:
                    if email_obj.get("primary"):
                        email = email_obj.get("email")
                        break
                
                if not email and emails:
                    email = emails[0].get("email")
            
            result = {
                "provider": "github",
                "provider_id": str(user_data.get("id")),
                "email": email,
                "full_name": user_data.get("name") or user_data.get("login"),
                "avatar_url": user_data.get("avatar_url"),
            }
            print(f"✅ GitHub auth successful for {result['email']}")
            return result
            
    except Exception as e:
        print(f"❌ Error exchanging GitHub code: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_google_auth_url() -> str:
    """
    Generate Google OAuth authorization URL
    
    Returns:
        Full URL to redirect user to for Google sign-in
    """
    if not GOOGLE_CLIENT_ID:
        print("❌ Cannot generate Google auth URL - client_id not configured")
        return ""
        
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": REDIRECT_URI_GOOGLE,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    print(f"[Google] Auth URL generated for redirect_uri: {REDIRECT_URI_GOOGLE}")
    return url


def get_github_auth_url() -> str:
    """
    Generate GitHub OAuth authorization URL
    
    Returns:
        Full URL to redirect user to for GitHub sign-in
    """
    if not GITHUB_CLIENT_ID:
        print("❌ Cannot generate GitHub auth URL - client_id not configured")
        return ""
        
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": REDIRECT_URI_GITHUB,
        "scope": "user:email",
        "allow_signup": "true",
    }
    url = f"https://github.com/login/oauth/authorize?{urlencode(params)}"
    print(f"[GitHub] Auth URL generated for redirect_uri: {REDIRECT_URI_GITHUB}")
    return url