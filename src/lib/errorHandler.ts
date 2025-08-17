// Centralized error handling for production SaaS

export interface AppError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
}

class ErrorHandler {
  private errors: AppError[] = [];
  private maxErrors = 100;

  log(error: Partial<AppError>): void {
    const appError: AppError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      severity: error.severity || 'medium',
      context: error.context || {},
      timestamp: new Date().toISOString(),
      userId: error.userId
    };

    this.errors.unshift(appError);
    if (this.errors.length > this.maxErrors) {
      this.errors.pop();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${appError.severity.toUpperCase()}] ${appError.code}:`, appError.message, appError.context);
    }

    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production' && appError.severity === 'critical') {
      this.reportToService(appError);
    }
  }

  private reportToService(error: AppError): void {
    // Implement reporting to error monitoring service
    // e.g., Sentry, LogRocket, etc.
  }

  getErrors(): AppError[] {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  handleAsyncError(promise: Promise<any>): Promise<any> {
    return promise.catch((error) => {
      this.log({
        code: 'ASYNC_ERROR',
        message: error.message,
        severity: 'medium',
        context: { stack: error.stack }
      });
      throw error;
    });
  }
}

export const errorHandler = new ErrorHandler();

// Error Boundary component - will be defined in React component file