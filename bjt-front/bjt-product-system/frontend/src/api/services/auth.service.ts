import { BaseService } from './base.service';
import ApiService from '../../services/apiService';
import { delay } from '../../utils/delay';
import axios from 'axios';
import { API_CONFIG } from '../../config/appConfig';
import { API_BASE_URL } from '../config';

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

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  SALES = 'sales',
  PARTNER = 'partner',
  CUSTOMER = 'customer',
}

// 单位制类型
export type UnitSystem = 'metric' | 'imperial';

// 用户权限接口
export interface UserPermissions {
  view_prices: boolean;
  view_inventory: boolean;
  add_to_cart: boolean;
  place_order: boolean;
  view_admin: boolean;
  edit_products: boolean;
  delete_products: boolean;
  manage_users: boolean;
  manage_orders: boolean;
}

// 用户信息接口
export interface User {
  id: number;
  username: string;
  email: string;
  name: string;
  display_name: string;
  role: UserRole;
  region: string;
  country?: string;
  customer_code?: string;
  company_logo?: string;
  preferred_unit: UnitSystem;
  status: string;
  permissions: string[];
  created_at: string;
  updated_at: string;
}

// 登录请求接口
export interface LoginRequest {
  username: string;
  password: string;
  remember_me?: boolean;
}

// 登录响应接口
export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    token_type: string;
    expires_in: number;
    user: User;
  };
  message?: string;
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
  preferred_unit?: UnitSystem;
  customer_code?: string;
  country?: string;
  region?: string;
  company_logo?: string;
}

// 用户资料响应接口
export interface ProfileResponse {
  success: boolean;
  data: User;
  message?: string;
}

// 更改密码请求接口
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}

// API错误响应接口
export interface ApiErrorResponse {
  success: false;
  message: string;
  code: string;
  data?: any;
}

// 认证响应接口
export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: User;
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

class AuthService {
  private baseURL = API_BASE_URL;
  private tokenKey = 'auth_token';
  private userKey = 'user';

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      console.log('🔐 [AuthService] Attempting login with credentials:', {
        username: credentials.username,
        remember_me: credentials.remember_me
      });

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('🔐 [AuthService] Login response status:', response.status);

      const data = await response.json();
      console.log('🔐 [AuthService] Login response data:', data);

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && data.data) {
        // 存储令牌和用户信息
        this.setToken(data.data.token);
        this.setUser(data.data.user);
        
        console.log('✅ [AuthService] Login successful, token and user data stored');
        return data;
      } else {
        throw new Error(data.message || '登录失败');
      }
    } catch (error) {
      console.error('❌ [AuthService] Login failed:', error);
      throw error;
    }
  }

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      const response = await fetch(`${this.baseURL}/user/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      // 安全解析可能为空的响应
      const rawText = await response.text();
      let data: any = {};
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (parseErr) {
          console.warn('[AuthService] 非JSON响应，可能未登录或令牌无效:', parseErr);
        }
      }

      if (!response.ok) {
        // 如果后端返回401/403且body为空，构造统一的错误信息
        const message = data.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(message);
      }

      if (data.success && data.data) {
        // 更新本地存储的用户信息
        this.setUser(data.data);
        return data.data;
      } else {
        // 如果数据结构不符合预期，则认为未登录
        throw new Error(data.message || '未登录或令牌已失效');
      }
    } catch (error) {
      console.error('❌ [AuthService] Get current user failed:', error);
      throw error;
    }
  }

  /**
   * 更新用户资料
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<ProfileResponse> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      console.log('📝 [AuthService] Updating profile with data:', profileData);

      const response = await fetch(`${this.baseURL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && data.data) {
        // 更新本地存储的用户信息
        this.setUser(data.data);
        console.log('✅ [AuthService] Profile updated successfully');
        return data;
      } else {
        throw new Error(data.message || '更新用户资料失败');
      }
    } catch (error) {
      console.error('❌ [AuthService] Update profile failed:', error);
      throw error;
    }
  }

  /**
   * 刷新令牌
   */
  async refreshToken(): Promise<string> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('未找到认证令牌');
      }

      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (data.success && data.data) {
        const newToken = data.data.access_token;
        this.setToken(newToken);
        console.log('✅ [AuthService] Token refreshed successfully');
        return newToken;
      } else {
        throw new Error(data.message || '刷新令牌失败');
      }
    } catch (error) {
      console.error('❌ [AuthService] Refresh token failed:', error);
      throw error;
    }
  }

  /**
   * 用户退出登录
   */
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      
      if (token) {
        // 调用后端退出登录API
        await fetch(`${this.baseURL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      console.error('❌ [AuthService] Logout API call failed:', error);
      // 即使API调用失败，也要清除本地数据
    } finally {
      // 清除本地存储的认证信息
      this.clearAuth();
      console.log('✅ [AuthService] Logout completed, local auth data cleared');
    }
  }

  /**
   * 检查用户是否已登录
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  /**
   * 获取存储的令牌
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * 设置令牌
   */
  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  /**
   * 获取存储的用户信息
   */
  getUser(): User | null {
    const userStr = localStorage.getItem(this.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('❌ [AuthService] Failed to parse user data:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * 设置用户信息
   */
  private setUser(user: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  /**
   * 清除认证信息
   */
  private clearAuth(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * 检查用户权限
   */
  hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user?.permissions?.includes(permission) || false;
  }

  /**
   * 获取用户角色权限映射
   */
  getRolePermissions(role: UserRole): UserPermissions {
    const basePermissions: UserPermissions = {
      view_prices: false,
      view_inventory: false,
      add_to_cart: false,
      place_order: false,
      view_admin: false,
      edit_products: false,
      delete_products: false,
      manage_users: false,
      manage_orders: false,
    };

    switch (role) {
      case UserRole.ADMIN:
        return {
          ...basePermissions,
          view_prices: true,
          view_inventory: true,
          add_to_cart: true,
          place_order: true,
          view_admin: true,
          edit_products: true,
          delete_products: true,
          manage_users: true,
          manage_orders: true,
        };

      case UserRole.SALES:
        return {
          ...basePermissions,
          view_prices: true,
          view_inventory: true,
          add_to_cart: true,
          place_order: true,
          edit_products: true,
          manage_orders: true,
        };

      case UserRole.PARTNER:
        return {
          ...basePermissions,
          view_prices: true,
          view_inventory: true,
          add_to_cart: true,
          place_order: true,
        };

      case UserRole.CUSTOMER:
      default:
        return {
          ...basePermissions,
          view_prices: true,
          add_to_cart: true,
          place_order: true,
        };
    }
  }
}

export { AuthService };
export const authService = new AuthService();
export default authService; 