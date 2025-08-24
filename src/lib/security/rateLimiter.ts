import { NextRequest } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
}

interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Timestamp when the limit resets
  retryAfter?: number; // Seconds to wait before retrying
}

class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests per window default
      keyGenerator: (req) => req.ip || 'unknown',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config
    };
  }

  /**
   * Check if a request is within rate limits
   */
  check(req: NextRequest): { allowed: boolean; info: RateLimitInfo } {
    const key = this.config.keyGenerator!(req);
    const now = Date.now();
    
    // Get or create rate limit entry
    let entry = this.store.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new rate limit window
      entry = {
        count: 0,
        resetTime: now + this.config.windowMs
      };
      this.store.set(key, entry);
    }
    
    // Increment request count
    entry.count++;
    
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const allowed = entry.count <= this.config.maxRequests;
    
    const info: RateLimitInfo = {
      limit: this.config.maxRequests,
      remaining,
      reset: entry.resetTime,
      retryAfter: allowed ? undefined : Math.ceil((entry.resetTime - now) / 1000)
    };
    
    // Clean up old entries periodically
    this.cleanup();
    
    return { allowed, info };
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Get current rate limit info for a key
   */
  getInfo(key: string): RateLimitInfo | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    
    return {
      limit: this.config.maxRequests,
      remaining,
      reset: entry.resetTime,
      retryAfter: entry.count >= this.config.maxRequests ? 
        Math.ceil((entry.resetTime - now) / 1000) : undefined
    };
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters
export const apiRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // 100 requests per 15 minutes
  keyGenerator: (req) => {
    // Use user ID if authenticated, otherwise use IP
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      // Extract user ID from token (simplified)
      return `user:${authHeader.split(' ')[1]?.slice(0, 10) || 'unknown'}`;
    }
    return `ip:${req.ip || req.headers.get('x-forwarded-for') || 'unknown'}`;
  }
});

export const authRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 login attempts per 15 minutes
  keyGenerator: (req) => `auth:${req.ip || req.headers.get('x-forwarded-for') || 'unknown'}`
});

export const uploadRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 10, // 10 uploads per hour
  keyGenerator: (req) => {
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      return `upload:${authHeader.split(' ')[1]?.slice(0, 10) || 'unknown'}`;
    }
    return `upload:${req.ip || req.headers.get('x-forwarded-for') || 'unknown'}`;
  }
});

// Rate limiting middleware function
export function withRateLimit(
  rateLimiter: RateLimiter,
  handler: (req: NextRequest, info: RateLimitInfo) => Promise<Response>
) {
  return async (req: NextRequest): Promise<Response> => {
    const { allowed, info } = rateLimiter.check(req);
    
    if (!allowed) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter: info.retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': info.limit.toString(),
            'X-RateLimit-Remaining': info.remaining.toString(),
            'X-RateLimit-Reset': info.reset.toString(),
            'Retry-After': info.retryAfter?.toString() || '0'
          }
        }
      );
    }
    
    // Add rate limit headers to response
    const response = await handler(req, info);
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', info.limit.toString());
    response.headers.set('X-RateLimit-Remaining', info.remaining.toString());
    response.headers.set('X-RateLimit-Reset', info.reset.toString());
    
    return response;
  };
}

// Utility function to create rate-limited API routes
export function createRateLimitedAPI(
  rateLimiter: RateLimiter,
  handler: (req: NextRequest) => Promise<Response>
) {
  return withRateLimit(rateLimiter, async (req, info) => {
    return await handler(req);
  });
}
