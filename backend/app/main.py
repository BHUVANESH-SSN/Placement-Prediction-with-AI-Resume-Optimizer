# Forced reload trigger
"""
main.py — AIRO FastAPI Application Entry Point

Routers registered:
  /auth    — Authentication (login, signup, OTP)
  /form    — Profile data (education, summary, profile)
  /dev     — Developer integrations (GitHub, LeetCode, LinkedIn)
  /api     — Resume extraction + PDF generation   ← was previously MISSING
  /resume  — Resume version history               ← was previously MISSING
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.middlewares.auth import AuthMiddleware
from app.middlewares.logging import LoggingMiddleware
from app.middlewares.rate_limit import RateLimitMiddleware

from app.routes.auth_routes import auth_router
from app.routes.form_routes import form_router
from app.routes.dev_routes import dev_router        # NEW: developer integrations
from app.routes.resume_routes import resume_router  # FIX: was never registered
from app.routes.predict_routes import predict_router  # ML placement prediction

app = FastAPI(
    title="AIRO — AI Resume Optimizer API",
    description="Backend API for AI-powered resume tailoring, ATS scoring, and profile management.",
    version="1.0.1-debug",
)

# ── Middleware (order matters — last added runs first on request) ────────────
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(AuthMiddleware)
app.add_middleware(CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(auth_router)    # /auth/*
app.include_router(form_router)    # /form/*
app.include_router(dev_router)     # /dev/*
app.include_router(resume_router)  # /api/extract, /api/download, /resume/*
app.include_router(predict_router) # /predict


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def health():
    return {"status": "running", "version": "1.0.0"}
