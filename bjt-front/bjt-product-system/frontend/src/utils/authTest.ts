/**
 * 认证测试工具
 * 用于调试和测试认证流程
 */

import { authService } from '../services/auth';
import apiService from '../services/apiService';

export interface LoginTestResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export interface ApiTestResult {
  success: boolean;
  data?: any;
  error?: string;
  status?: number;
}

/**
 * 测试登录API
 */
export const testLogin = async (username: string = 'admin', password: string = 'password'): Promise<LoginTestResult> => {
  try {
    console.log('🔐 [测试登录] 开始测试...');
    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ [测试登录] 登录失败:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ [测试登录] 登录成功:', data);

    if (data.success && data.data.token) {
      // 保存token到localStorage
      localStorage.setItem('auth_token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      console.log('💾 [测试登录] Token已保存到localStorage');
      
      return {
        success: true,
        token: data.data.token,
        user: data.data.user
      };
    } else {
      throw new Error('登录响应格式错误');
    }
  } catch (error: any) {
    console.error('❌ [测试登录] 登录失败:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 测试机器部件API
 */
export const testMachinePartsApi = async (): Promise<ApiTestResult> => {
  try {
    console.log('🔧 [测试API] 开始测试机器部件API...');
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      throw new Error('未找到认证token，请先登录');
    }

    console.log('🔐 [测试API] 使用token:', token.substring(0, 15) + '...');

    const response = await fetch('http://localhost:8080/wp-json/bjt/v1/machineparts?page=1&per_page=5&status=publish', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('❌ [测试API] API调用失败:', {
        status: response.status,
        statusText: response.statusText,
        errorData
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📡 [测试API] API响应:', response.status, data);

    if (response.ok && data.success) {
      console.log('✅ [测试API] API调用成功');
      return {
        success: true,
        data: data.data,
        status: response.status
      };
    } else {
      throw new Error(`API调用失败: ${data.message || response.statusText}`);
    }
  } catch (error: any) {
    console.error('❌ [测试API] API调用失败:', error);
    return {
      success: false,
      error: error.message,
      status: error.status
    };
  }
};

/**
 * 完整的认证流程测试
 */
export const runFullAuthTest = async (): Promise<void> => {
  console.log('🚀 [完整测试] 开始完整的认证流程测试...');
  
  // 1. 测试登录
  const loginResult = await testLogin();
  if (!loginResult.success) {
    console.error('❌ [完整测试] 登录测试失败，停止测试');
    return;
  }
  
  // 2. 等待一秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 3. 测试API调用
  const apiResult = await testMachinePartsApi();
  if (!apiResult.success) {
    console.error('❌ [完整测试] API测试失败');
    return;
  }
  
  console.log('🎉 [完整测试] 所有测试通过！');
};

/**
 * 测试认证流程
 */
export async function testAuthFlow() {
  console.log('🧪 Starting authentication flow test...');

  // 1. 检查初始状态
  console.log('\n1️⃣ Initial State:');
  console.log('Is authenticated:', authService.isAuthenticated());
  console.log('Current token:', authService.getToken());

  // 2. 测试登录
  console.log('\n2️⃣ Testing Login:');
  try {
    const response = await authService.login('admin', 'password');
    console.log('Login response:', response);
  } catch (error) {
    console.error('Login failed:', error);
  }

  // 3. 检查登录后的状态
  console.log('\n3️⃣ Post-Login State:');
  console.log('Is authenticated:', authService.isAuthenticated());
  console.log('Current token:', authService.getToken());

  // 4. 测试token刷新
  console.log('\n4️⃣ Testing Token Refresh:');
  try {
    const refreshed = await authService.refreshToken();
    console.log('Token refresh result:', refreshed);
  } catch (error) {
    console.error('Token refresh failed:', error);
  }

  // 5. 测试登出
  console.log('\n5️⃣ Testing Logout:');
  authService.logout();
  console.log('Is authenticated:', authService.isAuthenticated());
  console.log('Current token:', authService.getToken());

  console.log('\n✅ Authentication flow test completed');
}

// 导出测试函数
export default testAuthFlow;

// 导出到全局window对象，方便在浏览器控制台中调用
if (typeof window !== 'undefined') {
  (window as any).authTest = {
    testLogin,
    testMachinePartsApi,
    runFullAuthTest,
    testAuthFlow
  };
} 