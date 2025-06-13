import React from 'react';
import { SmartFieldValue } from '../components/SmartFieldValue';
import { UnitSystemDisplay } from '../components/UnitSystemToggle';
import { useSmartUnitSystem } from '../hooks/useSmartUnitSystem';
import { useAuth } from '../contexts/AuthContext';

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

export const UnitSystemTestPage: React.FC = () => {
  const { preferredUnitSystem } = useSmartUnitSystem();
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          单位制自动显示演示页面
        </h1>
        
        {/* 用户单位制设置显示 */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <h2 className="text-lg font-semibold">用户单位制设置</h2>
            <p className="text-sm text-gray-600">
              基于用户账户设置: {preferredUnitSystem === 'metric' ? '公制 (kg, cm, m)' : '英制 (lbs, inch, ft)'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              用户: {user?.email || '未登录'} | 偏好: {user?.preferred_unit || 'metric'}
            </p>
          </div>
          <UnitSystemDisplay size="default" showLabel={true} />
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">说明</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 单位制现在完全基于用户账户设置中的 preferred_unit 字段</li>
            <li>• 不再提供手动切换功能，与备件页面、耗材页面保持一致</li>
            <li>• 如需修改单位制偏好，请前往个人设置页面</li>
            <li>• 系统会自动选择对应的数据字段（如 net_weight_kg 或 net_weight_lbs）</li>
          </ul>
        </div>
      </div>

      {/* 产品卡片演示 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            智能字段显示演示
          </h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-gray-600">
                净重({preferredUnitSystem === 'metric' ? 'kg' : 'lbs'}):
              </span>
              <span className="font-semibold text-gray-900">
                <SmartFieldValue product={demoProduct} fieldKey="net_weight" />
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-gray-600">
                包装尺寸({preferredUnitSystem === 'metric' ? 'cm' : 'inch'}):
              </span>
              <span className="font-semibold text-gray-900">
                <SmartFieldValue product={demoProduct} fieldKey="package_size" />
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="font-medium text-gray-600">
                托盘尺寸({preferredUnitSystem === 'metric' ? 'cm' : 'inch'}):
              </span>
              <span className="font-semibold text-gray-900">
                <SmartFieldValue product={demoProduct} fieldKey="pallet_size" />
              </span>
            </div>
            
            <div className="flex justify-between items-center py-2">
              <span className="font-medium text-gray-600">电压:</span>
              <span className="font-semibold text-gray-900">
                <SmartFieldValue product={demoProduct} fieldKey="voltage" />
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            原始数据对比
          </h3>
          
          <div className="space-y-3 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">公制数据:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• net_weight_kg: {demoProduct.net_weight_kg}</li>
                <li>• package_size_cm: {demoProduct.package_size_cm}</li>
                <li>• pallet_size_cm: {demoProduct.pallet_size_cm}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">英制数据:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• net_weight_lbs: {demoProduct.net_weight_lbs}</li>
                <li>• package_size_inch: {demoProduct.package_size_inch}</li>
                <li>• pallet_size_inch: {demoProduct.pallet_size_inch}</li>
              </ul>
            </div>
            
            <div className="mt-4 p-3 bg-green-50 rounded">
              <p className="text-green-700 text-xs">
                ✅ 系统自动选择 {preferredUnitSystem === 'metric' ? '公制' : '英制'} 数据显示
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 