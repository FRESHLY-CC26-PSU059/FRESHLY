import api from '../api/axios';

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone?: string;
  gender?: string;
  address?: string;
  birthdate?: string;
  imgUrl?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface GetUsersResponse {
  status: string;
  data: {
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface GetUserResponse {
  status: string;
  data: {
    user: User;
  };
}

export interface CreateUserResponse {
  status: string;
  data: {
    user: User;
  };
}

export interface UpdateUserResponse {
  status: string;
  data: {
    user: User;
  };
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  address?: string;
  birthdate?: string;
}

export interface UpdateUserData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  gender?: string;
  address?: string;
  birthdate?: string;
  role_name?: string;
}

export const usersApi = {
  // Get all users
  getUsers: (page = 1, limit = 20, search = '') =>
    api.get<GetUsersResponse>('/users', { params: { page, limit, search } }),

  // Get single user
  getUser: (userId: number) =>
    api.get<GetUserResponse>(`/users/${userId}`),

  // Create user
  createUser: (data: CreateUserData) =>
    api.post<CreateUserResponse>('/users', data),

  // Update user
  updateUser: (userId: number, data: UpdateUserData) =>
    api.patch<UpdateUserResponse>(`/users/${userId}`, data),

  // Delete user
  deleteUser: (userId: number) =>
    api.delete(`/users/${userId}`),

  // Get current user
  getCurrentUser: () =>
    api.get<GetUserResponse>('/users/me'),
};
