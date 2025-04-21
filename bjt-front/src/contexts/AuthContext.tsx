import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../services/api';
import { mockAuthApi } from '../services/mockApi';

// 使用环境变量或配置决定是否使用模拟API
const USE_MOCK_API = true; // 设置为true强制使用模拟API进行开发

// 根据配置选择使用真实API还是模拟API
const apiService = {
  auth: USE_MOCK_API ? mockAuthApi : authApi
};

// 用户角色定义
export enum UserRole {
  CUSTOMER = 'customer',
  PARTNER = 'partner',
  SALES = 'sales',
  ADMIN = 'admin',
}

// 用户信息接口
export interface UserInfo {
  id: string;
  name: string;
  displayName?: string; // 显示名称（可用于国际化）
  email: string;
  username?: string; // 保持向后兼容
  role: UserRole;
  avatar?: string;
  vipLevel?: number; // VIP级别
  type?: string; // 用户类型，如'vip', 'regular'等
  region?: string; // 区域
}

// 中英文用户名映射
const userNameMap: Record<string, string> = {
  '管理员': 'Admin',
  '用户': 'User',
  '合作伙伴': 'Partner',
};

interface AuthContextType {
  user: UserInfo | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<UserInfo>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<UserInfo>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (data: Partial<UserInfo>) => Promise<void>;
  getTranslatedUserName: (name: string) => string;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 提供认证上下文的 Provider 组件
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取翻译后的用户名
  const getTranslatedUserName = (name: string): string => {
    return userNameMap[name] || name;
  };

  // 在组件挂载时尝试自动登录
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 从本地存储获取用户信息
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Auto login failed:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (email: string, password: string): Promise<UserInfo> => {
    setLoading(true);
    setError(null);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 测试账号列表
      const testAccounts: Record<string, UserInfo> = {
        // 管理员账号
        'admin@bjt.com': {
          id: '1',
          name: '系统管理员',
          displayName: 'System Admin',
          email: 'admin@bjt.com',
          role: UserRole.ADMIN,
          vipLevel: 3,
          type: 'vip'
        },
        // 销售账号
        'sales@bjt.com': {
          id: '2',
          name: '销售经理',
          displayName: 'Sales Manager',
          email: 'sales@bjt.com',
          role: UserRole.SALES,
          vipLevel: 2,
          type: 'staff'
        },
        // 欧洲区域VIP客户
        'eu-vip@customer.com': {
          id: '3',
          name: '欧洲客户',
          displayName: 'EU Customer',
          email: 'eu-vip@customer.com',
          role: UserRole.CUSTOMER,
          vipLevel: 2,
          type: 'vip'
        },
        // 澳洲区域普通客户
        'au@customer.com': {
          id: '4',
          name: '澳洲客户',
          displayName: 'AU Customer',
          email: 'au@customer.com',
          role: UserRole.CUSTOMER,
          vipLevel: 0,
          type: 'regular'
        },
        // 德国区域合作伙伴
        'de@partner.com': {
          id: '5',
          name: '德国合作伙伴',
          displayName: 'DE Partner',
          email: 'de@partner.com',
          role: UserRole.PARTNER,
          vipLevel: 1,
          type: 'partner'
        },
        // 北美地区普通用户
        'northamerica@user.com': {
          id: '6',
          name: '北美客户',
          displayName: 'North American Customer',
          email: 'northamerica@user.com',
          role: UserRole.CUSTOMER,
          vipLevel: 0,
          type: 'regular',
          region: 'NA'
        }
      };
      
      // 通过邮箱查找用户
      const user = testAccounts[email.toLowerCase()];
      
      if (user) {
        // 保存用户信息到本地存储
        localStorage.setItem('user', JSON.stringify(user));
        setUser(user);
        return user;
      } else {
        // 使用默认管理员账号（兼容性处理）
        const defaultUser: UserInfo = {
          id: '999',
          name: '默认用户',
          email: email,
          role: UserRole.CUSTOMER,
          vipLevel: 0,
          type: 'regular'
        };
        localStorage.setItem('user', JSON.stringify(defaultUser));
        setUser(defaultUser);
        return defaultUser;
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = async () => {
    setLoading(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 清除本地存储
      localStorage.removeItem('user');
      setUser(null);
    } catch (err: any) {
      setError(err.message || 'Logout failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 注册函数
  const register = async (name: string, email: string, password: string): Promise<UserInfo> => {
    setLoading(true);
    setError(null);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟用户数据
      const mockUser: UserInfo = {
        id: Date.now().toString(),
        name,
        email,
        username: email, // 设置username保持兼容性
        role: UserRole.CUSTOMER,
      };
      
      // 自动登录新注册的用户
      localStorage.setItem('user', JSON.stringify(mockUser));
      setUser(mockUser);
      return mockUser;
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 忘记密码函数
  const forgotPassword = async (email: string) => {
    setLoading(true);
    setError(null);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 通常这里会发送重置密码邮件
    } catch (err: any) {
      setError(err.message || 'Password reset request failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 重置密码函数
  const resetPassword = async (token: string, newPassword: string) => {
    setLoading(true);
    setError(null);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 通常这里会验证令牌并重置密码
    } catch (err: any) {
      setError(err.message || 'Password reset failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 更新用户资料
  const updateProfile = async (data: Partial<UserInfo>) => {
    setLoading(true);
    setError(null);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        const updatedUser = { ...user, ...data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err: any) {
      setError(err.message || 'Profile update failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 提供上下文值
  const contextValue: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    updateProfile,
    getTranslatedUserName,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 自定义钩子，便于在组件中使用认证上下文
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 