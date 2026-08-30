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

export const successResponse = <T>(data: T, path: string): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    path,
  },
});

export const errorResponse = (
  code: string,
  message: string,
  details?: unknown,
  path?: string
): ApiResponse => ({
  success: false,
  error: { code, message, details },
  meta: {
    timestamp: new Date().toISOString(),
    path: path || '',
  },
});
