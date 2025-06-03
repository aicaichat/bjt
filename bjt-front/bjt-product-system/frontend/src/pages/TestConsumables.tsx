import React from 'react';
import { useTranslation } from 'react-i18next';

const TestConsumables: React.FC = () => {
  const { t } = useTranslation('consumables');

  console.log('测试翻译函数返回值类型：');
  console.log('t("filter.width"):', typeof t('filter.width'), t('filter.width'));
  console.log('t("actions.addToCart"):', typeof t('actions.addToCart'), t('actions.addToCart'));
  console.log('t("materials.PAPER"):', typeof t('materials.PAPER'), t('materials.PAPER'));
  console.log('t("shapes.FLAT"):', typeof t('shapes.FLAT'), t('shapes.FLAT'));

  // 测试可能返回对象的翻译调用
  const testTranslations = [
    'filter.width',
    'filter.length', 
    'filter.material',
    'filter.shape',
    'filter.thickness',
    'actions.addToCart',
    'actions.moreInfo',
    'price',
    'quantity',
    'inventory',
    'loading',
    'error.retry',
    'noProducts.title',
    'noProducts.message',
    'button.resetFilters',
    'button.apply'
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Consumables翻译测试页面</h1>
      
      <h2>翻译函数返回值检测：</h2>
      <div style={{ marginBottom: '20px' }}>
        {testTranslations.map(key => {
          const value = t(key);
          const type = typeof value;
          const isObject = type === 'object' && value !== null;
          
          return (
            <div key={key} style={{ 
              padding: '5px', 
              marginBottom: '5px',
              backgroundColor: isObject ? '#ffebee' : '#e8f5e8',
              border: `1px solid ${isObject ? '#f44336' : '#4caf50'}`
            }}>
              <strong>{key}:</strong> 
              <span style={{ marginLeft: '10px' }}>
                类型: {type}
              </span>
              <span style={{ marginLeft: '10px' }}>
                值: {isObject ? JSON.stringify(value) : String(value)}
              </span>
              {isObject && (
                <span style={{ color: '#f44336', marginLeft: '10px' }}>
                  ⚠️ 返回了对象！
                </span>
              )}
            </div>
          );
        })}
      </div>

      <h2>安全渲染测试：</h2>
      <div style={{ marginBottom: '20px' }}>
        <p>直接渲染 t('filter.width'): {String(t('filter.width') || 'fallback')}</p>
        <p>直接渲染 t('actions.addToCart'): {String(t('actions.addToCart') || 'fallback')}</p>
        <p>直接渲染 t('price'): {String(t('price') || 'fallback')}</p>
      </div>

      <h2>可能有问题的复杂对象测试：</h2>
      <div style={{ marginBottom: '20px' }}>
        {/* 测试一些可能返回复杂对象的情况 */}
        <p>materials.PAPER: {String(t('materials.PAPER') || 'N/A')}</p>
        <p>shapes.FLAT: {String(t('shapes.FLAT') || 'N/A')}</p>
        <p>inventory状态: {String(t('inventory') || 'N/A')}</p>
      </div>
    </div>
  );
};

export default TestConsumables; 