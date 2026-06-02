import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { User, CreateUserData, UpdateUserData } from '../services/users';
import { usersApi } from '../services/users';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const getUsers = useCallback(async (page = 1, limit = 10, search = '') => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getUsers(page, limit, search);
      const { users: usersData, pagination: paginationData } = response.data.data;
      setUsers(usersData);
      setPagination({ 
        page: paginationData.page, 
        limit: paginationData.limit, 
        total: paginationData.total,
        totalPages: paginationData.pages
      });
      return usersData;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error mengambil users';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getUser = useCallback(async (userId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.getUser(userId);
      return response.data.data.user;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error mengambil user';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (data: CreateUserData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersApi.createUser(data);
      const newUser = response.data.data.user;
      setUsers([...users, newUser]);
      toast.success('User berhasil dibuat');
      return newUser;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error membuat user';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [users]);

  const updateUser = useCallback(
    async (userId: number, data: UpdateUserData) => {
      try {
        setLoading(true);
        setError(null);
        const response = await usersApi.updateUser(userId, data);
        const updatedUser = response.data.data.user;
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
        toast.success('User berhasil diupdate');
        return updatedUser;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Error update user';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [users]
  );

  const deleteUser = useCallback(
    async (userId: number) => {
      try {
        setLoading(true);
        setError(null);
        await usersApi.deleteUser(userId);
        setUsers(users.filter((u) => u.id !== userId));
        toast.success('User berhasil dihapus');
      } catch (err: any) {
        const message = err.response?.data?.message || 'Error menghapus user';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [users]
  );

  const promote = useCallback(
    async (userId: number) => {
      try {
        setLoading(true);
        setError(null);
        const response = await usersApi.updateUser(userId, { role_name: 'admin' });
        const updatedUser = response.data.data.user;
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
        toast.success('User berhasil dipromosikan menjadi Admin');
        return updatedUser;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Error promosi user';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [users]
  );

  const demote = useCallback(
    async (userId: number) => {
      try {
        setLoading(true);
        setError(null);
        const response = await usersApi.updateUser(userId, { role_name: 'user' });
        const updatedUser = response.data.data.user;
        setUsers(users.map((u) => (u.id === userId ? updatedUser : u)));
        toast.success('User berhasil diturunkan menjadi User Biasa');
        return updatedUser;
      } catch (err: any) {
        const message = err.response?.data?.message || 'Error demosi user';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [users]
  );

  return {
    users,
    loading,
    error,
    pagination,
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    promote,
    demote,
  };
};
