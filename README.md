# DataMind AI

A full-stack ML/AI platform with backend API, frontend dashboard, ML service, and complete DevOps infrastructure.

## Features

- **Dashboard** - Overview of datasets, experiments, insights, and predictions
- **Datasets** - Upload, profile, and manage CSV/XLSX datasets
- **Analysis** - Statistical analysis, distribution, correlation, outlier detection
- **Machine Learning** - Train and evaluate ML models
- **AI Analyst** - AI-powered insights and explanations
- **Decision Intelligence** - Predictions, scenarios, and recommendations
- **Settings** - User preferences, appearance, AI settings, security

## Tech Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Supabase)
- **AI**: OpenAI/Anthropic integration
- **ML**: Python service for model training

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- AI provider API key (OpenAI/Anthropic)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd datamind-ai
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
# Apply migrations to your Supabase database
```

5. Start development servers:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `AI_API_KEY` | AI provider API key | Yes |
| `AI_PROVIDER` | AI provider (openai/anthropic/mock) | No (default: mock) |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Production |
| `CORS_ORIGIN` | Allowed CORS origin | No (default: http://localhost:5173) |
| `PORT` | Backend port | No (default: 4000) |

## Development

```bash
# Run backend tests
cd backend && npm test

# Run frontend typecheck
cd frontend && npm run typecheck

# Run backend typecheck
cd backend && npm run typecheck
```

## Production Build

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd backend && npm run build
```

## API Documentation

### Authentication
All API endpoints require authentication via Bearer token in the Authorization header.

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/datasets` | List datasets |
| POST | `/api/datasets/upload` | Upload dataset |
| GET | `/api/analysis/dataset/:id/overview` | Dataset overview |
| POST | `/api/analysis` | Create analysis session |
| GET | `/api/ml` | List ML experiments |
| POST | `/api/ml` | Create ML experiment |
| GET | `/api/settings` | Get user settings |
| PATCH | `/api/settings/profile` | Update profile |

## Architecture

```
React Frontend
       ↓
API Layer (Express)
       ↓
Authentication / Authorization
       ↓
Service Layer
       ↓
Data Access Layer (Supabase)
       ↓
PostgreSQL Database
```

## Security

- Row Level Security (RLS) on all user-owned tables
- Authentication via Supabase Auth
- Input validation on all endpoints
- Rate limiting on API routes
- No secrets exposed to frontend

## License

MIT
