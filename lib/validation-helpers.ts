/**
 * Validation Helpers
 * Utility functions untuk validasi data dan mencegah runtime errors
 */

/**
 * Validate XID format (20 characters, base32 encoded)
 */
export function isValidXID(id: string | undefined | null): boolean {
  if (!id) return false
  return /^[0-9a-v]{20}$/.test(id)
}

/**
 * Validate UUID format
 */
export function isValidUUID(id: string | undefined | null): boolean {
  if (!id) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
}

/**
 * Safe array access with default value
 */
export function safeArrayAccess<T>(
  array: T[] | undefined | null, 
  index: number, 
  defaultValue: T
): T {
  if (!array || !Array.isArray(array)) return defaultValue
  if (index < 0 || index >= array.length) return defaultValue
  return array[index] ?? defaultValue
}

/**
 * Safe object property access
 */
export function safeGet<T, K extends keyof T>(
  obj: T | undefined | null,
  key: K,
  defaultValue: T[K]
): T[K] {
  if (!obj) return defaultValue
  return obj[key] ?? defaultValue
}

/**
 * Check if value is not null/undefined
 */
export function isDefined<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null
}

/**
 * Check if string is not empty
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

/**
 * Check if array has items
 */
export function hasItems<T>(array: T[] | undefined | null): array is T[] {
  return Array.isArray(array) && array.length > 0
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(
  json: string | undefined | null, 
  fallback: T
): T {
  if (!json) return fallback
  
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Validate email format
 */
export function isValidEmail(email: string | undefined | null): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false
  
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Clamp number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Safe number conversion
 */
export function toNumber(
  value: unknown, 
  fallback: number = 0
): number {
  if (typeof value === 'number') return isNaN(value) ? fallback : value
  if (typeof value === 'string') {
    const num = parseFloat(value)
    return isNaN(num) ? fallback : num
  }
  return fallback
}

/**
 * Type guard for checking if error is Error instance
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error
}

/**
 * Type guard for Supabase error
 */
export function isSupabaseError(error: unknown): error is { 
  code: string
  message: string
  details?: string
  hint?: string
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  )
}

/**
 * Validate params object has required ID
 */
export function validateParamsId(
  params: { id?: string } | undefined | null
): params is { id: string } {
  return isDefined(params) && isNonEmptyString(params.id)
}

/**
 * Assert value is defined (throws if not)
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message: string = 'Value is required'
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message)
  }
}

/**
 * Retry async operation with exponential backoff
 */
export async function retryAsync<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, i)))
      }
    }
  }
  
  throw lastError || new Error('Retry failed')
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null
  
  return function(...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), waitMs)
  }
}
