import React from 'react';
import { SmartFieldValue } from '../components/SmartFieldValue';
import { UnitSystemToggle } from '../components/UnitSystemToggle';
import { useSmartUnitSystem } from '../hooks/useSmartUnitSystem';

// 演示数据 - 模拟购物车中的产品
const demoProduct = {
  id: 'demo-1',
  name: 'LA E5S test',
  part_number: '123131313131313',
  model: 'LA-E5S V1.1',
  voltage: '220V',
  pcs_per_box: 10,
  pcs_per_pallet: 11,
  
  // 公制数据
  package_size_cm: '10*34.5*39',
  pallet_size_cm: '100*120',
  net_weight_kg: 1.00,
  
  // 英制数据
  package_size_inch: '3.9*13.6*15.4',
  pallet_size_inch: '39.4*47.2',
  net_weight_lbs: 2.20
};

export const UnitDisplayDemo: React.FC = () => {
  const { preferredUnitSystem } = useSmartUnitSystem();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          单位显示演示页面
        </h1>
        
        {/* 单位制切换控件 */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <h2 className="text-lg font-semibold">当前单位制</h2>
            <p className="text-sm text-gray-600">
              {preferredUnitSystem === 'metric' ? '公制 (kg, cm, m)' : '英制 (lbs, inch, ft)'}
            </p>
          </div>
          <UnitSystemToggle size="default" showLabel={true} />
        </div>
      </div>

      {/* 产品卡片演示 */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <div className="flex gap-4">
          {/* 产品图片占位 */}
          <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded border flex items-center justify-center">
            <span className="text-xs text-gray-500">图片</span>
          </div>

          {/* 产品信息 */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1">
              {demoProduct.name}
            </h4>
            <p className="text-sm text-gray-600 mb-2">
              Part Number: {demoProduct.part_number}
            </p>
            
            {/* 详细字段 - 使用智能单位显示 */}
            <div className="cart-item-properties">
              <div className="property-item">
                <span className="property-label">Part Number:</span>
                <span className="property-value">{demoProduct.part_number}</span>
              </div>
              
              <div className="property-item">
                <span className="property-label">Model:</span>
                <span className="property-value">{demoProduct.model}</span>
              </div>
              
              <div className="property-item">
                <span className="property-label">Voltage:</span>
                <span className="property-value">
                  <SmartFieldValue 
                    product={demoProduct} 
                    fieldKey="voltage" 
                    showUnit={true}
                  />
                </span>
              </div>
              
              <div className="property-item">
                <span className="property-label">Pieces per Box:</span>
                <span className="property-value">{demoProduct.pcs_per_box}</span>
              </div>
              
              <div className="property-item">
                <span className="property-label">Pieces per Pallet:</span>
                <span className="property-value">{demoProduct.pcs_per_pallet}</span>
              </div>
              
              {/* 智能单位制字段 */}
              <div className="property-item" style={{ backgroundColor: '#fff3cd', padding: '4px', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                <span className="property-label">Package Size:</span>
                <span className="property-value">
                  <SmartFieldValue 
                    product={demoProduct} 
                    fieldKey="package_size" 
                    showUnit={true}
                  />
                </span>
              </div>
              
              <div className="property-item" style={{ backgroundColor: '#fff3cd', padding: '4px', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                <span className="property-label">Pallet Size:</span>
                <span className="property-value">
                  <SmartFieldValue 
                    product={demoProduct} 
                    fieldKey="pallet_size" 
                    showUnit={true}
                  />
                </span>
              </div>
              
              <div className="property-item" style={{ backgroundColor: '#fff3cd', padding: '4px', borderRadius: '4px', border: '1px solid #ffeaa7' }}>
                <span className="property-label">Net Weight:</span>
                <span className="property-value">
                  <SmartFieldValue 
                    product={demoProduct} 
                    fieldKey="net_weight" 
                    showUnit={true}
                  />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 说明文档 */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">功能说明</h3>
        <ul className="text-sm text-blue-700 space-y-2">
          <li>• <strong>黄色高亮字段</strong>：支持智能单位制切换的字段</li>
          <li>• <strong>公制模式</strong>：显示 cm、kg 等公制单位</li>
          <li>• <strong>英制模式</strong>：显示 inch、lbs 等英制单位</li>
          <li>• <strong>实时切换</strong>：点击右上角开关即可切换单位制</li>
          <li>• <strong>自动单位</strong>：根据字段类型自动添加相应单位</li>
        </ul>
      </div>

      {/* 技术细节 */}
      <div className="mt-6 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">技术实现</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-700 mb-2">当前字段映射</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Package Size: {preferredUnitSystem === 'metric' ? 'package_size_cm' : 'package_size_inch'}</li>
              <li>• Pallet Size: {preferredUnitSystem === 'metric' ? 'pallet_size_cm' : 'pallet_size_inch'}</li>
              <li>• Net Weight: {preferredUnitSystem === 'metric' ? 'net_weight_kg' : 'net_weight_lbs'}</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 mb-2">显示的单位</h4>
            <ul className="text-gray-600 space-y-1">
              <li>• Package Size: {preferredUnitSystem === 'metric' ? 'cm' : 'inch'}</li>
              <li>• Pallet Size: {preferredUnitSystem === 'metric' ? 'cm' : 'inch'}</li>
              <li>• Net Weight: {preferredUnitSystem === 'metric' ? 'kg' : 'lbs'}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}; 