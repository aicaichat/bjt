import apiService from './apiService';

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: 'customer' | 'dealer' | 'sales';
  country: string;
  preferred_unit: 'metric' | 'imperial';
}

export interface User {
  id: number;
  username: string;
  email: string;
  customer_code: string;
  role: string;
  country: string;
  region: string;
  status: 'active' | 'pending' | 'rejected' | 'inactive' | 'suspended';
  preferred_unit: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}

// 注册接口
export const register = async (data: RegisterPayload) => {
  return apiService.post('/auth/register', data);
};

// 获取待审核用户数量
export const getPendingUsersCount = async () => {
  const response = await apiService.get('/users', { params: { status: 'pending', per_page: 1 } });
  return response.data?.data?.total || 0;
};

// 获取待审核用户列表（管理员使用）
export const getPendingUsers = async (params?: { page?: number; per_page?: number }) => {
  return apiService.get('/users', { params: { ...params, status: 'pending' } });
};

// 获取用户列表（支持各种筛选）
export const getUsers = async (params?: { 
  page?: number; 
  per_page?: number; 
  status?: string; 
  role?: string; 
  country?: string; 
  preferred_unit?: string; 
  search?: string;
}) => {
  return apiService.get('/users', { params });
};

// 审核用户（管理员使用）
export const approveUser = async (id: number, updateData: any) => {
  return apiService.put(`/users/${id}`, { ...updateData, status: 'active' });
};

export const rejectUser = async (id: number, reason: string) => {
  return apiService.put(`/users/${id}`, { status: 'rejected', rejection_reason: reason });
};

// 获取单个用户详情
export const getUserById = async (id: number) => {
  return apiService.get(`/users/${id}`);
};

// 更新用户信息
export const updateUser = async (id: number, data: Partial<User>) => {
  return apiService.put(`/users/${id}`, data);
}; 