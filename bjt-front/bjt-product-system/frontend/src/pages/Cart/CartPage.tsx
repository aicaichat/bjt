import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Divider, Row, Space, Spin, Typography } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CartService, { CartItem, CartResponse } from '../../api/services/cart.service';
import { formatCurrency } from '../../utils/priceUtils';
import { SmartCartItemCard } from '../../components/Cart/SmartCartItemCard';
import { FEATURE_FLAGS, debugLog } from '../../config/feature-flags';
import { ProductType } from '../../hooks/useCartDisplayEnhancer';
import './CartPage.scss';

const { Title, Text } = Typography;

// 将CartItem转换为SmartCartItemCard需要的格式
const transformCartItemToSmartCartItem = (cartItem: CartItem) => {
  // 根据product_type推断ProductType
  const getProductType = (type: string): ProductType => {
    switch (type) {
      case 'machine': return 'machines';
      case 'accessory': return 'accessories'; 
      case 'spare_part': return 'spareParts';
      case 'consumable': return 'consumables';
      default: return 'spareParts'; // 默认作为备件处理
    }
  };

  return {
    id: cartItem.item_id.toString(),
    product: {
      // 基础信息
      name: cartItem.name,
      name_en: cartItem.name,
      product_name: cartItem.name,
      part_number: cartItem.part_number,
      image_url: cartItem.image_url,
      price: cartItem.unit_price,
      unit_price: cartItem.unit_price,
      currency: cartItem.currency,
      
      // 从properties中提取更多字段信息
      ...(cartItem.properties || {}),
      
      // 确保关键字段不为空
      model: cartItem.properties?.model || cartItem.properties?.app_model || 'N/A',
      voltage: cartItem.properties?.voltage || cartItem.properties?.voltage_v || '',
      spec: cartItem.properties?.spec || '',
      app_model: cartItem.properties?.app_model || '',
      frequency: cartItem.properties?.frequency || cartItem.properties?.frequency_hz || '',
      pcs_per_box: cartItem.properties?.pcs_per_box || '',
      package_size: cartItem.properties?.package_size_cm || cartItem.properties?.package_size_inch || '',
      net_weight: cartItem.properties?.net_weight_kg || cartItem.properties?.net_weight_lbs || '',
      unit: cartItem.properties?.unit || 'pcs'
    },
    productType: getProductType(cartItem.product_type),
    quantity: cartItem.quantity,
    selected: false
  };
};

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 加载购物车数据
  const loadCart = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cartData = await CartService.getCart();
      setCart(cartData);
      debugLog('购物车数据加载成功', cartData);
      console.log('Cart data loaded:', cartData);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError('购物车数据加载失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 更新购物车项数量
  const handleUpdateQuantity = async (itemId: string, quantity: number) => {
    if (!cart) return;
    
    setLoading(true);
    try {
      await CartService.updateCartItem(parseInt(itemId), { quantity });
      await loadCart(); // 重新加载购物车
      debugLog('更新商品数量成功', { itemId, quantity });
    } catch (err) {
      console.error('Failed to update item quantity:', err);
      setError('更新数量失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 移除购物车项
  const handleRemoveItem = async (itemId: string) => {
    if (!cart) return;
    
    setLoading(true);
    try {
      await CartService.removeCartItem(parseInt(itemId));
      await loadCart(); // 重新加载购物车
      debugLog('删除商品成功', { itemId });
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError('移除商品失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 清空购物车
  const handleClearCart = async () => {
    if (!cart || cart.items.length === 0) return;
    
    setLoading(true);
    try {
      await CartService.clearCart();
      await loadCart(); // 重新加载购物车
      debugLog('清空购物车成功');
    } catch (err) {
      console.error('Failed to clear cart:', err);
      setError('清空购物车失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 前往结算
  const handleCheckout = () => {
    navigate('/checkout');
  };

  // 组件挂载时加载购物车
  useEffect(() => {
    loadCart();
  }, []);

  // 渲染购物车为空的状态
  const renderEmptyCart = () => (
    <div style={{ textAlign: 'center', padding: '50px 0' }}>
      <div style={{ fontSize: '16px', color: '#999', marginBottom: '20px' }}>
        🛒 您的购物车是空的
      </div>
      <Button type="primary" onClick={() => navigate('/products')}>
        去选购产品
      </Button>
    </div>
  );

  // 渲染购物车项列表
  const renderCartItems = () => {
    if (!cart || cart.items.length === 0) {
      return renderEmptyCart();
    }

    return (
      <div className="cart-items-container">
        {cart.items.map((item) => {
          const smartCartItem = transformCartItemToSmartCartItem(item);
          
          // 如果启用了智能购物车功能，使用SmartCartItemCard
          if (FEATURE_FLAGS.CART_FIELD_ENHANCEMENT) {
            return (
              <SmartCartItemCard
                key={item.item_id}
                item={smartCartItem}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                showSmartFields={true}
              />
            );
          } else {
            // 回退到原始组件（保持向后兼容）
            const CartItemCard = require('../../components/Cart/CartItemCard').default;
            return (
              <CartItemCard
                key={item.item_id}
                item={item}
                onUpdateQuantity={(itemId: number, quantity: number) => 
                  handleUpdateQuantity(itemId.toString(), quantity)}
                onRemove={(itemId: number) => 
                  handleRemoveItem(itemId.toString())}
              />
            );
          }
        })}
      </div>
    );
  };

  // 渲染购物车摘要
  const renderCartSummary = () => {
    if (!cart || cart.items.length === 0) {
      return null;
    }

    return (
      <Card className="cart-summary">
        <Title level={4}>购物车摘要</Title>
        <div className="summary-row">
          <Text>商品数量:</Text>
          <Text>{cart.item_count} 件商品</Text>
        </div>
        <div className="summary-row">
          <Text>商品总数:</Text>
          <Text>{cart.total_quantity} 件</Text>
        </div>
        <Divider />
        <div className="summary-row total">
          <Text strong>总计:</Text>
          <Text strong>{formatCurrency(cart.cart_total, cart.currency)}</Text>
        </div>
        <div className="summary-actions">
          <Button 
            type="primary" 
            size="large" 
            block 
            onClick={handleCheckout}
            disabled={cart.items.length === 0}
          >
            去结算
          </Button>
          <Button 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleClearCart}
            disabled={cart.items.length === 0}
          >
            清空购物车
          </Button>
        </div>
      </Card>
    );
  };

  // 渲染功能状态指示器（调试模式下显示）
  const renderFeatureStatus = () => {
    if (!FEATURE_FLAGS.DEBUG_MODE) return null;
    
    return (
      <div className="feature-status-debug" style={{ 
        background: '#f0f0f0', 
        padding: '8px', 
        marginBottom: '16px',
        fontSize: '12px',
        borderRadius: '4px'
      }}>
        <strong>🛒 购物车系统状态:</strong>
        <span style={{ marginLeft: '8px' }}>
          智能单位制: {FEATURE_FLAGS.SMART_UNIT_SYSTEM ? '✅' : '❌'} |
          字段增强: {FEATURE_FLAGS.CART_FIELD_ENHANCEMENT ? '✅' : '❌'} |
          调试模式: {FEATURE_FLAGS.DEBUG_MODE ? '✅' : '❌'}
        </span>
      </div>
    );
  };

  return (
    <div className="cart-page">
      <div className="page-header">
        <Title level={2}>
          <Space>
            <ShoppingCartOutlined />
            购物车
            {FEATURE_FLAGS.CART_FIELD_ENHANCEMENT && (
              <span style={{ fontSize: '14px', color: '#52c41a' }}>
                ✨ 智能增强版
              </span>
            )}
          </Space>
        </Title>
        {cart && <Text type="secondary">{cart.item_count} 件商品</Text>}
      </div>

      {renderFeatureStatus()}

      {error && (
        <div className="error-message">
          <Text type="danger">{error}</Text>
        </div>
      )}

      {loading && !cart ? (
        <div className="loading-container">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {renderCartItems()}
          </Col>
          <Col xs={24} lg={8}>
            {renderCartSummary()}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default CartPage; 