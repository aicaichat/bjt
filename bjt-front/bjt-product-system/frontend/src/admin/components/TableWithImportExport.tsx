import React from 'react';
import { Table, Space, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import TableImportExport, { TableImportExportProps } from './TableImportExport';
import type { TableProps } from 'antd/es/table';

export interface TableWithImportExportProps<T = any> extends TableProps<T> {
  // 导入导出配置
  importExportConfig?: Omit<TableImportExportProps<T>, 'data'>;
  
  // 工具栏配置
  showToolbar?: boolean;
  toolbarExtra?: React.ReactNode;
  
  // 新增按钮配置
  showAddButton?: boolean;
  addButtonText?: string;
  onAddClick?: () => void;
  
  // 工具栏样式
  toolbarClassName?: string;
  toolbarStyle?: React.CSSProperties;
}

/**
 * 带有导入导出功能的表格组件
 * 
 * 使用示例：
 * ```tsx
 * <TableWithImportExport
 *   dataSource={data}
 *   columns={columns}
 *   importExportConfig={{
 *     columns: exportColumns,
 *     exportFileName: 'data.csv',
 *     onImportSuccess: handleImport,
 *     requiredFields: ['name', 'code']
 *   }}
 *   onAddClick={handleAdd}
 * />
 * ```
 */
const TableWithImportExport = <T extends Record<string, any> = any,>({
  importExportConfig,
  showToolbar = true,
  toolbarExtra,
  showAddButton = true,
  addButtonText = '新增',
  onAddClick,
  toolbarClassName = 'mb-4 flex justify-between',
  toolbarStyle,
  dataSource = [],
  ...tableProps
}: TableWithImportExportProps<T>) => {
  
  // 确保dataSource是数组类型以传递给TableImportExport
  const exportData = Array.isArray(dataSource) ? [...dataSource] : [];
  
  const renderToolbar = () => {
    if (!showToolbar) return null;
    
    return (
      <div className={toolbarClassName} style={toolbarStyle}>
        <div>
          <Space>
            {showAddButton && onAddClick && (
              <Button type="primary" icon={<PlusOutlined />} onClick={onAddClick}>
                {addButtonText}
              </Button>
            )}
            
            {importExportConfig && (
              <TableImportExport
                {...importExportConfig}
                data={exportData}
              />
            )}
          </Space>
        </div>
        
        {toolbarExtra && (
          <div>
            {toolbarExtra}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderToolbar()}
      
      <Table
        {...tableProps}
        dataSource={dataSource}
      />
    </div>
  );
};

export default TableWithImportExport; 