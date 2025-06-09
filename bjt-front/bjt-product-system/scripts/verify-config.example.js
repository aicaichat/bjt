// 验证脚本配置示例
// 复制此文件为 verify-config.js 并修改相应的配置

module.exports = {
  database: {
    host: 'localhost',
    user: 'your_db_user',
    password: 'your_db_password',
    database: 'bjt_product_system',
    port: 3306
  },
  api: {
    baseUrl: 'http://localhost:8080/wp-json/bjt/v1',
    maxLevels: 5,
    lang: 'zh',
    // 如果API需要认证，可以添加headers
    headers: {
      // 'Authorization': 'Bearer your_token',
      // 'X-API-Key': 'your_api_key'
    }
  },
  // 产品线映射
  productLines: {
    1: 'air-cushion',
    2: 'paper', 
    3: 'tape'
  },
  // 验证选项
  validation: {
    // 是否检查配件数据是否存在于配件表中
    checkAccessoryData: true,
    // 是否允许API中存在数据库中没有的节点（用于测试模式）
    allowExtraApiNodes: false,
    // 最大允许的问题数量，超过则停止验证
    maxIssuesPerHost: 100
  }
}; 