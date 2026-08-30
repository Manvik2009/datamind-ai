# DataMind AI - API Documentation

## Base URL

```
Production: https://api.datamind.ai
Development: http://localhost:4000
```

All API endpoints are prefixed with `/api`.

---

## Authentication

All endpoints except health checks require a Bearer token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

### Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
 "details": {} // optional additional details
  }
}
```

---

## Health Endpoints

### GET /api/health

Returns service health status. No authentication required.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-01-15T10:30:00Z",
    "version": "1.0.0"
  }
}
```

---

## Dashboard Endpoints

### GET /api/dashboard/overview

Returns aggregated dashboard overview data. Uses `optionalAuth` - returns empty data for unauthenticated users.

**Response:**
```json
{
  "success": true,
  "data": {
    "datasets": { "total": 10, "recent": [] },
    "analyses": { "total": 25, "recent": [] },
    "experiments": { "total": 5, "recent": [] },
    "jobs": { "running": 2, "completed": 15, "failed": 1 }
  }
}
```

### GET /api/dashboard/activity

Returns recent activity items.

**Query Parameters:**
- `limit` (optional, default: 20) - Number of items to return

### GET /api/dashboard/jobs

Returns job summaries.

**Query Parameters:**
- `status` (optional) - Filter by status: `running`, `completed`, `failed`

---

## Analysis Endpoints

### GET /api/analysis

Returns all analysis sessions for the authenticated user.

### POST /api/analysis

Creates a new analysis session.

**Body:**
```json
{
  "name": "My Analysis",
  "dataset_id": "uuid",
  "description": "Optional description"
}
```

### GET /api/analysis/:id

Returns a specific analysis session.

### PATCH /api/analysis/:id

Updates an analysis session.

### DELETE /api/analysis/:id

Deletes an analysis session.

### POST /api/analysis/:id/duplicate

Duplicates an analysis session.

### GET /api/analysis/dataset/:datasetId/overview

Returns dataset overview with column information.

### GET /api/analysis/dataset/:datasetId/columns/:columnName

Returns detailed column exploration data.

### GET /api/analysis/dataset/:datasetId/statistics?column=:column

Returns descriptive statistics for a column.

### GET /api/analysis/dataset/:datasetId/distribution?column=:column&bins=:bins

Returns distribution analysis for a column.

### GET /api/analysis/dataset/:datasetId/correlation?column_a=:a&column_b=:b&method=:method

Returns correlation between two columns.

### GET /api/analysis/dataset/:datasetId/correlation-matrix?method=:method

Returns correlation matrix for all numeric columns.

### GET /api/analysis/dataset/:datasetId/outliers?column=:column&method=:method

Returns outlier analysis for a column.

### GET /api/analysis/dataset/:datasetId/missing-data

Returns missing data analysis.

### POST /api/analysis/dataset/:datasetId/group-by

Performs group-by aggregation.

**Body:**
```json
{
  "group_by": "column_name",
  "measure": "column_name",
  "aggregation": "sum|avg|count|min|max"
}
```

### POST /api/analysis/dataset/:datasetId/time-series

Performs time series analysis.

**Body:**
```json
{
  "date_column": "date_col",
  "value_column": "value_col",
  "frequency": "daily|weekly|monthly",
  "aggregation": "sum|avg|count"
}
```

### POST /api/analysis/dataset/:datasetId/chart

Generates chart data.

**Body:**
```json
{
  "chart_type": "bar|line|scatter|pie|histogram",
  "x_column": "column_name",
  "y_column": "column_name",
  "title": "Chart Title"
}
```

### POST /api/analysis/dataset/:datasetId/statistical-test

Performs statistical tests.

**Body:**
```json
{
  "test_type": "t-test|chi-square|anova|mann-whitney",
  "column_a": "column_name",
  "column_b": "column_name"
}
```

### GET /api/analysis/:id/export?format=:format

Exports analysis in specified format (json, csv, pdf).

---

## Settings Endpoints

All settings endpoints require authentication.

### GET /api/settings

Returns all user settings. Creates default settings if none exist.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "theme": "system",
    "reduced_motion": false,
    "compact_density": false,
    "timezone": "UTC",
    "language": "en",
    "ai_response_style": "balanced",
    "ai_detail_level": "standard",
    "ai_explain_results": true,
    "ai_show_limitations": true,
    "ai_ask_before_expensive": true,
    "notification_preferences": { ... },
    "analytics_opt_out": false,
    "activity_visibility": "private",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

### PATCH /api/settings/profile

Updates profile settings.

**Body:**
```json
{
  "timezone": "America/New_York",
  "language": "en"
}
```

### PATCH /api/settings/appearance

Updates appearance settings.

**Body:**
```json
{
  "theme": "dark",
  "reduced_motion": true,
  "compact_density": false
}
```

### PATCH /api/settings/ai-preferences

Updates AI preferences.

**Body:**
```json
{
  "ai_response_style": "detailed",
  "ai_detail_level": "advanced",
  "ai_explain_results": true,
  "ai_show_limitations": true,
  "ai_ask_before_expensive": true,
  "ai_model_name": "gpt-4"
}
```

### PATCH /api/settings/notifications

Updates notification preferences.

**Body:**
```json
{
  "analysis_completed": { "in_app": true, "email": true },
  "model_training_completed": { "in_app": true, "email": false }
}
```

### PATCH /api/settings/privacy

Updates privacy settings.

**Body:**
```json
{
  "analytics_opt_out": false,
  "activity_visibility": "team"
}
```

### GET /api/settings/data/summary

Returns data usage summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "datasets": 10,
    "analyses": 25,
    "experiments": 5,
    "ai_analyses": 8,
    "reports": 3,
    "predictions": 12
  }
}
```

### GET /api/settings/integrations

Returns integration connection statuses.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "provider": "AI Provider",
      "connected": true,
      "status": "connected",
      "last_checked": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### GET /api/settings/security

Returns security information.

**Response:**
```json
{
  "success": true,
  "data": {
    "last_login": "2024-01-15T10:30:00Z",
    "active_sessions": 1,
    "two_factor_enabled": false
  }
}
```

### POST /api/settings/data/export

Exports all user data.

### POST /api/settings/account/delete

Deletes user account. Requires confirmation.

**Body:**
```json
{
  "confirmation": "DELETE"
}
```

---

## Datasets Endpoints

### GET /api/datasets

Returns all datasets for the authenticated user.

### POST /api/datasets

Creates a new dataset.

### GET /api/datasets/:id

Returns a specific dataset.

### PATCH /api/datasets/:id

Updates a dataset.

### DELETE /api/datasets/:id

Deletes a dataset.

---

## ML Endpoints

### GET /api/ml/experiments

Returns all ML experiments.

### POST /api/ml/experiments

Creates a new experiment.

### GET /api/ml/experiments/:id

Returns a specific experiment.

### GET /api/ml/models

Returns all ML models.

### POST /api/ml/models

Creates a new model.

### POST /api/ml/predictions

Creates a prediction.

---

## AI Endpoints

### POST /api/ai/analyze

Performs AI analysis on data.

### POST /api/ai/insights

Generates AI insights.

### GET /api/ai/queries

Returns AI query history.

---

## Decisions Endpoints

### GET /api/decisions

Returns all decision records.

### POST /api/decisions

Creates a new decision analysis.

### GET /api/decisions/:id

Returns a specific decision.

### POST /api/decisions/:id/scenarios

Creates decision scenarios.

### POST /api/decisions/:id/recommendations

Generates recommendations.

---

## Rate Limiting

API endpoints are rate limited. Current limits:

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| General | 100 requests | 15 minutes |
| Auth | 5 requests | 15 minutes |
| AI | 20 requests | 15 minutes |
| Analysis | 30 requests | 15 minutes |
| Export | 5 requests | 1 hour |
| Upload | 10 requests | 15 minutes |

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

---

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Missing or invalid authentication token |
| `FORBIDDEN` | Insufficient permissions |
| `NOT_FOUND` | Resource not found |
| `VALIDATION_ERROR` | Request validation failed |
| `RATE_LIMITED` | Rate limit exceeded |
| `INTERNAL_ERROR` | Internal server error |
| `HTTP_ERROR` | General HTTP error |

---

## Pagination

List endpoints support pagination via query parameters:

- `page` (default: 1) - Page number
- `limit` (default: 20) - Items per page

**Response format:**
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```
