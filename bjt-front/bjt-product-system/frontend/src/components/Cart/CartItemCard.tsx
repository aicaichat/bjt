import React from 'react';
import { Card, Button, InputNumber, Typography, Space, Divider } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { CartItem } from '../../api/services/cart.service';
import { formatCurrency } from '../../utils/priceUtils';
import './CartItemCard.css';

const { Text, Title } = Typography;

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const handleQuantityChange = (value: number | null) => {
    if (value !== null && value > 0) {
      onUpdateQuantity(item.item_id, value);
    }
  };

  const handleIncrement = () => {
    onUpdateQuantity(item.item_id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.item_id, item.quantity - 1);
    }
  };

  const handleRemove = () => {
    onRemove(item.item_id);
  };

  // 计算最大可购买数量，默认为999
  const maxQuantity = 999;

  return (
    <Card className="cart-item-card" hoverable>
      <div className="cart-item-content">
        <div className="cart-item-image">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} />
          ) : (
            <div className="placeholder-image">
              <Text type="secondary">No Image</Text>
            </div>
          )}
        </div>
        
        <div className="cart-item-details">
          <Title level={5}>{item.name}</Title>
          <Text type="secondary">Part Number: {item.part_number}</Text>
          <Text>Unit Price: {formatCurrency(item.unit_price, item.currency)}</Text>
        </div>
        
        <div className="cart-item-actions">
          <div className="quantity-control">
            <Button 
              icon={<MinusOutlined />} 
              onClick={handleDecrement}
              disabled={item.quantity <= 1}
            />
            <InputNumber
              min={1}
              max={maxQuantity}
              value={item.quantity}
              onChange={handleQuantityChange}
            />
            <Button 
              icon={<PlusOutlined />} 
              onClick={handleIncrement}
              disabled={item.quantity >= maxQuantity}
            />
          </div>
          
          <Divider type="vertical" />
          
          <div className="cart-item-subtotal">
            <Text strong>Subtotal:</Text>
            <Text strong>{formatCurrency(item.unit_price * item.quantity, item.currency)}</Text>
          </div>
          
          <Button 
            danger 
            icon={<DeleteOutlined />} 
            onClick={handleRemove}
            title="Remove item"
          />
        </div>
      </div>
    </Card>
  );
};

export default CartItemCard; 