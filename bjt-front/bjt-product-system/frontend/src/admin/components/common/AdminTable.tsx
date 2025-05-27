import React, { useState } from 'react';
import { Table, TableProps, Button, Space, Input, Select } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { InputChangeEvent, PaginationShowTotal, TableChangeEvent } from '../../../types/events';

interface AdminTableProps<T = any> extends TableProps<T> {
  columns: ColumnsType<T>;
  dataSource: T[];
  loading?: boolean;
  pagination?: any;
  rowSelection?: any;
  onChange?: TableChangeEvent;
  tableTitle?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRefresh?: () => void;
  extra?: React.ReactNode;
  batchActions?: React.ReactNode;
}

function AdminTable<T = any>({
  columns,
  dataSource,
  loading = false,
  pagination,
  rowSelection,
  onChange,
  tableTitle,
  searchable = true,
  searchPlaceholder = '搜索...',
  onSearch,
  onRefresh,
  extra,
  batchActions,
  ...restProps
}: AdminTableProps<T>) {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (e: InputChangeEvent) => {
    setSearchText(e.target.value);
  };

  const handleRefresh = () => {
    setSearchText('');
    onRefresh?.();
  };

  const handleTableChange = (
    paginationConfig: any,
    filters: any,
    sorter: any
  ) => {
    onChange?.(paginationConfig, filters, sorter);
  };

  const showTotal = (total: number, range?: [number, number]) => 
    range ? `第 ${range[0]}-${range[1]} 条/共 ${total} 条` : `共 ${total} 条`;

  const defaultPagination = {
    current: pagination?.current || 1,
    pageSize: pagination?.pageSize || 10,
    total: pagination?.total || 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal,
    ...pagination
  };

  const handleRowSelectionChange = (
    selectedRowKeys: React.Key[],
    selectedRows: T[]
  ) => {
    if (rowSelection?.onChange) {
      rowSelection.onChange(selectedRowKeys, selectedRows);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-4">
          {tableTitle && <h2 className="text-lg font-medium">{tableTitle}</h2>}
          {searchable && (
            <Input
              placeholder={searchPlaceholder}
              value={searchText}
              onChange={handleSearch}
              prefix={<SearchOutlined />}
              className="w-64"
            />
          )}
          {onRefresh && (
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
          )}
        </div>
        <Space>
          {extra}
        </Space>
      </div>
      
      {batchActions && (
        <div className="mb-4">
          {batchActions}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={defaultPagination}
        rowSelection={
          rowSelection
            ? {
                ...rowSelection,
                onChange: handleRowSelectionChange
              }
            : undefined
        }
        onChange={handleTableChange}
        {...restProps}
        className="admin-table"
      />
    </div>
  );
}

export default AdminTable; 