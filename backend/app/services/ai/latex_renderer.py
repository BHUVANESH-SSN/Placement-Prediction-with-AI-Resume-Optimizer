# ──────────────────────────────────────────────────────────
# latex_renderer.py — Jinja2 LaTeX Template Renderer
#
# Renders LaTeX templates with profile data. Handles:
#   - LaTeX special character escaping
#   - Profile field normalization (college->institution, etc.)
#   - Skills normalization: flat list -> 5-category skills_categorized
#   - Missing field defaults
#   - Safe filename generation
#   - Dynamic content fitting (spacing adjustment)
#   - Template theming (color/font injection)
#
# Public API:
#   render_latex(profile, template_name, theme) -> .tex file path
# ──────────────────────────────────────────────────────────

import os
import re
from typing import Dict, Any, Optional, List
from jinja2 import Environment, FileSystemLoader

# Fields that should NOT be LaTeX-escaped (URLs, emails, links)
SAFE_FIELDS = {"email", "github", "linkedin", "website", "link", "url"}

# LaTeX special characters -> escaped equivalents
LATEX_SPECIAL_CHARS = {
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\^{}",
}

# ── Skill Category Buckets ────────────────────────────────
# Used to auto-categorize a flat skills list into the
# 5 display categories shown on the resume.

_LANGUAGES = {
    "python", "java", "javascript", "typescript", "c", "c++", "c#",
    "go", "rust", "ruby", "php", "swift", "kotlin", "scala", "r",
    "matlab", "bash", "shell", "perl", "dart", "elixir", "haskell",
}

_WEB = {
    "html", "css", "react", "reactjs", "react.js", "angular", "vue",
    "vuejs", "next.js", "nextjs", "nuxt", "svelte", "bootstrap",
    "tailwind", "tailwindcss", "jquery", "sass", "scss", "webpack",
    "vite", "redux",
}

_FRAMEWORKS = {
    "flask", "django", "fastapi", "spring", "springboot", "express",
    "expressjs", "node", "node.js", "nodejs", "laravel", "rails",
    "nestjs", "fastify", "tensorflow", "pytorch", "keras", "sklearn",
    "scikit-learn", "numpy", "pandas", "matplotlib", "seaborn",
    "plotly", "scipy", "huggingface", "langchain", "celery",
    "graphql", "rest", "restful", "grpc",
}

_DATABASES = {
    "mysql", "postgresql", "postgres", "sqlite", "mongodb", "mongo",
    "redis", "oracle", "oracle sql", "mssql", "sql server", "dynamodb",
    "cassandra", "elasticsearch", "firebase", "supabase", "neo4j",
    "mariadb", "cockroachdb", "influxdb", "sql",
}

_TOOLS = {
    "git", "github", "gitlab", "bitbucket", "docker", "kubernetes",
    "k8s", "jenkins", "travis", "circleci", "github actions", "terraform",
    "ansible", "aws", "gcp", "azure", "heroku", "vercel", "netlify",
    "linux", "unix", "nginx", "apache", "postman", "swagger", "figma",
    "jira", "confluence", "vs code", "vscode", "intellij", "pycharm",
    "jupyter", "colab", "notion", "slack",
}

# Display labels for the 5 categories
_CATEGORY_ORDER = ["Languages", "Web", "Frameworks", "Databases", "Tools"]

_BUCKET_MAP = {
    "Languages":  _LANGUAGES,
    "Web":        _WEB,
    "Frameworks": _FRAMEWORKS,
    "Databases":  _DATABASES,
    "Tools":      _TOOLS,
}


def _auto_categorize_skills(skills: List[str]) -> Dict[str, List[str]]:
    """
    Distribute a flat skill list into the 5 display categories.

    Skills that don't match any bucket go into the category with the
    most matches (or 'Tools' as a final fallback), so no skill is
    ever silently dropped.
    """
    buckets: Dict[str, List[str]] = {cat: [] for cat in _CATEGORY_ORDER}
    uncategorized: List[str] = []

    for skill in skills:
        skill_lower = skill.strip().lower()
        placed = False
        for cat in _CATEGORY_ORDER:
            if skill_lower in _BUCKET_MAP[cat]:
                buckets[cat].append(skill)
                placed = True
                break
        if not placed:
            uncategorized.append(skill)

    # Put uncategorized skills into Tools (catch-all)
    buckets["Tools"].extend(uncategorized)

    # Remove empty categories
    return {cat: items for cat, items in buckets.items() if items}


def escape_latex(text: str) -> str:
    """Escape LaTeX special characters in text."""
    if not isinstance(text, str):
        return str(text)
    text = text.replace("\\", r"\textbackslash{}")
    for char, escaped in LATEX_SPECIAL_CHARS.items():
        text = text.replace(char, escaped)
    return text


def normalize_profile(profile: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize profile fields.

    Resume data ALWAYS takes priority over profile/dashboard data.
    If resume has education/certifications, dashboard data is completely ignored.
    Also cleans duplicates in education, certifications, projects, experience and skills.
    """

    normalized: Dict[str, Any] = {}

    # -------------------------
    # EDUCATION
    # -------------------------
    # Only use resume education. Ignore profile_education completely if resume has education
    resume_edu = profile.get("education") or []
    
    if resume_edu and len(resume_edu) > 0:
        # Resume has education - use ONLY resume data
        normalized["education"] = clean_education(resume_edu)
    else:
        # Resume has no education - fall back to profile data
        profile_edu = profile.get("profile_education") or []
        normalized["education"] = clean_education(profile_edu)

    # -------------------------
    # CERTIFICATIONS
    # -------------------------
    # Only use resume certifications. Ignore profile_certifications completely if resume has certs
    resume_certs = profile.get("certifications") or []
    
    if resume_certs and len(resume_certs) > 0:
        # Resume has certifications - use ONLY resume data
        normalized["certifications"] = clean_certifications(resume_certs)
    else:
        # Resume has no certifications - fall back to profile data
        profile_certs = profile.get("profile_certifications") or []
        normalized["certifications"] = clean_certifications(profile_certs)

    # -------------------------
    # PROJECTS
    # -------------------------
    projects = profile.get("projects") or []
    normalized["projects"] = clean_projects(projects)

    # -------------------------
    # EXPERIENCE
    # -------------------------
    experience = profile.get("experience") or []
    normalized["experience"] = clean_experience(experience)

    # -------------------------
    # SKILLS
    # -------------------------
    skills = profile.get("skills") or []
    skills = clean_skills(skills)

    normalized["skills"] = skills
    normalized["skills_categorized"] = _auto_categorize_skills(skills)

    # -------------------------
    # COPY REMAINING FIELDS
    # -------------------------
    blocked = {
        "education",
        "profile_education",
        "certifications",
        "profile_certifications",
        "projects",
        "experience",
        "skills",
        "skills_categorized",
    }

    for key, value in profile.items():
        if key not in blocked:
            normalized[key] = value

    return normalized



def sanitize_profile(data: Any, parent_key: str = "") -> Any:
    """Recursively escape all strings for LaTeX. SAFE_FIELDS are left raw."""
    if isinstance(data, dict):
        return {k: sanitize_profile(v, k) for k, v in data.items()}
    if isinstance(data, list):
        return [sanitize_profile(v, parent_key) for v in data]
    if isinstance(data, str):
        return data if parent_key in SAFE_FIELDS else escape_latex(data)
    return data


def fill_missing_fields(profile: Dict[str, Any]) -> Dict[str, Any]:
    """Fill missing fields with defaults so templates don't error."""
    defaults = {
        "id": "unknown",
        "name": "Name Not Provided",
        "email": "",
        "phone": "",
        "linkedin": "",
        "github": "",
        "website": "",
        "professional_summary": "",
        "career_objective": "",
        "objective": "",
        "research_interests": "",
        "skills": [],
        "skills_categorized": {},
        "projects": [],
        "experience": [],
        "education": [],
        "publications": [],
        "certifications": [],
        "achievements": [],
    }
    filled = defaults.copy()
    filled.update(profile)
    return filled


def safe_filename(name: str) -> str:
    """Create OS-safe filename from name."""
    if not name:
        return "Unknown"
    name = re.sub(r"[^A-Za-z0-9 _-]", "", name)
    name = name.strip().replace(" ", "_")
    return name or "Unknown"


def create_jinja_env(templates_dir: str) -> Environment:
    """Create Jinja2 environment configured for LaTeX delimiters."""
    return Environment(
        loader=FileSystemLoader(templates_dir),
        block_start_string="\\BLOCK{",
        block_end_string="}",
        variable_start_string="\\VAR{",
        variable_end_string="}",
        comment_start_string="\\#{",
        comment_end_string="}",
        line_statement_prefix="%%",
        line_comment_prefix="%#",
        trim_blocks=True,
        autoescape=False,
    )


# ── Dynamic Content Fitting ──────────────────────────────

def _count_content_items(profile: Dict[str, Any]) -> Dict[str, int]:
    """Count content items to estimate page density."""
    counts = {
        "experience": 0,
        "projects": 0,
        "total_bullets": 0,
        "sections": 0,
    }

    for exp in profile.get("experience", []):
        counts["experience"] += 1
        desc = exp.get("description", "")
        if isinstance(desc, list):
            counts["total_bullets"] += len(desc)
        elif desc:
            counts["total_bullets"] += 1

    for proj in profile.get("projects", []):
        counts["projects"] += 1
        desc = proj.get("description", "")
        if isinstance(desc, list):
            counts["total_bullets"] += len(desc)
        elif desc:
            counts["total_bullets"] += 1

    for section in ["professional_summary", "education", "skills",
                     "certifications", "achievements", "publications"]:
        val = profile.get(section)
        if val and (not isinstance(val, (list, str)) or len(val) > 0):
            counts["sections"] += 1

    return counts


def _compute_spacing(counts: Dict[str, int]) -> Dict[str, str]:
    """
    Compute LaTeX spacing values based on content density.

    Returns spacing values that can be injected into templates:
      - section_vspace: space after section headings
      - item_vspace: space between list items
      - bullet_vspace: space between bullets
      - header_vspace: space after header block
    """
    total_items = counts["experience"] + counts["projects"]
    total_bullets = counts["total_bullets"]

    if total_bullets > 15 or total_items > 6:
        # Dense: compress
        return {
            "section_vspace": "-8pt",
            "item_vspace": "-2pt",
            "bullet_vspace": "-3pt",
            "header_vspace": "4pt",
            "post_section_vspace": "2pt",
        }
    elif total_bullets < 8 and total_items <= 3:
        # Sparse: expand to fill page
        return {
            "section_vspace": "-4pt",
            "item_vspace": "2pt",
            "bullet_vspace": "0pt",
            "header_vspace": "12pt",
            "post_section_vspace": "8pt",
        }
    else:
        # Normal density
        return {
            "section_vspace": "-6pt",
            "item_vspace": "0pt",
            "bullet_vspace": "-2pt",
            "header_vspace": "8pt",
            "post_section_vspace": "4pt",
        }


# ── Template Theming ─────────────────────────────────────

def _resolve_theme(theme: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
    """
    Resolve theme settings with defaults from config.

    Returns dict with:
      - theme_primary_color: hex color for section headings
      - theme_accent_color: hex color for accents
      - theme_font: main document font
    """
    from app.services.ai.tailoring.config import THEME_COLORS, THEME_FONT

    resolved = {
        "theme_primary_color": THEME_COLORS.get("primary", "2D3748"),
        "theme_accent_color": THEME_COLORS.get("accent", "3182CE"),
        "theme_font": THEME_FONT,
    }

    if theme:
        if "primary" in theme:
            resolved["theme_primary_color"] = theme["primary"]
        if "accent" in theme:
            resolved["theme_accent_color"] = theme["accent"]
        if "font" in theme:
            resolved["theme_font"] = theme["font"]

    return resolved


def render_latex(
    profile: Dict[str, Any],
    template_name: str,
    theme: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Render a LaTeX template with the given profile.

    Supports dynamic content fitting and optional theme customization.
    Returns path to the generated .tex file.
    """
    current_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(current_dir, "templates")
    output_dir = os.path.join(current_dir, "output")
    os.makedirs(output_dir, exist_ok=True)

    template_file = f"{template_name}.tex"
    template_path = os.path.join(templates_dir, template_file)
    if not os.path.exists(template_path):
        raise FileNotFoundError(f"Template not found: {template_file}")

    profile = fill_missing_fields(profile)
    profile = normalize_profile(profile)
    sanitized_profile = sanitize_profile(profile)

    # Compute dynamic spacing based on content density
    counts = _count_content_items(profile)
    spacing = _compute_spacing(counts)

    # Resolve theme settings
    theme_vars = _resolve_theme(theme)

    safe_name = safe_filename(profile.get("name", "Unknown"))
    env = create_jinja_env(templates_dir)
    template = env.get_template(template_file)

    # Merge all context: profile + spacing + theme
    context = {**sanitized_profile, **spacing, **theme_vars}
    rendered_tex = template.render(**context)

    output_path = os.path.join(output_dir, f"{safe_name}_Resume.tex")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(rendered_tex)

    return output_path

def dedupe_dict_list(items: List[Dict[str, Any]], keys: List[str]) -> List[Dict[str, Any]]:
    """
    Remove duplicate dictionaries based on selected keys.
    Uses improved normalization for better deduplication.
    """
    if not items:
        return []

    seen = set()
    result = []

    for item in items:
        if not isinstance(item, dict):
            result.append(item)
            continue

        key_tuple = []

        for key in keys:
            val = item.get(key, "")
            
            # Convert datetime objects to strings
            if hasattr(val, 'strftime'):
                val = val.strftime('%Y-%m-%d')
            elif hasattr(val, 'year'):
                val = str(val.year)
            
            val = str(val).lower().strip()
            
            # Normalize whitespace
            val = re.sub(r"\s+", " ", val)
            
            # Remove timestamps (00:00:00) for cleaner comparison
            val = re.sub(r"\s*\d{2}:\d{2}:\d{2}$", "", val)
            
            key_tuple.append(val)

        key_tuple = tuple(key_tuple)

        if key_tuple not in seen:
            seen.add(key_tuple)
            result.append(item)

    return result

def clean_education(education: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Normalize education fields and remove duplicates.
    """
    if not education:
        return []

    cleaned = []

    for edu in education:
        if not isinstance(edu, dict):
            continue

        edu_copy = edu.copy()

        # Normalize college → institution
        if "college" in edu_copy:
            edu_copy["institution"] = edu_copy.pop("college")

        # Normalize years and remove timestamps
        for year_field in ["start_year", "end_year"]:
            if year_field in edu_copy and edu_copy[year_field]:
                val = edu_copy[year_field]
                if hasattr(val, 'year'):
                    edu_copy[year_field] = str(val.year)
                elif hasattr(val, 'strftime'):
                    edu_copy[year_field] = val.strftime('%Y')
                else:
                    # Convert to string and extract year
                    val_str = str(val)
                    # Remove timestamp if present
                    val_str = re.sub(r"\s*\d{2}:\d{2}:\d{2}$", "", val_str)
                    # Extract just the year (first 4 digits)
                    year_match = re.search(r'\d{4}', val_str)
                    if year_match:
                        edu_copy[year_field] = year_match.group(0)
                    else:
                        edu_copy[year_field] = val_str.strip()

        cleaned.append(edu_copy)

    # Deduplicate - use degree, institution, and start_year as unique key
    return dedupe_dict_list(cleaned, ["degree", "institution", "start_year"])

def clean_certifications(certifications: List[Any]) -> List[Dict[str, Any]]:
    """
    Normalize certification formats and remove duplicates.
    """
    if not certifications:
        return []

    cleaned = []

    for cert in certifications:
        if isinstance(cert, str):
            cleaned.append({
                "title": cert,
                "name": cert
            })
        elif isinstance(cert, dict):
            cert_copy = cert.copy()

            # Normalize date fields - remove timestamps
            for date_field in ["date", "issue_date", "expiry_date"]:
                if date_field in cert_copy and cert_copy[date_field]:
                    val = cert_copy[date_field]
                    if hasattr(val, 'strftime'):
                        cert_copy[date_field] = val.strftime('%Y-%m-%d')
                    else:
                        # Remove timestamps
                        val_str = str(val)
                        val_str = re.sub(r"\s*\d{2}:\d{2}:\d{2}$", "", val_str)
                        cert_copy[date_field] = val_str.strip()

            # Ensure both title and name exist
            if "title" in cert_copy and "name" not in cert_copy:
                cert_copy["name"] = cert_copy["title"]

            if "name" in cert_copy and "title" not in cert_copy:
                cert_copy["title"] = cert_copy["name"]

            cleaned.append(cert_copy)

    # Deduplicate by title/name
    return dedupe_dict_list(cleaned, ["title"])

def clean_projects(projects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicate projects by title.
    """
    if not projects:
        return []
    
    # Use title as primary key, name as fallback
    deduped = []
    seen = set()
    
    for proj in projects:
        if not isinstance(proj, dict):
            continue
            
        # Get identifier (prefer title over name)
        identifier = proj.get("title") or proj.get("name") or ""
        identifier_key = identifier.lower().strip()
        
        if identifier_key and identifier_key not in seen:
            seen.add(identifier_key)
            deduped.append(proj)
    
    return deduped

def clean_experience(experience: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Remove duplicate experience entries.
    """
    if not experience:
        return []
    
    return dedupe_dict_list(experience, ["title", "company", "start_date"])

def clean_skills(skills: List[str]) -> List[str]:
    """
    Remove duplicate skills (case-insensitive).
    """
    if not skills:
        return []

    seen = set()
    result = []

    for skill in skills:
        if not isinstance(skill, str):
            continue
            
        key = skill.lower().strip()

        if key and key not in seen:
            seen.add(key)
            result.append(skill)

    return result