# DataMind AI — Deployment Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- Docker and Docker Compose (for containerized deployment)
- Supabase account and project
- AI provider API key (OpenAI, Anthropic, etc.)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Application
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://your-domain.com
CORS_ORIGIN=https://your-domain.com

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider
AI_PROVIDER=openai
AI_API_KEY=your-ai-api-key
AI_MODEL=gpt-4
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.7
AI_TIMEOUT=30000

# Python ML Service
PYTHON_SERVICE_URL=http://localhost:5001

# Security
JWT_SECRET=your-jwt-secret-min-32-characters-long

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info

# Uploads
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=200
```

## Database Setup

1. Create a Supabase project at https://supabase.com
2. Run the migrations in order:

```bash
# Connect to your Supabase database and run:
psql -h your-db-host -U postgres -d postgres -f database/migrations/001_initial_schema.sql
psql -h your-db-host -U postgres -d postgres -f database/migrations/002_datasets_and_analysis.sql
psql -h your-db-host -U postgres -d postgres -f database/migrations/003_ml_schema.sql
psql -h your-db-host -U postgres -d postgres -f database/migrations/004_ai_schema.sql
psql -h your-db-host -U postgres -d postgres -f database/migrations/005_decision_intelligence.sql
psql -h your-db-host -U postgres -d postgres -f database/migrations/006_job_queue.sql
psql -h your-db-host -U postgres -d postgres -f database/migrations/007_users_and_rls.sql
```

## Docker Deployment

### Production

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Development

```bash
# Build and start development services
docker-compose -f docker-compose.dev.yml up -d --build

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
docker-compose -f docker-compose.dev.yml down
```

## Manual Deployment

### Backend

```bash
cd backend
npm ci --production
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm ci
npm run build
# Serve the dist/ folder with nginx or any static file server
```

### ML Service

```bash
cd ml-service
pip install -r requirements.txt
uvicorn api.main:app --host 0.0.0.0 --port 5001 --workers 4
```

## Health Checks

- `GET /api/health` — Full health check with dependency status
- `GET /api/health/live` — Liveness probe (always returns 200 if running)
- `GET /api/health/ready` — Readiness probe (checks database and services)

## Rollback Procedure

1. Stop the current deployment
2. Revert to the previous Docker image tag
3. Restart services
4. Verify health checks pass

```bash
# Rollback to previous version
docker-compose down
docker pull datamind-backend:previous-tag
docker-compose up -d
```

## Monitoring

- Check application logs: `docker-compose logs -f backend`
- Monitor health endpoints: `curl https://your-domain.com/api/health`
- Set up alerts for 5xx errors and high latency

## Backup Strategy

1. **Database**: Supabase provides automatic daily backups
2. **Uploads**: Back up the uploads directory regularly
3. **ML Models**: Back up the models directory

## Security Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies verified
- [ ] Authentication configured
- [ ] HTTPS enabled
- [ ] Rate limiting enabled
- [ ] CORS configured
- [ ] Security headers enabled
- [ ] Secrets not exposed in logs
- [ ] File upload limits configured
