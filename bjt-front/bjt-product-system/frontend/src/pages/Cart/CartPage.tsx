import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Divider, Empty, Row, Space, Spin, Typography } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import CartService, { CartItem, CartResponse } from '../../api/services/cart.service';
import { formatCurrency } from '../../utils/priceUtils';
import CartItemCard from '../../components/Cart/CartItemCard';
import './CartPage.scss';

const { Title, Text } = Typography;

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
      console.log('Cart data loaded:', cartData);
    } catch (err) {
      console.error('Failed to load cart:', err);
      setError('购物车数据加载失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 更新购物车项数量
  const handleUpdateQuantity = async (itemId: number, quantity: number) => {
    if (!cart) return;
    
    setLoading(true);
    try {
      await CartService.updateCartItem(itemId, { quantity });
      await loadCart(); // 重新加载购物车
    } catch (err) {
      console.error('Failed to update item quantity:', err);
      setError('更新数量失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 移除购物车项
  const handleRemoveItem = async (itemId: number) => {
    if (!cart) return;
    
    setLoading(true);
    try {
      await CartService.removeCartItem(itemId);
      await loadCart(); // 重新加载购物车
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
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="您的购物车是空的"
    >
      <Button type="primary" onClick={() => navigate('/products')}>
        去选购产品
      </Button>
    </Empty>
  );

  // 渲染购物车项列表
  const renderCartItems = () => {
    if (!cart || cart.items.length === 0) {
      return renderEmptyCart();
    }

    return (
      <div className="cart-items-container">
        {cart.items.map((item) => (
          <CartItemCard
            key={item.item_id}
            item={item}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemoveItem}
          />
        ))}
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

  return (
    <div className="cart-page">
      <div className="page-header">
        <Title level={2}>
          <Space>
            <ShoppingCartOutlined />
            购物车
          </Space>
        </Title>
        {cart && <Text type="secondary">{cart.item_count} 件商品</Text>}
      </div>

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