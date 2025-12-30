/**
 * Secure Environment Configuration Management
 * Memisahkan client-side dan server-side environment variables untuk keamanan
 */

// Client-side environment variables (safe to expose)
export const clientEnv = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  supabaseRealtime: {
    url: process.env.NEXT_PUBLIC_SUPABASE_REALTIME_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_REALTIME_ANON_KEY || '',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'GameForSmart',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'development',
  }
} as const

// Server-side environment variables (never exposed to client)
export const serverEnv = {
  supabase: {
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    jwtSecret: process.env.SUPABASE_JWT_SECRET || '',
  },
  ai: {
    groqApiKey: process.env.GROQ_API_KEY || '',
    geminiApiKey: process.env.GEMINI_API_KEY || '',
  },
  security: {
    encryptionKey: process.env.ENCRYPTION_KEY || '',
    sessionSecret: process.env.SESSION_SECRET || '',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || [],
  },
  monitoring: {
    logLevel: process.env.LOG_LEVEL || 'info',
    enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
  }
} as const

// Validation functions
export function validateClientEnv(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!clientEnv.supabase.url) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!clientEnv.supabase.anonKey) {
    errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is required')
  }

  // Validate Supabase URL format
  if (clientEnv.supabase.url && !clientEnv.supabase.url.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
    if (clientEnv.supabase.url !== 'https://placeholder.supabase.co') {
      errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase URL')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateServerEnv(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Only validate in production
  if (process.env.NODE_ENV === 'production') {
    if (!serverEnv.supabase.serviceRoleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required in production')
    }

    if (!serverEnv.security.encryptionKey) {
      errors.push('ENCRYPTION_KEY is required in production')
    }

    if (!serverEnv.security.sessionSecret) {
      errors.push('SESSION_SECRET is required in production')
    }

    // Validate API keys for AI services if they're being used
    const hasAiEndpoints = true // Adjust based on your app
    if (hasAiEndpoints && !serverEnv.ai.groqApiKey && !serverEnv.ai.geminiApiKey) {
      errors.push('At least one AI API key (GROQ_API_KEY or GEMINI_API_KEY) is required')
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

// Runtime environment check
export function checkEnvironment(): void {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    return
  }

  const clientValidation = validateClientEnv()
  const serverValidation = validateServerEnv()

  if (!clientValidation.isValid) {
    console.error('❌ Client environment validation failed:')
    clientValidation.errors.forEach(error => console.error(`  - ${error}`))
  }

  if (!serverValidation.isValid) {
    console.error('❌ Server environment validation failed:')
    serverValidation.errors.forEach(error => console.error(`  - ${error}`))
  }

  if (!clientValidation.isValid || !serverValidation.isValid) {
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Environment validation failed in production. Exiting...')
      process.exit(1)
    } else {
      console.warn('⚠️ Environment validation failed in development mode.')
    }
  } else {
    console.log('✅ Environment configuration validated successfully')
  }
}

// Safe environment exposure for debugging (redacted sensitive values)
export function getSafeEnvInfo() {
  return {
    client: {
      supabase: {
        url: clientEnv.supabase.url ? '***' + clientEnv.supabase.url.slice(-20) : 'NOT_SET',
        anonKey: clientEnv.supabase.anonKey ? '***' + clientEnv.supabase.anonKey.slice(-10) : 'NOT_SET',
      },
      app: clientEnv.app
    },
    server: {
      supabase: {
        serviceRoleKey: serverEnv.supabase.serviceRoleKey ? 'SET' : 'NOT_SET',
        jwtSecret: serverEnv.supabase.jwtSecret ? 'SET' : 'NOT_SET',
      },
      ai: {
        groqApiKey: serverEnv.ai.groqApiKey ? 'SET' : 'NOT_SET',
        geminiApiKey: serverEnv.ai.geminiApiKey ? 'SET' : 'NOT_SET',
      },
      security: {
        encryptionKey: serverEnv.security.encryptionKey ? 'SET' : 'NOT_SET',
        sessionSecret: serverEnv.security.sessionSecret ? 'SET' : 'NOT_SET',
        corsOrigins: serverEnv.security.corsOrigins.length > 0 ? `${serverEnv.security.corsOrigins.length} origins` : 'NOT_SET',
      }
    },
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString()
  }
}

// Initialize environment check
if (typeof window === 'undefined') {
  checkEnvironment()
}


