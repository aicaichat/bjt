import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, UserRole, UnitSystem, UserPermissions } from '../api/services/auth.service';
import { useMockData } from '../config/env';

// 用户角色定义
export { UserRole } from '../api/services/auth.service';

// 单位制类型定义
export type { UnitSystem } from '../api/services/auth.service';

// 用户权限定义
export type { UserPermissions } from '../api/services/auth.service';

// 用户信息接口
export type { User } from '../api/services/auth.service';

// 认证上下文接口
interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (profileData: any) => Promise<void>;
  refreshToken: () => Promise<void>;
  isAuthenticated: boolean;
  hasPermission: (permission: string) => boolean;
  getUserRole: () => UserRole | null;
  getPreferredUnit: () => UnitSystem;
  setPreferredUnit: (unit: UnitSystem) => Promise<void>;
}

// 创建认证上下文
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 认证提供者组件属性
interface AuthProviderProps {
  children: ReactNode;
}

// 认证提供者组件
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // 检查用户是否已认证
  const isAuthenticated = authService.isAuthenticated();

  // 初始化认证状态
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        // 检查本地存储的用户信息
        const storedUser = authService.getUser();
        const token = authService.getToken();
        
        if (storedUser && token) {
          console.log('🔍 [AuthProvider] Found stored user and token, checking validity...');
          
          // 🔧 检查token是否过期
          try {
            const payload = token.split('.')[1];
            if (payload) {
              const decoded = JSON.parse(atob(payload));
              const tokenExpiry = decoded.exp * 1000;
              const now = Date.now();
              
              console.log('🔐 [AuthProvider] Token expiry check:', {
                tokenExpiry: new Date(tokenExpiry),
                currentTime: new Date(now),
                isExpired: tokenExpiry < now
              });
              
              if (tokenExpiry < now) {
                console.warn('⚠️ [AuthProvider] Token has expired, clearing auth state');
                // 清除过期的认证信息
                await authService.logout();
                setUser(null);
                setLoading(false);
                return;
              }
            }
          } catch (tokenParseError) {
            console.error('❌ [AuthProvider] Failed to parse token, clearing auth state:', tokenParseError);
            await authService.logout();
            setUser(null);
            setLoading(false);
            return;
          }
          
          try {
            // 尝试获取最新的用户信息
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
            console.log('✅ [AuthProvider] Successfully loaded current user:', currentUser.username);
          } catch (error) {
            console.error('❌ [AuthProvider] Failed to get current user, token may be invalid:', error);
            
            // 🔧 当获取用户信息失败时，检查是否是认证错误
            if (error instanceof Error && (
              error.message.includes('401') || 
              error.message.includes('未授权') ||
              error.message.includes('Unauthorized')
            )) {
              console.warn('🔄 [AuthProvider] Token invalid, clearing auth state');
              await authService.logout();
              setUser(null);
            } else {
              // 对于其他错误（如网络错误），使用存储的用户信息但记录警告
              console.warn('⚠️ [AuthProvider] Using stored user due to API error:', error);
              setUser(storedUser);
            }
          }
        } else {
          console.log('🔍 [AuthProvider] No stored user or token found');
          setUser(null);
        }
      } catch (error) {
        console.error('❌ [AuthProvider] Failed to initialize auth:', error);
        // 清除可能损坏的认证状态
        await authService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 登录函数
  const login = async (username: string, password: string, rememberMe: boolean = false) => {
    try {
      setLoading(true);
      console.log('🔐 [AuthProvider] Attempting login for user:', username);
      
      const response = await authService.login({
        username,
        password,
        remember_me: rememberMe,
      });
      
      if (response.success && response.data.user) {
        setUser(response.data.user);
        console.log('✅ [AuthProvider] Login successful for user:', response.data.user.username);
      } else {
        throw new Error('登录响应格式错误');
      }
    } catch (error) {
      console.error('❌ [AuthProvider] Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 退出登录函数
  const logout = async () => {
    try {
      setLoading(true);
      console.log('🚪 [AuthProvider] Logging out user');
      
      await authService.logout();
      setUser(null);
      
      console.log('✅ [AuthProvider] Logout successful');
    } catch (error) {
      console.error('❌ [AuthProvider] Logout failed:', error);
      // 即使退出登录API失败，也要清除本地状态
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 更新用户资料函数
  const updateProfile = async (profileData: any) => {
    try {
      setLoading(true);
      console.log('📝 [AuthProvider] Updating user profile');
      
      const response = await authService.updateProfile(profileData);
      
      if (response.success && response.data) {
        setUser(response.data);
        console.log('✅ [AuthProvider] Profile updated successfully');
      } else {
        throw new Error('更新用户资料响应格式错误');
      }
    } catch (error) {
      console.error('❌ [AuthProvider] Update profile failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 刷新令牌函数
  const refreshToken = async () => {
    try {
      console.log('🔄 [AuthProvider] Refreshing token');
      
      await authService.refreshToken();
      
      // 刷新令牌后，重新获取用户信息
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
      
      console.log('✅ [AuthProvider] Token refreshed successfully');
    } catch (error) {
      console.error('❌ [AuthProvider] Token refresh failed:', error);
      // 如果刷新失败，清除用户状态
      setUser(null);
      throw error;
    }
  };

  // 检查用户权限
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return authService.hasPermission(permission);
  };

  // 获取用户角色
  const getUserRole = (): UserRole | null => {
    return user?.role || null;
  };

  // 获取用户偏好单位制
  const getPreferredUnit = (): UnitSystem => {
    return user?.preferred_unit || 'metric';
  };

  // 设置用户偏好单位制
  const setPreferredUnit = async (unit: UnitSystem) => {
    try {
      await updateProfile({ preferred_unit: unit });
      console.log('✅ [AuthProvider] Preferred unit updated to:', unit);
    } catch (error) {
      console.error('❌ [AuthProvider] Failed to update preferred unit:', error);
      throw error;
    }
  };

  // 上下文值
  const contextValue: AuthContextType = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    refreshToken,
    isAuthenticated,
    hasPermission,
    getUserRole,
    getPreferredUnit,
    setPreferredUnit,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 使用认证上下文的Hook
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// 默认导出
export default AuthContext; 