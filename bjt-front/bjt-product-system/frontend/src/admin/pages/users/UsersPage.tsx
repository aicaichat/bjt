import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Card,
  message,
  Modal,
  Form,
  Switch,
  Avatar,
  Badge,
  Tooltip,
  Divider
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  UserOutlined,
  LockOutlined,
  UnlockOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import ImportExportButtons from '../../components/common/ImportExportButtons';
import UserManagementTabs from '../../components/common/UserManagementTabs';
import { useAdminApi } from '../../hooks/useAdminApi';
import adminUserService from '../../services/admin-user.service';

const { Search } = Input;
const { Option } = Select;

// 用户接口定义
export interface User {
  id: number;
  username: string;
  email: string;
  customer_code: string;
  role: string;
  country: string;
  region: string;
  company_logo: string;
  status: 'active' | 'inactive' | 'suspended';
  preferred_unit: 'metric' | 'imperial';
  created_at: string;
  updated_at: string;
}

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);

  // 使用API hook获取用户数据
  const {
    data: userData,
    loading: usersLoading,
    refetch,
    updateParams
  } = useAdminApi(
    adminUserService.getUsers.bind(adminUserService),
    {
      page: 1,
      per_page: 10,
      search: '',
      role: undefined,
      status: undefined,
      country: undefined,
      preferred_unit: undefined
    }
  );

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchValue(value);
    updateParams({ search: value, page: 1 });
  };

  // 表格分页变化处理
  const handleTableChange = (pagination: any) => {
    updateParams({
      page: pagination.current,
      per_page: pagination.pageSize
    });
  };

  // 删除用户
  const handleDeleteUser = async (id: number) => {
    try {
      await adminUserService.deleteUser(id);
      message.success('用户删除成功');
      refetch();
    } catch (error) {
      message.error('删除失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 切换用户状态
  const handleToggleStatus = async (id: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await adminUserService.updateUser(id, { status: newStatus });
      message.success('状态更新成功');
      refetch();
    } catch (error) {
      message.error('状态更新失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 重置密码
  const handleResetPassword = async (id: number, username: string) => {
    Modal.confirm({
      title: '确认重置密码',
      content: `确定要重置用户 "${username}" 的密码吗？`,
      onOk: async () => {
        try {
          await adminUserService.resetPassword(id);
          message.success('密码重置成功，新密码已发送到用户邮箱');
        } catch (error) {
          message.error('密码重置失败：' + (error instanceof Error ? error.message : '未知错误'));
        }
      }
    });
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '头像',
      dataIndex: 'company_logo',
      key: 'company_logo',
      width: 60,
      render: (logo: string, record: User) => (
        <Avatar
          src={logo}
          icon={<UserOutlined />}
          size="default"
        />
      ),
    },
    {
      title: '用户信息',
      key: 'user_info',
      width: 200,
      render: (_: any, record: User) => (
        <div>
          <div className="font-medium">{record.username}</div>
          <div className="text-sm text-gray-500">{record.email}</div>
          <div className="text-xs text-gray-400">{record.customer_code}</div>
        </div>
      ),
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role: string) => {
        const roleColors = {
          admin: 'red',
          sales: 'orange',
          partner: 'blue',
          customer: 'green',
        };
        
        // 更强的错误处理
        const safeRole = role || 'customer';
        const color = roleColors[safeRole as keyof typeof roleColors] || 'default';
        
        return (
          <Tag color={color}>
            {safeRole.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: '地区信息',
      key: 'location',
      width: 150,
      render: (_: any, record: User) => (
        <div>
          <div className="flex items-center gap-1">
            <GlobalOutlined className="text-gray-500" />
            <span className="text-sm">{record.country}</span>
          </div>
          <div className="text-xs text-gray-500">{record.region}</div>
        </div>
      ),
    },
    {
      title: '单位偏好',
      dataIndex: 'preferred_unit',
      key: 'preferred_unit',
      width: 100,
      render: (unit: string) => {
        const safeUnit = unit || 'metric';
        return (
          <Tag color={safeUnit === 'metric' ? 'blue' : 'green'}>
            {safeUnit === 'metric' ? '公制' : '英制'}
          </Tag>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusConfig = {
          active: { color: 'success', text: '活跃' },
          inactive: { color: 'default', text: '未激活' },
          suspended: { color: 'error', text: '已暂停' },
        };
        
        // 更强的错误处理
        const safeStatus = status || 'inactive';
        const config = statusConfig[safeStatus as keyof typeof statusConfig] || { color: 'default', text: safeStatus || '未知' };
        
        return (
          <Badge
            status={config?.color as any || 'default'}
            text={config?.text || '未知'}
          />
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: User) => (
        <Space size="small">
          <Tooltip title="编辑用户">
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/users/edit/${record.id}`)}
            />
          </Tooltip>
          
          <Tooltip title={record.status === 'active' ? '禁用用户' : '启用用户'}>
            <Button
              type="link"
              size="small"
              icon={record.status === 'active' ? <LockOutlined /> : <UnlockOutlined />}
              onClick={() => handleToggleStatus(record.id, record.status)}
            />
          </Tooltip>
          
          <Tooltip title="重置密码">
            <Button
              type="link"
              size="small"
              icon={<LockOutlined />}
              onClick={() => handleResetPassword(record.id, record.username)}
            />
          </Tooltip>
          
          <Tooltip title="删除用户">
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteUser(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // 监听筛选变化
  useEffect(() => {
    const newParams: any = { page: 1 };
    if (selectedRole) newParams.role = selectedRole;
    if (selectedStatus) newParams.status = selectedStatus;
    if (selectedCountry) newParams.country = selectedCountry;
    if (selectedUnit) newParams.preferred_unit = selectedUnit;
    
    updateParams(newParams);
  }, [selectedRole, selectedStatus, selectedCountry, selectedUnit, updateParams]);

  const users = (userData as any)?.items || [];
  
  // 数据验证和清理
  const validUsers = users.filter((user: any) => user && typeof user === 'object').map((user: any) => ({
    ...user,
    id: user.id || 0,
    username: user.username || '',
    email: user.email || '',
    customer_code: user.customer_code || '',
    role: user.role || 'customer',
    country: user.country || '',
    region: user.region || '',
    company_logo: user.company_logo || '',
    status: user.status || 'inactive',
    preferred_unit: user.preferred_unit || 'metric',
    created_at: user.created_at || '',
    updated_at: user.updated_at || ''
  }));
  
  const pagination = {
    page: (userData as any)?.page || 1,
    per_page: (userData as any)?.page_size || 10,
    total: (userData as any)?.total || 0,
    total_pages: (userData as any)?.total_pages || 1
  };

  // 导入处理函数
  const handleImport = async (file: File): Promise<void> => {
    try {
      await adminUserService.importUsers(file);
      message.success('导入成功');
      refetch();
    } catch (error) {
      message.error('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 导出处理函数  
  const handleExport = async (): Promise<void> => {
    try {
      const exportParams = {
        role: selectedRole,
        status: selectedStatus,
        country: selectedCountry,
        preferred_unit: selectedUnit
      };
      const blob = await adminUserService.exportUsers(exportParams);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 批量删除处理函数
  const handleBatchDelete = async () => {
    try {
      await adminUserService.batchOperation('delete', selectedRowKeys as number[]);
      message.success('批量删除成功');
      setSelectedRowKeys([]);
      refetch();
    } catch (error) {
      message.error('批量删除失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <AdminPageHeader
        title="用户管理"
        breadcrumb={[
          { title: '首页', path: '/admin' },
          { title: '用户管理' }
        ]}
      />
      
      <UserManagementTabs />
      
      <Card>
        {/* 筛选工具栏 */}
        <div className="mb-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">搜索用户</label>
            <Search
              placeholder="搜索用户名、邮箱或客户代码"
              allowClear
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium mb-1">角色</label>
            <Select
              placeholder="选择角色"
              allowClear
              style={{ width: '100%' }}
              value={selectedRole}
              onChange={setSelectedRole}
            >
              <Option value="admin">管理员</Option>
              <Option value="sales">销售</Option>
              <Option value="partner">合作伙伴</Option>
              <Option value="customer">客户</Option>
            </Select>
          </div>
          
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium mb-1">状态</label>
            <Select
              placeholder="选择状态"
              allowClear
              style={{ width: '100%' }}
              value={selectedStatus}
              onChange={setSelectedStatus}
            >
              <Option value="active">活跃</Option>
              <Option value="inactive">未激活</Option>
              <Option value="suspended">已暂停</Option>
            </Select>
          </div>
          
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium mb-1">国家</label>
            <Select
              placeholder="选择国家"
              allowClear
              style={{ width: '100%' }}
              value={selectedCountry}
              onChange={setSelectedCountry}
            >
              <Option value="CN">中国</Option>
              <Option value="US">美国</Option>
              <Option value="UK">英国</Option>
              <Option value="DE">德国</Option>
              <Option value="JP">日本</Option>
            </Select>
          </div>
          
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium mb-1">单位偏好</label>
            <Select
              placeholder="单位偏好"
              allowClear
              style={{ width: '100%' }}
              value={selectedUnit}
              onChange={setSelectedUnit}
            >
              <Option value="metric">公制</Option>
              <Option value="imperial">英制</Option>
            </Select>
          </div>
        </div>

        <Divider />

        {/* 操作按钮 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/admin/users/create')}
            >
              新增用户
            </Button>
            
            <ImportExportButtons
              onImport={handleImport}
              onExport={handleExport}
            />
          </div>
          
          {selectedRowKeys.length > 0 && (
            <Button
              danger
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: `确定要删除这 ${selectedRowKeys.length} 个用户吗？`,
                  onOk: handleBatchDelete
                });
              }}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
          )}
        </div>

        {/* 用户表格 */}
        <Table
          columns={columns}
          dataSource={validUsers}
          rowKey="id"
          loading={usersLoading}
          scroll={{ x: 1200 }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.per_page,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条记录`,
          }}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default UsersPage;