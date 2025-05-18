import React, { useState } from 'react';
import '../styles/ApiIntegrationStatus.css';

// API配置
const API_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '/wp-json/bjt/v1',
  USE_MOCK_DATA: import.meta.env.VITE_USE_MOCK_DATA === 'true',
  DEBUG: import.meta.env.VITE_DEBUG === 'true'
};

// API集成状态
const apiIntegrationStatus = {
  services: {
    product_line: {
      name: '产品线',
      endpoints: [
        { name: '获取产品线列表', path: '/product-lines', method: 'GET', completed: true },
        { name: '获取产品线详情', path: '/product-lines/{id}', method: 'GET', completed: true },
        { name: '创建产品线', path: '/product-lines', method: 'POST', completed: true },
        { name: '更新产品线', path: '/product-lines/{id}', method: 'PUT', completed: true },
        { name: '删除产品线', path: '/product-lines/{id}', method: 'DELETE', completed: true }
      ]
    },
    machine: {
      name: '设备',
      endpoints: [
        { name: '获取设备列表', path: '/machines', method: 'GET', completed: true },
        { name: '获取设备详情', path: '/machines/{id}', method: 'GET', completed: true },
        { name: '创建设备', path: '/machines', method: 'POST', completed: true },
        { name: '更新设备', path: '/machines/{id}', method: 'PUT', completed: true },
        { name: '删除设备', path: '/machines/{id}', method: 'DELETE', completed: true }
      ]
    },
    spare_part: {
      name: '备件',
      endpoints: [
        { name: '获取备件列表', path: '/spare-parts', method: 'GET', completed: true },
        { name: '获取备件详情', path: '/spare-parts/{id}', method: 'GET', completed: true },
        { name: '创建备件', path: '/spare-parts', method: 'POST', completed: true },
        { name: '更新备件', path: '/spare-parts/{id}', method: 'PUT', completed: true },
        { name: '删除备件', path: '/spare-parts/{id}', method: 'DELETE', completed: true }
      ]
    },
    accessory: {
      name: '配件',
      endpoints: [
        { name: '获取配件列表', path: '/accessories', method: 'GET', completed: true },
        { name: '获取配件详情', path: '/accessories/{id}', method: 'GET', completed: true },
        { name: '创建配件', path: '/accessories', method: 'POST', completed: true },
        { name: '更新配件', path: '/accessories/{id}', method: 'PUT', completed: true },
        { name: '删除配件', path: '/accessories/{id}', method: 'DELETE', completed: true }
      ]
    },
    consumable: {
      name: '耗材',
      endpoints: [
        { name: '获取耗材列表', path: '/consumables', method: 'GET', completed: true },
        { name: '获取耗材详情', path: '/consumables/{id}', method: 'GET', completed: true },
        { name: '创建耗材', path: '/consumables', method: 'POST', completed: true },
        { name: '更新耗材', path: '/consumables/{id}', method: 'PUT', completed: true },
        { name: '删除耗材', path: '/consumables/{id}', method: 'DELETE', completed: true }
      ]
    },
    cart: {
      name: '购物车',
      endpoints: [
        { name: '获取购物车', path: '/cart', method: 'GET', completed: true },
        { name: '添加商品到购物车', path: '/cart/items', method: 'POST', completed: true },
        { name: '更新购物车商品数量', path: '/cart/items/{id}', method: 'PUT', completed: true },
        { name: '从购物车移除商品', path: '/cart/items/{id}', method: 'DELETE', completed: true },
        { name: '清空购物车', path: '/cart/clear', method: 'POST', completed: true }
      ]
    },
    order: {
      name: '订单',
      endpoints: [
        { name: '获取订单列表', path: '/orders', method: 'GET', completed: true },
        { name: '获取订单详情', path: '/orders/{id}', method: 'GET', completed: true },
        { name: '创建订单', path: '/orders', method: 'POST', completed: true },
        { name: '更新订单状态', path: '/orders/{id}', method: 'PUT', completed: true },
        { name: '取消订单', path: '/orders/{id}/cancel', method: 'PUT', completed: true },
        { name: '导出订单PO文档', path: '/orders/{id}/po', method: 'GET', completed: true },
        { name: '重新下单', path: '/orders/{id}/reorder', method: 'POST', completed: true }
      ]
    },
    auth: {
      name: '认证',
      endpoints: [
        { name: '用户登录', path: '/auth/login', method: 'POST', completed: true },
        { name: '用户注册', path: '/auth/register', method: 'POST', completed: true },
        { name: '用户登出', path: '/auth/logout', method: 'POST', completed: true },
        { name: '刷新访问令牌', path: '/auth/refresh', method: 'POST', completed: true },
        { name: '获取当前用户信息', path: '/auth/me', method: 'GET', completed: true },
        { name: '更新用户资料', path: '/auth/profile', method: 'PUT', completed: true },
        { name: '更改密码', path: '/auth/password', method: 'PUT', completed: true },
        { name: '忘记密码：发送重置链接', path: '/auth/forgot-password', method: 'POST', completed: true },
        { name: '验证邮箱', path: '/auth/verify-email', method: 'POST', completed: true }
      ]
    }
  }
};

// 计算完成进度
const calculateProgress = () => {
  let totalEndpoints = 0;
  let completedEndpoints = 0;

  Object.values(apiIntegrationStatus.services).forEach(service => {
    totalEndpoints += service.endpoints.length;
    completedEndpoints += service.endpoints.filter(endpoint => endpoint.completed).length;
  });

  return {
    totalEndpoints,
    completedEndpoints,
    percentage: Math.round((completedEndpoints / totalEndpoints) * 100)
  };
};

const ApiIntegrationStatus: React.FC = () => {
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({
    product_line: true,
    spare_part: true,
    machine: true,
    accessory: true,
    consumable: true
  });

  const progress = calculateProgress();

  // 切换服务展开状态
  const toggleService = (serviceKey: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [serviceKey]: !prev[serviceKey]
    }));
  };

  return (
    <div className="api-integration-status">
      <h1>API 集成进度</h1>
      
      {/* 环境信息 */}
      <div className="environment-info">
        <h2>环境信息</h2>
        <div className="info-items">
          <div className="info-item">
            <span className="info-label">API 基础路径:</span>
            <span className="info-value">{API_CONFIG.API_BASE_URL}</span>
          </div>
          <div className="info-item">
            <span className="info-label">使用模拟数据:</span>
            <span className="info-value">{API_CONFIG.USE_MOCK_DATA ? '是' : '否'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">调试模式:</span>
            <span className="info-value">{API_CONFIG.DEBUG ? '开启' : '关闭'}</span>
          </div>
        </div>
      </div>
      
      {/* 总体进度 */}
      <div className="overall-progress">
        <h2>总体进度</h2>
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress.percentage}%` }}>
            <span className="progress-text">{progress.percentage}%</span>
          </div>
        </div>
        <div className="progress-stats">
          <span>已完成: {progress.completedEndpoints} / {progress.totalEndpoints} 个接口</span>
        </div>
      </div>
      
      {/* 服务集成状态 */}
      <div className="services-status">
        <h2>服务集成状态</h2>
        
        {Object.entries(apiIntegrationStatus.services).map(([serviceKey, service]) => {
          const serviceEndpoints = service.endpoints;
          const completedEndpoints = serviceEndpoints.filter(endpoint => endpoint.completed).length;
          const serviceProgress = Math.round((completedEndpoints / serviceEndpoints.length) * 100);
          
          return (
            <div key={serviceKey} className="service-card">
              <div 
                className="service-header"
                onClick={() => toggleService(serviceKey)}
              >
                <h3>{service.name}</h3>
                <div className="service-progress">
                  <div className="progress-bar-small">
                    <div 
                      className="progress-fill"
                      style={{ width: `${serviceProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-percentage">{serviceProgress}%</span>
                  <span className="toggle-icon">
                    {expandedServices[serviceKey as keyof typeof expandedServices] ? '▼' : '►'}
                  </span>
                </div>
              </div>
              
              {expandedServices[serviceKey as keyof typeof expandedServices] && (
                <div className="endpoints-list">
                  <table>
                    <thead>
                      <tr>
                        <th>接口名称</th>
                        <th>路径</th>
                        <th>方法</th>
                        <th>状态</th>
                      </tr>
                    </thead>
                    <tbody>
                      {serviceEndpoints.map((endpoint, index) => (
                        <tr key={index}>
                          <td>{endpoint.name}</td>
                          <td><code>{endpoint.path}</code></td>
                          <td><code>{endpoint.method || 'GET'}</code></td>
                          <td>
                            <span className={`status-indicator ${endpoint.completed ? 'completed' : 'pending'}`}>
                              {endpoint.completed ? '已完成' : '待开发'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* 状态指示器图例 */}
      <div className="status-legend">
        <div className="legend-item">
          <span className="status-dot completed"></span>
          <span>已完成</span>
        </div>
        <div className="legend-item">
          <span className="status-dot pending"></span>
          <span>待开发</span>
        </div>
      </div>
    </div>
  );
};

export default ApiIntegrationStatus; 