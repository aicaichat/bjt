import React, { useState } from 'react';
import { Table, TableProps, Button, Space, Input, Select } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

interface AdminTableProps<T> extends Omit<TableProps<T>, 'columns'> {
  columns: ColumnsType<T>;
  tableTitle?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (value: string) => void;
  onRefresh?: () => void;
  extra?: React.ReactNode;
  batchActions?: React.ReactNode;
}

function AdminTable<T extends object>({
  columns,
  tableTitle,
  searchable = true,
  searchPlaceholder = '搜索...',
  onSearch,
  onRefresh,
  extra,
  batchActions,
  ...tableProps
}: AdminTableProps<T>) {
  const [searchText, setSearchText] = useState('');

  const handleSearch = (value: string) => {
    setSearchText(value);
    onSearch?.(value);
  };

  const handleRefresh = () => {
    setSearchText('');
    onRefresh?.();
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
              onChange={(e) => handleSearch(e.target.value)}
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
        {...tableProps}
        className="admin-table"
      />
    </div>
  );
}

export default AdminTable; 