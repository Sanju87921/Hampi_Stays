import { cache } from 'hono/cache';

// Cache configuration for generic discovery routes (15 minutes)
export const discoveryCache = cache({
  cacheName: 'hampi-discovery',
  cacheControl: 'max-age=900, stale-while-revalidate=3600',
});

// Cache configuration for featured resorts (24 hours)
export const featuredCache = cache({
  cacheName: 'hampi-featured',
  cacheControl: 'max-age=86400, stale-while-revalidate=86400',
});

// Cache configuration for static dictionaries like categories (7 days)
export const staticCache = cache({
  cacheName: 'hampi-static',
  cacheControl: 'max-age=604800, stale-while-revalidate=604800',
});
