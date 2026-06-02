import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/axios';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();
const inflightRequests = new Map<string, Promise<any>>();

const DEFAULT_TTL = 60_000; // 1 minute

/**
 * Lightweight client-side API cache with stale-while-revalidate pattern.
 * - Deduplicates concurrent requests to the same endpoint
 * - Returns cached data instantly while revalidating in background
 * - Configurable TTL per hook instance
 */
export function useApiCache<T = any>(
  url: string | null,
  options: {
    ttl?: number;
    enabled?: boolean;
    transform?: (raw: any) => T;
  } = {}
) {
  const { ttl = DEFAULT_TTL, enabled = true, transform } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const transformRef = useRef(transform);
  transformRef.current = transform;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchData = useCallback(async (force = false) => {
    if (!url || !enabled) return;

    const cacheKey = url;
    const cached = cache.get(cacheKey);
    const now = Date.now();

    // Serve from cache if fresh
    if (!force && cached && (now - cached.timestamp) < ttl) {
      if (mountedRef.current) setData(cached.data);
      return cached.data;
    }

    // Serve stale data immediately, then revalidate
    if (cached && !force) {
      if (mountedRef.current) setData(cached.data);
    } else {
      if (mountedRef.current) setLoading(true);
    }

    // Deduplicate inflight requests
    let promise = inflightRequests.get(cacheKey);
    if (!promise) {
      promise = api.get(url).then(res => res.data).finally(() => {
        inflightRequests.delete(cacheKey);
      });
      inflightRequests.set(cacheKey, promise);
    }

    try {
      const raw = await promise;
      const fn = transformRef.current;
      const result = fn ? fn(raw) : raw;
      cache.set(cacheKey, { data: result, timestamp: Date.now() });
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
      return result;
    } catch (err: any) {
      if (mountedRef.current) {
        setError(err.response?.data?.message || err.message || 'Request failed');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [url, enabled, ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * Invalidate cache entries matching a prefix.
 * Call after mutations (create/update/delete) to force refetch.
 */
export function invalidateCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

/**
 * Pre-warm cache for a URL (e.g., on hover or prefetch).
 */
export async function prefetchApi(url: string) {
  if (cache.has(url)) return;
  try {
    const res = await api.get(url);
    cache.set(url, { data: res.data, timestamp: Date.now() });
  } catch { /* silent */ }
}
