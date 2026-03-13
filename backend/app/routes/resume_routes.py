from fastapi import APIRouter, Request, UploadFile, Form, File, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import Optional, Annotated
import json
import ast
import traceback
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.resume_service import process_jd_input, run_resume_pipeline, create_plain_resume, merge_resumes
from app.services.ai.resume_parser import parse_resume_file
from app.services.user_service import generate_resume_data
from app.db.connection import get_db

resume_router = APIRouter()

@resume_router.get("/")
def read_root():
    return {"status": "ok"}

@resume_router.post("/api/extract")
async def extract_and_tailor(
    req: Request,
    input_type: Annotated[str, Form(...)],
    text: Annotated[Optional[str], Form()] = None,
    url: Annotated[Optional[str], Form()] = None,
    file: Annotated[Optional[UploadFile], File()] = None,
    resume_file: Annotated[Optional[UploadFile], File()] = None,
    resume_json: Annotated[Optional[str], Form()] = None
):
    print(f">>> HIT /api/extract | input_type={input_type}")
    try:
        # Parse JD from whatever input type was sent
        jd_info = await process_jd_input(input_type, text, url, file)

        # Get DB Profile if available
        db_resume = None
        try:
            email = req.state.user.get("email")
            if email:
                db = await get_db()
                db_resume = await generate_resume_data(db, email)
        except Exception:
            pass

        # Get File Resume if available
        file_resume = None
        if resume_file:
            file_resume = await parse_resume_file(resume_file)
        elif resume_json:
            try:
                file_resume = json.loads(resume_json)
            except json.JSONDecodeError:
                import ast
                file_resume = ast.literal_eval(resume_json)

        # Merge them giving preference to DB profile
        if db_resume and file_resume:
            user_resume = merge_resumes(db_resume, file_resume)
        elif db_resume:
            user_resume = db_resume
        elif file_resume:
            user_resume = file_resume
        else:
            raise HTTPException(
                status_code=400,
                detail="No resume file or JSON provided and could not load profile from DB."
            )

        result = await run_resume_pipeline(user_resume, jd_info, verbose=False)
        return {"status": "success", **result}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@resume_router.get("/api/download")
async def download_pdf(path: str):
    import os
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf", filename=os.path.basename(path))


@resume_router.post("/api/create")
async def create_resume(
    req: Request,
    resume_file: Annotated[Optional[UploadFile], File()] = None,
):
    """
    Create an ATS-friendly resume directly from the user's dashboard profile
    (or from an uploaded PDF/DOCX) — no JD required, no AI tailoring.
    """
    print(">>> HIT /api/create")
    try:
        # Get DB Profile if available
        db_resume = None
        try:
            email = req.state.user.get("email")
            if email:
                db = await get_db()
                db_resume = await generate_resume_data(db, email)
        except Exception:
            pass

        # Get File Resume if available
        file_resume = None
        if resume_file:
            file_resume = await parse_resume_file(resume_file)

        # Merge them giving preference to DB profile
        if db_resume and file_resume:
            user_resume = merge_resumes(db_resume, file_resume)
        elif db_resume:
            user_resume = db_resume
        elif file_resume:
            user_resume = file_resume
        else:
            raise HTTPException(
                status_code=400,
                detail="No resume file provided and could not load profile from DB."
            )

        result = await create_plain_resume(user_resume)
        return {"status": "success", **result}

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))




from datetime import datetime
from bson import ObjectId

from app.db.connection import db
from app.models.resume_models import ResumeVersionCreate


@resume_router.post("/resume/version")
async def store_resume_version(data: ResumeVersionCreate):

    try:
        # Find latest version for this user
        last_version = await db.resume_versions.find_one(
            {"user_id": ObjectId(data.user_id)},
            sort=[("version", -1)]
        )

        next_version = 1
        if last_version:
            next_version = last_version["version"] + 1

        document = {
            "user_id": ObjectId(data.user_id),
            "version": next_version,
            "resume_url": data.resume_url,
            "original_resume_url": data.original_resume_url,
            "jd_qdrant_id": data.jd_qdrant_id,
            "match_score": data.match_score,
            "created_at": datetime.utcnow()
        }

        result = await db.resume_versions.insert_one(document)

        return {
            "message": "Resume version stored",
            "version": next_version,
            "id": str(result.inserted_id)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@resume_router.get("/resume/history/{user_id}")
async def get_resume_history(user_id: str):

    try:
        history = await db.resume_versions.find(
            {"user_id": ObjectId(user_id)},
            {
                "version": 1,
                "resume_url": 1,
                "match_score": 1,
                "created_at": 1
            }
        ).sort("version", -1).to_list(100)

        for h in history:
            h["_id"] = str(h["_id"])
            h["user_id"] = str(h["user_id"])

        return {
            "total_versions": len(history),
            "history": history
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@resume_router.get("/resume/version/{version_id}")
async def view_resume_version(version_id: str):

    try:
        resume = await db.resume_versions.find_one(
            {"_id": ObjectId(version_id)}
        )

        if not resume:
            raise HTTPException(status_code=404, detail="Resume version not found")

        resume["_id"] = str(resume["_id"])
        resume["user_id"] = str(resume["user_id"])

        return resume

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))