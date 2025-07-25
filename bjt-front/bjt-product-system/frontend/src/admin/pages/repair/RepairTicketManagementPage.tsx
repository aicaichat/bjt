import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Badge,
  Modal,
  Form,
  message,
  Drawer,
  Descriptions,
  Timeline,
  Upload,
  Divider,
  Row,
  Col,
  Statistic,
  DatePicker,
  Tooltip,
  Popconfirm,
  Typography
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ToolOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExportOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { repairService } from '../../../services/repair.service';
import FileUploadHandler from '../../../components/Repair/FileUploadHandler';
import AdminPageHeader from '../../components/common/AdminPageHeader';
import type {
  RepairTicket,
  RepairTicketListParams,
  RepairTicketStatus,
  RepairPriority,
  RepairIssueType,
  Warehouse,
  Technician,
  RepairTicketStats,
  RepairTicketActivity
} from '../../../types/repair.types';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const RepairTicketManagementPage: React.FC = () => {
  const [tickets, setTickets] = useState<RepairTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useState<RepairTicketListParams>({
    page: 1,
    per_page: 10
  });
  const [total, setTotal] = useState(0);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [stats, setStats] = useState<RepairTicketStats | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTickets();
    loadWarehouses();
    loadStats();
  }, [params]);

  // 加载工单列表
  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await repairService.getRepairTickets(params);
      if (response.success) {
        setTickets(response.data.items);
        setTotal(response.data.total);
      }
    } catch (error) {
      message.error('加载工单列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载仓库列表
  const loadWarehouses = async () => {
    try {
      const response = await repairService.getWarehouses();
      if (response.success) {
        setWarehouses(response.data);
      }
    } catch (error) {
      console.error('Failed to load warehouses:', error);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      const response = await repairService.getRepairTicketStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // 加载技术员列表
  const loadTechnicians = async (warehouseId?: number) => {
    try {
      const response = await repairService.getTechnicians(warehouseId);
      if (response.success) {
        setTechnicians(response.data);
      }
    } catch (error) {
      console.error('Failed to load technicians:', error);
    }
  };

  // 查看工单详情
  const viewTicketDetail = async (ticket: RepairTicket) => {
    try {
      const response = await repairService.getRepairTicketDetail(ticket.id);
      if (response.success) {
        setSelectedTicket(response.data);
        setDetailVisible(true);
      }
    } catch (error) {
      message.error('加载工单详情失败');
    }
  };

  // 分配工单
  const handleAssign = (ticket: RepairTicket) => {
    setSelectedTicket(ticket);
    form.setFieldsValue({
      assigned_warehouse: ticket.assigned_warehouse,
      assigned_technician: ticket.assigned_technician
    });
    setAssignModalVisible(true);
  };

  // 确认分配
  const confirmAssign = async (values: any) => {
    if (!selectedTicket) return;
    
    try {
      const response = await repairService.updateRepairTicket(selectedTicket.id, {
        assigned_warehouse: values.assigned_warehouse,
        assigned_technician: values.assigned_technician,
        status: 'assigned'
      });
      
      if (response.success) {
        message.success('分配成功');
        setAssignModalVisible(false);
        loadTickets();
      }
    } catch (error) {
      message.error('分配失败');
    }
  };

  // 更新工单状态
  const updateTicketStatus = async (ticketId: number, status: RepairTicketStatus) => {
    try {
      const response = await repairService.updateRepairTicket(ticketId, { status });
      if (response.success) {
        message.success('状态更新成功');
        loadTickets();
      }
    } catch (error) {
      message.error('状态更新失败');
    }
  };

  // 删除工单
  const deleteTicket = async (ticketId: number) => {
    try {
      const response = await repairService.deleteRepairTicket(ticketId);
      if (response.success) {
        message.success('删除成功');
        loadTickets();
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 批量操作
  const handleBatchOperation = async (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要操作的工单');
      return;
    }

    try {
      // 这里应该调用批量操作的API
      message.success(`批量${action}成功`);
      setSelectedRowKeys([]);
      loadTickets();
    } catch (error) {
      message.error(`批量${action}失败`);
    }
  };

  // 导出工单
  const exportTickets = async () => {
    try {
      // 这里应该调用导出API
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  // 表格列定义
  const columns: ColumnsType<RepairTicket> = [
    {
      title: '工单编号',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      fixed: 'left',
      width: 150,
      render: (text: string, record: RepairTicket) => (
        <Button
          type="link"
          onClick={() => viewTicketDetail(record)}
        >
          {text}
        </Button>
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 200,
      render: (_, record: RepairTicket) => (
        <div>
          <div><UserOutlined /> {record.customer_name}</div>
          <div><PhoneOutlined /> {record.customer_phone}</div>
          <div><MailOutlined /> {record.customer_email}</div>
        </div>
      )
    },
    {
      title: '问题类型',
      dataIndex: 'issue_type',
      key: 'issue_type',
      width: 120,
      render: (type: RepairIssueType) => {
        const typeMap = {
          hardware_failure: { text: '硬件故障', color: 'red' },
          software_issue: { text: '软件问题', color: 'blue' },
          maintenance: { text: '维护保养', color: 'green' },
          installation: { text: '安装调试', color: 'orange' },
          training: { text: '培训支持', color: 'purple' },
          calibration: { text: '校准服务', color: 'cyan' },
          upgrade: { text: '升级服务', color: 'magenta' },
          other: { text: '其他', color: 'default' }
        };
        const config = typeMap[type] || typeMap.other;
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: RepairPriority) => {
        const priorityMap = {
          urgent: { text: '紧急', color: 'red' },
          high: { text: '高', color: 'orange' },
          normal: { text: '普通', color: 'blue' },
          low: { text: '低', color: 'green' }
        };
        const config = priorityMap[priority];
        return <Tag color={config.color}>{config.text}</Tag>;
      }
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: RepairTicketStatus) => {
        const statusMap = {
          pending: { text: '待处理', color: 'orange' },
          assigned: { text: '已分配', color: 'blue' },
          in_progress: { text: '处理中', color: 'cyan' },
          waiting_parts: { text: '等待配件', color: 'purple' },
          completed: { text: '已完成', color: 'green' },
          cancelled: { text: '已取消', color: 'red' },
          rejected: { text: '已拒绝', color: 'red' }
        };
        const config = statusMap[status];
        return <Badge status="processing" text={<Tag color={config.color}>{config.text}</Tag>} />;
      }
    },
    {
      title: '分配信息',
      key: 'assignment',
      width: 200,
      render: (_, record: RepairTicket) => (
        <div>
          {record.assigned_warehouse && (
            <div><EnvironmentOutlined /> {record.assigned_warehouse}</div>
          )}
          {record.technician_name && (
            <div><UserOutlined /> {record.technician_name}</div>
          )}
        </div>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 150,
      render: (text: string) => new Date(text).toLocaleString()
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 200,
      render: (_, record: RepairTicket) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => viewTicketDetail(record)}
            />
          </Tooltip>
          <Tooltip title="分配">
            <Button
              type="text"
              icon={<UserOutlined />}
              onClick={() => handleAssign(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Popconfirm
              title="确定要删除这个工单吗？"
              onConfirm={() => deleteTicket(record.id)}
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                danger
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <AdminPageHeader
        title="维修工单管理"
        description="管理所有维修工单，包括分配、状态更新、统计分析等功能"
      />

      {/* 统计卡片 */}
      {stats && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总工单数"
                value={stats.total}
                prefix={<ToolOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="待处理"
                value={stats.pending_count}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已完成"
                value={stats.by_status.completed || 0}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="平均处理时间"
                value={stats.avg_resolution_time}
                suffix="小时"
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>
      )}

      <Card>
        {/* 搜索和筛选 */}
        <div style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Search
                placeholder="搜索工单编号、客户名称..."
                onSearch={(value) => setParams({ ...params, search: value, page: 1 })}
                style={{ width: '100%' }}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="状态"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => setParams({ ...params, status: value, page: 1 })}
              >
                <Option value="pending">待处理</Option>
                <Option value="assigned">已分配</Option>
                <Option value="in_progress">处理中</Option>
                <Option value="waiting_parts">等待配件</Option>
                <Option value="completed">已完成</Option>
                <Option value="cancelled">已取消</Option>
                <Option value="rejected">已拒绝</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="优先级"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => setParams({ ...params, priority: value, page: 1 })}
              >
                <Option value="urgent">紧急</Option>
                <Option value="high">高</Option>
                <Option value="normal">普通</Option>
                <Option value="low">低</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="问题类型"
                style={{ width: '100%' }}
                allowClear
                onChange={(value) => setParams({ ...params, issue_type: value, page: 1 })}
              >
                <Option value="hardware_failure">硬件故障</Option>
                <Option value="software_issue">软件问题</Option>
                <Option value="maintenance">维护保养</Option>
                <Option value="installation">安装调试</Option>
                <Option value="training">培训支持</Option>
                <Option value="calibration">校准服务</Option>
                <Option value="upgrade">升级服务</Option>
                <Option value="other">其他</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Button
                icon={<ReloadOutlined />}
                onClick={loadTickets}
              >
                刷新
              </Button>
            </Col>
          </Row>
        </div>

        {/* 操作按钮 */}
        <div style={{ marginBottom: 16 }}>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                // 这里可以打开创建工单的模态框
                message.info('创建工单功能待实现');
              }}
            >
              创建工单
            </Button>
            <Button
              icon={<ExportOutlined />}
              onClick={exportTickets}
            >
              导出Excel
            </Button>
            {selectedRowKeys.length > 0 && (
              <>
                <Button
                  onClick={() => handleBatchOperation('分配')}
                >
                  批量分配
                </Button>
                <Button
                  onClick={() => handleBatchOperation('更新状态')}
                >
                  批量更新状态
                </Button>
                <Button
                  danger
                  onClick={() => handleBatchOperation('删除')}
                >
                  批量删除
                </Button>
              </>
            )}
          </Space>
        </div>

        {/* 表格 */}
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: params.page,
            pageSize: params.per_page,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
            onChange: (page, pageSize) => setParams({ ...params, page, per_page: pageSize })
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
            selections: [
              Table.SELECTION_ALL,
              Table.SELECTION_INVERT,
              Table.SELECTION_NONE
            ]
          }}
          scroll={{ x: 1500 }}
        />
      </Card>

      {/* 工单详情抽屉 */}
      <Drawer
        title="工单详情"
        placement="right"
        width={600}
        onClose={() => setDetailVisible(false)}
        open={detailVisible}
      >
        {selectedTicket && (
          <div>
            <Descriptions title="基本信息" bordered>
              <Descriptions.Item label="工单编号">{selectedTicket.ticket_number}</Descriptions.Item>
              <Descriptions.Item label="标题">{selectedTicket.title}</Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color="blue">{selectedTicket.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="优先级">
                <Tag color="orange">{selectedTicket.priority}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="问题类型">
                <Tag color="green">{selectedTicket.issue_type}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {new Date(selectedTicket.created_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="客户信息" bordered>
              <Descriptions.Item label="客户姓名">{selectedTicket.customer_name}</Descriptions.Item>
              <Descriptions.Item label="联系电话">{selectedTicket.customer_phone}</Descriptions.Item>
              <Descriptions.Item label="邮箱地址">{selectedTicket.customer_email}</Descriptions.Item>
              <Descriptions.Item label="公司名称">{selectedTicket.company_name || '无'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Descriptions title="设备信息" bordered>
              <Descriptions.Item label="设备型号">{selectedTicket.device_model || '无'}</Descriptions.Item>
              <Descriptions.Item label="设备序列号">{selectedTicket.device_serial || '无'}</Descriptions.Item>
              <Descriptions.Item label="设备位置">{selectedTicket.device_location || '无'}</Descriptions.Item>
              <Descriptions.Item label="购买日期">{selectedTicket.purchase_date || '无'}</Descriptions.Item>
              <Descriptions.Item label="保修状态">{selectedTicket.warranty_status || '无'}</Descriptions.Item>
            </Descriptions>

            <Divider />

            <div>
              <Title level={5}>问题描述</Title>
              <p>{selectedTicket.description}</p>
            </div>

            {selectedTicket.customer_notes && (
              <div>
                <Title level={5}>客户备注</Title>
                <p>{selectedTicket.customer_notes}</p>
              </div>
            )}

            {selectedTicket.internal_notes && (
              <div>
                <Title level={5}>内部备注</Title>
                <p>{selectedTicket.internal_notes}</p>
              </div>
            )}

            {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
              <div>
                <Title level={5}>附件</Title>
                <Upload
                  fileList={selectedTicket.attachments.map(att => ({
                    uid: att.id.toString(),
                    name: att.original_name,
                    status: 'done',
                    url: att.file_path
                  }))}
                  showUploadList={{
                    showDownloadIcon: true,
                    showRemoveIcon: false
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* 分配模态框 */}
      <Modal
        title="分配工单"
        open={assignModalVisible}
        onCancel={() => setAssignModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={confirmAssign}
        >
          <Form.Item
            label="分配仓库"
            name="assigned_warehouse"
            rules={[{ required: true, message: '请选择分配仓库' }]}
          >
            <Select
              placeholder="请选择仓库"
              onChange={(value) => {
                const warehouse = warehouses.find(w => w.code === value);
                if (warehouse) {
                  loadTechnicians(warehouse.id);
                }
              }}
            >
              {warehouses.map(warehouse => (
                <Option key={warehouse.code} value={warehouse.code}>
                  {warehouse.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="分配技术员"
            name="assigned_technician"
            rules={[{ required: true, message: '请选择分配技术员' }]}
          >
            <Select placeholder="请选择技术员">
              {technicians.map(technician => (
                <Option key={technician.id} value={technician.id}>
                  {technician.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RepairTicketManagementPage; 