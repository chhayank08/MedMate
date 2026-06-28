// ============================================================================
// Centralized Error Logging and Monitoring
// Provides structured error tracking across the application
// ============================================================================

export type ErrorContext = 
  | 'subscription'
  | 'domain'
  | 'settings'
  | 'hydration'
  | 'network'
  | 'validation'
  | 'auth'
  | 'api';

export interface ErrorMetadata {
  userId?: string;
  component?: string;
  action?: string;
  tier?: string;
  [key: string]: any;
}

export function logError(
  context: ErrorContext,
  error: unknown,
  metadata?: ErrorMetadata
) {
  const errorData = {
    context,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    timestamp: new Date().toISOString(),
    metadata,
    userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
    url: typeof window !== 'undefined' ? window.location.href : undefined,
  };

  // Always log to console with structured format
  const prefix = `[${context.toUpperCase()}]`;
  if (process.env.NODE_ENV === 'development') {
    console.error(prefix, errorData);
  } else {
    console.error(prefix, errorData.message, errorData.metadata);
  }

  // TODO: Send to monitoring service (Sentry, LogRocket, etc.)
  // if (typeof window !== 'undefined') {
  //   window.sentry?.captureException(error, { contexts: { custom: errorData } });
  // }
}

export function logWarning(
  context: ErrorContext,
  message: string,
  metadata?: ErrorMetadata
) {
  const warningData = {
    context,
    message,
    timestamp: new Date().toISOString(),
    metadata,
  };

  const prefix = `[${context.toUpperCase()} WARNING]`;
  console.warn(prefix, warningData);
}

export function logInfo(
  context: ErrorContext,
  message: string,
  metadata?: ErrorMetadata
) {
  if (process.env.NODE_ENV === 'development') {
    const prefix = `[${context.toUpperCase()} INFO]`;
    console.log(prefix, message, metadata);
  }
}
