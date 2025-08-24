import { NextRequest, NextResponse } from 'next/server';

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  isOperational?: boolean;
  context?: Record<string, any>;
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  isOperational = true;

  constructor(message: string, public context?: Record<string, any>) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error implements AppError {
  code = 'AUTHENTICATION_ERROR';
  statusCode = 401;
  isOperational = true;

  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements AppError {
  code = 'AUTHORIZATION_ERROR';
  statusCode = 403;
  isOperational = true;

  constructor(message: string = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements AppError {
  code = 'NOT_FOUND';
  statusCode = 404;
  isOperational = true;

  constructor(resource: string = 'Resource') {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error implements AppError {
  code = 'RATE_LIMIT_EXCEEDED';
  statusCode = 429;
  isOperational = true;

  constructor(message: string = 'Rate limit exceeded') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error implements AppError {
  code = 'DATABASE_ERROR';
  statusCode = 500;
  isOperational = false;

  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error implements AppError {
  code = 'EXTERNAL_SERVICE_ERROR';
  statusCode = 502;
  isOperational = false;

  constructor(service: string, public originalError?: Error) {
    super(`Error communicating with ${service}`);
    this.name = 'ExternalServiceError';
  }
}

// Error handler for API routes
export function handleApiError(error: unknown): NextResponse {
  let appError: AppError;

  if (error instanceof Error && 'code' in error) {
    appError = error as AppError;
  } else if (error instanceof Error) {
    appError = new DatabaseError(error.message, error);
  } else {
    appError = new DatabaseError('An unexpected error occurred');
  }

  // Log error (in production, send to monitoring service)
  console.error('API Error:', {
    code: appError.code,
    message: appError.message,
    stack: appError.stack,
    context: appError.context,
    timestamp: new Date().toISOString()
  });

  const statusCode = appError.statusCode || 500;
  const response: any = {
    error: appError.code,
    message: appError.message,
    timestamp: new Date().toISOString()
  };

  // Include additional context in development
  if (process.env.NODE_ENV === 'development' && appError.context) {
    response.context = appError.context;
  }

  return NextResponse.json(response, { status: statusCode });
}

// Error handler for client-side errors
export function handleClientError(error: unknown, context?: string): void {
  let errorMessage = 'An unexpected error occurred';
  let errorDetails: any = {};

  if (error instanceof Error) {
    errorMessage = error.message;
    errorDetails = {
      name: error.name,
      stack: error.stack,
      context
    };
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorDetails = { error, context };
  }

  // Log error (in production, send to monitoring service)
  console.error('Client Error:', {
    message: errorMessage,
    ...errorDetails,
    timestamp: new Date().toISOString()
  });

  // In production, you might want to send this to an error reporting service
  // Example: Sentry.captureException(error, { extra: { context } });
}

// Error boundary error handler
export function handleBoundaryError(error: Error, errorInfo: React.ErrorInfo): void {
  console.error('Error Boundary Error:', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString()
  });

  // In production, send to error reporting service
  // Example: Sentry.captureException(error, { extra: { errorInfo } });
}

// Utility function to check if error is operational
export function isOperationalError(error: AppError): boolean {
  return error.isOperational === true;
}

// Utility function to create user-friendly error messages
export function createUserFriendlyMessage(error: AppError): string {
  switch (error.code) {
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    case 'AUTHENTICATION_ERROR':
      return 'Please log in to continue.';
    case 'AUTHORIZATION_ERROR':
      return 'You don\'t have permission to perform this action.';
    case 'NOT_FOUND':
      return 'The requested resource was not found.';
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please try again later.';
    case 'DATABASE_ERROR':
      return 'We\'re experiencing technical difficulties. Please try again.';
    case 'EXTERNAL_SERVICE_ERROR':
      return 'We\'re having trouble connecting to external services. Please try again.';
    default:
      return 'Something went wrong. Please try again.';
  }
}
