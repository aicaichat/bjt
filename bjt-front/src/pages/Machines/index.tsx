// src/pages/Machines/index.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { Spin, message, Button, Select, InputNumber, Tabs, Tag } from 'antd';
import { ShoppingCartOutlined, InfoCircleOutlined, PlusOutlined, MinusOutlined, ExclamationCircleOutlined, ReloadOutlined } from '@ant-design/icons';

// 导入API服务
import machinesService from '../../services/machinesService';
import { MachineProduct } from '../../types/machines';
import { useMockData } from '../../config/env';

import './Machines.css';

const { Option } = Select;
const { TabPane } = Tabs;

// 在适当的位置添加区域配置常量
const REGIONS = {
  CN: {
    code: 'CN',
    nameCn: '中国',
    nameEn: 'China',
    currencySymbol: '¥',
    voltage: '220V',
  },
  EU: {
    code: 'EU',
    nameCn: '欧洲',
    nameEn: 'Europe',
    currencySymbol: '€',
    voltage: '220V',
  },
  NA: {
    code: 'NA',
    nameCn: '北美',
    nameEn: 'North America',
    currencySymbol: '$',
    voltage: '110V',
  },
  AU: {
    code: 'AU',
    nameCn: '澳洲',
    nameEn: 'Australia',
    currencySymbol: 'A$',
    voltage: '220V',
  }
};

// 修改默认电压初始化逻辑
const getDefaultVoltageByRegion = (region: string): string => {
  switch(region) {
      case 'NA':
      return REGIONS.NA.voltage;
    case 'CN':
      case 'EU':
      case 'AU':
      default:
      return REGIONS.CN.voltage;
  }
};

const MachinesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addItem } = useCart();
  
  // 产品和过滤相关状态
  const [machines, setMachines] = useState<MachineProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>(user?.region || 'CN');
  
  // 用户交互相关状态
  const [selectedMachine, setSelectedMachine] = useState<string>('');
  const [selectedVoltage, setSelectedVoltage] = useState<string>(getDefaultVoltageByRegion(user?.region || 'CN'));
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [showNotification, setShowNotification] = useState<boolean>(false);
  const [notificationProduct, setNotificationProduct] = useState<string>('');
  const [notificationQuantity, setNotificationQuantity] = useState<number>(1);
  const [cartCount, setCartCount] = useState<number>(0);
  
  // 配件相关状态
  const [accessories, setAccessories] = useState<any[]>([]);
  const [accessoriesLoading, setAccessoriesLoading] = useState<boolean>(false);
  const [selectedAccessories, setSelectedAccessories] = useState<Record<string, string>>({});
  const [selectedAccessoryNames, setSelectedAccessoryNames] = useState<Record<string, string>>({});
  const [level2Accessories, setLevel2Accessories] = useState<any[]>([]);
  const [level3Accessories, setLevel3Accessories] = useState<any[]>([]);
  const [level4Accessories, setLevel4Accessories] = useState<any[]>([]);
  const [level5Accessories, setLevel5Accessories] = useState<any[]>([]);
  const [level2Loading, setLevel2Loading] = useState<boolean>(false);
  const [level3Loading, setLevel3Loading] = useState<boolean>(false);
  const [level4Loading, setLevel4Loading] = useState<boolean>(false);
  const [level5Loading, setLevel5Loading] = useState<boolean>(false);
  
  // 判断用户角色和权限
  const isSales = user && (user.role === 'sales' || user.role === 'admin');
  const isAdmin = user && user.role === 'admin';
  const isVIP = user && (user.vipLevel ? user.vipLevel >= 2 : user.type === 'vip');
  const userRegion = filterRegion || user?.region || 'CN';
  
  // 修改默认视图为表格模式
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  
  // 从API获取设备列表
  useEffect(() => {
    const fetchMachines = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await machinesService.getMachines({
          region: userRegion,
          lang: 'zh'
        });
        
        if (response.success) {
          setMachines(response.data.items);
          
          // 初始化数量状态
          const initialQuantities: Record<string, number> = {};
          response.data.items.forEach(machine => {
            initialQuantities[machine.id] = 1;
          });
          setQuantities(initialQuantities);
          
          // 如果有数据，默认选中第一个机器
          if (response.data.items.length > 0) {
            setSelectedMachine(response.data.items[0].id);
          }
        } else {
          setError('获取机器列表失败');
          message.error('获取设备列表失败，请稍后重试');
        }
      } catch (err) {
        setError('获取数据时发生错误');
        message.error('系统错误，请联系管理员');
        console.error('Failed to fetch machines:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMachines();
  }, [userRegion]);
  
  // 过滤产品
  const filteredMachines = React.useMemo(() => {
    if (filterType === 'all') {
      return machines;
    }
    
    return machines.filter(machine => {
      // 根据实际数据结构调整过滤逻辑
      return machine.model.toLowerCase().includes(filterType) || 
             machine.name.toLowerCase().includes(filterType);
    });
  }, [machines, filterType]);
  
  // 格式化日期
  const formatDate = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `今日 ${hours}:${minutes}`;
  };
  
  // 获取货币符号
  const getCurrencySymbol = (region: string): string => {
    switch(region) {
      case 'CN':
        return REGIONS.CN.currencySymbol;
      case 'EU':
        return REGIONS.EU.currencySymbol;
      case 'NA':
        return REGIONS.NA.currencySymbol;
      case 'AU':
        return REGIONS.AU.currencySymbol;
      default:
        return REGIONS.CN.currencySymbol;
    }
  };
  
  // 格式化价格
  const formatPrice = (price: number): string => {
    return price.toLocaleString();
  };
  
  // 获取库存状态
  const getStockStatus = (amount: number) => {
    if (amount <= 0) {
      return { className: 'out-of-stock', colorClass: 'inventory-low' };
    } else if (amount <= 5) {
      return { className: 'low-stock', colorClass: 'inventory-low' };
    } else if (amount <= 20) {
      return { className: 'medium-stock', colorClass: 'inventory-medium' };
    } else {
      return { className: 'high-stock', colorClass: 'inventory-high' };
    }
  };

  // 获取特定区域的库存
  const getRegionInventory = (product: MachineProduct, region: string): number => {
    const inventory = product.inventory.find(i => i.region === region);
    return inventory ? inventory.amount : 0;
  };
  
  // 处理数量变化
  const handleQuantityChange = (productId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, value)
    }));
  };
  
  // 添加购物车通知函数
  // 显示购物车通知消息
  const renderCartNotification = () => {
    if (!showNotification) return null;

    return (
      <div className="cart-notification">
        <div className="notification-content">
          <div className="notification-icon">✅</div>
          <div className="notification-text">
            已将 {notificationQuantity}台 {notificationProduct} 添加到购物车
          </div>
          <button className="notification-close" onClick={hideCartNotification}>
            ×
          </button>
            </div>
        <div className="notification-actions">
          <button className="go-to-cart-btn" onClick={goToCart}>
            <ShoppingCartOutlined /> 去购物车结算
            </button>
        </div>
      </div>
    );
  };

  // 隐藏购物车通知
  const hideCartNotification = () => {
    setShowNotification(false);
  };
  
  // 添加到购物车
  const handleAddToCart = async (product: MachineProduct) => {
    try {
      const quantity = quantities[product.id] || 1;
      
      // 调用API将产品添加到购物车
      const response = await machinesService.addToCart({
        product_id: product.id,
        product_type: 'machine',
        quantity: quantity,
        voltage: selectedVoltage,
        properties: { 
          ...product.specs,
          '选择的电压': selectedVoltage
        }
      });
      
      if (response.success) {
        // 同时添加到前端购物车上下文
        addItem({
          id: product.id.toString(),
          name: product.name,
          code: product.model,
          partNumber: product.model || '',
          image: product.image_url,
          category: '设备',
          productId: Number(product.id),
          price: product.prices ? product.prices.base : 0,
          quantity,
          selected: true,
          priceTiers: [
            {
              min: 1,
              max: 4,
              price: product.prices ? product.prices.base : 0
            },
            {
              min: 5,
              max: 9,
              price: product.prices ? product.prices.tier1 : 0
            },
            {
              min: 10,
              max: null,
              price: product.prices ? product.prices.tier2 : 0
            }
          ],
          properties: { 
            ...product.specs,
            '选择的电压': selectedVoltage
          },
          specs: {}
        });
        
        // 显示通知
        setNotificationProduct(product.name);
        setNotificationQuantity(quantity);
        setShowNotification(true);
        
        // 延迟关闭通知
        setTimeout(hideCartNotification, 3000);
        
        message.success('已添加到购物车');
      } else {
        message.error('添加到购物车失败');
      }
    } catch (err) {
      message.error('系统错误，请稍后重试');
      console.error('Error adding to cart:', err);
    }
  };
  
  // 处理机器选择
  const handleMachineSelection = async (machineId: string) => {
    // 设置选中的机器
    setSelectedMachine(machineId);
    
    // 清空选中的配件
    setSelectedAccessories({});
    
    // 隐藏所有配件层级
    for (let i = 1; i <= 5; i++) {
      const accessoryDiv = document.getElementById(`accessory-level-${i}`);
      if (accessoryDiv) {
        accessoryDiv.style.display = 'none';
      }
    }
    
    // 显示加载状态
    setAccessoriesLoading(true);
    
    try {
      // 获取所选机器的配件
      const response = await machinesService.getMachineAccessories(machineId, {
        level: 1
      });
      
      if (response.success) {
        // 更新配件列表
        setAccessories(response.data.items);
        
        // 清空其他级别配件
        setLevel2Accessories([]);
        setLevel3Accessories([]);
        setLevel4Accessories([]);
        setLevel5Accessories([]);
        
        // 设置上下文消息
        const contextMessage = document.getElementById('level1-context-message');
        if (contextMessage) {
          const machine = machines.find(m => m.id === machineId);
          contextMessage.textContent = `为 ${machine?.name || '所选设备'} 选择配件`;
        }
        
        // 显示一级配件界面
        const level1Div = document.getElementById('accessory-level-1');
        if (level1Div && response.data.items.length > 0) {
          level1Div.style.display = 'block';
        } else if (level1Div) {
          // 如果没有配件，显示一条消息
          message.info('当前设备没有可用配件');
        }
      } else {
        message.error('获取配件失败，请稍后重试');
      }
    } catch (err) {
      console.error('Failed to fetch accessories:', err);
      message.error('系统错误，请联系管理员');
    } finally {
      setAccessoriesLoading(false);
    }
  };
  
  // 查看配件详情
  const handleViewAccessory = (accessoryId: string) => {
    // 实现查看配件详情功能
  };
  
  // 查看产品详情
  const handleViewDetails = (machineId: string) => {
    // 可以跳转到详情页
    navigate(`/product-detail/${machineId}`);
  };
  
  // 前往购物车
  const goToCart = () => {
    navigate('/cart');
  };
  
  // 渲染机器表格
  const renderMachinesTable = () => {
    return (
      <table className="machines-table">
        <thead>
          <tr>
            <th className="selection-cell">选择</th>
            <th className="machine-image-cell">图片</th>
            <th className="machine-info-cell">机型</th>
            <th className="specs-cell">规格</th>
            <th className="price-cell">价格</th>
            {isSales && <th className="inventory-cell">库存</th>}
            <th className="actions-cell">操作</th>
          </tr>
        </thead>
        <tbody>
          {filteredMachines.map(machine => (
            <tr key={machine.id}>
              <td className="selection-cell">
                <input 
                  type="radio" 
                  name="machine" 
                  checked={selectedMachine === machine.id}
                  onChange={() => handleMachineSelection(machine.id)}
                />
              </td>
              <td className="machine-image-cell">
                <img 
                  className="machine-image" 
                  src={machine.image_url} 
                  alt={machine.name} 
                />
              </td>
              <td className="machine-info-cell">
                <div className="machine-header">
                  <span className="machine-code">{machine.model}</span>
                  <span className="machine-name">{machine.name}</span>
                  <span className="machine-model">{machine.subtitle}</span>
                </div>
                
                <div className="accessory-specs-container">
                  {machine.specs && Object.entries(machine.specs).map(([key, value]: [string, any]) => (
                    <span className="accessory-spec-item" key={key}>
                      <strong>{key}:</strong> {String(value)}
                    </span>
                  ))}
                </div>
                
                <div className="more-info-section">
                  <a className="specification-link" onClick={() => handleViewDetails(machine.id)}>规格详情</a>
                  <a className="more-info-link" onClick={() => handleViewDetails(machine.id)}>更多信息</a>
                </div>
              </td>
              <td className="specs-cell">
                <table className="specs-table">
                  <tbody>
                    {machine.specs && Object.entries(machine.specs).map(([key, value]: [string, any]) => (
                      <tr key={key} className="specs-row">
                        <td className="specs-label">{key}:</td>
                        <td className="specs-value">{String(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </td>
              <td className="price-cell">
                <div className="price-tiers">
                  <div className="price-title">价格</div>
                  {machine.prices && (
                    <>
                      <div className="price-tier">
                        <span className="price-range">单价 (1-4台)</span>
                        <span className="price-value">{getCurrencySymbol(userRegion)}{formatPrice(machine.prices.base)}</span>
                      </div>
                      <div className="price-tier">
                        <span className="price-range">批发价 (5-9台)</span>
                        <span className="price-value">{getCurrencySymbol(userRegion)}{formatPrice(machine.prices.tier1)}</span>
                      </div>
                      <div className="price-tier">
                        <span className="price-range">批发价 (10+台)</span>
                        <span className="price-value">{getCurrencySymbol(userRegion)}{formatPrice(machine.prices.tier2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </td>
              {isSales ? (
                <td className="inventory-cell">
                  <div className="inventory-tiers">
                    <div className="inventory-title">库存</div>
                    <div className="inventory-region">
                      <span className="region-label">
                        {REGIONS.CN.nameCn}
                      </span>
                      <span>
                        <span className={`region-value ${getStockStatus(getRegionInventory(machine, 'CN')).className}`}>
                          {getRegionInventory(machine, 'CN')}
                        </span>
                      </span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">
                        {REGIONS.NA.nameCn}
                      </span>
                      <span>
                        <span className={`region-value ${getStockStatus(getRegionInventory(machine, 'NA')).className}`}>
                          {getRegionInventory(machine, 'NA')}
                        </span>
                      </span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">
                        {REGIONS.EU.nameCn}
                      </span>
                      <span>
                        <span className={`region-value ${getStockStatus(getRegionInventory(machine, 'EU')).className}`}>
                          {getRegionInventory(machine, 'EU')}
                        </span>
                      </span>
                    </div>
                    <div className="inventory-region">
                      <span className="region-label">
                        {REGIONS.AU.nameCn}
                      </span>
                          <span>
                        <span className={`region-value ${getStockStatus(getRegionInventory(machine, 'AU')).className}`}>
                          {getRegionInventory(machine, 'AU')}
                          </span>
                        </span>
                    </div>
                  </div>
                </td>
              ) : null}
              <td className="actions-cell">
                <div className="quantity-selector">
                  <button 
                    className="qty-btn" 
                    onClick={() => handleQuantityChange(machine.id, (quantities[machine.id] || 1) - 1)}
                    disabled={(quantities[machine.id] || 1) <= 1}
                  >
                    <MinusOutlined />
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={quantities[machine.id] || 1} 
                    onChange={(e) => handleQuantityChange(machine.id, parseInt(e.target.value) || 1)}
                    className="quantity-input"
                  />
                  <button 
                    className="qty-btn" 
                    onClick={() => handleQuantityChange(machine.id, (quantities[machine.id] || 1) + 1)}
                  >
                    <PlusOutlined />
                  </button>
                </div>
                <button onClick={() => handleAddToCart(machine)} className="btn-add">
                  <ShoppingCartOutlined /> 加入购物车
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  // 处理配件选择
  const handleAccessorySelection = async (level: number, accessoryId: string, accessoryName: string) => {
    // 更新选中配件
    setSelectedAccessories(prev => ({
      ...prev,
      [`level${level}`]: accessoryId
    }));
    
    // 存储当前选中的配件名称，用于显示在下一级上下文中
    setSelectedAccessoryNames(prev => ({
      ...prev,
      [`level${level}`]: accessoryName
    }));
    
    // 确保所选配件层级显示，其他更高级别隐藏
    for (let i = 1; i <= 5; i++) {
      const accessoryDiv = document.getElementById(`accessory-level-${i}`);
      if (accessoryDiv) {
        if (i <= level) {
          accessoryDiv.style.display = 'block';
        } else if (i === level + 1) {
          // 下一级将在API返回后显示
        } else {
          accessoryDiv.style.display = 'none';
        }
      }
    }
    
    // 清空已选的更高级别配件
    setSelectedAccessories(prev => {
      const newState = { ...prev };
      for (let i = level + 1; i <= 5; i++) {
        if (newState[`level${i}`]) delete newState[`level${i}`];
      }
      return newState;
    });
    
    // 更新上下文消息
    const nextLevel = level + 1;
    if (nextLevel <= 5) {
      const contextMessage = document.getElementById(`level${nextLevel}-context-message`);
      if (contextMessage) {
        // 构建上下文消息，显示选择路径
        let contextText = `${accessoryName} 的适配配件`;
        
        // 添加配件层级导航提示
        if (level > 1) {
          contextText = `${level}级配件 ${accessoryName} 的下级适配件`;
        }
        
        contextMessage.textContent = contextText;
      }
    }
    
    try {
      // 根据 level 设置不同的 loading 状态
      switch (level) {
        case 1: setLevel2Loading(true); break;
        case 2: setLevel3Loading(true); break;
        case 3: setLevel4Loading(true); break;
        case 4: setLevel5Loading(true); break;
      }
      
      // 调用API获取下一级配件
      const response = await machinesService.getAccessories({
        parent_id: accessoryId,
        machine_id: selectedMachine,
        level: level + 1
      });
      
      if (response.success) {
        // 更新对应的配件列表
        switch (level) {
          case 1:
            setLevel2Accessories(response.data.items);
            // 如果有配件，显示下一级界面
            if (response.data.items.length > 0) {
              const level2Div = document.getElementById('accessory-level-2');
              if (level2Div) level2Div.style.display = 'block';
            } else {
              message.info(`${accessoryName} 没有下级配件`);
            }
            break;
          case 2:
            setLevel3Accessories(response.data.items);
            // 如果有配件，显示下一级界面
            if (response.data.items.length > 0) {
              const level3Div = document.getElementById('accessory-level-3');
              if (level3Div) level3Div.style.display = 'block';
            } else {
              message.info(`${accessoryName} 没有下级配件`);
            }
            break;
          case 3:
            setLevel4Accessories(response.data.items);
            // 如果有配件，显示下一级界面
            if (response.data.items.length > 0) {
              const level4Div = document.getElementById('accessory-level-4');
              if (level4Div) level4Div.style.display = 'block';
            } else {
              message.info(`${accessoryName} 没有下级配件`);
            }
            break;
          case 4:
            setLevel5Accessories(response.data.items);
            // 如果有配件，显示下一级界面
            if (response.data.items.length > 0) {
              const level5Div = document.getElementById('accessory-level-5');
              if (level5Div) level5Div.style.display = 'block';
            } else {
              message.info(`${accessoryName} 没有下级配件`);
            }
            break;
        }
      } else {
        message.error('获取配件失败，请稍后重试');
      }
    } catch (err) {
      console.error('Failed to fetch accessories:', err);
      message.error('系统错误，请联系管理员');
    } finally {
      // 重置 loading 状态
      switch (level) {
        case 1: setLevel2Loading(false); break;
        case 2: setLevel3Loading(false); break;
        case 3: setLevel4Loading(false); break;
        case 4: setLevel5Loading(false); break;
      }
    }
  };

  // 处理电压选择
  const handleVoltageChange = (voltage: string) => {
    setSelectedVoltage(voltage);
  };

  // 渲染配件导航路径组件
  const renderAccessoryPath = (level: number) => {
    if (level <= 1) return null;
    
                  return (
      <div className="accessory-path">
        {Array.from({ length: level - 1 }).map((_, index) => {
          const pathLevel = index + 1;
          const accessoryId = selectedAccessories[`level${pathLevel}`];
          const accessoryName = selectedAccessoryNames[`level${pathLevel}`];
          
          return accessoryId ? (
            <div key={accessoryId} className="accessory-path-item">
              <span className="accessory-path-level">L{pathLevel}:</span>
              <span className="accessory-path-name">{accessoryName || accessoryId}</span>
                      </div>
          ) : null;
        })}
                    </div>
                  );
  };

  // 显示加载中状态
  const showLoading = () => {
                  return (
      <div className="loading-container">
        <Spin>
          <div className="loading-content">
            <p>加载设备信息...</p>
                      </div>
        </Spin>
                    </div>
                  );
  };

  // 显示错误状态
  const showError = () => {
    if (!error) return null;
    
    return (
      <div className="error-container">
        <div className="error-icon">
          <ExclamationCircleOutlined />
            </div>
        <div className="error-message">
          <h3>加载失败</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-retry">
            <ReloadOutlined /> 重试
          </button>
                </div>
                      </div>
    );
  };

  // 显示配件部分
  const showAccessoryLevels = () => {
                    return (
                      <>
        <div id="accessory-level-1" className="accessory-level accessory-level-1" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 一级配件</span></h2>
            <span id="level1-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-1');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
                        </div>
          <div className="accessory-content">
            {accessoriesLoading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                        </div>
                </Spin>
                        </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {accessories.map(accessory => renderAccessory(accessory, 1))}
                  {accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
                </div>
              </div>
        
        <div id="accessory-level-2" className="accessory-level accessory-level-2" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 二级配件</span></h2>
            <span id="level2-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-2');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
                </button>
              </div>
          <div className="accessory-content">
            {/* 添加导航路径 */}
            {renderAccessoryPath(2)}
            
            {level2Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
            </div>
                </Spin>
                </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level2Accessories.map(accessory => renderAccessory(accessory, 2))}
                  {level2Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
                      </div>
                      </div>
        
        <div id="accessory-level-3" className="accessory-level accessory-level-3" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 三级配件</span></h2>
            <span id="level3-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-3');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
                      </div>
          <div className="accessory-content">
            {/* 添加导航路径 */}
            {renderAccessoryPath(3)}
            
            {level3Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                      </div>
                </Spin>
                      </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level3Accessories.map(accessory => renderAccessory(accessory, 3))}
                  {level3Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
                      </div>
                      </div>
        
        <div id="accessory-level-4" className="accessory-level accessory-level-4" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 四级配件</span></h2>
            <span id="level4-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-4');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
                      </div>
          <div className="accessory-content">
            {/* 添加导航路径 */}
            {renderAccessoryPath(4)}
            
            {level4Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                    </div>
                </Spin>
                </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level4Accessories.map(accessory => renderAccessory(accessory, 4))}
                  {level4Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
              </div>
                    </div>
        
        <div id="accessory-level-5" className="accessory-level accessory-level-5" style={{display: 'none'}}>
          <div className="level-header">
            <h2>配件选择 <span className="level-indicator">- 五级配件</span></h2>
            <span id="level5-context-message" className="context-message"></span>
            <button className="close-btn" onClick={() => {
              const accessoryDiv = document.getElementById('accessory-level-5');
              if (accessoryDiv) accessoryDiv.style.display = 'none';
            }}>
              关闭
            </button>
                    </div>
          <div className="accessory-content">
            {/* 添加导航路径 */}
            {renderAccessoryPath(5)}
            
            {level5Loading ? (
              <div className="loading-container">
                <Spin>
                  <div className="loading-content">
                    <p>加载配件...</p>
                    </div>
                </Spin>
                  </div>
            ) : (
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th className="selection-th">选择</th>
                    <th className="image-th">图片</th>
                    <th className="info-th">配件信息</th>
                    {isSales && <th className="inventory-th">库存状态</th>}
                    <th className="price-th">价格信息</th>
                    <th className="actions-th">数量/操作</th>
                  </tr>
                </thead>
                <tbody>
                  {level5Accessories.map(accessory => renderAccessory(accessory, 5))}
                  {level5Accessories.length === 0 && 
                    <tr>
                      <td colSpan={isSales ? 6 : 5} className="no-accessories">无可用配件</td>
                    </tr>
                  }
                </tbody>
              </table>
            )}
                        </div>
                        </div>
                      </>
                    );
  };

  // 渲染单个产品卡片
  const renderProduct = (product: MachineProduct) => {
    return (
      <div className="product-card" key={product.id}>
        <div className="product-inner">
          <div className="product-header">
            <h3>{product.name}</h3>
            {product.subtitle && <p className="product-subtitle">{product.subtitle}</p>}
          </div>
          <div className="product-body">
            <div className="product-image">
              <img src={product.image_url} alt={product.name} />
            </div>
            <div className="product-specs">
              {Object.entries(product.specs || {}).map(([key, value]: [string, any]) => (
                <div className="spec-item" key={key}>
                  <span className="spec-label">{key}:</span>
                  <span className="spec-value">{String(value)}</span>
                </div>
              ))}
            </div>
            {isSales && (
              <div className="product-inventory">
                <div className="inventory-regions">
                  <div className="product-inventory-title">库存状态</div>
                  <div className="inventory-region">
                    <span className="region-label">EU</span>
                    <span className={`region-value ${getStockStatus(getRegionInventory(product, 'EU')).className}`}>
                      {getRegionInventory(product, 'EU')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 渲染配件部分
  const renderAccessory = (accessory: any, level: number) => {
    return (
      <tr key={accessory.id}>
        <td className="selection-cell">
          <input 
            type="radio" 
            name={`accessory-level-${level}`}
            checked={selectedAccessories[`level${level}`] === accessory.id}
            onChange={() => handleAccessorySelection(level, accessory.id, accessory.name)}
          />
        </td>
        <td className="accessory-image-cell">
          <img 
            className="accessory-image" 
            src={accessory.image_url} 
            alt={accessory.name} 
          />
        </td>
        <td className="accessory-info-cell">
          <div className="accessory-header">
            <span className="accessory-code">{accessory.code}</span>
            <span className="accessory-name">{accessory.name}</span>
          </div>
          <div className="accessory-specs-container">
            {accessory.specs && Object.entries(accessory.specs).map(([key, value]: [string, any]) => (
              <span className="accessory-spec-item" key={key}>
                <strong>{key}:</strong> {String(value)}
              </span>
            ))}
          </div>
          <div className="more-info-section">
            <a className="specification-link" onClick={() => handleViewAccessory(accessory.id)}>规格详情</a>
          </div>
        </td>
        {isSales ? (
          <td className="inventory-cell">
            <div className="inventory-status">
              <div className="inventory-regions">
                {['CN', 'NA', 'EU', 'AU'].map((region: string) => (
                  <div className="inventory-region" key={region}>
                    <span className="region-label">{REGIONS[region as keyof typeof REGIONS].nameCn}</span>
                    <span className={`region-value ${getStockStatus(accessory.inventory ? accessory.inventory.find((i: any) => i.region === region)?.amount || 0 : 0).className}`}>
                      {accessory.inventory ? accessory.inventory.find((i: any) => i.region === region)?.amount || 0 : 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </td>
        ) : null}
        <td className="price-cell">
          <div className="price-info">
            <div className="price-title">价格：</div>
            <div className="price-value">
              {getCurrencySymbol(userRegion)}{formatPrice(accessory.price || 0)}
            </div>
          </div>
        </td>
        <td className="actions-cell">
          <div className="quantity-selector">
            <button 
              className="qty-btn" 
              onClick={() => handleQuantityChange(accessory.id, (quantities[accessory.id] || 1) - 1)}
              disabled={(quantities[accessory.id] || 1) <= 1}
            >
              <MinusOutlined />
            </button>
            <input
              type="number"
              min="1"
              value={quantities[accessory.id] || 1} 
              onChange={(e) => handleQuantityChange(accessory.id, parseInt(e.target.value) || 1)}
              className="quantity-input"
            />
            <button 
              className="qty-btn"
              onClick={() => handleQuantityChange(accessory.id, (quantities[accessory.id] || 1) + 1)}
            >
              <PlusOutlined />
            </button>
          </div>
          <button onClick={() => handleAddToCart(accessory)} className="btn-add">
            <ShoppingCartOutlined /> 加入购物车
          </button>
        </td>
      </tr>
    );
  };

  // Return the main component JSX
  return (
    <div className="machines-page">
      {renderCartNotification()}
      <div className="machines-filter">
        {/* Filter controls would go here */}
            </div>
      <div className="machines-container">
        {loading ? showLoading() : error ? showError() : renderMachinesTable()}
          </div>
      {showAccessoryLevels()}
    </div>
  );
};

export default MachinesPage;