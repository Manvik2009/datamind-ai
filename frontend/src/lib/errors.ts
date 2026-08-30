export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isApiError = (error: unknown): error is ApiError => {
  return error instanceof ApiError;
};
