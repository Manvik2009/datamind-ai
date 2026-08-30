# DataMind AI - Production Deployment Checklist

## Pre-Deployment

### Environment Configuration
- [ ] Set `NODE_ENV=production`
- [ ] Configure `SUPABASE_URL` with production Supabase instance
- [ ] Configure `SUPABASE_SERVICE_ROLE_KEY` with production key
- [ ] Configure `SUPABASE_JWT_SECRET` with production JWT secret
- [ ] Configure `CORS_ORIGIN` with production frontend URL
- [ ] Configure `AI_API_KEY` with production AI provider key
- [ ] Configure `PORT` (default: 4000)
- [ ] Set `LOG_LEVEL=warn` or `error` for production

### Database
- [ ] Run all database migrations in order
- [ ] Verify RLS policies are enabled on all tables
- [ ] Verify `user_settings` table exists and has correct schema
- [ ] Verify `users` table trigger creates default settings
- [ ] Test database connection from production environment
- [ ] Configure database backups

### Security
- [ ] Review and update Helmet CSP headers for production
- [ ] Enable `crossOriginEmbedderPolicy` in production
- [ ] Configure CORS to only allow production origins
- [ ] Set secure cookie flags
- [ ] Review rate limiting thresholds
- [ ] Enable request logging
- [ ] Configure error tracking (Sentry, etc.)

### SSL/TLS
- [ ] Configure SSL certificate
- [ ] Enable HTTPS redirect
- [ ] Configure HSTS headers
- [ ] Disable HTTP in production

## Deployment Steps

### Backend
1. Build the application:
   ```bash
   cd backend
   npm run build
   ```

2. Run database migrations:
   ```bash
   npm run migrate
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Verify health endpoint:
   ```bash
   curl https://api.datamind.ai/api/health
   ```

### Frontend
1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Deploy static files to CDN/web server

3. Configure web server to proxy `/api` to backend

### Docker Deployment
1. Build images:
   ```bash
   docker-compose -f docker-compose.yml build
   ```

2. Start services:
   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. Verify all containers are running:
   ```bash
   docker-compose ps
   ```

## Post-Deployment Verification

### Health Checks
- [ ] GET /api/health returns 200 with healthy status
- [ ] All database connections successful
- [ ] External service connections verified (AI Provider, Supabase)

### Authentication
- [ ] User registration works
- [ ] User login works
- [ ] JWT token validation works
- [ ] Token refresh works

### Core Features
- [ ] Dashboard loads with correct data
- [ ] Dataset upload works
- [ ] Analysis sessions can be created
- [ ] ML experiments can be created
- [ ] AI analysis works
- [ ] Settings can be loaded and updated

### Security
- [ ] Rate limiting is active
- [ ] CORS only allows configured origins
- [ ] Helmet headers are present
- [ ] No sensitive data in logs
- [ ] Error responses don't leak stack traces

### Performance
- [ ] Response times < 500ms for most endpoints
- [ ] Database queries are optimized
- [ ] Indexes are being used
- [ ] No N+1 query issues

## Monitoring

### Logging
- [ ] Structured JSON logging enabled
- [ ] Log level appropriate for production
- [ ] Error logs monitored
- [ ] Access logs retained

### Metrics
- [ ] Request rate monitoring
- [ ] Error rate monitoring
- [ ] Response time monitoring
- [ ] Database connection pool monitoring

### Alerts
- [ ] 5xx error rate alerts
- [ ] High latency alerts
- [ ] Database connection failures
- [ ] Rate limit exceeded alerts

## Rollback Plan

1. Keep previous deployment artifacts
2. Maintain database backup before migrations
3. Document rollback steps:
   - Stop new version
   - Start previous version
   - Rollback database migrations if needed
4. Test rollback procedure

## Disaster Recovery

- [ ] Database backups configured (daily minimum)
- [ ] Backup restoration tested
- [ ] Failover procedures documented
- [ ] Contact information for critical services
- [ ] Incident response plan

## Maintenance Windows

- [ ] Schedule regular maintenance windows
- [ ] Communicate downtime to users
- [ ] Test deployments in staging first
- [ ] Have rollback plan ready

## Compliance

- [ ] GDPR compliance verified
- [ ] Data retention policies implemented
- [ ] User data export works
- [ ] Account deletion works
- [ ] Privacy policy updated
- [ ] Terms of service updated

## Contact Information

| Role | Name | Contact |
|------|------|---------|
| On-Call Engineer | - | - |
| Database Admin | - | - |
| Security Team | - | - |
| Product Manager | - | - |

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0
