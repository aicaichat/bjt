import React from 'react';
import { Button, Space } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useImportExport, ImportExportConfig } from '../hooks/useImportExport';
import ImportExportModal from './ImportExportModal';

export interface TableImportExportProps<T = any> extends ImportExportConfig<T> {
  // 按钮样式配置
  showImport?: boolean;
  showExport?: boolean;
  buttonSize?: 'small' | 'middle' | 'large';
  buttonType?: 'default' | 'primary' | 'text' | 'link';
  
  // 自定义按钮文本
  importText?: string;
  exportText?: string;
  
  // 额外的className
  className?: string;
  
  // 按钮间距
  spacing?: 'small' | 'middle' | 'large' | number;
}

const TableImportExport = <T = any,>({
  showImport = true,
  showExport = true,
  buttonSize = 'middle',
  buttonType = 'default',
  importText = '导入',
  exportText = '导出',
  className,
  spacing = 'small',
  ...config
}: TableImportExportProps<T>) => {
  const {
    importLoading,
    importResult,
    modalVisible,
    handleExport,
    handleDownloadTemplate,
    handleImportFile,
    handleConfirmImport,
    showImportModal,
    hideImportModal,
    columns,
  } = useImportExport(config);

  return (
    <div className={className}>
      <Space size={spacing}>
        {showImport && (
          <Button
            type={buttonType}
            size={buttonSize}
            icon={<UploadOutlined />}
            onClick={showImportModal}
            loading={importLoading}
          >
            {importText}
          </Button>
        )}
        
        {showExport && (
          <Button
            type={buttonType}
            size={buttonSize}
            icon={<DownloadOutlined />}
            onClick={handleExport}
          >
            {exportText}
          </Button>
        )}
      </Space>

      {/* 导入导出模态框 */}
      <ImportExportModal
        visible={modalVisible}
        onCancel={hideImportModal}
        onImportSuccess={handleConfirmImport}
        onExport={handleExport}
        onDownloadTemplate={handleDownloadTemplate}
        onImportFile={handleImportFile}
        title={config.exportFileName ? config.exportFileName.replace(/\.csv$/, '') : '数据'}
        templateColumns={columns}
        importResult={importResult}
        importLoading={importLoading}
      />
    </div>
  );
};

export default TableImportExport; 