/**
 * API配置验证工具
 * 用于检查和验证API配置的正确性
 */

import { API_BASE_URL } from '../api/config';

export interface ApiConfigValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  config: {
    baseUrl: string;
    environment: string;
    isRemote: boolean;
    useProxy: boolean;
  };
}

/**
 * 验证API配置
 */
export const validateApiConfig = (): ApiConfigValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 检测环境
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const isRemote = hostname !== 'localhost' && hostname !== '127.0.0.1';
  const useProxy = import.meta.env.VITE_USE_PROXY === 'true';
  
  // 检查基础URL
  if (!API_BASE_URL) {
    errors.push('API_BASE_URL 未定义');
  }
  
  // 检查URL格式
  if (API_BASE_URL && !API_BASE_URL.startsWith('http') && !API_BASE_URL.startsWith('/')) {
    errors.push('API_BASE_URL 格式不正确，应该以 http 或 / 开头');
  }
  
  // 远程环境检查
  if (isRemote) {
    if (API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1')) {
      errors.push('远程环境不应该使用 localhost 地址');
    }
    
    if (!API_BASE_URL.startsWith('/')) {
      warnings.push('远程环境建议使用相对路径，让 nginx 代理处理');
    }
  }
  
  // 本地环境检查
  if (!isRemote) {
    if (API_BASE_URL.startsWith('/') && !useProxy) {
      warnings.push('本地环境使用相对路径但未启用代理，可能导致请求失败');
    }
  }
  
  // 环境变量检查
  if (!import.meta.env.VITE_API_URL && isRemote) {
    warnings.push('远程环境建议设置 VITE_API_URL 环境变量');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    config: {
      baseUrl: API_BASE_URL,
      environment: isRemote ? 'remote' : 'local',
      isRemote,
      useProxy
    }
  };
};

/**
 * 测试API连接
 */
export const testApiConnection = async (): Promise<{
  success: boolean;
  status?: number;
  error?: string;
  responseTime: number;
}> => {
  const startTime = Date.now();
  
  try {
    const response = await fetch(`${API_BASE_URL.replace('/wp-json/bjt/v1', '')}/wp-json/bjt/v1`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(5000) // 5秒超时
    });
    
    const responseTime = Date.now() - startTime;
    
    return {
      success: response.ok,
      status: response.status,
      responseTime
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime
    };
  }
};

/**
 * 打印API配置信息
 */
export const logApiConfig = () => {
  const validation = validateApiConfig();
  
  console.group('🔧 API配置验证');
  console.log('配置状态:', validation.isValid ? '✅ 有效' : '❌ 无效');
  console.log('基础URL:', validation.config.baseUrl);
  console.log('环境:', validation.config.environment);
  console.log('是否远程:', validation.config.isRemote);
  console.log('使用代理:', validation.config.useProxy);
  
  if (validation.errors.length > 0) {
    console.error('错误:', validation.errors);
  }
  
  if (validation.warnings.length > 0) {
    console.warn('警告:', validation.warnings);
  }
  
  console.groupEnd();
  
  return validation;
};

/**
 * 自动修复API配置（如果可能）
 */
export const autoFixApiConfig = (): string | null => {
  const validation = validateApiConfig();
  
  if (validation.isValid) {
    return null; // 无需修复
  }
  
  // 尝试自动修复
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  const isRemote = hostname !== 'localhost' && hostname !== '127.0.0.1';
  
  if (isRemote && validation.config.baseUrl.includes('localhost')) {
    return '/wp-json/bjt/v1'; // 建议使用相对路径
  }
  
  return null; // 无法自动修复
}; 