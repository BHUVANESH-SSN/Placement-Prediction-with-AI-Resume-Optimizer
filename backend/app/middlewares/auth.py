from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.utils.jwt_handler import verify_token


class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):

        public_paths = (
            "/auth",
            "/docs",
            "/openapi.json",
            "/redoc",
            "/plots",
        )

        public_exact = {"/", "/favicon.ico"}

        if (
            request.method == "OPTIONS" or
            request.url.path in public_exact or
            any(request.url.path.startswith(p) for p in public_paths)
        ):
            return await call_next(request)

        token = request.headers.get("Authorization")

        if not token:
            return JSONResponse(status_code=401, content={"detail": "Token missing"})

        try:
            payload = verify_token(token)
            request.state.user = payload

        except Exception:
            return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

        response = await call_next(request)
        return response