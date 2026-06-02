import api from '../api/axios';

export interface OverviewStats {
  totalUsers: number;
  totalScans: number;
  totalArticles: number;
  totalConversations: number;
  totalKnowledges: number;
}

export interface OverviewResponse {
  status: string;
  data: {
    stats: OverviewStats;
  };
}

export interface PlatformStats {
  totalScans: number;
  accuracy: number;
  uniqueVarieties: number;
  avgProcessingTime: string;
}

export interface PlatformStatsResponse {
  status: string;
  data: PlatformStats;
}

export interface ScansByFruit {
  object_name: string;
  count: number;
}

export interface ScansByRipeness {
  ripeness_level: string;
  count: number;
}

export interface DailyScan {
  date: string;
  count: number;
}

export interface AnalyticsData {
  scansByFruit: ScansByFruit[];
  scansByRipeness: ScansByRipeness[];
  dailyScans: DailyScan[];
}

export interface AnalyticsResponse {
  status: string;
  data: AnalyticsData;
}

export const statsApi = {
  getOverview: () => api.get<OverviewResponse>('/stats/overview'),
  getPlatformStats: () => api.get<PlatformStatsResponse>('/stats'),
  getAnalytics: () => api.get<AnalyticsResponse>('/stats/analytics'),
};
