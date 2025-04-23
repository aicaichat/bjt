import React, { useState, useEffect } from 'react';
import mockService from '../services/mockService';
import { useMockData } from '../config/env';

interface MockDataManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// 添加对象索引签名接口
interface MockDataObject {
  [key: string]: any;
}

const MockDataManager: React.FC<MockDataManagerProps> = ({ isOpen, onClose }) => {
  const [currentMockData, setCurrentMockData] = useState<any>(null);
  const [isMockDataEnabled, setIsMockDataEnabled] = useState<boolean>(useMockData);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [importDataText, setImportDataText] = useState<string>('');
  const [importSuccess, setImportSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshMockData();
    }
  }, [isOpen]);

  const refreshMockData = () => {
    setCurrentMockData(mockService.exportData());
    setIsMockDataEnabled(mockService.isEnabled());
  };

  const handleToggleMockData = () => {
    const newValue = !isMockDataEnabled;
    mockService.setEnabled(newValue);
    setIsMockDataEnabled(newValue);
  };

  const handleExportData = () => {
    const allData = mockService.getAllData() as MockDataObject;
    
    const dataStr = JSON.stringify(
      selectedSection === 'all' 
        ? mockService.exportData() 
        : allData[selectedSection],
      null, 2
    );
    
    // 创建一个Blob对象
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // 创建一个下载链接并点击
    const a = document.createElement('a');
    a.href = url;
    a.download = `mock-data-${selectedSection}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    try {
      const data = JSON.parse(importDataText);
      const result = mockService.importData(data);
      setImportSuccess(result);
      refreshMockData();
      
      // 3秒后重置导入状态
      setTimeout(() => {
        setImportSuccess(null);
        setImportDataText('');
      }, 3000);
    } catch (e) {
      console.error('导入失败:', e);
      setImportSuccess(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold dark:text-white">模拟数据管理</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4 flex flex-col md:flex-row gap-4 flex-grow overflow-hidden">
          {/* 左侧控制面板 */}
          <div className="w-full md:w-1/3 flex flex-col gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <h3 className="text-lg font-medium mb-3 dark:text-white">Mock数据控制</h3>
              
              <div className="flex items-center mb-4">
                <span className="mr-2 dark:text-white">启用Mock数据:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isMockDataEnabled}
                    onChange={handleToggleMockData}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 dark:text-white">选择数据部分:</label>
                <select 
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                >
                  <option value="all">全部数据</option>
                  <option value="machines">机器</option>
                  <option value="accessories">配件</option>
                  <option value="products">产品</option>
                  <option value="productLines">产品线</option>
                  <option value="users">用户</option>
                  <option value="orders">订单</option>
                  <option value="consumables">耗材</option>
                  <option value="spareParts">备件</option>
                </select>
              </div>
              
              <button
                onClick={handleExportData}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
              >
                导出选中数据
              </button>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg flex-grow">
              <h3 className="text-lg font-medium mb-3 dark:text-white">导入数据</h3>
              <textarea
                value={importDataText}
                onChange={(e) => setImportDataText(e.target.value)}
                placeholder="粘贴要导入的JSON数据..."
                className="w-full h-32 p-2 border border-gray-300 dark:border-gray-600 rounded resize-none mb-3 dark:bg-gray-700 dark:text-white"
              />
              
              <button
                onClick={handleImportData}
                disabled={!importDataText}
                className={`w-full py-2 text-white rounded-lg ${
                  !importDataText 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                导入数据
              </button>
              
              {importSuccess !== null && (
                <div className={`mt-2 p-2 rounded ${
                  importSuccess 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}>
                  {importSuccess ? '导入成功!' : '导入失败，请检查数据格式'}
                </div>
              )}
            </div>
          </div>
          
          {/* 右侧数据预览 */}
          <div className="w-full md:w-2/3 overflow-hidden flex flex-col">
            <h3 className="text-lg font-medium mb-2 dark:text-white">数据预览</h3>
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg flex-grow overflow-hidden">
              <div className="h-full overflow-auto p-4 bg-gray-50 dark:bg-gray-900">
                <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                  {currentMockData ? JSON.stringify(
                    selectedSection === 'all' 
                      ? currentMockData 
                      : (mockService.getAllData() as MockDataObject)[selectedSection], 
                    null, 2
                  ) : 'Loading...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockDataManager; 