import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';
import axios from 'axios';
import { API_CONFIG } from '../../config/appConfig';

// 模拟用户数据
const mockUser = {
  id: 1,
  username: 'admin',
  email: 'admin@bjt.com',
  first_name: '管理',
  last_name: '员',
  full_name: '管理员',
  avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
  department: '技术部',
  role: 'admin',
  permissions: ['read', 'write', 'delete', 'admin'],
  created_at: '2023-01-15T08:00:00Z',
  updated_at: '2023-05-01T10:30:00Z'
};

// 登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

// 注册请求接口
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirmation: string;
  first_name?: string;
  last_name?: string;
}

// 更新用户资料请求接口
export interface UpdateProfileRequest {
  email?: string;
  first_name?: string;
  last_name?: string;
  department?: string;
  avatar?: File | null;
}

// 更改密码请求接口
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// 用户接口
export interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  avatar?: string;
  department?: string;
  role?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}

// 认证响应接口
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
}

// 用户登录响应接口
export interface LoginResponse {
  token: string; // 这是后端返回的令牌字段
  expiration?: number;
  user: {
    id: string | number;
    username: string;
    role: string;
    display_name?: string;
    email?: string;
    [key: string]: any;
  };
}

// 用户信息接口
export interface UserInfo {
  id: string | number;
  username: string;
  role: string;
  name?: string;
  display_name?: string;
  email?: string;
  avatar?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  last_login?: string;
  region?: string;
  [key: string]: any;
}

// 认证服务类
export class AuthService extends BaseService<AuthResponse> {
  constructor() {
    super('/auth');
  }

  /**
   * 用户登录
   * @param data 登录信息
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    console.log(`Attempting login for user: ${data.username}`);
    if (this.useMockData) {
      await delay(800);
      
      // 模拟登录逻辑
      if (data.username === 'admin' && data.password === 'password') {
        // 返回模拟的认证响应
        return {
          access_token: 'mock-access-token',
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: mockUser
        };
      }
      
      throw new Error('用户名或密码不正确。');
    }
    
    try {
      const response = await ApiService.post(this.getApiPath('/login'), data);
      console.log('Login API response:', response.data);
      
      // 兼容后端返回格式 - 后端可能直接返回token字段而不是access_token
      if (response.data) {
        // 检查response.data是否有success: true和data字段
        const responseData = response.data.success && response.data.data ? response.data.data : response.data;
        
        // 从responseData中提取token和user信息
        const token = responseData.token || responseData.access_token;
        const user = responseData.user;
        
        if (!token) {
          console.error('No token found in login response:', responseData);
        }
        
        if (!user) {
          console.error('No user found in login response:', responseData);
        }
        
        // 存储auth_token到localStorage
        if (token) {
          localStorage.setItem('auth_token', token);
          console.log('Stored auth_token in localStorage');
        }
        
        return {
          access_token: token,
          token_type: responseData.token_type || 'Bearer',
          expires_in: responseData.expires_in || responseData.expiration || 0,
          refresh_token: responseData.refresh_token || '',
          user: user
        };
      }
    } catch (error: any) {
      console.error('Login request failed:', error);
      console.error('Error response:', error.response?.data);
      throw error;
    }
    
    // 如果以上处理都失败，返回默认值
    throw new Error('Login failed: Invalid server response format');
  }

  /**
   * 用户注册
   * @param data 注册信息
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    if (this.useMockData) {
      await delay(1000);
      
      // 模拟注册逻辑
      if (data.password !== data.password_confirmation) {
        throw new Error('密码和确认密码不匹配。');
      }
      
      if (data.username === 'admin') {
        throw new Error('用户名已被使用，请尝试其他用户名。');
      }
      
      const newUser: User = {
        id: 2,
        username: data.username,
        email: data.email,
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        full_name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
        avatar: 'https://randomuser.me/api/portraits/lego/2.jpg',
        department: '新用户',
        role: 'user',
        permissions: ['read', 'write'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      return {
        access_token: 'mock-access-token-new-user',
        token_type: 'Bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token-new-user',
        user: newUser
      };
    }
    
    const response = await ApiService.post(this.getApiPath('/register'), data);
    // 兼容后端返回格式
    if (response.data && (response.data.token || response.data.access_token)) {
      return {
        access_token: response.data.token || response.data.access_token,
        token_type: response.data.token_type || 'Bearer',
        expires_in: response.data.expires_in || 0,
        refresh_token: response.data.refresh_token || '',
        user: response.data.user
      };
    }
    return response.data;
  }

  /**
   * 用户登出
   */
  async logout(): Promise<void> {
    if (this.useMockData) {
      await delay(300);
      // 在实际应用中，这里应该清除本地存储的令牌
      return;
    }
    
    await ApiService.post(this.getApiPath('/logout'));
  }

  /**
   * 刷新访问令牌
   * @param refreshToken 刷新令牌
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    if (this.useMockData) {
      await delay(500);
      
      // 模拟刷新令牌
      if (refreshToken.startsWith('mock-refresh-token')) {
        return {
          access_token: `mock-access-token-refreshed-${Date.now()}`,
          token_type: 'Bearer',
          expires_in: 3600,
          refresh_token: `mock-refresh-token-extended-${Date.now()}`,
          user: mockUser
        };
      }
      
      throw new Error('无效的刷新令牌。');
    }
    
    try {
      console.log('Attempting to refresh token...');
      const response = await ApiService.post(this.getApiPath('/auth/refresh'), { refresh_token: refreshToken });
      console.log('Token refresh response:', response.data);
      
      // 兼容后端返回格式
      if (response.data) {
        // 检查response.data是否有success: true和data字段
        const responseData = response.data.success && response.data.data ? response.data.data : response.data;
        
        // 从responseData中提取token和user信息
        const token = responseData.token || responseData.access_token;
        const user = responseData.user;
        
        if (token) {
          // 更新localStorage中的token
          localStorage.setItem('auth_token', token);
          console.log('Updated auth_token in localStorage after refresh');
        }
        
        return {
          access_token: token,
          token_type: responseData.token_type || 'Bearer',
          expires_in: responseData.expires_in || responseData.expiration || 0,
          refresh_token: responseData.refresh_token || refreshToken, // 如果没有新的refresh_token，则保留旧的
          user: user || mockUser // 如果没有用户信息，使用模拟数据
        };
      }
      
      throw new Error('Invalid refresh token response format');
    } catch (error: any) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    console.log('Attempting to get current user...');
    if (this.useMockData) {
      await delay(500);
      return mockUser;
    }

    try {
      // 使用 ApiService 发送 GET 请求 - 直接使用 /user/me
      const response = await ApiService.get('/user/me');
      console.log('Current user API response:', response.data);
      
      // 检查response.data是否有success: true和data字段
      const responseData = response.data.success && response.data.data 
        ? response.data.data 
        : response.data;
        
      if (!responseData) {
        console.error('Invalid user data in response:', response);
        throw new Error('Failed to get valid user data');
      }
      
      // 映射后端用户数据到前端所需格式
      const userData: User = {
        id: responseData.id,
        username: responseData.username || responseData.login,
        email: responseData.email || '',
        first_name: responseData.first_name || responseData.name || '',
        last_name: responseData.last_name || '',
        full_name: responseData.display_name || responseData.name || `${responseData.first_name || ''} ${responseData.last_name || ''}`.trim(),
        avatar: responseData.avatar || '',
        department: responseData.department || '',
        role: responseData.role || 'user',
        permissions: responseData.permissions || []
      };
      
      return userData;
    } catch (error: any) {
      console.warn('Failed to get current user from API:', error);
      console.log('Falling back to mock data for current user');
      
      // Check if error is 401 (Unauthorized)
      if (error.response && error.response.status === 401) {
        // Token might be invalid or expired - clear it
        localStorage.removeItem('auth_token');
        console.warn('Cleared potentially invalid auth_token due to 401 error');
      }
      
      // If API call fails, fall back to mock data
      return mockUser;
    }
  }

  /**
   * 更新用户资料
   * @param data 用户资料更新数据
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    if (this.useMockData) {
      await delay(800);
      
      // 模拟更新用户资料
      const updatedUser = {
        ...mockUser,
        email: data.email || mockUser.email,
        first_name: data.first_name || mockUser.first_name,
        last_name: data.last_name || mockUser.last_name,
        full_name: `${data.first_name || mockUser.first_name} ${data.last_name || mockUser.last_name}`.trim(),
        department: data.department || mockUser.department,
        updated_at: new Date().toISOString()
      };
      
      return updatedUser;
    }
    
    // 处理带文件上传的请求
    if (data.avatar) {
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'avatar' && value instanceof File) {
            formData.append(key, value);
          } else if (value !== null && typeof value !== 'object') {
            formData.append(key, String(value));
          }
        }
      });
      
      const response = await ApiService.post(this.getApiPath('/profile'), formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      return response.data;
    }
    
    const response = await ApiService.put(this.getApiPath('/profile'), data);
    return response.data;
  }

  /**
   * 更改密码
   * @param data 密码更改数据
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    if (this.useMockData) {
      await delay(800);
      
      // 模拟密码更改逻辑
      if (data.current_password !== 'password') {
        throw new Error('当前密码不正确。');
      }
      
      if (data.new_password !== data.new_password_confirmation) {
        throw new Error('新密码和确认密码不匹配。');
      }
      
      if (data.new_password === data.current_password) {
        throw new Error('新密码不能与当前密码相同。');
      }
      
      return;
    }
    
    await ApiService.put(this.getApiPath('/password'), data);
  }

  /**
   * 忘记密码：发送重置链接
   * @param email 用户邮箱
   */
  async forgotPassword(email: string): Promise<void> {
    if (this.useMockData) {
      await delay(800);
      
      // 模拟发送重置链接
      if (!email.includes('@')) {
        throw new Error('请输入有效的电子邮件地址。');
      }
      
      return;
    }
    
    await ApiService.post(this.getApiPath('/forgot-password'), { email });
  }

  /**
   * 验证邮箱
   * @param token 验证令牌
   */
  async verifyEmail(token: string): Promise<void> {
    if (this.useMockData) {
      await delay(500);
      
      if (!token || token.length < 10) {
        throw new Error('无效的验证令牌。');
      }
      
      return;
    }
    
    await ApiService.post(this.getApiPath('/verify-email'), { token });
  }

  /**
   * 实现抽象方法：获取模拟数据
   */
  protected async getMockData(): Promise<AuthResponse> {
    await delay(300);
    
    return {
      access_token: 'mock-access-token-123456789',
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: 'mock-refresh-token-987654321',
      user: mockUser
    };
  }
}

// 导出认证服务实例
export default new AuthService(); 