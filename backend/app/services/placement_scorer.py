"""
placement_scorer.py — Placement Feature Scorer

Scores Projects (0-10) and Skills (0-10) for ML placement prediction.

KEY OUTPUT FEATURES:
  - project_complexity  : single 0-10 score across ALL projects
  - skills_diversity    : single 0-10 score across ALL skills
  - final_placement_score : combined weighted score

These values feed directly into the XGBoost placement model as
`project_complexity_score` and `skill_diversity_score`.
"""

from typing import Optional

# ──────────────────────────────────────────────
# SKILL TIER DICTIONARY
# ──────────────────────────────────────────────

SKILL_TIERS = {
    "tier1": {
        "score": 10,
        "skills": [
            "python", "java", "react", "node.js", "nodejs", "machine learning",
            "deep learning", "aws", "docker", "kubernetes", "sql", "tensorflow",
            "pytorch", "data science", "nlp", "computer vision", "generative ai",
            "llm", "flutter", "kotlin", "swift", "rust", "golang", "go",
            "spring boot", "django", "fastapi", "next.js", "nextjs", "typescript"
        ]
    },
    "tier2": {
        "score": 7,
        "skills": [
            "javascript", "c++", "mongodb", "git", "rest api", "flask",
            "express", "expressjs", "mysql", "postgresql", "redis", "firebase",
            "graphql", "linux", "bash", "r", "scala", "hadoop", "spark",
            "azure", "gcp", "tableau", "power bi", "selenium", "jest",
            "github", "ci/cd", "jenkins", "nginx", "vue", "angular"
        ]
    },
    "tier3": {
        "score": 4,
        "skills": [
            "html", "css", "c", "excel", "canva", "bootstrap", "jquery",
            "xml", "json", "php", "wordpress", "figma", "photoshop",
            "matlab", "unity", "android studio", "linux basics"
        ]
    },
    "tier4": {
        "score": 1,
        "skills": [
            "ms office", "microsoft office", "powerpoint", "word",
            "team player", "hard working", "communication", "leadership",
            "time management", "problem solving", "critical thinking"
        ]
    }
}

# ──────────────────────────────────────────────
# TECH STACK TIER (for project scoring)
# ──────────────────────────────────────────────

STACK_TIERS = {
    "high": {
        "score": 3,
        "keywords": [
            "aws", "gcp", "azure", "docker", "kubernetes", "machine learning",
            "deep learning", "tensorflow", "pytorch", "react", "next.js",
            "fastapi", "spring boot", "microservices", "redis", "graphql",
            "flutter", "llm", "generative ai", "nlp", "computer vision"
        ]
    },
    "mid": {
        "score": 2,
        "keywords": [
            "node", "express", "django", "flask", "mongodb", "postgresql",
            "mysql", "rest api", "firebase", "android", "vue", "angular",
            "typescript", "jwt", "oauth", "websocket", "python", "java"
        ]
    },
    "low": {
        "score": 1,
        "keywords": [
            "html", "css", "javascript", "bootstrap", "jquery", "php",
            "wordpress", "sqlite", "basic", "simple"
        ]
    }
}

TUTORIAL_KEYWORDS = [
    "todo", "to-do", "weather app", "calculator", "portfolio template",
    "clone", "tutorial", "basic crud", "simple website", "landing page only"
]

COMPLEXITY_KEYWORDS = {
    "high": [
        "real-time", "machine learning", "ml model", "neural network",
        "authentication", "payment gateway", "api integration", "deployed",
        "live", "production", "microservices", "recommendation system",
        "chatbot", "ocr", "image recognition", "nlp", "data pipeline"
    ],
    "mid": [
        "rest api", "database", "crud", "login", "dashboard", "chart",
        "search", "filter", "notification", "email", "upload", "download"
    ],
    "low": [
        "display", "static", "basic", "simple", "show", "list", "form"
    ]
}

DOMAIN_SKILL_MAP = {
    "frontend":  ["react", "html", "css", "vue", "angular", "next.js", "typescript", "javascript"],
    "backend":   ["node.js", "django", "flask", "fastapi", "spring boot", "express", "java", "python", "php"],
    "database":  ["sql", "mongodb", "postgresql", "mysql", "redis", "firebase", "sqlite"],
    "ml_ai":     ["machine learning", "deep learning", "nlp", "computer vision", "tensorflow",
                  "pytorch", "data science", "llm", "generative ai"],
    "devops":    ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "jenkins", "linux", "bash"],
    "mobile":    ["flutter", "kotlin", "swift", "android studio", "react native"],
    "data_eng":  ["spark", "hadoop", "scala", "r", "tableau", "power bi"],
    "tools":     ["git", "github", "selenium", "jest", "graphql", "rest api"],
}


def _grade(score: float) -> str:
    if score >= 8.5: return "Excellent"
    if score >= 7.0: return "Good"
    if score >= 5.0: return "Average"
    if score >= 3.0: return "Below Average"
    return "Weak"


# ──────────────────────────────────────────────
# PROJECT SCORER
# ──────────────────────────────────────────────

def score_project(title: str, overview: str, tech_stack: list[str]) -> dict:
    title_lower    = title.lower()
    overview_lower = overview.lower()
    stack_lower    = [t.lower() for t in tech_stack]
    combined_text  = title_lower + " " + overview_lower

    scores = {}

    # Tech stack relevance (max 3)
    stack_score = 0
    for tier in ("high", "mid", "low"):
        for kw in STACK_TIERS[tier]["keywords"]:
            if any(kw in s for s in stack_lower):
                stack_score = STACK_TIERS[tier]["score"]
                break
        if stack_score:
            break
    scores["tech_stack_relevance"] = stack_score

    # Complexity / depth (max 3)
    complexity_score = 1
    for level in ("high", "mid"):
        for kw in COMPLEXITY_KEYWORDS[level]:
            if kw in combined_text:
                complexity_score = 3 if level == "high" else 2
                break
        if complexity_score > 1:
            break
    scores["complexity"] = complexity_score

    # Real-world impact (max 2)
    impact_score = 0
    impact_high = ["deployed", "live", "production", "users", "real users",
                   "client", "startup", "published", "app store"]
    impact_mid  = ["solves", "problem", "automates", "helps", "manages",
                   "tracks", "monitors", "improves"]
    for kw in impact_high:
        if kw in combined_text:
            impact_score = 2
            break
    if not impact_score:
        for kw in impact_mid:
            if kw in combined_text:
                impact_score = 1
                break
    scores["real_world_impact"] = impact_score

    # Completeness (max 1)
    has_frontend = any(kw in stack_lower for kw in
                       ["react", "html", "vue", "angular", "flutter", "android", "swift"])
    has_backend  = any(kw in stack_lower for kw in
                       ["node", "django", "flask", "fastapi", "spring", "express", "php", "java"])
    has_db       = any(kw in stack_lower for kw in
                       ["mongodb", "mysql", "postgresql", "sqlite", "firebase", "redis", "sql"])
    scores["completeness"] = 1 if (has_frontend and has_backend and has_db) else 0

    # Novelty (max 1)
    is_tutorial = any(kw in combined_text for kw in TUTORIAL_KEYWORDS)
    scores["novelty"] = 0 if is_tutorial else 1

    raw = sum(scores.values())
    if is_tutorial:
        raw = min(raw, 5)

    return {
        "project_title": title,
        "breakdown":     scores,
        "is_tutorial":   is_tutorial,
        "final_score":   round(min(raw, 10), 2),
        "grade":         _grade(min(raw, 10)),
    }


# ──────────────────────────────────────────────
# PROJECT COMPLEXITY SCORE  (0-10)
# ──────────────────────────────────────────────

def project_complexity_score(projects: list[dict]) -> dict:
    """
    Takes all projects and returns a single project_complexity score (0-10).

    Projects should be dicts with: title, overview, tech_stack.
    DB projects use `description` for overview — normalised in the public helper below.
    """
    if not projects:
        return {"project_complexity": 0.0, "grade": _grade(0), "per_project_complexity": {},
                "domains_covered": [], "variety_score": 0}

    scored = [score_project(p["title"], p["overview"], p.get("tech_stack") or []) for p in projects]

    raw_complexities = [r["breakdown"]["complexity"] for r in scored]
    normalized       = [round((c / 3) * 10, 2) for c in raw_complexities]

    best_complexity = max(normalized)
    avg_complexity  = round(sum(normalized) / len(normalized), 2)

    domains = {
        "web":     ["react", "html", "css", "node", "django", "flask"],
        "ml_ai":   ["machine learning", "nlp", "tensorflow", "pytorch", "computer vision"],
        "mobile":  ["flutter", "android", "swift", "kotlin"],
        "devops":  ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd"],
        "data":    ["sql", "mongodb", "postgresql", "data pipeline", "spark", "hadoop"],
        "systems": ["rust", "golang", "c++", "microservices", "real-time"]
    }
    covered_domains = set()
    for p in projects:
        stack_text = " ".join(p.get("tech_stack") or []).lower() + " " + p["overview"].lower()
        for domain, keywords in domains.items():
            if any(kw in stack_text for kw in keywords):
                covered_domains.add(domain)

    variety_score = min(len(covered_domains) * 2, 10)

    complexity = round(
        (best_complexity * 0.5) + (avg_complexity * 0.3) + (variety_score * 0.2), 2
    )
    complexity = min(complexity, 10.0)

    return {
        "per_project_complexity": {scored[i]["project_title"]: normalized[i] for i in range(len(scored))},
        "best_complexity":        best_complexity,
        "avg_complexity":         avg_complexity,
        "domains_covered":        list(covered_domains),
        "variety_score":          variety_score,
        "project_complexity":     complexity,
        "grade":                  _grade(complexity),
    }


# ──────────────────────────────────────────────
# SKILLS DIVERSITY SCORE  (0-10)
# ──────────────────────────────────────────────

def skills_diversity_score(skills: list[str]) -> dict:
    """Takes all skill name strings and returns a single skills_diversity score (0-10)."""
    if not skills:
        return {"skills_diversity": 0.0, "grade": _grade(0), "domains_covered": [],
                "breadth_score": 0, "depth_score": 0, "tier1_skill_count": 0,
                "stack_bonus": 0, "narrow_penalty": 0}

    skills_lower = [s.lower().strip() for s in skills]

    skill_domain_map = {}
    for skill in skills_lower:
        for domain, domain_skills in DOMAIN_SKILL_MAP.items():
            if any(skill in ds or ds in skill for ds in domain_skills):
                skill_domain_map[skill] = domain
                break
        if skill not in skill_domain_map:
            skill_domain_map[skill] = "other"

    covered_domains = set(skill_domain_map.values()) - {"other"}

    breadth_score = min(len(covered_domains) * (10 / 6), 10)

    tier1_list  = SKILL_TIERS["tier1"]["skills"]
    tier1_count = sum(1 for s in skills_lower if any(s in t1 or t1 in s for t1 in tier1_list))
    depth_score = min(tier1_count * 2, 10)

    has_frontend = any(d == "frontend" for d in skill_domain_map.values())
    has_backend  = any(d == "backend"  for d in skill_domain_map.values())
    has_database = any(d == "database" for d in skill_domain_map.values())
    stack_bonus  = 1.0 if (has_frontend and has_backend and has_database) else 0.0
    narrow_penalty = -1.0 if len(covered_domains) <= 1 else 0.0

    diversity = round(
        (breadth_score * 0.4) + (depth_score * 0.4) + (stack_bonus * 0.1) + (narrow_penalty * 0.1), 2
    )
    diversity = round(min(max(diversity, 0), 10), 2)

    return {
        "skill_domain_map":  skill_domain_map,
        "domains_covered":   list(covered_domains),
        "breadth_score":     round(breadth_score, 2),
        "depth_score":       round(depth_score, 2),
        "tier1_skill_count": tier1_count,
        "stack_bonus":       stack_bonus,
        "narrow_penalty":    narrow_penalty,
        "skills_diversity":  diversity,
        "grade":             _grade(diversity),
    }


# ──────────────────────────────────────────────
# COMBINED PLACEMENT SCORE
# ──────────────────────────────────────────────

def placement_feature_score(projects: list[dict], skills: list[str]) -> dict:
    """
    Master function. Returns project_complexity and skills_diversity
    ready to feed into the XGBoost placement model.

    Projects should have keys: title, overview (or description), tech_stack.
    Skills should be a flat list of strings.
    """
    # normalise 'description' → 'overview' for DB-sourced project dicts
    normalised_projects = []
    for p in projects:
        normalised_projects.append({
            "title":      p.get("title") or p.get("name") or "",
            "overview":   p.get("overview") or p.get("description") or "",
            "tech_stack": p.get("tech_stack") or [],
        })

    project_results  = [score_project(p["title"], p["overview"], p["tech_stack"]) for p in normalised_projects]
    complexity_result = project_complexity_score(normalised_projects)
    diversity_result  = skills_diversity_score(skills)

    project_stacks = [p["tech_stack"] for p in normalised_projects]
    # legacy per-skill score (with project cross-validation)
    skill_scores_map: dict[str, int] = {}
    for skill in skills:
        s = skill.lower().strip()
        score = 0
        for tier_data in SKILL_TIERS.values():
            if s in tier_data["skills"]:
                score = tier_data["score"]
                break
            if any(s in listed or listed in s for listed in tier_data["skills"]):
                score = max(score, tier_data["score"] - 1)
        skill_scores_map[skill] = score
    top5 = sorted(skill_scores_map.values(), reverse=True)[:5]
    base = sum(top5) / len(top5) if top5 else 0
    all_skills_lower = [s.lower() for s in skills]
    pipelines = [
        ["python", "sql", "machine learning"],
        ["react", "node", "mongodb"],
        ["java", "spring", "mysql"],
        ["flutter", "firebase"],
        ["aws", "docker", "kubernetes"],
        ["tensorflow", "python", "computer vision"],
    ]
    pipeline_bonus = 0.5 if any(
        all(any(p in s for s in all_skills_lower) for p in pl) for pl in pipelines
    ) else 0.0
    all_project_tech = [t.lower() for stack in project_stacks for t in stack]
    matches = sum(1 for s in all_skills_lower if any(s in p or p in s for p in all_project_tech))
    consistency_bonus = 0.5 if matches >= 3 else 0.0
    skill_final = round(min(base + pipeline_bonus + consistency_bonus, 10), 2)

    final = round(
        (complexity_result["project_complexity"] * 0.5) +
        (diversity_result["skills_diversity"] * 0.5),
        2
    )

    return {
        "projects":                   project_results,
        "project_complexity":         complexity_result["project_complexity"],
        "project_complexity_detail":  complexity_result,
        "skills_diversity":           diversity_result["skills_diversity"],
        "skills_diversity_detail":    diversity_result,
        "skill_score":                skill_final,
        "final_placement_score":      final,
        "grade":                      _grade(final),
    }
