import React, { useState } from 'react';
import ProductLineList from '../components/ProductLineList';
import SparePartList from '../components/SparePartList';
import MachineList from '../components/MachineList';
import AccessoryList from '../components/AccessoryList';
import ConsumableList from '../components/ConsumableList';
import '../styles/DashboardPage.css';
import { API_CONFIG } from '../config';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('productLines');

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <h1>BJT 产品管理系统</h1>
        <div className="environment-badge">
          {API_CONFIG.USE_MOCK_DATA ? '模拟数据模式' : '真实API模式'}
        </div>
      </header>

      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === 'productLines' ? 'active' : ''}`}
          onClick={() => setActiveTab('productLines')}
        >
          产品线
        </button>
        <button
          className={`tab-button ${activeTab === 'machines' ? 'active' : ''}`}
          onClick={() => setActiveTab('machines')}
        >
          机器设备
        </button>
        <button
          className={`tab-button ${activeTab === 'accessories' ? 'active' : ''}`}
          onClick={() => setActiveTab('accessories')}
        >
          配件
        </button>
        <button
          className={`tab-button ${activeTab === 'spareParts' ? 'active' : ''}`}
          onClick={() => setActiveTab('spareParts')}
        >
          备件
        </button>
        <button
          className={`tab-button ${activeTab === 'consumables' ? 'active' : ''}`}
          onClick={() => setActiveTab('consumables')}
        >
          耗材
        </button>
      </div>

      <main className="dashboard-content">
        <div className="content-section">
          {activeTab === 'productLines' && (
            <>
              <h2>产品线列表</h2>
              <ProductLineList maxItems={6} />
            </>
          )}

          {activeTab === 'machines' && (
            <>
              <h2>机器设备列表</h2>
              <MachineList maxItems={6} />
            </>
          )}

          {activeTab === 'accessories' && (
            <>
              <h2>配件列表</h2>
              <AccessoryList maxItems={6} />
            </>
          )}

          {activeTab === 'spareParts' && (
            <>
              <h2>备件列表</h2>
              <SparePartList maxItems={6} />
            </>
          )}

          {activeTab === 'consumables' && (
            <>
              <h2>耗材列表</h2>
              <ConsumableList maxItems={6} />
            </>
          )}
        </div>
      </main>

      <footer className="dashboard-footer">
        <p>© 2023 BJT 产品管理系统</p>
        <div className="footer-links">
          <a href="/api-integration-status">API集成状态</a>
          <span className="separator">|</span>
          <a href="https://github.com/bjt-product-system" target="_blank" rel="noopener noreferrer">GitHub</a>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;