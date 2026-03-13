def merge_resumes(db_res: dict, file_res: dict) -> dict:
    """Merge uploaded resume data with dashboard data, giving DB (dashboard) priority."""
    import copy
    merged = {}
    
    # 1. Scalar fields (DB > File)
    for field in ["id", "name", "phone", "email", "github", "linkedin", "professional_summary"]:
        db_val = db_res.get(field, "")
        if isinstance(db_val, str) and db_val.strip():
            merged[field] = db_val
        else:
            merged[field] = file_res.get(field, "")

    # 2. Lists (Merge unique, prioritizing DB logic if needed, but here we just union them to not lose data, keeping DB items first)
    
    # Skills (List of strings)
    db_skills = [s.lower() for s in db_res.get("skills", []) if isinstance(s, str)]
    merged_skills = list(db_res.get("skills", []))
    for s in file_res.get("skills", []):
        if isinstance(s, str) and s.lower() not in db_skills:
            merged_skills.append(s)
            db_skills.append(s.lower())
    merged["skills"] = merged_skills
    
    # Education
    db_edu_titles = [f"{e.get(\"degree\", \"\")} {e.get(\"institution\", \"\")}".lower() for e in db_res.get("education", [])]
    merged_edu = list(db_res.get("education", []))
    for e in file_res.get("education", []):
        title = f"{e.get(\"degree\", \"\")} {e.get(\"institution\", \"\")}".lower()
        if title not in db_edu_titles:
            merged_edu.append(e)
            db_edu_titles.append(title)
    merged["education"] = merged_edu

    # Experience
    db_exp_titles = [f"{e.get(\"role\", \"\")} {e.get(\"company\", \"\")}".lower() for e in db_res.get("experience", [])]
    merged_exp = list(db_res.get("experience", []))
    for e in file_res.get("experience", []):
        title = f"{e.get(\"role\", \"\")} {e.get(\"company\", \"\")}".lower()
        if title not in db_exp_titles:
            merged_exp.append(e)
            db_exp_titles.append(title)
    merged["experience"] = merged_exp

    # Projects
    db_proj_titles = [p.get("title", "").lower() for p in db_res.get("projects", [])]
    merged_proj = list(db_res.get("projects", []))
    for p in file_res.get("projects", []):
        title = p.get("title", "").lower()
        if title not in db_proj_titles:
            merged_proj.append(p)
            db_proj_titles.append(title)
    merged["projects"] = merged_proj

    # Certifications
    db_cert_titles = [c.get("title", "").lower() for c in db_res.get("certifications", [])]
    merged_cert = list(db_res.get("certifications", []))
    for c in file_res.get("certifications", []):
        title = c.get("title", "").lower()
        if title not in db_cert_titles:
            merged_cert.append(c)
            db_cert_titles.append(title)
    merged["certifications"] = merged_cert

    # Achievements
    db_ach_titles = [a.get("title", "").lower() for a in db_res.get("achievements", [])]
    merged_ach = list(db_res.get("achievements", []))
    for a in file_res.get("achievements", []):
        title = a.get("title", "").lower()
        if title not in db_ach_titles:
            merged_ach.append(a)
            db_ach_titles.append(title)
    merged["achievements"] = merged_ach

    merged["skills_categorized"] = db_res.get("skills_categorized", {})
    return merged

