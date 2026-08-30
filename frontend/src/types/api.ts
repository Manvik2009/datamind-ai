export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    path: string;
  };
}

export interface HealthResponse {
  status: 'ok';
  service: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'INTERNAL_SERVER_ERROR'
  | 'NETWORK_ERROR'
  | 'HTTP_ERROR';
