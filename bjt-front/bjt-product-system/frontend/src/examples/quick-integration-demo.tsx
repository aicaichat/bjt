import React, { useState } from 'react';
import { 
  useProductLines, 
  useMachines, 
  useAccessories, 
  useConsumables, 
  useSpareParts,
  usePaginatedData 
} from '../hooks/useMockData';
import MockServiceStatus from '../components/MockServiceStatus';

/**
 * SQL Mock数据服务 - 快速集成演示
 * 展示如何在React组件中使用新的Hook系统
 */
const QuickIntegrationDemo: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'productLines' | 'machines' | 'accessories' | 'consumables' | 'spareParts'>('productLines');

  // 1. 产品线数据 - 基础用法
  const { data: productLines, loading: productLinesLoading, error: productLinesError } = useProductLines();

  // 2. 机器数据 - 带参数
  const { data: machines, loading: machinesLoading, refresh: refreshMachines } = useMachines({
    category: 1,
    page: 1,
    pageSize: 5
  });

  // 3. 配件数据 - 分页Hook
  const {
    data: accessoriesData,
    loading: accessoriesLoading,
    params: accessoriesParams,
    changePage: changeAccessoriesPage,
    updateFilter: updateAccessoriesFilter
  } = usePaginatedData('accessories', { category: 1, pageSize: 6 });

  // 4. 耗材数据 - 带成功回调
  const { data: consumables, loading: consumablesLoading } = useConsumables(
    { category: 1, page: 1, pageSize: 4 },
    {
      onSuccess: (data) => console.log('✅ 耗材数据加载完成:', data.total),
      onError: (error) => console.error('❌ 耗材数据加载失败:', error)
    }
  );

  // 5. 备件数据 - 手动加载
  const { data: spareParts, loading: sparePartsLoading, loadData: loadSpareParts } = useSpareParts(
    undefined,
    { autoLoad: false }
  );

  const handleLoadSpareParts = () => {
    loadSpareParts({ machineModel: 'LA-E4S V2.0', page: 1, pageSize: 8 });
  };

  const renderProductLines = () => (
    <div className="demo-section">
      <h3>📦 产品线数据 (useProductLines)</h3>
      {productLinesLoading && <p>加载中...</p>}
      {productLinesError && <p style={{ color: 'red' }}>错误: {productLinesError}</p>}
      {productLines && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
          {productLines.map((line: any) => (
            <div key={line.id} style={{ 
              border: '1px solid #ddd', 
              padding: '16px', 
              borderRadius: '8px',
              backgroundColor: '#f9f9f9'
            }}>
              <h4>{line.title_zh}</h4>
              <p>{line.description_zh}</p>
              <small>代码: {line.code}</small>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderMachines = () => (
    <div className="demo-section">
      <h3>🔧 机器数据 (useMachines)</h3>
      <button onClick={refreshMachines} style={{ marginBottom: '16px' }}>刷新数据</button>
      {machinesLoading && <p>加载中...</p>}
      {machines && (
        <div>
          <p>找到 {machines.total} 台机器，当前显示第 {machines.page} 页</p>
          <div style={{ display: 'grid', gap: '12px' }}>
            {machines.items.map((machine: any) => (
              <div key={machine.id} style={{ 
                border: '1px solid #ddd', 
                padding: '12px', 
                borderRadius: '6px',
                display: 'flex',
                justifyContent: 'space-between',
                backgroundColor: '#f9f9f9'
              }}>
                <div>
                  <strong>{machine.title_zh}</strong>
                  <p>型号: {machine.model} | 电压: {machine.voltage}</p>
                  <small>料号: {machine.part_number}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>价格: ¥{machine.price}</div>
                  <div>库存: {machine.inventory}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAccessories = () => (
    <div className="demo-section">
      <h3>🔌 配件数据 (usePaginatedData)</h3>
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="搜索配件..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              updateAccessoriesFilter({ search: (e.target as HTMLInputElement).value });
            }
          }}
          style={{ padding: '8px', marginRight: '8px' }}
        />
        <button onClick={() => updateAccessoriesFilter({ search: '' })}>清除搜索</button>
      </div>
      
      {accessoriesLoading && <p>加载中...</p>}
      {accessoriesData && (
        <div>
          <p>
            第 {accessoriesParams.page} 页，共 {accessoriesData.total_pages} 页 
            (总计 {accessoriesData.total} 个配件)
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
            {accessoriesData.items.map((accessory: any) => (
              <div key={accessory.id} style={{ 
                border: '1px solid #ddd', 
                padding: '12px', 
                borderRadius: '6px',
                backgroundColor: '#f9f9f9'
              }}>
                <h5>{accessory.name}</h5>
                <p>型号: {accessory.model}</p>
                <p>电压: {accessory.voltage}</p>
                <small>料号: {accessory.part_number}</small>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: '16px', textAlign: 'center' }}>
            {Array.from({ length: accessoriesData.total_pages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => changeAccessoriesPage(i + 1)}
                style={{
                  margin: '0 4px',
                  padding: '8px 12px',
                  backgroundColor: accessoriesParams.page === i + 1 ? '#007bff' : '#f8f9fa',
                  color: accessoriesParams.page === i + 1 ? 'white' : 'black',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderConsumables = () => (
    <div className="demo-section">
      <h3>📦 耗材数据 (useConsumables)</h3>
      {consumablesLoading && <p>加载中...</p>}
      {consumables && (
        <div>
          <p>找到 {consumables.total} 个耗材</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '12px' }}>
            {consumables.items.map((consumable: any) => (
              <div key={consumable.id} style={{ 
                border: '1px solid #ddd', 
                padding: '12px', 
                borderRadius: '6px',
                backgroundColor: '#f9f9f9'
              }}>
                <h5>{consumable.model}</h5>
                <p>材质: {consumable.material}</p>
                <p>厚度: {consumable.thickness_met}μm</p>
                <p>宽度: {consumable.width_met}cm</p>
                <small>料号: {consumable.part_number}</small>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderSpareParts = () => (
    <div className="demo-section">
      <h3>🔩 备件数据 (手动加载)</h3>
      <button 
        onClick={handleLoadSpareParts} 
        disabled={sparePartsLoading}
        style={{ marginBottom: '16px' }}
      >
        {sparePartsLoading ? '加载中...' : '加载 LA-E4S V2.0 备件'}
      </button>
      
      {spareParts && (
        <div>
          <p>找到 {spareParts.total} 个备件</p>
          <div style={{ display: 'grid', gap: '8px' }}>
            {spareParts.items.slice(0, 6).map((part: any) => (
              <div key={part.id} style={{ 
                border: '1px solid #ddd', 
                padding: '8px', 
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f9f9f9'
              }}>
                <div>
                  <strong>{part.name_zh}</strong>
                  <small style={{ marginLeft: '8px' }}>({part.part_number})</small>
                </div>
                <span style={{
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '10px',
                  backgroundColor: part.is_consumable ? '#fef3c7' : '#dbeafe',
                  color: part.is_consumable ? '#92400e' : '#1e40af'
                }}>
                  {part.is_consumable ? '易损件' : '非易损件'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Mock服务状态监控 */}
      <MockServiceStatus position="top-right" compact={true} />

      <h1>🚀 SQL Mock数据服务 - 快速集成演示</h1>
      <p>展示如何使用新的Hook系统轻松集成Mock数据</p>

      {/* 选项卡导航 */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        {['productLines', 'machines', 'accessories', 'consumables', 'spareParts'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            style={{
              padding: '10px 20px',
              marginRight: '8px',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #007bff' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tab === 'productLines' && '📦 产品线'}
            {tab === 'machines' && '🔧 机器'}
            {tab === 'accessories' && '🔌 配件'}
            {tab === 'consumables' && '📦 耗材'}
            {tab === 'spareParts' && '🔩 备件'}
          </button>
        ))}
      </div>

      {/* 内容区域 */}
      <div>
        {activeTab === 'productLines' && renderProductLines()}
        {activeTab === 'machines' && renderMachines()}
        {activeTab === 'accessories' && renderAccessories()}
        {activeTab === 'consumables' && renderConsumables()}
        {activeTab === 'spareParts' && renderSpareParts()}
      </div>

      {/* 代码示例 */}
      <div style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3>💻 当前页面使用的Hook代码</h3>
        <pre style={{ 
          fontSize: '12px', 
          overflow: 'auto',
          backgroundColor: '#ffffff',
          padding: '16px',
          borderRadius: '4px',
          border: '1px solid #ddd'
        }}>
{`// 1. 基础数据获取
const { data: productLines, loading, error } = useProductLines();

// 2. 带参数的数据获取
const { data: machines, refresh } = useMachines({
  category: 1,
  page: 1,
  pageSize: 5
});

// 3. 分页数据Hook
const {
  data,
  params,
  changePage,
  updateFilter
} = usePaginatedData('accessories', { category: 1 });

// 4. 带回调的数据获取
const { data: consumables } = useConsumables(params, {
  onSuccess: (data) => console.log('加载成功:', data.total),
  onError: (error) => console.error('加载失败:', error)
});

// 5. 手动加载数据
const { data, loadData } = useSpareParts(undefined, { autoLoad: false });
// 调用: loadData({ machineModel: 'LA-E4S V2.0' });`}
        </pre>
      </div>
    </div>
  );
};

export default QuickIntegrationDemo; 