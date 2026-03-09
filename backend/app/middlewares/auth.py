from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from app.utils.jwt_handler import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        public_paths = (
            "/auth",
            "/docs",
            "/openapi.json",
            "/redoc",
        )

        if (
            request.method == "OPTIONS" or 
            request.url.path in public_paths or 
            request.url.path == "/" or
            any(request.url.path.startswith(p) for p in public_paths)
        ):
            return await call_next(request)

        token = request.headers.get("Authorization")

        if not token:
            raise HTTPException(401, "Token missing")

        try:
            payload = verify_token(token)
            request.state.user = payload

        except Exception:
            raise HTTPException(401, "Invalid or expired token")

        response = await call_next(request)
        return response