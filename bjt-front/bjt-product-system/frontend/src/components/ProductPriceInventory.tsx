import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import priceInventoryService, { 
  PriceChangedEvent, 
  InventoryChangedEvent, 
  ProductAvailabilityData 
} from '../services/priceInventoryService';
import { Spin, Tag, Tooltip, Alert } from 'antd';
import { ReloadOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { safeToLocaleString } from '../utils/priceUtils';
import './ProductPriceInventory.css';

interface ProductPriceInventoryProps {
  productId: string;
  productType: 'machine' | 'spare-part' | 'consumable' | 'accessory';
  quantity?: number;
}

const ProductPriceInventory: React.FC<ProductPriceInventoryProps> = ({ 
  productId, 
  productType, 
  quantity = 1 
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [productData, setProductData] = useState<ProductAvailabilityData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [realTimeConnected, setRealTimeConnected] = useState<boolean>(false);

  // 获取产品价格和库存数据
  const fetchProductData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await priceInventoryService.getProductAvailability({
        product_requests: [
          {
            product_id: productId,
            product_type: productType,
            quantity: quantity
          }
        ],
        region: user?.region
      });
      
      if (response.success && response.data.products.length > 0) {
        setProductData(response.data.products[0]);
        setLastUpdate(response.data.timestamp);
      } else {
        setError(t('errors.failedToLoadProductData'));
      }
    } catch (err) {
      setError(t('errors.systemError'));
      console.error('Failed to fetch product data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 连接到实时更新
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // 初始化WebSocket连接
      priceInventoryService.connectToPriceSocket(token);
      priceInventoryService.connectToInventorySocket(token);
      setRealTimeConnected(true);
      
      // 订阅产品更新
      priceInventoryService.subscribeToPriceChanges([productId], [productType]);
      priceInventoryService.subscribeToInventoryChanges(
        [productId], 
        [productType], 
        user?.region ? [user.region] : ['CN', 'EU', 'NA', 'AU']
      );
      
      // 添加监听器
      const handlePriceChange = (event: PriceChangedEvent) => {
        if (event.product.product_id === productId && event.product.type === productType) {
          // 更新价格数据
          setProductData((prevData) => {
            if (!prevData) return null;
            return {
              ...prevData,
              price: {
                ...prevData.price,
                ...event.product.new_price
              }
            };
          });
          setLastUpdate(event.timestamp);
        }
      };
      
      const handleInventoryChange = (event: InventoryChangedEvent) => {
        if (event.product.product_id === productId && event.product.type === productType) {
          // 更新库存数据
          setProductData((prevData) => {
            if (!prevData) return null;
            
            // 当前区域的库存状态更新
            if (event.product.region === user?.region) {
              return {
                ...prevData,
                inventory: {
                  ...prevData.inventory,
                  amount: event.product.new_amount,
                  status: event.product.status
                }
              };
            }
            return prevData;
          });
          setLastUpdate(event.timestamp);
        }
      };
      
      priceInventoryService.addPriceChangeListener(handlePriceChange);
      priceInventoryService.addInventoryChangeListener(handleInventoryChange);
      
      // 初始加载数据
      fetchProductData();
      
      // 清理函数
      return () => {
        priceInventoryService.removePriceChangeListener(handlePriceChange);
        priceInventoryService.removeInventoryChangeListener(handleInventoryChange);
      };
    }
  }, [productId, productType, user?.region]);
  
  // 组件卸载时断开连接
  useEffect(() => {
    return () => {
      priceInventoryService.disconnectAll();
    };
  }, []);
  
  // 刷新数据
  const handleRefresh = () => {
    fetchProductData();
  };
  
  // 格式化时间
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  // 根据库存状态获取标签颜色
  const getStockStatusColor = (status: string): string => {
    switch (status) {
      case 'in_stock':
        return 'success';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
        return 'error';
      default:
        return 'default';
    }
  };
  
  // 根据用户角色确定显示哪个价格
  const getPriceToDisplay = () => {
    if (!productData) return null;
    
    const { price } = productData;
    
    // VIP用户
    if (user?.vipLevel && user.vipLevel >= 2) {
      return price.vip_price;
    }
    
    // 企业用户
    if (user?.type === 'enterprise') {
      return price.tier2_price;
    }
    
    // 批发客户
    if (user?.type === 'wholesale') {
      return price.tier1_price;
    }
    
    // 普通用户
    return price.base_price;
  };
  
  // 渲染价格显示
  const renderPrice = () => {
    if (!productData) return null;
    
    const displayPrice = getPriceToDisplay();
    const { currency, currency_code, discount_applied, sale_ends_at } = productData.price;
    
    return (
      <div className="product-price">
        <span className="price-value">{currency} {safeToLocaleString(displayPrice)}</span>
        {discount_applied && (
          <Tag color="red" className="discount-tag">
            {t('product.discounted')}
            {sale_ends_at && (
              <Tooltip title={t('product.saleEndsAt', { date: formatTimestamp(sale_ends_at) })}>
                <ClockCircleOutlined />
              </Tooltip>
            )}
          </Tag>
        )}
      </div>
    );
  };
  
  // 渲染库存状态
  const renderStockStatus = () => {
    if (!productData) return null;
    
    const { inventory } = productData;
    const statusText = t(`inventory.status.${inventory.status}`);
    
    return (
      <div className="product-inventory">
        <Tag color={getStockStatusColor(inventory.status)}>
          {statusText}
        </Tag>
        {inventory.status === 'in_stock' && (
          <span className="inventory-amount">
            {t('inventory.available')}: {inventory.amount}
          </span>
        )}
      </div>
    );
  };
  
  if (loading) {
    return <Spin tip={t('loading')} />;
  }
  
  if (error) {
    return <Alert type="error" message={error} />;
  }
  
  if (!productData) {
    return <Alert type="warning" message={t('product.noDataAvailable')} />;
  }
  
  return (
    <div className="product-price-inventory">
      <div className="price-inventory-header">
        <h4>{t('product.priceAndInventory')}</h4>
        <Tooltip title={t('actions.refresh')}>
          <ReloadOutlined className="refresh-btn" onClick={handleRefresh} />
        </Tooltip>
      </div>
      
      {renderPrice()}
      {renderStockStatus()}
      
      {lastUpdate && (
        <div className="last-update">
          <small>
            {t('product.lastUpdate')}: {formatTimestamp(lastUpdate)}
            {realTimeConnected && (
              <Tag color="green" style={{ marginLeft: 8 }}>
                {t('product.realTime')}
              </Tag>
            )}
          </small>
        </div>
      )}
    </div>
  );
};

export default ProductPriceInventory; 