import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User as ServiceUser } from '../api/services';
import { useMockData } from '../config/env';

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
  token?: string;
}

// 将后端角色映射到前端UserRole枚举
const mapRoleToFrontend = (backendRole: string): UserRole => {
  const role = backendRole?.toLowerCase() || '';
  if (role === 'administrator' || role === 'admin') return UserRole.ADMIN;
  if (role === 'editor' || role === 'sales') return UserRole.SALES;
  if (role === 'author' || role === 'partner') return UserRole.PARTNER;
  if (role === 'contributor' || role === 'subscriber' || role === 'customer') return UserRole.CUSTOMER;
  return UserRole.UNKNOWN;
};

// 将服务用户对象转换为前端使用的用户信息对象
const mapServiceUserToUserInfo = (user: ServiceUser, token?: string): UserInfo => {
  return {
    id: user.id ? user.id.toString() : '0',
    name: user.username || user.first_name || (user.email ? user.email.split('@')[0] : 'user'),
    displayName: user.full_name || user.first_name || user.username,
    email: user.email || '',
    username: user.username,
    role: mapRoleToFrontend(user.role || ''),
    avatar: user.avatar,
    vipLevel: (user as any).vipLevel || 0,
    type: (user as any).type || 'regular',
    region: (user as any).region || 'CN',
    token: token
  };
};

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
        // 检查本地存储的令牌
        const token = localStorage.getItem('auth_token');
        const userJson = localStorage.getItem('user');
        
        if (token) {
          console.log('[AuthContext] Found auth_token in localStorage, attempting to get user info');
          try {
            // 尝试使用令牌获取当前用户信息
            const currentUser = await authService.getCurrentUser();
            console.log('[AuthContext] Successfully retrieved current user:', currentUser);
            
            const userInfo = mapServiceUserToUserInfo(currentUser, token);
            console.log('[AuthContext] Mapped user info:', userInfo);
            
            setUser(userInfo);
            
            // 更新localStorage中的用户信息
            localStorage.setItem('user', JSON.stringify(userInfo));
            console.log('[AuthContext] Updated user info in localStorage');
          } catch (error) {
            console.error('[AuthContext] Error getting current user:', error);
            // 尝试使用localStorage中的用户信息作为备份
            if (userJson) {
              try {
                const cachedUser = JSON.parse(userJson);
                console.log('[AuthContext] Using cached user info:', cachedUser);
                setUser(cachedUser);
              } catch (parseError) {
                console.error('[AuthContext] Failed to parse cached user info:', parseError);
                // 清除无效的用户数据
                localStorage.removeItem('user');
              }
            } else {
              console.log('[AuthContext] No cached user info found');
              // 清除可能无效的令牌
              localStorage.removeItem('auth_token');
            }
          }
        } else {
          console.log('[AuthContext] No auth_token in localStorage');
          
          // 如果没有令牌但有用户数据，也清除用户数据以保持一致性
          if (userJson) {
            console.log('[AuthContext] Removing inconsistent user data without token');
            localStorage.removeItem('user');
          }
        }
      } catch (err) {
        console.error('[AuthContext] Auto login failed:', err);
        // 清除可能无效的令牌和用户数据
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      } finally {
        console.log('[AuthContext] useEffect checkAuth finished, setting loading to false.');
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // 登录函数
  const login = async (username: string, password: string): Promise<UserInfo> => {
    setLoading(true);
    setError(null);
    try {
      console.log('[AuthContext] login attempt for user:', username);
      const response = await authService.login({
        username,
        password,
        remember_me: true
      });
      
      const { access_token, user: serviceUser } = response;
      console.log('[AuthContext] login successful, received token and user data');
      
      // 保存令牌到本地存储
      localStorage.setItem('auth_token', access_token);
      console.log('[AuthContext] saved auth_token to localStorage');
      
      // 转换用户数据
      const userInfo = mapServiceUserToUserInfo(serviceUser, access_token);
      console.log('[AuthContext] mapped user info:', userInfo);
      
      // 保存用户信息到本地存储
      localStorage.setItem('user', JSON.stringify(userInfo));
      console.log('[AuthContext] saved user info to localStorage');
      
      setUser(userInfo);
      return userInfo;
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setError(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 登出函数
  const logout = async () => {
    console.log('[AuthContext] logout called');
    setLoading(true);
    try {
      await authService.logout();
      
      console.log('[AuthContext] logout success, clearing localStorage and setting user to null');
      // 清除本地存储
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
    } catch (err: any) {
      console.log('[AuthContext] logout error:', err);
      setError(err.message || 'Logout failed. Please try again.');
      
      // 即使API调用失败，也清除本地会话
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      setUser(null);
      
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
      const response = await authService.register({
        username: email.split('@')[0], // 从邮箱生成用户名
        email,
        password,
        password_confirmation: password,
        first_name: name,
        last_name: ''
      });
      
      const { access_token, user: serviceUser } = response;
      
      // 保存令牌到本地存储
      localStorage.setItem('auth_token', access_token);
      
      // 转换用户数据
      const userInfo = mapServiceUserToUserInfo(serviceUser, access_token);
      
      setUser(userInfo);
      return userInfo;
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
      await authService.forgotPassword(email);
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
      await authService.changePassword({
        current_password: '', // 此处应根据实际API需求调整
        new_password: newPassword,
        new_password_confirmation: newPassword
      });
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
      // 转换为服务API需要的格式
      const profileData = {
        email: data.email,
        first_name: data.name,
        department: data.type
      };
      
      const updatedUser = await authService.updateProfile(profileData);
      
      if (user) {
        // 更新用户信息，保留原有令牌
        const updatedUserInfo = mapServiceUserToUserInfo(updatedUser, user.token);
        setUser(updatedUserInfo);
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
    getTranslatedUserName
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的自定义钩子
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    console.error('[AuthContext] useAuth called outside of AuthProvider. Context is undefined.'); // Add error log
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 