import React from 'react';
import { Card, Button, InputNumber, Typography, Space, Divider } from 'antd';
import { DeleteOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
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

  // 优先从 properties 取字段
  const props = (item as any).properties || {};
  const imageUrl = props.image_url || item.image_url || (item as any).image || '/images/placeholder.jpg';
  const name = props.name || item.name || '';
  const partNumber = props.part_number || item.part_number || '';
  const model = props.model || (item as any).model || '';
  const voltage = props.voltage || (item as any).voltage || '';
  const frequency = props.frequency || (item as any).frequency || '';
  const pcsPerBox = props.pcs_per_box || (item as any).pcs_per_box || '';
  const pcsPerPallet = props.pcs_per_pallet || (item as any).pcs_per_pallet || '';
  const packageSizeCm = props.package_size_cm || (item as any).package_size_cm || '';
  const packageSizeInch = props.package_size_inch || (item as any).package_size_inch || '';
  const palletSizeCm = props.pallet_size_cm || (item as any).pallet_size_cm || '';
  const palletSizeInch = props.pallet_size_inch || (item as any).pallet_size_inch || '';

  return (
    <Card className="cart-item-card" hoverable>
      <div className="cart-item-content">
        <div className="cart-item-image">
          {imageUrl ? (
            <img src={imageUrl} alt={name} />
          ) : (
            <div className="placeholder-image">
              <Text type="secondary">No Image</Text>
            </div>
          )}
        </div>
        
        <div className="cart-item-details">
          <Title level={5}>{name}</Title>
          <Text type="secondary">Part Number: {partNumber}</Text>
          {model && <div><Text type="secondary">Model: {model}</Text></div>}
          {voltage && <div><Text type="secondary">Voltage: {voltage}</Text></div>}
          {frequency && <div><Text type="secondary">Frequency: {frequency}</Text></div>}
          {pcsPerBox && <div><Text type="secondary">Box Qty: {pcsPerBox}</Text></div>}
          {pcsPerPallet && <div><Text type="secondary">Pallet Qty: {pcsPerPallet}</Text></div>}
          {packageSizeCm && <div><Text type="secondary">Package Size (cm): {packageSizeCm}</Text></div>}
          {packageSizeInch && <div><Text type="secondary">Package Size (inch): {packageSizeInch}</Text></div>}
          {palletSizeCm && <div><Text type="secondary">Pallet Size (cm): {palletSizeCm}</Text></div>}
          {palletSizeInch && <div><Text type="secondary">Pallet Size (inch): {palletSizeInch}</Text></div>}
          <Text>Unit Price: {formatCurrency(item.unit_price, item.currency)}</Text>
        </div>
        
        <div className="cart-item-actions">
          <div className="quantity-control">
            <Button 
              icon={<MenuOutlined />} 
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