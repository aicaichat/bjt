import { BaseAdminService, PaginatedResponse } from './base-admin.service';
import HttpAdminService from '../api/httpAdminService';

export interface User {
  id: number;
  username: string;
  email: string;
  customer_code: string;
  role: string;
  country: string;
  region: string;
  company_logo: string;
  status: 'active' | 'inactive' | 'suspended';
  preferred_unit: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}

export interface UserFormData {
  username: string;
  email: string;
  password?: string;
  customer_code: string;
  role: string;
  country: string;
  region: string;
  company_logo: string;
  status: 'active' | 'inactive' | 'suspended';
  preferred_unit: 'metric' | 'imperial';
}

export interface UserParams {
  page?: number;
  per_page?: number;
  search?: string;
  role?: string;
  status?: string;
  country?: string;
  region?: string;
  preferred_unit?: string;
  orderby?: string;
  order?: 'ASC' | 'DESC';
}

// Mock data for development
const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@example.com',
    customer_code: 'ADM001',
    role: 'admin',
    country: 'CN',
    region: '北京',
    company_logo: '',
    status: 'active',
    preferred_unit: 'metric',
    created_at: '2024-01-01 10:00:00',
    updated_at: '2024-01-01 10:00:00',
  },
  {
    id: 2,
    username: 'manager1',
    email: 'manager1@example.com',
    customer_code: 'MGR001',
    role: 'manager',
    country: 'CN',
    region: '上海',
    company_logo: '',
    status: 'active',
    preferred_unit: 'metric',
    created_at: '2024-01-02 10:00:00',
    updated_at: '2024-01-02 10:00:00',
  },
  {
    id: 3,
    username: 'user1',
    email: 'user1@example.com',
    customer_code: 'USR001',
    role: 'user',
    country: 'US',
    region: 'California',
    company_logo: '',
    status: 'active',
    preferred_unit: 'imperial',
    created_at: '2024-01-03 10:00:00',
    updated_at: '2024-01-03 10:00:00',
  },
  {
    id: 4,
    username: 'viewer1',
    email: 'viewer1@example.com',
    customer_code: 'VWR001',
    role: 'viewer',
    country: 'UK',
    region: 'England',
    company_logo: '',
    status: 'inactive',
    preferred_unit: 'metric',
    created_at: '2024-01-04 10:00:00',
    updated_at: '2024-01-04 10:00:00',
  },
];

class AdminUserService extends BaseAdminService<User> {
  constructor() {
    super('users');
  }

  /**
   * 获取用户列表
   */
  async getUsers(params?: UserParams): Promise<PaginatedResponse<User>> {
    try {
      const response = await HttpAdminService.get<PaginatedResponse<User>>('/users', { params });
      
      // Transform the response to match our expected format
      if (response.data && response.data.items) {
        return {
          items: response.data.items,
          total: response.data.total || response.data.items.length,
          page: response.data.page || 1,
          page_size: response.data.page_size || 10,
          total_pages: Math.ceil((response.data.total || response.data.items.length) / (response.data.page_size || 10)),
        };
      }
      
      // If API response format is different, try to adapt
      if (response.success && response.data) {
        const items = Array.isArray(response.data) ? response.data : response.data.items || [];
        return {
          items,
          total: items.length,
          page: 1,
          page_size: items.length,
          total_pages: 1,
        };
      }
      
      throw new Error('Invalid API response format');
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      // Fallback to mock data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      let filteredUsers = [...mockUsers];
      
      // Apply filters
      if (params?.search) {
        const search = params.search.toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
          user.username.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search) ||
          user.customer_code.toLowerCase().includes(search)
        );
      }
      
      if (params?.role) {
        filteredUsers = filteredUsers.filter(user => user.role === params.role);
      }
      
      if (params?.status) {
        filteredUsers = filteredUsers.filter(user => user.status === params.status);
      }
      
      if (params?.country) {
        filteredUsers = filteredUsers.filter(user => user.country === params.country);
      }
      
      if (params?.preferred_unit) {
        filteredUsers = filteredUsers.filter(user => user.preferred_unit === params.preferred_unit);
      }
      
      // Apply pagination
      const page = params?.page || 1;
      const per_page = params?.per_page || 10;
      const offset = (page - 1) * per_page;
      const paginatedUsers = filteredUsers.slice(offset, offset + per_page);
      
      return {
        items: paginatedUsers,
        total: filteredUsers.length,
        page,
        page_size: per_page,
        total_pages: Math.ceil(filteredUsers.length / per_page),
      };
    }
  }

  /**
   * 获取单个用户
   */
  async getUser(id: number): Promise<{ data: User }> {
    try {
      const response = await HttpAdminService.get<User>(`/users/${id}`);
      // Handle different response formats
      if ((response as any).data) {
        return { data: (response as any).data };
      } else if ((response as any).success && (response as any).data) {
        return { data: (response as any).data };
      } else {
        return { data: response as unknown as User };
      }
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const user = mockUsers.find(u => u.id === id);
      if (!user) {
        throw new Error('User not found');
      }
      
      return { data: user };
    }
  }

  /**
   * 创建用户
   */
  async createUser(data: UserFormData): Promise<{ data: User }> {
    try {
      const response = await HttpAdminService.post<User>('/users', data);
      // Handle different response formats
      if ((response as any).data) {
        return { data: (response as any).data };
      } else if ((response as any).success && (response as any).data) {
        return { data: (response as any).data };
      } else {
        return { data: response as unknown as User };
      }
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newUser: User = {
        id: Math.max(...mockUsers.map(u => u.id)) + 1,
        ...data,
        created_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      
      mockUsers.push(newUser);
      return { data: newUser };
    }
  }

  /**
   * 更新用户
   */
  async updateUser(id: number, data: Partial<UserFormData>): Promise<{ data: User }> {
    try {
      const response = await HttpAdminService.put<User>(`/users/${id}`, data);
      // Handle different response formats
      if ((response as any).data) {
        return { data: (response as any).data };
      } else if ((response as any).success && (response as any).data) {
        return { data: (response as any).data };
      } else {
        return { data: response as unknown as User };
      }
    } catch (error) {
      console.warn('API call failed, using mock data:', error);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex === -1) {
        throw new Error('User not found');
      }

      const updatedUser = {
        ...mockUsers[userIndex],
        ...data,
        updated_at: new Date().toISOString().replace('T', ' ').slice(0, 19),
      };
      
      mockUsers[userIndex] = updatedUser;
      return { data: updatedUser };
    }
  }

  /**
   * 删除用户
   */
  async deleteUser(id: number): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const userIndex = mockUsers.findIndex(u => u.id === id);
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    mockUsers.splice(userIndex, 1);
  }

  /**
   * 重置用户密码
   */
  async resetPassword(id: number): Promise<{ data: { message: string } }> {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const user = mockUsers.find(u => u.id === id);
    if (!user) {
      throw new Error('User not found');
    }
    
    return { 
      data: { 
        message: 'Password reset successfully. New password has been sent to user email.' 
      } 
    };
  }

  /**
   * 批量操作用户
   */
  async batchOperation(
    operation: 'enable' | 'disable' | 'delete',
    ids: number[]
  ): Promise<{ data: { success: number; failed: number } }> {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    let success = 0;
    let failed = 0;
    
    ids.forEach(id => {
      const userIndex = mockUsers.findIndex(u => u.id === id);
      if (userIndex !== -1) {
        switch (operation) {
          case 'enable':
            mockUsers[userIndex].status = 'active';
            break;
          case 'disable':
            mockUsers[userIndex].status = 'inactive';
            break;
          case 'delete':
            mockUsers.splice(userIndex, 1);
            break;
        }
        success++;
      } else {
        failed++;
      }
    });
    
    return { data: { success, failed } };
  }

  /**
   * 导入用户数据
   */
  async importUsers(file: File): Promise<{ data: { success: number; failed: number } }> {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock import result
    return { data: { success: 5, failed: 1 } };
  }

  /**
   * 导出用户数据
   */
  async exportUsers(params?: UserParams): Promise<Blob> {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Filter users based on params
    let usersToExport = [...mockUsers];
    
    if (params?.role) {
      usersToExport = usersToExport.filter(user => user.role === params.role);
    }
    
    if (params?.status) {
      usersToExport = usersToExport.filter(user => user.status === params.status);
    }
    
    if (params?.country) {
      usersToExport = usersToExport.filter(user => user.country === params.country);
    }
    
    if (params?.preferred_unit) {
      usersToExport = usersToExport.filter(user => user.preferred_unit === params.preferred_unit);
    }
    
    // Convert to CSV format
    const headers = [
      'ID', '用户名', '邮箱', '客户代码', '角色', '国家', '地区', 
      '公司Logo', '状态', '单位偏好', '创建时间', '更新时间'
    ];
    
    const csvContent = [
      headers.join(','),
      ...usersToExport.map(user => [
        user.id,
        user.username,
        user.email,
        user.customer_code || '',
        user.role,
        user.country || '',
        user.region || '',
        user.company_logo || '',
        user.status,
        user.preferred_unit,
        user.created_at,
        user.updated_at
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  }
}

const adminUserService = new AdminUserService();
export default adminUserService; 