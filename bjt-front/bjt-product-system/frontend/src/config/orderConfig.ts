/**
 * 订单系统统一配置
 * 定义订单号格式、验证规则、错误处理等
 */

export const ORDER_CONFIG = {
  // 订单号格式配置
  ORDER_NUMBER: {
    // 🔧 修复：支持多种订单号格式
    // 原格式：PO-YYYYMMDDHHMM-XXXXXX
    // 实际格式：ORD-YYYYMMDD-XXXXXX
    FORMAT_PATTERNS: [
      /^PO-\d{12}-[A-Z0-9]{6}$/,     // 原PO格式
      /^ORD-\d{8}-[A-Z0-9]{6}$/,     // 实际ORD格式
      /^[A-Z]{2,4}-\d{8,12}-[A-Z0-9]{4,8}$/ // 通用格式：前缀-日期-随机字符
    ],
    PREFIX: ['PO-', 'ORD-'], // 支持多种前缀
    
    // 验证函数 - 支持多种格式
    validate: (orderNumber: string): boolean => {
      if (!orderNumber || typeof orderNumber !== 'string') {
        return false;
      }
      return ORDER_CONFIG.ORDER_NUMBER.FORMAT_PATTERNS.some(pattern => 
        pattern.test(orderNumber)
      );
    },
    
    // 格式说明
    DESCRIPTION: '支持格式：PO-YYYYMMDDHHMM-XXXXXX 或 ORD-YYYYMMDD-XXXXXX'
  },
  
  // API字段映射
  API_FIELDS: {
    // 前端字段 -> 后端字段
    FRONTEND_TO_BACKEND: {
      'orderNumber': 'order_number',
      'orderId': 'id',
      'createdAt': 'created_at',
      'updatedAt': 'updated_at'
    },
    
    // 后端字段 -> 前端字段
    BACKEND_TO_FRONTEND: {
      'order_number': 'orderNumber',
      'id': 'orderId',
      'created_at': 'createdAt',
      'updated_at': 'updatedAt'
    }
  },
  
  // 错误消息
  ERROR_MESSAGES: {
    MISSING_ORDER_NUMBER: '订单号缺失：订单号必须由后端API提供',
    INVALID_ORDER_NUMBER_FORMAT: '订单号格式无效：必须符合 PO-YYYYMMDDHHMM-XXXXXX 或 ORD-YYYYMMDD-XXXXXX 格式',
    MISSING_ORDER_ID: '订单ID缺失：无法识别订单',
    API_RESPONSE_INVALID: 'API响应格式无效：缺少必要的订单信息',
    FRONTEND_GENERATION_FORBIDDEN: '禁止前端生成订单号：订单号只能由后端API生成'
  },
  
  // 开发环境配置
  DEV: {
    ENABLE_MOCK_DATA: false, // 强制禁用Mock数据
    STRICT_VALIDATION: false, // 🔧 修复：放松验证模式，支持历史订单
    LOG_LEVEL: 'debug' // 日志级别
  }
} as const;

/**
 * 订单号验证工具
 */
export class OrderNumberValidator {
  /**
   * 验证订单号格式
   */
  static validate(orderNumber: string): { valid: boolean; error?: string } {
    if (!orderNumber || typeof orderNumber !== 'string') {
      return {
        valid: false,
        error: ORDER_CONFIG.ERROR_MESSAGES.MISSING_ORDER_NUMBER
      };
    }
    
    if (!ORDER_CONFIG.ORDER_NUMBER.validate(orderNumber)) {
      return {
        valid: false,
        error: `${ORDER_CONFIG.ERROR_MESSAGES.INVALID_ORDER_NUMBER_FORMAT} (收到: ${orderNumber})`
      };
    }
    
    return { valid: true };
  }
  
  /**
   * 从API响应中安全提取订单号
   */
  static extractFromApiResponse(apiResponse: any): { orderNumber: string; orderId: string } {
    if (!apiResponse || typeof apiResponse !== 'object') {
      throw new Error(ORDER_CONFIG.ERROR_MESSAGES.API_RESPONSE_INVALID);
    }
    
    // 🔧 修复：支持多种字段格式
    const orderId = apiResponse?.data?.orderId || 
                   apiResponse?.data?.id || 
                   apiResponse?.orderId || 
                   apiResponse?.id;
                   
    const orderNumber = apiResponse?.data?.orderNumber || 
                       apiResponse?.data?.order_number || 
                       apiResponse?.orderNumber || 
                       apiResponse?.order_number;
    
    console.log('🔧 [OrderNumberValidator] 字段提取结果:', {
      orderId,
      orderNumber,
      apiResponseStructure: {
        hasData: !!apiResponse?.data,
        dataKeys: apiResponse?.data ? Object.keys(apiResponse.data) : [],
        topLevelKeys: Object.keys(apiResponse)
      }
    });
    
    if (!orderId) {
      throw new Error(ORDER_CONFIG.ERROR_MESSAGES.MISSING_ORDER_ID);
    }
    
    if (!orderNumber) {
      throw new Error(ORDER_CONFIG.ERROR_MESSAGES.MISSING_ORDER_NUMBER);
    }
    
    const validation = this.validate(orderNumber);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return {
      orderId: String(orderId),
      orderNumber: String(orderNumber)
    };
  }
} 