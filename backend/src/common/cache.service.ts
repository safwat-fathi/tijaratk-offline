import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';

/**
 * Cache key patterns for different data types.
 */
export const CACHE_KEYS = {
  STORE_PUBLIC: (slug: string) => `store:public:${slug}`,
  STORE_THEME: (slug: string) => `store:theme:${slug}`,
  STORE_SEO: (slug: string) => `store:seo:${slug}`,
  STORE_CATEGORY: (slug: string) => `store:category:${slug}`,
  STORE_PRODUCTS: (
    slug: string,
    page: number,
    limit: number,
    keyword?: string,
  ) => `store:products:${slug}:${page}:${limit}:${keyword || ''}`,
  STORE_PRODUCT: (storeSlug: string, productSlug: string) =>
    `store:product:${storeSlug}:${productSlug}`,
  STORE_STATS: (storeId: number) => `store:stats:${storeId}`,
} as const;

/**
 * TTL values in milliseconds for different cache types.
 */
export const CACHE_TTL = {
  LONG: 60 * 60 * 1000, // 1 hour (for theme)
  STORE_PUBLIC: 5 * 60 * 1000, // 5 minutes
  STORE_THEME: 60 * 60 * 1000, // 1 hour (explicit named reference)
  STORE_SEO: 10 * 60 * 1000, // 10 minutes
  STORE_CATEGORY: 10 * 60 * 1000, // 10 minutes
  STORE_PRODUCTS: 2 * 60 * 1000, // 2 minutes
  STORE_PRODUCT: 5 * 60 * 1000, // 5 minutes
  STORE_STATS: 1 * 60 * 1000, // 1 minute (shorter for real-time stats)
} as const;

/**
 * Centralized cache service wrapper for managing in-memory caching.
 * Provides typed methods for getting, setting, and invalidating cache entries.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get a value from the cache.
   */
  async get<T>(key: string): Promise<T | undefined> {
    const value = await this.cacheManager.get<T>(key);
    if (value !== undefined) {
      this.logger.debug(`Cache HIT: ${key}`);
    } else {
      this.logger.debug(`Cache MISS: ${key}`);
    }
    return value;
  }

  /**
   * Set a value in the cache with TTL.
   */
  async set<T>(key: string, value: T, ttl: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
    this.logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Delete a specific key from the cache.
   */
  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
    this.logger.debug(`Cache DEL: ${key}`);
  }

  /**
   * Invalidate all caches related to a store by slug.
   * This includes public store data, theme, and all product-related caches.
   */
  async invalidateStore(slug: string): Promise<void> {
    const keysToDelete = [
      CACHE_KEYS.STORE_PUBLIC(slug),
      CACHE_KEYS.STORE_THEME(slug),
    ];

    // Delete known keys
    await Promise.all(keysToDelete.map((key) => this.del(key)));

    // Note: Product list caches with pagination can't be easily cleared without
    // a scan operation. For simplicity, we rely on short TTLs for product lists.
    this.logger.debug(`Invalidated store caches for: ${slug}`);
  }

  /**
   * Invalidate a specific product cache.
   */
  async invalidateProduct(
    storeSlug: string,
    productSlug: string,
  ): Promise<void> {
    await this.del(CACHE_KEYS.STORE_PRODUCT(storeSlug, productSlug));
    this.logger.debug(`Invalidated product cache: ${storeSlug}/${productSlug}`);
  }

  /**
   * Get or set pattern - returns cached value or fetches and caches it.
   */
  async getOrSet<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T>,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetcher();
    await this.set(key, value, ttl);
    return value;
  }
}
