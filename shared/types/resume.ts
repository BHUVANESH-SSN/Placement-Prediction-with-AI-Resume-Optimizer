/**
 * shared/types/resume.ts
 * TypeScript types for Resume generation and ATS scoring.
 */

import { User } from "./user";

export interface ResumeProfile extends User {
    // Any additional fields specific to the resume generation view
}

export interface ATSResult {
    with_jd: number;
    without_jd: number;
}

export interface GapAnalysis {
    missing_skills: string[];
    recommendations: string[];
    matching_score: number;
}

export interface GenerateResumeResponse {
    status: "success";
    tailored_resume: Partial<User>;
    gap_analysis: GapAnalysis;
    ats_score: ATSResult;
    pdf_path: string;
}

export interface ResumeVersion {
    id: string;
    user_id: string;
    version: number;
    resume_url: string;
    original_resume_url?: string;
    jd_qdrant_id?: string;
    match_score?: number;
    created_at: string;
}
