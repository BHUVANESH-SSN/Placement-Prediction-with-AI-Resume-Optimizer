"""
roadmap_service.py — Service for fetching and generating career roadmaps.
Supports: roadmap.sh API integration and AI-generated personalized roadmaps.
"""

import httpx
import json
from typing import List, Dict, Any, Optional
from app.services.ai.tailoring.gap_analyzer import analyze_gap
from app.services.user_service import generate_resume_data
from app.services.resource_mapper import get_resource_link

from app.services.ai.tailoring.tailor_engine import _call_with_fallback
from app.services.ai.tailoring.config import GROQ_API_KEY, GROQ_MODEL

ROADMAP_CDN_BASE = "https://raw.githubusercontent.com/kamranahmedse/developer-roadmap/master/src/data/roadmaps"

ROADMAP_MAPPING = {
    "frontend": "frontend/frontend.json",
    "backend": "backend/backend.json",
    "full-stack": "full-stack/full-stack.json",
    "devops": "devops/devops.json",
    "android": "android/android.json",
    "ios": "ios/ios.json",
    "data-analyst": "data-analyst/data-analyst.json",
    "ai-data-scientist": "ai-data-scientist/ai-data-scientist.json",
    "cyber-security": "cyber-security/cyber-security.json",
    "ux-design": "ux-design/ux-design.json",
    "product-manager": "product-manager/product-manager.json"
}

AI_ROLE_PROMPTS = {
    "frontend": "You are a Frontend dev mentor. Given these skill gaps: {gaps}, create a personalized Frontend learning roadmap.",
    "backend": "You are a Backend dev mentor. Given these skill gaps: {gaps}, create a personalized Backend learning roadmap.",
    "full-stack": "You are a Full Stack dev mentor. Given these skill gaps: {gaps}, create a personalized Full Stack learning roadmap.",
    "devops": "You are a DevOps career coach. Given these skill gaps: {gaps}, create a personalized DevOps learning roadmap.",
    "android": "You are an Android dev mentor. Given these skill gaps: {gaps}, create a personalized Android roadmap.",
    "ios": "You are an iOS dev mentor. Given these skill gaps: {gaps}, create a personalized Swift/iOS roadmap.",
    "data-analyst": "You are a data analytics coach. Given these skill gaps: {gaps}, create a personalized Data Analyst roadmap.",
    "ai-data-scientist": "You are an ML engineer mentor. Given these skill gaps: {gaps}, create a personalized Data Science roadmap.",
    "cyber-security": "You are a cybersecurity expert. Given these skill gaps: {gaps}, create a personalized CyberSec roadmap.",
    "ux-design": "You are a UI/UX design mentor. Given these skill gaps: {gaps}, create a personalized UI Developer roadmap.",
    "product-manager": "You are a PM coach. Given these skill gaps: {gaps}, create a personalized Product Manager roadmap.",
}

ROADMAP_GENERATOR_SYSTEM_PROMPT = """
You are an expert career strategist. Your task is to generate a personalized 8-step learning roadmap.

Guidelines:
- Create exactly 8 logical phases/steps.
- Each step must have:
  - "name": Brief title (e.g. "Phase 1: Foundation").
  - "items": List of 2-3 topics.
  - For each item:
    - "n": Topic name.
    - "desc": 1-sentence reason why this candidate needs it.
    - "l": Learning resource link.
    - "h": Estimated hours (int).
    - "s": Status ("focus", "bridge", or "skip").

Return ONLY valid JSON.
"""

async def fetch_standard_roadmaps() -> List[Dict[str, Any]]:
    """Fetch active roadmap list."""
    return [
        {"id": k, "title": k.replace("-", " ").title()} 
        for k in ROADMAP_MAPPING.keys()
    ]

async def get_roadmap_detail(role_id: str) -> Optional[Dict[str, Any]]:
    """Fetch detail for a specific roadmap from GitHub CDN."""
    path = ROADMAP_MAPPING.get(role_id.lower())
    if not path:
        return None
        
    async with httpx.AsyncClient() as client:
        try:
            url = f"{ROADMAP_CDN_BASE}/{path}"
            response = await client.get(url)
            if response.status_code == 200:
                raw_data = response.json()
                return transform_roadmap_sh_to_airo(raw_data)
            return None
        except Exception:
            return None

def transform_roadmap_sh_to_airo(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Transform roadmap.sh JSON structure to AIRO UI structure."""
    steps = []
    nodes = raw.get("nodes", [])
    topics = [n for n in nodes if n.get("type") in ["topic", "subtopic"]]
    
    for i in range(0, len(topics), 4):
        chunk = topics[i:i+4]
        items = []
        for t in chunk:
            label = t.get("data", {}).get("label")
            if not label: continue
            
            # Extract description and resources if available in the raw node
            # Note: roadmap.sh nodes sometimes store these in data
            items.append({
                "n": label,
                "desc": t.get("data", {}).get("description", ""),
                "l": get_resource_link(label),
                "res": t.get("data", {}).get("resources", [])
            })
            
        steps.append({
            "name": f"Module {len(steps) + 1}",
            "items": items
        })
        
    return {
        "title": raw.get("title", "Roadmap"),
        "steps": [s for s in steps if s["items"]]
    }

async def generate_ai_roadmap(db, email: str, role: str) -> Dict[str, Any]:
    """
    Generate a personalized 8-step learning roadmap using LLM.
    """
    user_resume = await generate_resume_data(db, email)
    target_jd = {"role": role, "description": f"A comprehensive {role} role."}
    gap_analysis = analyze_gap(user_resume, target_jd, verbose=False)
    readiness_score = gap_analysis.get("match_summary", {}).get("readiness_score", 0)
    
    missing_skills = gap_analysis.get("skills_analysis", {}).get("missing_required_skills", [])
    gaps_str = ", ".join(missing_skills) if missing_skills else "advanced specialization"
    
    role_prompt = AI_ROLE_PROMPTS.get(role.lower(), f"You are a {role} mentor. Given these skill gaps: {{gaps}}, create a roadmap.")
    user_prompt = role_prompt.format(gaps=gaps_str)
    
    full_user_prompt = f"""
    {user_prompt}
    
    CANDIDATE RESUME SUMMARY:
    {json.dumps(user_resume.get("skills", []), indent=2)}
    
    Generate the 8-step roadmap JSON.
    """
    
    roadmap = _call_with_fallback(
        ROADMAP_GENERATOR_SYSTEM_PROMPT, 
        full_user_prompt, 
        GROQ_API_KEY, 
        primary_model=GROQ_MODEL, 
        verbose=False
    )
    
    if not roadmap:
        return {
            "title": f"Personalized {role} Guide (Fallback)",
            "readiness_score": readiness_score,
            "steps": [{"name": "Foundation", "items": [{"n": "Skill Setup", "l": get_resource_link(role)}]}]
        }
    
    roadmap["readiness_score"] = readiness_score
    for step in roadmap.get("steps", []):
        for item in step.get("items", []):
            if "l" not in item or item["l"] == "#" or "google.com" in item["l"]:
                item["l"] = get_resource_link(item["n"])
        
    return roadmap
