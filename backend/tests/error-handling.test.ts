import { describe, it, expect } from 'vitest';
import { AppError } from '../src/middleware/errorHandler.js';
import { errorResponse } from '../src/utils/response.js';

describe('Error handling', () => {
  it('should create a structured error response', () => {
    const response = errorResponse('TEST_ERROR', 'Something went wrong', { id: 1 });
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('TEST_ERROR');
    expect(response.error?.message).toBe('Something went wrong');
    expect(response.meta?.timestamp).toBeDefined();
  });

  it('should create AppError with correct properties', () => {
    const error = new AppError(404, 'NOT_FOUND', 'Resource not found', { resource: 'user' });
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Resource not found');
    expect(error.details).toEqual({ resource: 'user' });
  });
});
