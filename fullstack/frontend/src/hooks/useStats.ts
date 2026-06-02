import { useCallback } from 'react';
import { useApiCache, invalidateCache } from './useApiCache';
import type { OverviewStats } from '../services/stats';

export const useStats = () => {
  const { data, loading, refetch } = useApiCache<OverviewStats | null>(
    '/stats/overview',
    {
      ttl: 120_000, // 2 minutes — stats don't change often
      transform: (raw) => raw?.data?.stats ?? null,
    }
  );

  const getOverview = useCallback(() => {
    invalidateCache('/stats');
    return refetch();
  }, [refetch]);

  return { stats: data, loading, getOverview };
};
