import React, { useState, useEffect } from 'react';
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
  Badge,
  Tooltip,
  Divider,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  SearchOutlined,
  UserOutlined,
  GlobalOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { getPendingUsers, approveUser, rejectUser, type User } from '../../services/registrationService';
import { usePendingUsersCount } from '../hooks/usePendingUsersCount';
import AdminPageHeader from '../components/common/AdminPageHeader';
import UserManagementTabs from '../components/common/UserManagementTabs';

const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

const RegistrationsPage: React.FC = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<number[]>([]);
  const [searchValue, setSearchValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | undefined>(undefined);
  const [selectedCountry, setSelectedCountry] = useState<string | undefined>(undefined);
  const [selectedUnit, setSelectedUnit] = useState<string | undefined>(undefined);
  
  // 审核相关状态
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [approveForm] = Form.useForm();
  const [rejectForm] = Form.useForm();

  // 用户数据状态
  const [userData, setUserData] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // 获取待审核用户数量的Hook
  const { refetch: refreshPendingCount } = usePendingUsersCount();

  // 获取用户数据
  const fetchUsers = async (params: any = {}) => {
    setUsersLoading(true);
    try {
      const response = await getPendingUsers({
        page: currentPage,
        per_page: pageSize,
        ...params
      });
      setUserData(response.data);
    } catch (error) {
      message.error('获取用户数据失败');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentPage, pageSize]);

  const refetch = () => {
    fetchUsers();
    // 同时刷新待审核数量
    refreshPendingCount();
  };
  
  const updateParams = (params: any) => {
    if (params.page) setCurrentPage(params.page);
    if (params.per_page) setPageSize(params.per_page);
    fetchUsers(params);
  };

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

  // 审核通过
  const handleApprove = async (user: User) => {
    setCurrentUser(user);
    // 预填表单数据
    approveForm.setFieldsValue({
      role: user.role,
      preferred_unit: user.preferred_unit,
      customer_code: user.customer_code,
      country: user.country
    });
    setApproveModalVisible(true);
  };

  // 确认审核通过
  const handleApproveConfirm = async () => {
    try {
      const values = await approveForm.validateFields();
      if (!currentUser) return;

      await approveUser(currentUser.id, values);
      message.success('用户审核通过');
      setApproveModalVisible(false);
      setCurrentUser(null);
      approveForm.resetFields();
      refetch(); // 这里会同时刷新列表和待审核数量
    } catch (error) {
      message.error('审核失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 审核拒绝
  const handleReject = async (user: User) => {
    setCurrentUser(user);
    setRejectModalVisible(true);
  };

  // 确认审核拒绝
  const handleRejectConfirm = async () => {
    try {
      const values = await rejectForm.validateFields();
      if (!currentUser) return;

      await rejectUser(currentUser.id, values.reason);
      message.success('用户审核拒绝');
      setRejectModalVisible(false);
      setCurrentUser(null);
      rejectForm.resetFields();
      refetch(); // 这里会同时刷新列表和待审核数量
    } catch (error) {
      message.error('审核失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  // 查看用户详情
  const handleView = (user: User) => {
    setCurrentUser(user);
    setViewModalVisible(true);
  };

  // 表格列定义
  const columns: ColumnsType<User> = [
    {
      title: '用户信息',
      key: 'user_info',
      width: 200,
      render: (_: any, record: User) => (
        <div>
          <div className="font-medium flex items-center gap-2">
            <UserOutlined className="text-gray-500" />
            {record.username}
          </div>
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
          dealer: 'orange',
          sales: 'blue',
          customer: 'green',
        };
        return (
          <Tag color={roleColors[role as keyof typeof roleColors] || 'default'}>
            {role.toUpperCase()}
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
          {record.region && (
            <div className="text-xs text-gray-500">{record.region}</div>
          )}
        </div>
      ),
    },
    {
      title: '单位偏好',
      dataIndex: 'preferred_unit',
      key: 'preferred_unit',
      width: 100,
      render: (unit: string) => (
        <Tag color={unit === 'metric' ? 'blue' : 'green'}>
          {unit === 'metric' ? '公制' : '英制'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Badge
          status="processing"
          text="待审核"
        />
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (date: string) => (
        <span className="text-sm">
          {new Date(date).toLocaleString('zh-CN')}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 200,
      render: (_: any, record: User) => (
        <Space size="small">
                     <Tooltip title="审核通过">
             <Button
               type="primary"
               size="small"
               icon={<CheckCircleOutlined />}
               onClick={() => handleApprove(record)}
             >
               通过
             </Button>
           </Tooltip>
           
           <Tooltip title="审核拒绝">
             <Button
               danger
               size="small"
               icon={<CloseCircleOutlined />}
               onClick={() => handleReject(record)}
             >
               拒绝
             </Button>
           </Tooltip>
          
          <Tooltip title="查看详情">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
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
    if (selectedCountry) newParams.country = selectedCountry;
    if (selectedUnit) newParams.preferred_unit = selectedUnit;
    
    updateParams(newParams);
  }, [selectedRole, selectedCountry, selectedUnit, updateParams]);

  const users = (userData as any)?.data?.items || [];
  const pagination = {
    page: (userData as any)?.data?.page || 1,
    per_page: (userData as any)?.data?.page_size || 10,
    total: (userData as any)?.data?.total || 0,
    total_pages: (userData as any)?.data?.total_pages || 1
  };

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <AdminPageHeader
        title="注册审核"
        description="审核待处理的用户注册申请"
        breadcrumb={[
          { title: '用户管理', icon: <TeamOutlined /> },
          { title: '注册审核' }
        ]}
        extra={
          <Badge 
            count={userData?.data?.total || 0} 
            showZero 
            style={{ backgroundColor: '#1890ff' }}
          >
            <Button 
              type="primary" 
              onClick={refetch}
              loading={usersLoading}
            >
              刷新列表
            </Button>
          </Badge>
        }
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
              onChange={(value) => {
                setSelectedRole(value);
                updateParams({ role: value, page: 1 });
              }}
            >
              <Option value="dealer">经销商</Option>
              <Option value="sales">销售</Option>
              <Option value="customer">客户</Option>
            </Select>
          </div>
          
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium mb-1">国家</label>
            <Select
              placeholder="选择国家"
              allowClear
              style={{ width: '100%' }}
              value={selectedCountry}
              onChange={(value) => {
                setSelectedCountry(value);
                updateParams({ country: value, page: 1 });
              }}
            >
              <Option value="CN">中国</Option>
              <Option value="US">美国</Option>
              <Option value="UK">英国</Option>
              <Option value="DE">德国</Option>
              <Option value="JP">日本</Option>
              <Option value="AU">澳大利亚</Option>
            </Select>
          </div>
          
          <div className="min-w-[120px]">
            <label className="block text-sm font-medium mb-1">单位偏好</label>
            <Select
              placeholder="单位偏好"
              allowClear
              style={{ width: '100%' }}
              value={selectedUnit}
              onChange={(value) => {
                setSelectedUnit(value);
                updateParams({ preferred_unit: value, page: 1 });
              }}
            >
              <Option value="metric">公制</Option>
              <Option value="imperial">英制</Option>
            </Select>
          </div>
        </div>

        <Divider />

        {/* 审核表格 */}
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={usersLoading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.per_page,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number) => `共 ${total} 条待审核记录`,
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: '暂无待审核的用户注册申请'
          }}
        />
      </Card>

      {/* 审核通过模态框 */}
      <Modal
        title="审核通过"
        open={approveModalVisible}
        onOk={handleApproveConfirm}
        onCancel={() => {
          setApproveModalVisible(false);
          setCurrentUser(null);
          approveForm.resetFields();
        }}
        width={600}
      >
        <Form
          form={approveForm}
          layout="vertical"
        >
          <Form.Item
            label="角色"
            name="role"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="选择角色">
              <Option value="dealer">经销商</Option>
              <Option value="sales">销售</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="单位偏好"
            name="preferred_unit"
            rules={[{ required: true, message: '请选择单位偏好' }]}
          >
            <Select placeholder="选择单位偏好">
              <Option value="metric">公制</Option>
              <Option value="imperial">英制</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="客户代码"
            name="customer_code"
            rules={[{ required: true, message: '请输入客户代码' }]}
          >
            <Input placeholder="输入客户代码" />
          </Form.Item>
          
          <Form.Item
            label="国家"
            name="country"
            rules={[{ required: true, message: '请选择国家' }]}
          >
            <Select placeholder="选择国家">
              <Option value="CN">中国</Option>
              <Option value="US">美国</Option>
              <Option value="UK">英国</Option>
              <Option value="DE">德国</Option>
              <Option value="JP">日本</Option>
              <Option value="CA">加拿大</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            label="备注"
            name="notes"
          >
            <TextArea rows={3} placeholder="可选：添加审核备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 审核拒绝模态框 */}
      <Modal
        title="审核拒绝"
        open={rejectModalVisible}
        onOk={handleRejectConfirm}
        onCancel={() => {
          setRejectModalVisible(false);
          setCurrentUser(null);
          rejectForm.resetFields();
        }}
        width={500}
      >
        <Form
          form={rejectForm}
          layout="vertical"
        >
          <Form.Item
            label="拒绝原因"
            name="reason"
            rules={[{ required: true, message: '请输入拒绝原因' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="请详细说明拒绝原因，用户将收到此消息"
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 查看详情模态框 */}
      <Modal
        title="用户详情"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setCurrentUser(null);
        }}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {currentUser && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text strong>用户名:</Text>
                <div>{currentUser.username}</div>
              </div>
              <div>
                <Text strong>邮箱:</Text>
                <div>{currentUser.email}</div>
              </div>
              <div>
                <Text strong>客户代码:</Text>
                <div>{currentUser.customer_code}</div>
              </div>
              <div>
                <Text strong>角色:</Text>
                <div>
                  <Tag color={currentUser.role === 'dealer' ? 'orange' : 'blue'}>
                    {currentUser.role.toUpperCase()}
                  </Tag>
                </div>
              </div>
              <div>
                <Text strong>国家:</Text>
                <div>{currentUser.country}</div>
              </div>
              <div>
                <Text strong>单位偏好:</Text>
                <div>
                  <Tag color={currentUser.preferred_unit === 'metric' ? 'blue' : 'green'}>
                    {currentUser.preferred_unit === 'metric' ? '公制' : '英制'}
                  </Tag>
                </div>
              </div>
              <div>
                <Text strong>状态:</Text>
                <div>
                  <Badge status="processing" text="待审核" />
                </div>
              </div>
              <div>
                <Text strong>提交时间:</Text>
                <div>{new Date(currentUser.created_at).toLocaleString('zh-CN')}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RegistrationsPage; 