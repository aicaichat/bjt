import { IntegratedMockService } from '../services/integrated-mock-service';

/**
 * 从环境变量获取配置值
 */
const getEnvConfig = () => {
  return {
    // API地址配置
    realApiBaseUrl: import.meta.env.VITE_REAL_API_BASE_URL || 'http://localhost:8080',
    mockApiBaseUrl: import.meta.env.VITE_MOCK_API_BASE_URL || 'mock://internal',
    
    // 数据源配置
    dataSource: import.meta.env.VITE_DATA_SOURCE as DataSourceType || null,
    forceMock: import.meta.env.VITE_FORCE_MOCK === 'true',
    
    // Mock服务配置
    enableCaching: import.meta.env.VITE_ENABLE_CACHING !== 'false', // 默认启用
    networkDelay: import.meta.env.VITE_NETWORK_DELAY === 'true',
    mockEnvironment: import.meta.env.VITE_MOCK_ENVIRONMENT || 'development',
    
    // 调试配置
    showMockStatus: import.meta.env.VITE_SHOW_MOCK_STATUS !== 'false', // 默认显示
    mockStatusPosition: import.meta.env.VITE_MOCK_STATUS_POSITION || 'top-right',
    debugLogs: import.meta.env.VITE_DEBUG_LOGS !== 'false' // 默认启用
  };
};

/**
 * API配置常量
 */
export const API_CONFIG = {
  REAL_API_BASE_URL: getEnvConfig().realApiBaseUrl,
  MOCK_API_BASE_URL: getEnvConfig().mockApiBaseUrl,
  API_ENDPOINTS: {
    machines: '/api/machines',
    accessories: '/api/accessories', 
    consumables: '/api/consumables',
    spareParts: '/api/spare-parts',
    productLines: '/api/product-lines',
    shapes: '/api/shapes',
    materials: '/api/materials'
  }
};

/**
 * 数据源类型
 */
export type DataSourceType = 'mock' | 'sql-mock' | 'real-api';

/**
 * Mock服务配置管理
 * 根据环境变量和不同环境自动配置Mock数据源和行为
 */
export const configureMockService = () => {
  const mockService = IntegratedMockService.getInstance();
  const envConfig = getEnvConfig();
  
  // 如果环境变量中明确指定了数据源，优先使用
  if (envConfig.dataSource) {
    const config = getDataSourceConfig(envConfig.dataSource, envConfig);
    mockService.setConfig(config);
    if (envConfig.debugLogs) {
      console.log(`🔧 环境变量配置: 使用${getDataSourceName(envConfig.dataSource)}`);
    }
    return;
  }
  
  // 如果强制使用Mock，则使用SQL Mock
  if (envConfig.forceMock) {
    const config = getDataSourceConfig('sql-mock', envConfig);
    mockService.setConfig(config);
    if (envConfig.debugLogs) {
      console.log('🔧 强制Mock模式: 使用SQL Mock数据');
    }
    return;
  }
  
  // 根据NODE_ENV环境变量配置
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isTest = process.env.NODE_ENV === 'test';
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isDevelopment) {
    // 开发环境：优先使用SQL Mock数据，便于调试
    const config = getDataSourceConfig('sql-mock', envConfig);
    mockService.setConfig(config);
    if (envConfig.debugLogs) {
      console.log('🔧 开发环境: 使用SQL Mock数据，启用缓存，关闭网络延迟');
    }
  } else if (isTest) {
    // 测试环境：使用SQL数据，关闭缓存确保测试准确性
    const config = getDataSourceConfig('sql-mock', envConfig);
    config.enableCaching = false; // 测试环境强制关闭缓存
    mockService.setConfig(config);
    if (envConfig.debugLogs) {
      console.log('🧪 测试环境: 使用SQL Mock数据，关闭缓存和网络延迟');
    }
  } else if (isProduction) {
    // 生产环境：默认使用真实API
    const config = getDataSourceConfig('real-api', envConfig);
    mockService.setConfig(config);
    if (envConfig.debugLogs) {
      console.log('🚀 生产环境: 使用真实API，启用缓存');
    }
  } else {
    // 默认配置
    const config = getDataSourceConfig('sql-mock', envConfig);
    mockService.setConfig(config);
    if (envConfig.debugLogs) {
      console.log('⚡ 默认配置: 使用SQL Mock数据');
    }
  }

  // 打印配置状态
  if (envConfig.debugLogs) {
    const status = mockService.getServiceStatus();
    console.log('📊 Mock服务状态:', {
      active: status.isActive,
      source: status.dataSource,
      tables: status.totalTables,
      records: status.totalRecords,
      environment: status.config.mockEnvironment,
      apiUrl: status.config.apiBaseUrl
    });
  }
};

/**
 * 根据数据源类型获取配置
 */
const getDataSourceConfig = (dataSourceType: DataSourceType, envConfig: ReturnType<typeof getEnvConfig>) => {
  const baseConfig = {
    mockEnvironment: envConfig.mockEnvironment as any,
    enableCaching: envConfig.enableCaching,
    networkDelay: envConfig.networkDelay
  };

  switch (dataSourceType) {
    case 'mock':
      return {
        ...baseConfig,
        useRealSQLData: false,
        useRealAPI: false,
        apiBaseUrl: envConfig.mockApiBaseUrl
      };
    case 'sql-mock':
      return {
        ...baseConfig,
        useRealSQLData: true,
        useRealAPI: false,
        apiBaseUrl: envConfig.mockApiBaseUrl
      };
    case 'real-api':
      return {
        ...baseConfig,
        useRealSQLData: false,
        useRealAPI: true,
        apiBaseUrl: envConfig.realApiBaseUrl
      };
    default:
      throw new Error(`未知的数据源类型: ${dataSourceType}`);
  }
};

/**
 * 获取数据源显示名称
 */
const getDataSourceName = (dataSourceType: DataSourceType): string => {
  switch (dataSourceType) {
    case 'real-api':
      return '真实API';
    case 'sql-mock':
      return 'SQL Mock数据';
    case 'mock':
      return '传统Mock文件';
    default:
      return '未知数据源';
  }
};

/**
 * 手动切换数据源
 */
export const switchDataSource = (dataSourceType: DataSourceType) => {
  const mockService = IntegratedMockService.getInstance();
  const envConfig = getEnvConfig();
  const config = getDataSourceConfig(dataSourceType, envConfig);
  
  mockService.setConfig(config);
  
  if (envConfig.debugLogs) {
    console.log(`🔄 切换数据源: ${getDataSourceName(dataSourceType)}`);
  }
};

/**
 * 手动切换Mock数据源 (保持向后兼容)
 */
export const switchMockDataSource = (useSQL: boolean) => {
  switchDataSource(useSQL ? 'sql-mock' : 'mock');
};

/**
 * 获取当前数据源类型
 */
export const getCurrentDataSourceType = (): DataSourceType => {
  const mockService = IntegratedMockService.getInstance();
  const config = mockService.getConfig();
  
  if (config.useRealAPI) {
    return 'real-api';
  } else if (config.useRealSQLData) {
    return 'sql-mock';
  } else {
    return 'mock';
  }
};

/**
 * 获取当前Mock服务状态
 */
export const getMockStatus = () => {
  const mockService = IntegratedMockService.getInstance();
  return mockService.getServiceStatus();
};

/**
 * 获取API完整URL
 */
export const getApiUrl = (endpoint: keyof typeof API_CONFIG.API_ENDPOINTS): string => {
  const mockService = IntegratedMockService.getInstance();
  const config = mockService.getConfig();
  const baseUrl = config.apiBaseUrl || API_CONFIG.MOCK_API_BASE_URL;
  const endpointPath = API_CONFIG.API_ENDPOINTS[endpoint];
  
  return config.useRealAPI ? `${baseUrl}${endpointPath}` : endpointPath;
}; 