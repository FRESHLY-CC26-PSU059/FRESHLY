import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { rolesApi, type Role, type RoleData } from '../services/roles';

export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const getRoles = useCallback(async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true);
      const response = await rolesApi.getRoles(page, limit, search);
      const { roles: rolesData, pagination: paginationData } = response.data.data;
      setRoles(rolesData);
      setPagination({
        page: paginationData.page,
        limit: paginationData.limit,
        total: paginationData.total,
        totalPages: paginationData.pages
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengambil data roles');
    } finally {
      setLoading(false);
    }
  }, []);

  const createRole = async (data: RoleData) => {
    try {
      setLoading(true);
      await rolesApi.createRole(data);
      toast.success('Role berhasil dibuat');
      await getRoles(1, pagination.limit);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal membuat role');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (roleId: number, data: Partial<RoleData>) => {
    try {
      setLoading(true);
      await rolesApi.updateRole(roleId, data as RoleData);
      toast.success('Role berhasil diperbarui');
      await getRoles(1, pagination.limit);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui role');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const deleteRole = async (roleId: number) => {
    try {
      setLoading(true);
      await rolesApi.deleteRole(roleId);
      toast.success('Role berhasil dihapus');
      await getRoles(1, pagination.limit);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menghapus role');
    } finally {
      setLoading(false);
    }
  };

  return {
    roles,
    loading,
    pagination,
    getRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};
