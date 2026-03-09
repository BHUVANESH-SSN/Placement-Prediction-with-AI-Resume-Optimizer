# AI Resume Optimizer (AIRO)

AIRO is a platform that uses AI to tailor your resume to a Job Description, provides ATS scoring, and tracks your developer profile stats from GitHub and LeetCode.

## Project Structure

- `frontend/`: Next.js 16 web application.
- `backend/`: FastAPI Python service with AI tailoring and LaTeX rendering.
- `shared/`: Shared TypeScript types and constants.
- `docs/`: Detailed documentation for architecture and API.

## Getting Started

### Local Development (Direct)

1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   # Set up .env
   uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   # Set up .env.local
   npm run dev
   ```

### Local Development (Docker)

```bash
docker-compose up --build
```

## Documentation

See the [docs/](docs/) directory for:
- [Architecture Overview](docs/architecture.md)
- [API Reference](docs/api.md)