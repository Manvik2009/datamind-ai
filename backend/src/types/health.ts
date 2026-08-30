export interface HealthServiceResponse {
  status: 'ok' | 'degraded' | 'down';
  service: string;
  timestamp: string;
}
