/**
 * 真实API配置管理器
 * 管理真实后端API的连接配置和认证信息
 */

export interface RealApiConfig {
  baseUrl: string;
  timeout: number;
  authRequired: boolean;
  authToken?: string;
  retryCount: number;
  retryDelay: number;
  headers: Record<string, string>;
}

export interface ApiEnvironment {
  name: string;
  baseUrl: string;
  description: string;
  requiresAuth: boolean;
}

class RealApiConfigManager {
  private config: RealApiConfig;
  private environments: Record<string, ApiEnvironment> = {
    local: {
      name: 'Local Development',
      baseUrl: 'http://localhost:8080/wp-json',
      description: '本地开发环境',
      requiresAuth: false
    },
    docker: {
      name: 'Docker Environment',
      baseUrl: 'http://127.0.0.1:80/wp-json',
      description: 'Docker开发环境',
      requiresAuth: false
    },
    staging: {
      name: 'Staging Environment',
      baseUrl: 'https://staging-api.bjt.com/wp-json',
      description: '测试环境',
      requiresAuth: true
    },
    production: {
      name: 'Production Environment',
      baseUrl: 'https://api.bjt.com/wp-json',
      description: '生产环境',
      requiresAuth: true
    }
  };

  constructor() {
    this.config = this.initializeConfig();
  }

  private initializeConfig(): RealApiConfig {
    // 从环境变量或配置文件读取配置
    const environment = this.getEnvironment();
    const env = this.environments[environment];
    
    return {
      baseUrl: env.baseUrl,
      timeout: parseInt(process.env.VITE_API_TIMEOUT || '10000'),
      authRequired: env.requiresAuth,
      authToken: this.getAuthToken(),
      retryCount: 3,
      retryDelay: 1000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-API-Version': 'v1',
        'X-Client': 'BJT-Frontend-Tests'
      }
    };
  }

  private getEnvironment(): string {
    // 优先级：环境变量 > URL检测 > 默认值
    const envVar = process.env.VITE_API_ENVIRONMENT;
    if (envVar && this.environments[envVar]) {
      return envVar;
    }

    // 根据当前URL检测环境
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return window.location.port === '8080' ? 'docker' : 'local';
      }
      
      if (hostname.includes('staging')) {
        return 'staging';
      }
      
      if (hostname.includes('bjt.com')) {
        return 'production';
      }
    }

    // 默认环境
    return 'local';
  }

  private getAuthToken(): string | undefined {
    // 优先级：环境变量 > localStorage > 默认测试token
    const envToken = process.env.VITE_API_TEST_TOKEN;
    if (envToken) {
      return envToken;
    }

    if (typeof window !== 'undefined') {
      const storageToken = localStorage.getItem('auth_token') || localStorage.getItem('test_auth_token');
      if (storageToken) {
        return storageToken;
      }
    }

    // 开发环境的默认测试token
    const environment = this.getEnvironment();
    if (environment === 'local' || environment === 'docker') {
      return 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAiLCJpYXQiOjE2ODMwMDAwMDAsImV4cCI6MTk5OTk5OTk5OSwidXNlciI6eyJpZCI6MX19.gHpqpeoq_NBRF2-v1UG9XNWG2X2Sj9pB5stCN4Y5IxA';
    }

    return undefined;
  }

  getConfig(): RealApiConfig {
    return { ...this.config };
  }

  getHeaders(): Record<string, string> {
    const headers = { ...this.config.headers };
    
    if (this.config.authToken) {
      headers['Authorization'] = `Bearer ${this.config.authToken}`;
    }
    
    return headers;
  }

  getCurrentEnvironment(): ApiEnvironment {
    const envName = this.getEnvironment();
    return this.environments[envName];
  }

  getAllEnvironments(): Record<string, ApiEnvironment> {
    return { ...this.environments };
  }

  updateConfig(updates: Partial<RealApiConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  setAuthToken(token: string): void {
    this.config.authToken = token;
    
    // 保存到localStorage供后续使用
    if (typeof window !== 'undefined') {
      localStorage.setItem('test_auth_token', token);
    }
  }

  clearAuthToken(): void {
    this.config.authToken = undefined;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('test_auth_token');
    }
  }

  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.baseUrl) {
      errors.push('基础URL未配置');
    } else {
      try {
        new URL(this.config.baseUrl);
      } catch {
        errors.push('基础URL格式无效');
      }
    }

    if (this.config.timeout < 1000) {
      errors.push('超时时间过短（应大于1000ms）');
    }

    if (this.config.authRequired && !this.config.authToken) {
      errors.push('需要认证但未提供认证令牌');
    }

    if (this.config.retryCount < 0 || this.config.retryCount > 10) {
      errors.push('重试次数应在0-10之间');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getApiUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.replace(/\/$/, '');
    const cleanEndpoint = endpoint.replace(/^\//, '');
    return `${baseUrl}/${cleanEndpoint}`;
  }

  // 用于测试的快速配置方法
  configureForTest(environment: 'local' | 'docker' | 'staging' | 'production', options?: {
    authToken?: string;
    timeout?: number;
  }): void {
    const env = this.environments[environment];
    this.config = {
      ...this.config,
      baseUrl: env.baseUrl,
      authRequired: env.requiresAuth,
      timeout: options?.timeout || this.config.timeout
    };

    if (options?.authToken) {
      this.setAuthToken(options.authToken);
    }
  }

  // 创建测试专用的fetch函数
  createTestFetch() {
    return async (url: string, options: RequestInit = {}): Promise<Response> => {
      const fullUrl = url.startsWith('http') ? url : this.getApiUrl(url);
      
      const requestOptions: RequestInit = {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        },
        signal: options.signal || AbortSignal.timeout(this.config.timeout)
      };

      let lastError: Error;
      
      // 重试逻辑
      for (let attempt = 0; attempt <= this.config.retryCount; attempt++) {
        try {
          const response = await fetch(fullUrl, requestOptions);
          
          // 记录API调用信息
          console.log(`🌐 API调用: ${requestOptions.method || 'GET'} ${fullUrl} - ${response.status}`);
          
          return response;
        } catch (error) {
          lastError = error as Error;
          
          if (attempt < this.config.retryCount) {
            console.log(`🔄 API调用失败，${this.config.retryDelay}ms后重试 (${attempt + 1}/${this.config.retryCount})`);
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          }
        }
      }
      
      throw lastError!;
    };
  }

  // 获取配置摘要
  getConfigSummary(): string {
    const env = this.getCurrentEnvironment();
    const validation = this.validateConfig();
    
    return `
真实API配置摘要:
- 环境: ${env.name}
- 基础URL: ${this.config.baseUrl}
- 认证: ${this.config.authRequired ? '需要' : '不需要'}
- 超时: ${this.config.timeout}ms
- 重试: ${this.config.retryCount}次
- 状态: ${validation.valid ? '✅ 配置有效' : '❌ 配置无效'}
${validation.errors.length > 0 ? '- 错误: ' + validation.errors.join(', ') : ''}
    `.trim();
  }
}

// 导出单例实例
export const realApiConfig = new RealApiConfigManager(); 