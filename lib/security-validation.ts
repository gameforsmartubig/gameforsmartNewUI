/**
 * Security Validation System untuk melindungi dari injection attacks dan malicious input
 */

import { NextRequest } from 'next/server'

export interface ValidationRule {
  field: string
  type: 'string' | 'number' | 'email' | 'uuid' | 'array' | 'object' | 'boolean'
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  allowedValues?: string[]
  sanitize?: boolean
}

export class SecurityValidator {
  private rules: ValidationRule[]
  
  constructor(rules: ValidationRule[]) {
    this.rules = rules
  }

  validate(data: any): { isValid: boolean; errors: string[]; sanitizedData?: any } {
    const errors: string[] = []
    const sanitizedData: any = {}

    for (const rule of this.rules) {
      const value = data[rule.field]
      
      // Check required fields
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${rule.field}' is required`)
        continue
      }
      
      // Skip validation for optional empty fields
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue
      }

      // Type validation
      const typeValidation = this.validateType(value, rule)
      if (!typeValidation.isValid) {
        errors.push(`Field '${rule.field}': ${typeValidation.error}`)
        continue
      }

      // Length validation for strings
      if (rule.type === 'string' && typeof value === 'string') {
        if (rule.minLength && value.length < rule.minLength) {
          errors.push(`Field '${rule.field}' must be at least ${rule.minLength} characters`)
          continue
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          errors.push(`Field '${rule.field}' must be no more than ${rule.maxLength} characters`)
          continue
        }
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`Field '${rule.field}' has invalid format`)
        continue
      }

      // Allowed values validation
      if (rule.allowedValues && !rule.allowedValues.includes(value)) {
        errors.push(`Field '${rule.field}' must be one of: ${rule.allowedValues.join(', ')}`)
        continue
      }

      // Sanitize if requested
      let sanitizedValue = value
      if (rule.sanitize && typeof value === 'string') {
        sanitizedValue = this.sanitizeString(value)
      }

      sanitizedData[rule.field] = sanitizedValue
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedData: errors.length === 0 ? sanitizedData : undefined
    }
  }

  private validateType(value: any, rule: ValidationRule): { isValid: boolean; error?: string } {
    switch (rule.type) {
      case 'string':
        if (typeof value !== 'string') {
          return { isValid: false, error: 'must be a string' }
        }
        break
      
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { isValid: false, error: 'must be a valid number' }
        }
        break
      
      case 'email':
        if (typeof value !== 'string' || !this.isValidEmail(value)) {
          return { isValid: false, error: 'must be a valid email address' }
        }
        break
      
      case 'uuid':
        if (typeof value !== 'string' || !this.isValidUUID(value)) {
          return { isValid: false, error: 'must be a valid UUID' }
        }
        break
      
      case 'array':
        if (!Array.isArray(value)) {
          return { isValid: false, error: 'must be an array' }
        }
        break
      
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null) {
          return { isValid: false, error: 'must be an object' }
        }
        break
      
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: 'must be a boolean' }
        }
        break
    }
    
    return { isValid: true }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  private isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    return uuidRegex.test(uuid)
  }

  private sanitizeString(input: string): string {
    return input
      .trim()
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script tags content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove on* event handlers
      .replace(/\s*on\w+\s*=\s*['""][^'""]*['""]?/gi, '')
      // Remove SQL injection patterns
      .replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi, '')
      // Limit length to prevent DoS
      .slice(0, 10000)
  }
}

// Predefined validation schemas
export const validationSchemas = {
  quiz: new SecurityValidator([
    { field: 'title', type: 'string', required: true, minLength: 1, maxLength: 100, sanitize: true },
    { field: 'description', type: 'string', maxLength: 500, sanitize: true },
    { field: 'category', type: 'string', maxLength: 50, sanitize: true },
    { field: 'language', type: 'string', allowedValues: ['id', 'en'], required: true },
    { field: 'is_public', type: 'boolean' },
    { field: 'questions', type: 'array', required: true }
  ]),

  user: new SecurityValidator([
    { field: 'username', type: 'string', required: true, minLength: 3, maxLength: 30, sanitize: true },
    { field: 'email', type: 'email', required: true },
    { field: 'fullname', type: 'string', required: true, minLength: 1, maxLength: 100, sanitize: true },
    { field: 'phone', type: 'string', maxLength: 20, sanitize: true },
    { field: 'country_id', type: 'number' }
  ]),

  group: new SecurityValidator([
    { field: 'name', type: 'string', required: true, minLength: 1, maxLength: 50, sanitize: true },
    { field: 'description', type: 'string', maxLength: 200, sanitize: true },
    { field: 'is_public', type: 'boolean' }
  ]),

  report: new SecurityValidator([
    { field: 'reportedContentType', type: 'string', required: true, allowedValues: ['user', 'quiz', 'game_session', 'message'] },
    { field: 'reportType', type: 'string', required: true, allowedValues: [
      'bug_teknis', 'gambar_tidak_muncul', 'konten_tidak_pantas', 'soal_tidak_jelas', 'lainnya',
      'harassment', 'inappropriate_content', 'cheating', 'spam', 'hate_speech', 'impersonation', 'copyright', 'other'
    ] },
    { field: 'title', type: 'string', required: true, minLength: 1, maxLength: 100, sanitize: true },
    { field: 'description', type: 'string', required: true, minLength: 10, maxLength: 1000, sanitize: true },
    { field: 'reportedUserId', type: 'string', required: false, maxLength: 100 },
    { field: 'reportedContentId', type: 'string', required: false, maxLength: 100 },
    { field: 'evidenceUrl', type: 'string', required: false, maxLength: 500, sanitize: true }
  ]),

  gameSession: new SecurityValidator([
    { field: 'quiz_id', type: 'uuid', required: true },
    { field: 'game_pin', type: 'string', pattern: /^\d{6}$/ },
    { field: 'total_time_minutes', type: 'number' },
    { field: 'allow_join_after_start', type: 'boolean' }
  ])
}

// Security middleware untuk request validation
export function validateRequest(schema: SecurityValidator) {
  return async (request: NextRequest, handler: () => Promise<Response>): Promise<Response> => {
    try {
      const body = await request.json()
      const validation = schema.validate(body)
      
      if (!validation.isValid) {
        return new Response(
          JSON.stringify({
            error: 'Validation failed',
            details: validation.errors
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        )
      }
      
      // Replace request body with sanitized data
      const sanitizedRequest = new Request(request.url, {
        method: request.method,
        headers: request.headers,
        body: JSON.stringify(validation.sanitizedData)
      })
      
      return await handler()
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: 'Invalid JSON payload'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
    }
  }
}

// Check for suspicious patterns in requests
export function detectSuspiciousActivity(request: NextRequest): { isSuspicious: boolean; reasons: string[] } {
  const reasons: string[] = []
  const userAgent = request.headers.get('user-agent') || ''
  const referer = request.headers.get('referer') || ''
  
  // Check for common attack patterns in User-Agent
  const suspiciousUserAgents = [
    /sqlmap/i,
    /nikto/i,
    /nmap/i,
    /burp/i,
    /owasp/i,
    /dirbuster/i,
    /masscan/i
  ]
  
  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    reasons.push('Suspicious user agent detected')
  }
  
  // Check for missing User-Agent (common in automated attacks)
  if (!userAgent) {
    reasons.push('Missing user agent')
  }
  
  // Check for suspicious referer patterns
  if (referer && !referer.includes(request.headers.get('host') || '')) {
    reasons.push('Suspicious referer header')
  }
  
  // Check request rate (basic detection)
  const url = new URL(request.url)
  const hasExcessiveParams = url.searchParams.toString().length > 2048
  if (hasExcessiveParams) {
    reasons.push('Excessive URL parameters')
  }
  
  return {
    isSuspicious: reasons.length > 0,
    reasons
  }
}

