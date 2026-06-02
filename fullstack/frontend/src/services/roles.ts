import api from '../api/axios';

export interface Role {
  id: number;
  role_name: string;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetRolesResponse {
  status: string;
  data: {
    roles: Role[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface RoleResponse {
  status: string;
  data: { role: Role };
}

export interface RoleData {
  role_name: string;
  enabled: boolean;
}

export const rolesApi = {
  // Get all roles with pagination and search
  getRoles: (page = 1, limit = 10, search = '') =>
    api.get<GetRolesResponse>('/roles', { params: { page, limit, search } }),

  getRole: (roleId: number) =>
    api.get<RoleResponse>(`/roles/${roleId}`),

  createRole: (data: RoleData) =>
    api.post<RoleResponse>('/roles', data),

  updateRole: (roleId: number, data: Partial<RoleData>) =>
    api.patch<RoleResponse>(`/roles/${roleId}`, data),

  deleteRole: (roleId: number) =>
    api.delete(`/roles/${roleId}`),
};
