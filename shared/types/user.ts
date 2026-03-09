/**
 * shared/types/user.ts
 * TypeScript types for User and Developer data shared between frontend and backend.
 */

export interface User {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    professional_summary?: string;
    profile_score: number;
    education: EducationEntry[];
    skills: SkillEntry[];
    experience: ExperienceEntry[];
    projects: ProjectEntry[];
    certifications: CertificationEntry[];
    achievements: string[];
    links?: { linkedin?: string; portfolio?: string };
    created_at: string;
    updated_at: string;
    // Merged dev fields (present when fetched from /form/get-profile)
    github?: GitHubProfile;
    leetcode?: LeetCodeProfile;
    linkedin?: string;
}

export interface EducationEntry {
    institution: string;
    degree: string;
    field?: string;
    start_year: number;
    end_year?: number;
    gpa?: number;
}

export interface SkillEntry {
    name: string;
    level?: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface ExperienceEntry {
    company: string;
    role: string;
    start_date: string;
    end_date?: string;
    description?: string;
    bullets?: string[];
}

export interface ProjectEntry {
    name: string;
    description?: string;
    tech_stack?: string[];
    url?: string;
    repo_url?: string;
}

export interface CertificationEntry {
    name: string;
    issuer?: string;
    date?: string;
    url?: string;
}

export interface GitHubProfile {
    username: string;
    name?: string;
    bio?: string;
    public_repos?: number;
    followers?: number;
    following?: number;
    avatar_url?: string;
}

export interface LeetCodeProfile {
    username: string;
    about?: string;
    solved_total?: number;
    solved_easy?: number;
    solved_medium?: number;
    solved_hard?: number;
    rating?: number;
}
