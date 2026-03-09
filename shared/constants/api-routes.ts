/**
 * shared/constants/api-routes.ts
 * Centralized API route constants to avoid hardcoding paths in the frontend.
 */

export const API_ROUTES = {
    AUTH: {
        LOGIN: "/auth/login",
        SIGNUP: "/auth/signup",
        SEND_OTP: "/auth/send-otp",
    },
    PROFILE: {
        GET: (email: string) => `/form/get-profile/${email}`,
        UPDATE: "/form/update-profile",
        EDUCATION: (email: string) => `/form/education/${email}`,
        UPDATE_SUMMARY: "/form/update-summary",
        GENERATE: "/form/generate",
    },
    DEV: {
        GITHUB_CODE: "/dev/github/getcode",
        GITHUB_LINK: "/dev/github/link",
        GITHUB_UPDATE: "/dev/github/update",
        GITHUB_HEATMAP: (username: string) => `/dev/github/contributions/${username}`,
        LEETCODE_CODE: "/dev/leetcode/getcode",
        LEETCODE_LINK: "/dev/leetcode/link",
        LEETCODE_UPDATE: "/dev/leetcode/update",
        LINKEDIN_ADD: "/dev/linkedin/add",
    },
    RESUME: {
        EXTRACT: "/api/extract",
        DOWNLOAD: (path: string) => `/api/download?path=${encodeURIComponent(path)}`,
        STORE_VERSION: "/resume/version",
        HISTORY: (userId: string) => `/resume/history/${userId}`,
        VERSION: (versionId: string) => `/resume/version/${versionId}`,
    },
};
