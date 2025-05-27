import React, { useState } from 'react';
import { RequiredPartsDisplay } from '../components/RequiredPartsDisplay';
import { RequiredPartCartItem } from '../components/Cart/RequiredPartCartItem';
import { CartList } from '../components/Cart/CartList';
import { ExtendedCartItem } from '../contexts/CartContext';

// 测试数据
const testSparePart = {
  id: 1,
  part_number: 'SP001',
  name_zh: '测试备件',
  name_en: 'Test Spare Part',
  required_parts: 'SP002,SP003',
  required_quantity: '2,1',
  spec: '测试规格',
  app_model: 'Model-A',
  image_url: '/images/test-part.jpg'
};

const testCartItems: ExtendedCartItem[] = [
  {
    item_id: 1,
    product_type: 'spare_part',
    product_id: 1,
    part_number: 'SP001',
    quantity: 1,
    name: '主要备件',
    image_url: '/images/main-part.jpg',
    unit_price: 100,
    currency: 'CNY',
    line_total: 100,
    inventory_status: 'in_stock',
    added_at: new Date().toISOString(),
    properties: {},
    id: '1',
    code: 'SP001',
    partNumber: 'SP001',
    image: '/images/main-part.jpg',
    category: 'spare_part',
    productId: 1,
    priceTiers: [],
    selected: false,
    type: 'spare_part',
    price: 100,
    specs: {
      partNumber: 'SP001',
      productName: '主要备件'
    }
  },
  {
    item_id: 2,
    product_type: 'spare_part',
    product_id: 2,
    part_number: 'SP002',
    quantity: 2,
    name: '必选备件1',
    image_url: '/images/required-part1.jpg',
    unit_price: 50,
    currency: 'CNY',
    line_total: 100,
    inventory_status: 'in_stock',
    added_at: new Date().toISOString(),
    properties: {
      is_required: true,
      parent_part_number: 'SP001',
      name_zh: '必选备件1',
      name_en: 'Required Part 1',
      spec: '必选规格1',
      app_model: 'Model-A',
      is_consumable: false,
      unit: 'pcs',
      package_size_cm: '10x5x2',
      net_weight_kg: 0.5
    },
    id: '2',
    code: 'SP002',
    partNumber: 'SP002',
    image: '/images/required-part1.jpg',
    category: 'spare_part',
    productId: 2,
    priceTiers: [],
    selected: false,
    type: 'spare_part',
    price: 50,
    specs: {
      partNumber: 'SP002',
      productName: '必选备件1'
    },
    is_required: true,
    parent_part_number: 'SP001',
    name_zh: '必选备件1',
    name_en: 'Required Part 1',
    spec: '必选规格1',
    app_model: 'Model-A',
    is_consumable: false,
    unit: 'pcs',
    package_size_cm: '10x5x2',
    net_weight_kg: 0.5
  }
];

export const RequiredPartsTest: React.FC = () => {
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [cartItems, setCartItems] = useState<ExtendedCartItem[]>(testCartItems);

  const handleUpdateQuantity = (id: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const handleRemove = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="required-parts-test p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">必选备件功能测试</h1>
        
        {/* 语言切换 */}
        <div className="mb-8">
          <label className="mr-4">语言选择:</label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as 'zh' | 'en')}
            className="border border-gray-300 rounded px-3 py-1"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 必选备件显示组件测试 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              必选备件显示组件
            </h2>
            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-700 mb-2">测试备件信息:</h3>
                <p>料号: {testSparePart.part_number}</p>
                <p>名称: {language === 'zh' ? testSparePart.name_zh : testSparePart.name_en}</p>
                <p>必选备件: {testSparePart.required_parts}</p>
                <p>必选数量: {testSparePart.required_quantity}</p>
              </div>
              
              <RequiredPartsDisplay
                requiredParts={testSparePart.required_parts}
                requiredQuantity={testSparePart.required_quantity}
                language={language}
              />
            </div>
          </div>

          {/* 购物车列表组件测试 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              购物车列表组件
            </h2>
            <CartList
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemove}
              language={language}
            />
          </div>
        </div>

        {/* 必选备件购物车项目单独测试 */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            必选备件购物车项目组件
          </h2>
          {cartItems
            .filter(item => item.is_required)
            .map(item => (
              <RequiredPartCartItem
                key={item.id}
                item={item as ExtendedCartItem & { is_required: true }}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                language={language}
              />
            ))
          }
        </div>

        {/* 测试说明 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">测试说明</h2>
          <div className="text-blue-800 space-y-2">
            <p>1. <strong>必选备件显示组件</strong>: 在产品详情页显示必选备件信息</p>
            <p>2. <strong>购物车列表组件</strong>: 分组显示主要商品和必选备件</p>
            <p>3. <strong>必选备件购物车项目</strong>: 特殊样式显示必选备件，包含完整字段信息</p>
            <p>4. <strong>语言切换</strong>: 支持中英文切换显示</p>
            <p>5. <strong>数量操作</strong>: 支持修改数量和移除操作</p>
          </div>
        </div>
      </div>
    </div>
  );
}; 