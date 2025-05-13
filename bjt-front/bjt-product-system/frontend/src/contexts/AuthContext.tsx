import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, BackendUser } from '../services/api';
import { mockAuthApi } from '../services/mockApi';

// 使用环境变量或配置决定是否使用模拟API
const USE_MOCK_API = false; // 设置为true强制使用模拟API进行开发

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
  UNKNOWN = 'unknown' // Added for safety
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
  login: (username: string, password: string) => Promise<UserInfo>;
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

  console.log('[AuthContext] Rendering Provider - Loading:', loading, 'User:', !!user);

  // 获取翻译后的用户名
  const getTranslatedUserName = (name: string): string => {
    return userNameMap[name] || name;
  };

  // 在组件挂载时尝试自动登录
  useEffect(() => {
    const checkAuth = async () => {
      console.log('[AuthContext] useEffect checkAuth starting...');
      try {
        // 从本地存储获取用户信息
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          console.log('[AuthContext] Found user in localStorage');
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } else {
          console.log('[AuthContext] No user in localStorage');
        }
      } catch (err) {
        console.error('[AuthContext] Auto login failed:', err);
      } finally {
        console.log('[AuthContext] useEffect checkAuth finished, setting loading to false.');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (username: string, password: string): Promise<UserInfo> => {
    console.log('[AuthContext] login called');
    setLoading(true);
    setError(null);
    try {
      // Actual API call
      // Explicitly assert the type of the response when USE_MOCK_API is false
      const loggedInResponse = await apiService.auth.login(username, password) as { user: BackendUser, token: string };

      // Map BackendUser to UserInfo
      const mapBackendUserToUserInfo = (backendUser: BackendUser): UserInfo => {
        let userRole = UserRole.UNKNOWN;
        if (backendUser.roles && backendUser.roles.length > 0) {
          const roleName = backendUser.roles[0].toLowerCase();
          if (roleName === 'administrator') userRole = UserRole.ADMIN;
          else if (roleName === 'editor') userRole = UserRole.SALES; // Example mapping
          else if (roleName === 'author') userRole = UserRole.PARTNER; // Example mapping
          else if (roleName === 'contributor') userRole = UserRole.CUSTOMER; // Example mapping
          else if (roleName === 'subscriber') userRole = UserRole.CUSTOMER; // Example mapping
        }

        // Use the updated fields from BackendUser (name, email)
        // Keep user_login for username for now if needed, or use name directly.
        return {
          id: backendUser.id.toString(),
          name: backendUser.name, // Use the direct 'name' field
          displayName: backendUser.name, // Can use 'name' for displayName too, or leave if not critical
          email: backendUser.email, // Use the direct 'email' field
          username: backendUser.name, // Use 'name' as username, or map differently if login needs a specific 'user_login' format
          role: userRole,
          // avatar, vipLevel, type, region can be fetched later or set to defaults
          avatar: undefined, 
          vipLevel: 0,
          type: 'regular',
          region: 'CN' // Default region, can be updated later
        };
      };
      
      const userInfo = mapBackendUserToUserInfo(loggedInResponse.user);

      console.log('[AuthContext] login success, setting user:', userInfo);
      localStorage.setItem('user', JSON.stringify(userInfo));
      setUser(userInfo);
      return userInfo;

    } catch (err: any) {
      console.log('[AuthContext] login error:', err);
      setError(err.message || 'Login failed. Please try again.');
      throw err;
    } finally {
      console.log('[AuthContext] login finished, setting loading to false.');
      setLoading(false);
    }
  };

  // 登出函数
  const logout = async () => {
    console.log('[AuthContext] logout called');
    setLoading(true);
    try {
      // 模拟 API 调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('[AuthContext] logout success, setting user to null');
      // 清除本地存储
      localStorage.removeItem('user');
      setUser(null);
    } catch (err: any) {
      console.log('[AuthContext] logout error:', err);
      setError(err.message || 'Logout failed. Please try again.');
      throw err;
    } finally {
      console.log('[AuthContext] logout finished, setting loading to false.');
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
  // console.log('[useAuth] Hook called, context value:', context); // Log context value if needed
  if (context === undefined) {
    console.error('[AuthContext] useAuth called outside of AuthProvider. Context is undefined.'); // Add error log
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 