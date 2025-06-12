import React from 'react';
import { Card, Button, InputNumber, Typography, Space, Divider } from 'antd';
import { DeleteOutlined, MenuOutlined, PlusOutlined } from '@ant-design/icons';
import { CartItem } from '../../api/services/cart.service';
import { formatCurrency } from '../../utils/priceUtils';
import './CartItemCard.css';
import { useTranslation } from 'react-i18next';
import { ASSETS } from '../../config/appConfig';

const { Text, Title } = Typography;

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemove: (itemId: number) => void;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item, onUpdateQuantity, onRemove }) => {
  const { t, i18n } = useTranslation(['spareParts', 'cart']);

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
  const imageUrl = props.image_url || item.image_url || (item as any).image || ASSETS.DEFAULT_IMAGE;
  
  // 根据当前语言选择正确的商品名称
  const language = i18n.language;
  const getDisplayName = (): string => {
    const props = item.properties || {};
    if (language === 'zh') {
      return props.name_zh || 
             (item as any).name_zh || 
             props.name || 
             item.name ||
             props.code ||
             (item as any).code ||
             props.part_number ||
             item.part_number ||
             '商品';
    } else {
      return props.name_en || 
             (item as any).name_en || 
             props.name || 
             item.name ||
             props.code ||
             (item as any).code ||
             props.part_number ||
             item.part_number ||
             'Product';
    }
  };
  
  const displayName = getDisplayName();
  
  const partNumber = props.part_number || (item as any).part_number || '';
  const model = props.model || (item as any).model || '';
  const voltage = props.voltage || (item as any).voltage || '';
  const frequency = props.frequency || (item as any).frequency || '';
  const pcs_per_box = props.pcs_per_box || (item as any).pcs_per_box || '';
  const pcs_per_pallet = props.pcs_per_pallet || (item as any).pcs_per_pallet || '';
  const package_size_cm = props.package_size_cm || (item as any).package_size_cm || '';
  const package_size_inch = props.package_size_inch || (item as any).package_size_inch || '';
  const pallet_size_cm = props.pallet_size_cm || (item as any).pallet_size_cm || '';
  const pallet_size_inch = props.pallet_size_inch || (item as any).pallet_size_inch || '';

  // 属性key到i18n key映射
  const propertyKeyMap: Record<string, string> = {
    part_number: 'partNumber',
    model: 'model',
    voltage: 'voltage',
    frequency: 'frequency',
    spec: 'spec',
    spec_imperial: 'specImperial',
    pcs_per_box: 'pcsPerBox',
    pcs_per_pallet: 'pcsPerPallet',
    package_size_cm: 'packageSize',
    package_size_inch: 'packageSize',
    pallet_size_cm: 'palletSize',
    pallet_size_inch: 'palletSize',
    net_weight_kg: 'netWeight',
    net_weight_lbs: 'netWeight',
    gross_weight_kg: 'grossWeight',
    gross_weight_lbs: 'grossWeight',
    brand: 'brand',
    unit: 'unit'
  };
  const getLabel = (key: string, t: any) => t(`products.properties.${propertyKeyMap[key] || key}`, key);
  const getValue = (value: any, t: any) => value && value !== 'N/A' && value !== 'Not Specified' ? value : t('products.defaultValues.notAvailable');

  return (
    <Card className="cart-item-card" hoverable>
      <div className="cart-item-content">
        <div className="cart-item-image">
          {imageUrl ? (
            <img src={imageUrl} alt={displayName} />
          ) : (
            <div className="placeholder-image">
              <Text type="secondary">No Image</Text>
            </div>
          )}
        </div>
        
        <div className="cart-item-details">
          <Title level={5}>{displayName}</Title>
          <Text type="secondary">{getLabel('partNumber', t)}: {getValue(partNumber, t)}</Text>
          {model && <div><Text type="secondary">{getLabel('model', t)}: {getValue(model, t)}</Text></div>}
          {voltage && <div><Text type="secondary">{getLabel('voltage', t)}: {getValue(voltage, t)}</Text></div>}
          {frequency && <div><Text type="secondary">{getLabel('frequency', t)}: {getValue(frequency, t)}</Text></div>}
          {pcs_per_box && <div><Text type="secondary">{getLabel('pcsPerBox', t)}: {getValue(pcs_per_box, t)}</Text></div>}
          {pcs_per_pallet && <div><Text type="secondary">{getLabel('pcsPerPallet', t)}: {getValue(pcs_per_pallet, t)}</Text></div>}
          {package_size_cm && <div><Text type="secondary">{getLabel('packageSize', t)} (cm): {getValue(package_size_cm, t)}</Text></div>}
          {package_size_inch && <div><Text type="secondary">{getLabel('packageSize', t)} (inch): {getValue(package_size_inch, t)}</Text></div>}
          {pallet_size_cm && <div><Text type="secondary">{getLabel('palletSize', t)} (cm): {getValue(pallet_size_cm, t)}</Text></div>}
          {pallet_size_inch && <div><Text type="secondary">{getLabel('palletSize', t)} (inch): {getValue(pallet_size_inch, t)}</Text></div>}
          <Text>{t('cart.unitPrice', {ns: 'spareParts'})}: {formatCurrency(item.unit_price, item.currency)}</Text>
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
            <Text strong>{t('cart.subtotal', {ns: 'spareParts'})}:</Text>
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