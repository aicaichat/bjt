import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../api/config';

// 预设的JWT令牌 - 使用bjt-secret-key-2023密钥生成，有效期到2053年
const INITIAL_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA";

export interface LoginResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    expires_in: number;
    user: {
      id: number;
      name: string;
      email: string;
    }
  }
}

class AuthService {
  private token: string | null = null;
  private user: any = null;

  constructor() {
    // 初始化时从localStorage获取token
    this.token = localStorage.getItem('auth_token') || INITIAL_TOKEN;
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        this.user = JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user data from localStorage:', e);
        this.user = null;
      }
    }
  }

  /**
   * 验证token格式和有效性
   */
  private validateToken(token: string): boolean {
    try {
      console.log('🔍 [AuthService] Validating token...');
      
      // 检查token格式
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('❌ [AuthService] Invalid token format');
        return false;
      }

      // 解码payload
      const payload = JSON.parse(atob(parts[1]));
      console.log('📝 [AuthService] Token payload:', {
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration',
        iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'No issued at',
        user: payload.user || 'No user info'
      });

      // 检查是否过期
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        console.warn('⚠️ [AuthService] Token is expired');
        return false;
      }

      console.log('✅ [AuthService] Token is valid');
      return true;
    } catch (error) {
      console.error('❌ [AuthService] Token validation error:', error);
      return false;
    }
  }

  /**
   * 登录并获取新token
   */
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('🔐 [AuthService] Attempting login...');
      
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        username,
        password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = response.data;
      console.log('🔐 [AuthService] Login response:', data);

      if (data.success && data.data.token) {
        // 验证新token
        if (!this.validateToken(data.data.token)) {
          throw new Error('Invalid token received from server');
        }

        // 保存新token和用户信息
        this.token = data.data.token;
        this.user = data.data.user;
        localStorage.setItem('auth_token', this.token as string);
        localStorage.setItem('user', JSON.stringify(this.user));
        console.log('✅ [AuthService] Login successful, token saved');
        return data;
      } else {
        throw new Error(data.message || '登录失败');
      }
    } catch (error: any) {
      console.error('❌ [AuthService] Login failed:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      throw error;
    }
  }

  /**
   * 获取当前token
   */
  getToken(): string | null {
    if (this.token && !this.validateToken(this.token)) {
      console.warn('⚠️ [AuthService] Current token is invalid, clearing...');
      this.logout();
      return null;
    }
    return this.token;
  }

  /**
   * 获取认证头
   */
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }

  /**
   * 检查是否已认证
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * 登出
   */
  logout(): void {
    console.log('👋 [AuthService] Logging out...');
    this.token = null;
    this.user = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    console.log('✅ [AuthService] Logout complete');
  }

  /**
   * 刷新token
   */
  async refreshToken(): Promise<boolean> {
    try {
      console.log('🔄 [AuthService] Attempting to refresh token...');
      
      if (!this.token) {
        console.warn('⚠️ [AuthService] No token to refresh');
        return false;
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
        headers: {
          ...this.getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const data = response.data;
      console.log('🔄 [AuthService] Token refresh response:', data);

      if (data.success && data.data.token) {
        // 验证新token
        if (!this.validateToken(data.data.token)) {
          throw new Error('Invalid token received from refresh');
        }

        this.token = data.data.token;
        localStorage.setItem('auth_token', this.token as string);
        console.log('✅ [AuthService] Token refreshed successfully');
        return true;
      }
      
      console.warn('⚠️ [AuthService] Token refresh failed:', data.message);
      return false;
    } catch (error) {
      console.error('❌ [AuthService] Token refresh failed:', error);
      return false;
    }
  }
}

// 创建单例实例
export const authService = new AuthService();

// Mock implementation for development
export const mockLogin = async (email: string, password: string): Promise<LoginResponse> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Demo users for testing
  const users = [
    { email: 'admin@bjt.com', password: 'admin123', role: 'admin' },
    { email: 'sales@bjt.com', password: 'admin123', role: 'sales' },
    { email: 'eu-vip@customer.com', password: 'admin123', role: 'customer' },
    { email: 'au@customer.com', password: 'admin123', role: 'customer' },
    { email: 'northamerica@user.com', password: 'admin123', role: 'customer' }
  ];
  
  const user = users.find(u => u.email === email && u.password === password);
  
  if (user) {
    return {
      success: true,
      data: {
        token: 'mock-jwt-token-' + Math.random().toString(36).substr(2, 9),
        expires_in: 3600,
        user: {
          id: parseInt(Math.random().toString().substring(2, 8)),
          name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
          email: email,
        }
      }
    };
  } else {
    return {
      success: false,
      message: 'Invalid credentials',
      data: {
        token: '',
        expires_in: 0,
        user: {
          id: 0,
          name: '',
          email: '',
        }
      }
    };
  }
};

export const refreshToken = async (): Promise<string> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Token refresh failed');
    }

    // 统一处理响应格式
    const newToken = data.data?.access_token || data.data?.token;
    if (!newToken) {
      throw new Error('No token in refresh response');
    }

    localStorage.setItem('auth_token', newToken);
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
}; 