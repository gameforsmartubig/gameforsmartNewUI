/**
 * Error Logger Utility
 * Provides centralized error logging with context and metadata
 */

type ErrorContext = {
  userId?: string
  page?: string
  action?: string
  metadata?: Record<string, any>
}

type ErrorInfo = {
  timestamp: string
  message: string
  stack?: string
  context?: ErrorContext
  userAgent?: string
  url?: string
}

export class ErrorLogger {
  /**
   * Log an error with optional context
   */
  static log(error: unknown, context?: ErrorContext): ErrorInfo {
    const errorInfo: ErrorInfo = {
      timestamp: new Date().toISOString(),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      context,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    }
    
    // Log ke console dengan format yang jelas
    console.error('🔴 ERROR LOGGED:', {
      ...errorInfo,
      // Truncate stack untuk readability di console
      stack: errorInfo.stack?.split('\n').slice(0, 3).join('\n')
    })
    
    // TODO: Kirim ke error tracking service (Sentry, LogRocket, dll)
    // if (process.env.NODE_ENV === 'production') {
    //   this.sendToErrorTracking(errorInfo)
    // }
    
    return errorInfo
  }
  
  /**
   * Log Supabase-specific errors with additional context
   */
  static logSupabaseError(error: any, operation: string, context?: ErrorContext): ErrorInfo {
    return this.log(error, {
      ...context,
      action: 'supabase_operation',
      metadata: {
        operation,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        ...context?.metadata
      }
    })
  }
  
  /**
   * Log API errors
   */
  static logApiError(error: any, endpoint: string, context?: ErrorContext): ErrorInfo {
    return this.log(error, {
      ...context,
      action: 'api_call',
      metadata: {
        endpoint,
        status: error?.status,
        statusText: error?.statusText,
        ...context?.metadata
      }
    })
  }
  
  /**
   * Log validation errors
   */
  static logValidationError(message: string, data: any, context?: ErrorContext): ErrorInfo {
    return this.log(new Error(message), {
      ...context,
      action: 'validation_error',
      metadata: {
        invalidData: data,
        ...context?.metadata
      }
    })
  }
  
  /**
   * Log component render errors
   */
  static logRenderError(error: Error, componentName: string, props?: any): ErrorInfo {
    return this.log(error, {
      action: 'component_render',
      page: componentName,
      metadata: {
        props: props ? JSON.stringify(props).slice(0, 200) : undefined
      }
    })
  }
  
  /**
   * Create a safe error message for users (without exposing sensitive info)
   */
  static getUserMessage(error: unknown): string {
    if (error instanceof Error) {
      // Filter out sensitive information
      const message = error.message.toLowerCase()
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your connection and try again.'
      }
      
      if (message.includes('permission') || message.includes('unauthorized')) {
        return 'You don\'t have permission to perform this action.'
      }
      
      if (message.includes('not found')) {
        return 'The requested resource was not found.'
      }
      
      if (message.includes('timeout')) {
        return 'Request timed out. Please try again.'
      }
      
      // Return sanitized message
      return error.message.length > 100 
        ? 'An error occurred. Please try again or contact support.'
        : error.message
    }
    
    return 'An unexpected error occurred. Please try again.'
  }
  
  /**
   * Future: Send to error tracking service
   */
  private static sendToErrorTracking(errorInfo: ErrorInfo): void {
    // Implement Sentry, LogRocket, or other error tracking
    // Example:
    // Sentry.captureException(new Error(errorInfo.message), {
    //   contexts: {
    //     error: errorInfo
    //   }
    // })
  }
}

/**
 * Hook untuk error logging dengan React context
 */
export function useErrorLogger() {
  return {
    logError: (error: unknown, context?: ErrorContext) => 
      ErrorLogger.log(error, context),
    logSupabaseError: (error: any, operation: string, context?: ErrorContext) => 
      ErrorLogger.logSupabaseError(error, operation, context),
    logApiError: (error: any, endpoint: string, context?: ErrorContext) => 
      ErrorLogger.logApiError(error, endpoint, context),
    getUserMessage: (error: unknown) => 
      ErrorLogger.getUserMessage(error)
  }
}

