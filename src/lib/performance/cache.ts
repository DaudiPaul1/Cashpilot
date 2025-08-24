interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private defaultMaxSize = 100;

  constructor(private options: CacheOptions = {}) {
    this.options.ttl = options.ttl || this.defaultTTL;
    this.options.maxSize = options.maxSize || this.defaultMaxSize;
  }

  // Set a value in cache
  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.options.ttl!
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.options.maxSize!) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
  }

  // Get a value from cache
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Check if key exists and is not expired
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  // Delete a specific key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private calculateHitRate(): number {
    // This is a simplified hit rate calculation
    // In a real implementation, you'd track hits and misses
    return this.cache.size / this.options.maxSize!;
  }
}

// Create different cache instances for different purposes
export const apiCache = new CacheManager({ ttl: 2 * 60 * 1000, maxSize: 50 }); // 2 minutes for API calls
export const uiCache = new CacheManager({ ttl: 10 * 60 * 1000, maxSize: 20 }); // 10 minutes for UI data
export const sessionCache = new CacheManager({ ttl: 30 * 60 * 1000, maxSize: 10 }); // 30 minutes for session data

// Utility function to create cache key
export function createCacheKey(...parts: string[]): string {
  return parts.join(':');
}

// Utility function to cache API responses
export async function cachedApiCall<T>(
  cache: CacheManager,
  key: string,
  apiCall: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }

  // If not in cache, make API call
  const data = await apiCall();
  
  // Cache the result
  cache.set(key, data, ttl);
  
  return data;
}

// Utility function to invalidate cache by pattern
export function invalidateCacheByPattern(cache: CacheManager, pattern: string): void {
  const keys = Array.from(cache['cache'].keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}
