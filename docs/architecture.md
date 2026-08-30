# DataMind AI Architecture

## Overview

DataMind AI is a production-ready AI + Machine Learning + Data Science platform. Phase 1 establishes the foundational architecture, development environment, and service boundaries for future feature development.

## 1. Frontend Architecture

### Technology Stack
- React 18 + TypeScript
- Vite
- Tailwind CSS (dark mode)
- React Router DOM

### Structure
```
frontend/
├── src/
│   ├── components/    # Reusable UI components
│   ├── pages/         # Route-level page components
│   ├── lib/           # Utilities (API client, navigation)
│   ├── types/         # TypeScript interfaces
│   ├── hooks/         # Custom React hooks
│   ├── App.tsx        # Route definitions
│   └── main.tsx       # Application entry point
```

### Design System
- Dark, modern interface optimized for data-heavy workflows
- Consistent color tokens via Tailwind CSS variables
- Sidebar navigation + top header layout
- Responsive and accessible

### API Client
- Centralized `apiClient` in `src/lib/api.ts`
- Supports GET, POST, PUT, DELETE
- Normalizes responses and throws typed `ApiError` on failures
- Environment-based base URL via Vite proxy

## 2. Backend Architecture

### Technology Stack
- Node.js + Express
- TypeScript (strict mode)
- Zod for request validation

### Structure
```
backend/
├── src/
│   ├── config/        # Environment configuration
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── routes/         # Route definitions
│   ├── middleware/     # Express middleware
│   ├── types/          # TypeScript interfaces
│   ├── utils/          # Helpers (logger, response builder)
│   └── index.ts        # Application entry point
```

### Key Patterns
- **Modular routing**: Each feature has its own route file
- **Layered architecture**: Routes → Controllers → Services
- **Centralized error handling**: `AppError` class + global error middleware
- **Structured responses**: `successResponse` / `errorResponse` utilities
- **Request validation**: Zod schemas via reusable middleware
- **Logging**: Structured request/error logging

### API Health
- `GET /api/health` returns service status and timestamp
- Used for readiness and monitoring

## 3. Database Architecture

### Technology
- PostgreSQL via Supabase

### Phase 1 Scope
- Minimal foundation only
- Placeholder migration for future tables
- UUID extension enabled

### Planned Entities (Future Phases)
- `users` — authentication and profiles
- `datasets` — uploaded file metadata and storage paths
- `analysis_runs` — configuration and results of data analysis
- `models` — trained ML models and metrics
- `predictions` — model outputs
- `ai_insights` — LLM-generated explanations and recommendations

### Connection Strategy
- Backend uses Supabase client with `SUPABASE_ANON_KEY` for user operations
- Backend uses `SUPABASE_SERVICE_ROLE_KEY` for admin/server-side operations
- Row-Level Security (RLS) will enforce tenant isolation in future phases

## 4. Future Python Service

### Purpose
Dedicated service for data processing and model training. Offloads compute-heavy operations from Node.js.

### Planned Stack
- FastAPI or Flask
- Pandas, NumPy, Scikit-learn

### Communication
- REST API with the backend
- Async job queues (future) for long-running training
- Returns JSON results to the backend

### Integration Points
- `PYTHON_SERVICE_URL` environment variable in backend
- Backend acts as a proxy between frontend and Python service

## 5. Future ML Engine

### Purpose
Train, evaluate, and serve ML models.

### Planned Capabilities
- Supervised learning (classification, regression)
- Feature engineering pipelines
- Model serialization (ONNX, joblib, PMML)
- Version tracking for experiments

### Communication
- Invoked by backend or directly by Python service
- Results stored in database and object storage

## 6. Future AI Engine

### Purpose
Explain model predictions and generate insights using LLMs.

### Planned Integration
- OpenAI, Anthropic, or compatible API
- `AI_API_KEY` environment variable
- Prompt templates for data analysis explanations

### Communication
- Backend receives analysis/model results
- Backend constructs prompts and calls AI API
- Responses stored in `ai_insights` table

## 7. Inter-Service Communication

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│ Frontend │────▶│  Backend  │────▶│  Supabase DB │
│ (React)  │◀────│ (Express) │◀────│ (PostgreSQL) │
└──────────┘     └─────┬─────┘     └──────────────┘
                       │
                       ▼
                 ┌─────────────┐
                 │  ML Service │ (Python - Phase 3)
                 │ (FastAPI)   │
                 └─────────────┘
                       │
                       ▼
                 ┌─────────────┐
                 │  AI Engine  │ (LLM API - Phase 4)
                 └─────────────┘
```

### Data Flow
1. Frontend sends authenticated requests to Backend
2. Backend validates, orchestrates, and persists data via Supabase
3. Backend proxies long-running tasks to Python service
4. Backend enriches results via AI Engine
5. Frontend renders structured data and insights

### Authentication
- JWT tokens issued by Supabase Auth (future)
- Backend verifies tokens on protected routes
- Frontend stores and attaches tokens to requests
