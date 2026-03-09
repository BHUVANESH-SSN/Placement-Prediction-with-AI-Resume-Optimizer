# API Reference — AIRO

All API endpoints are prefixed with the backend URL (default: `http://localhost:8000`).

## 1. Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/auth/send-otp` | Sends a 6-digit OTP to the user's email. | No |
| POST | `/auth/signup` | Registers a new user with OTP verification. | No |
| POST | `/auth/login` | Log in and receive a JWT access token. | No |

## 2. Profile Management (`/form`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| GET | `/form/get-profile/{email}`| Fetch user profile merged with GitHub/LeetCode data. | Yes |
| PATCH | `/form/update-profile` | Update top-level profile fields (name, phone, etc.). | Yes |
| POST | `/form/education` | Add new education entries. | Yes |
| PATCH | `/form/update-summary` | Update professional summary. | Yes |
| GET | `/form/generate` | Assemble a structured resume-ready object. | Yes |

## 3. Developer Integrations (`/dev`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/dev/github/getcode` | Get verification code for GitHub bio. | Yes |
| POST | `/dev/github/link` | Verify and link GitHub account. | Yes |
| PATCH | `/dev/github/update` | Refresh stored GitHub statistics. | Yes |
| GET | `/dev/github/contributions/{username}` | Get contribution heatmap data. | No |
| POST | `/dev/leetcode/getcode` | Get verification code for LeetCode bio. | Yes |
| POST | `/dev/leetcode/link` | Verify and link LeetCode account. | Yes |
| POST | `/dev/linkedin/add` | Store LinkedIn profile URL. | Yes |

## 4. Resume AI & History (`/api` / `/resume`)

| Method | Endpoint | Description | Auth Required |
| --- | --- | --- | --- |
| POST | `/api/extract` | Paste JD or upload PDF → Tailor + ATS Score. | Yes* |
| GET | `/api/download` | Download generated PDF. | Yes |
| POST | `/resume/version` | Save a new resume version to history. | Yes |
| GET | `/resume/history/{userId}` | Get user's resume version history. | Yes |
| GET | `/resume/version/{vId}` | Fetch a specific version's details. | Yes |

*\*Optional: can pass `resume_json` in the form data if the user doesn't have a DB profile.*
