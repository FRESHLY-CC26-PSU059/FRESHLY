import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { auditLogsApi, type AuditLog } from '../services/audit-logs';

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const getLogs = useCallback(async (page = 1, limit = 20, search = '', entity = '', action = '') => {
    try {
      setLoading(true);
      const response = await auditLogsApi.getLogs(page, limit, search, entity, action);
      const { logs: logsData, pagination: paginationData } = response.data.data;
      setLogs(logsData);
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        totalPages: paginationData.pages
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengambil data audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    loading,
    pagination,
    getLogs,
  };
};
