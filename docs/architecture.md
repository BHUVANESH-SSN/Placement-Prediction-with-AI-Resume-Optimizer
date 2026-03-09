# Architecture Overview — AIRO

AIRO (AI Resume Optimizer) is built with a modern full-stack architecture designed for scalability, separation of concerns, and ease of maintenance.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), Tailwind CSS, Shadcn UI, Lucide Icons.
- **Backend**: FastAPI (Python), Motor (Async MongoDB Driver), Pydantic (Validation).
- **Database**: MongoDB (Atlas).
- **AI/ML**: Groq (LLM), custom tailoring pipeline, LaTeX for PDF rendering.
- **DevOps**: Docker, Render.com (Deployment).

## Project Structure

```
ai-resume-optimizer/
├── frontend/             # Next.js 16 Web App
├── backend/              # FastAPI Python Service
│   ├── app/
│   │   ├── main.py       # Entry point
│   │   ├── routes/       # HTTP Routers (Controllers)
│   │   ├── services/     # Business Logic (Orchestration)
│   │   ├── repositories/ # DB Access (Persistence)
│   │   └── models/       # Pydantic Schemas
│   └── tests/            # Python Tests
├── shared/               # TypeScript Types & Constants
└── docs/                 # Documentation
```

## Backend Design Pattern: Controller → Service → Repository

We use a layered architecture to keep code decoupled:

1.  **Routes (Controllers)**: Handle HTTP requests, validate input using Pydantic, and delegate to Services. They never touch the Database directly.
2.  **Services**: Contain the core business logic. They orchestrate work between multiple repositories or external APIs (AI, GitHub, etc.).
3.  **Repositories**: Consist of pure MongoDB queries. They are the only layer that interacts with `motor.motor_asyncio`.
4.  **Models**: Define the data structure for both DB documents and API request/response bodies.

## AI Pipeline Isolation

The resume generation pipeline is isolated in `backend/app/services/ai/`. It consists of:
- **JD Parser**: Extracts role and description from text/files.
- **Tailor Engine**: Uses LLMs (Groq) to rewrite resume sections based on JD.
- **ATS Scorer**: Calculates keyword matching scores.
- **LaTeX Renderer**: Converts JSON resume data into professional LaTeX code.
- **PDF Generator**: Compiles LaTeX into a high-quality PDF.

## Shared Layer (`shared/`)

The `shared/` directory contains TypeScript types that should be used by the frontend to ensure type safety when communicating with the backend. It also includes `api-routes.ts` to centralize all endpoint paths.
