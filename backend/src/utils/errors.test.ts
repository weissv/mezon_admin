// backend/src/utils/errors.test.ts
// Unit тесты для системы ошибок

import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
} from './errors';
import { HTTP_STATUS } from '../constants';

describe('AppError', () => {
  describe('Конструктор', () => {
    it('создаёт ошибку с дефолтными значениями', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
      expect(error.code).toBe('INTERNAL_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('создаёт ошибку с кастомными параметрами', () => {
      const error = new AppError('Custom error', 400, 'CUSTOM_CODE', { field: 'test' });

      expect(error.message).toBe('Custom error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.details).toEqual({ field: 'test' });
    });

    it('наследуется от Error', () => {
      const error = new AppError('Test');

      expect(error instanceof Error).toBe(true);
      expect(error instanceof AppError).toBe(true);
    });
  });

  describe('toJSON', () => {
    it('возвращает JSON представление без details', () => {
      const error = new AppError('Test error', 400, 'TEST_CODE');

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'TEST_CODE',
          message: 'Test error',
        },
      });
    });

    it('возвращает JSON представление с details', () => {
      const error = new AppError('Test error', 400, 'TEST_CODE', { field: 'email' });

      const json = error.toJSON();

      expect(json).toEqual({
        error: {
          code: 'TEST_CODE',
          message: 'Test error',
          details: { field: 'email' },
        },
      });
    });
  });
});

describe('ValidationError', () => {
  it('создаёт ошибку с правильным статусом и кодом', () => {
    const error = new ValidationError('Invalid data');

    expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.message).toBe('Invalid data');
  });

  it('использует дефолтное сообщение', () => {
    const error = new ValidationError();

    expect(error.message).toBeTruthy();
    expect(error.statusCode).toBe(HTTP_STATUS.BAD_REQUEST);
  });

  it('сохраняет details', () => {
    const details = { field: 'email', error: 'must be valid email' };
    const error = new ValidationError('Validation failed', details);

    expect(error.details).toEqual(details);
  });
});

describe('AuthenticationError', () => {
  it('создаёт ошибку с правильным статусом', () => {
    const error = new AuthenticationError();

    expect(error.statusCode).toBe(HTTP_STATUS.UNAUTHORIZED);
    expect(error.code).toBe('AUTHENTICATION_ERROR');
  });

  it('принимает кастомное сообщение', () => {
    const error = new AuthenticationError('Invalid token');

    expect(error.message).toBe('Invalid token');
  });
});

describe('AuthorizationError', () => {
  it('создаёт ошибку с правильным статусом', () => {
    const error = new AuthorizationError();

    expect(error.statusCode).toBe(HTTP_STATUS.FORBIDDEN);
    expect(error.code).toBe('AUTHORIZATION_ERROR');
  });

  it('принимает кастомное сообщение', () => {
    const error = new AuthorizationError('Insufficient permissions');

    expect(error.message).toBe('Insufficient permissions');
  });
});

describe('NotFoundError', () => {
  it('создаёт ошибку с правильным статусом', () => {
    const error = new NotFoundError('User');

    expect(error.statusCode).toBe(HTTP_STATUS.NOT_FOUND);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toContain('User');
    expect(error.message).toContain('не найден');
  });

  it('использует дефолтный ресурс', () => {
    const error = new NotFoundError();

    expect(error.message).toContain('Ресурс');
  });
});

describe('ConflictError', () => {
  it('создаёт ошибку с правильным статусом', () => {
    const error = new ConflictError('User already exists');

    expect(error.statusCode).toBe(HTTP_STATUS.CONFLICT);
    expect(error.code).toBe('CONFLICT');
    expect(error.message).toBe('User already exists');
  });
});

describe('DatabaseError', () => {
  it('создаёт ошибку с правильным статусом', () => {
    const error = new DatabaseError('Connection failed');

    expect(error.statusCode).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
    expect(error.code).toBe('DATABASE_ERROR');
    expect(error.message).toBe('Connection failed');
  });

  it('сохраняет детали ошибки БД', () => {
    const dbDetails = { constraint: 'unique_email' };
    const error = new DatabaseError('Constraint violation', dbDetails);

    expect(error.details).toEqual(dbDetails);
  });
});
