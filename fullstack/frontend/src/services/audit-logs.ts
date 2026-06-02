import api from '../api/axios';

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id: number;
  details: string;
  ip_address: string;
  createdAt: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

export interface GetAuditLogsResponse {
  status: string;
  data: {
    logs: AuditLog[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export const auditLogsApi = {
  getLogs: (page = 1, limit = 20, search = '', entity = '', action = '') =>
    api.get<GetAuditLogsResponse>('/audit-logs', { 
      params: { page, limit, search, entity, action } 
    }),
};
