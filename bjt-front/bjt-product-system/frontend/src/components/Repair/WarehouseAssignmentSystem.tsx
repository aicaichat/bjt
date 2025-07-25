import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Select,
  Button,
  Table,
  Space,
  message,
  Modal,
  Input,
  Switch,
  Tag,
  Divider,
  Row,
  Col,
  Typography,
  Alert,
  Tooltip,
  Progress,
  Badge
} from 'antd';
import {
  EnvironmentOutlined,
  UserOutlined,
  SettingOutlined,
  RocketOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { repairService } from '../../services/repair.service';
import type {
  RepairTicket,
  Warehouse,
  Technician,
  RepairIssueType,
  RepairPriority
} from '../../types/repair.types';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface AssignmentRule {
  id: number;
  name: string;
  priority: number;
  conditions: {
    issue_types?: RepairIssueType[];
    priorities?: RepairPriority[];
    customer_location?: string[];
    device_models?: string[];
    submission_method?: string[];
  };
  assignment: {
    warehouse_id: number;
    technician_id?: number;
    auto_assign: boolean;
  };
  enabled: boolean;
  created_at: string;
}

interface AssignmentStats {
  total_assignments: number;
  auto_assignments: number;
  manual_assignments: number;
  avg_assignment_time: number;
  warehouse_workload: Record<string, number>;
  technician_workload: Record<string, number>;
}

interface WarehouseAssignmentSystemProps {
  onAssignmentComplete?: (ticket: RepairTicket) => void;
  embedded?: boolean;
}

const WarehouseAssignmentSystem: React.FC<WarehouseAssignmentSystemProps> = ({
  onAssignmentComplete,
  embedded = false
}) => {
  const [activeTab, setActiveTab] = useState<'assign' | 'rules' | 'stats'>('assign');
  const [assignForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pendingTickets, setPendingTickets] = useState<RepairTicket[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<AssignmentRule | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);

  // 问题类型配置
  const issueTypeOptions = [
    { value: 'hardware_failure', label: '硬件故障' },
    { value: 'software_issue', label: '软件问题' },
    { value: 'maintenance', label: '维护保养' },
    { value: 'installation', label: '安装调试' },
    { value: 'training', label: '培训支持' },
    { value: 'calibration', label: '校准服务' },
    { value: 'upgrade', label: '升级服务' },
    { value: 'other', label: '其他' }
  ];

  // 优先级配置
  const priorityOptions = [
    { value: 'urgent', label: '紧急', color: 'red' },
    { value: 'high', label: '高', color: 'orange' },
    { value: 'normal', label: '普通', color: 'blue' },
    { value: 'low', label: '低', color: 'green' }
  ];

  useEffect(() => {
    loadPendingTickets();
    loadWarehouses();
    loadAssignmentRules();
    loadStats();
  }, []);

  // 加载待分配工单
  const loadPendingTickets = async () => {
    try {
      const response = await repairService.getRepairTickets({
        status: 'pending',
        per_page: 100
      });
      if (response.success) {
        setPendingTickets(response.data.items);
      }
    } catch (error) {
      console.error('Failed to load pending tickets:', error);
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

  // 加载分配规则
  const loadAssignmentRules = async () => {
    try {
      // 模拟数据
      const mockRules: AssignmentRule[] = [
        {
          id: 1,
          name: '紧急硬件故障自动分配',
          priority: 1,
          conditions: {
            issue_types: ['hardware_failure'],
            priorities: ['urgent', 'high']
          },
          assignment: {
            warehouse_id: 1,
            auto_assign: true
          },
          enabled: true,
          created_at: '2024-01-01 00:00:00'
        },
        {
          id: 2,
          name: '软件问题专项分配',
          priority: 2,
          conditions: {
            issue_types: ['software_issue'],
            priorities: ['normal', 'high']
          },
          assignment: {
            warehouse_id: 2,
            technician_id: 1,
            auto_assign: true
          },
          enabled: true,
          created_at: '2024-01-01 00:00:00'
        }
      ];
      setAssignmentRules(mockRules);
    } catch (error) {
      console.error('Failed to load assignment rules:', error);
    }
  };

  // 加载统计数据
  const loadStats = async () => {
    try {
      // 模拟数据
      const mockStats: AssignmentStats = {
        total_assignments: 150,
        auto_assignments: 120,
        manual_assignments: 30,
        avg_assignment_time: 15, // 分钟
        warehouse_workload: {
          '北京仓库': 45,
          '上海仓库': 38,
          '广州仓库': 32,
          '深圳仓库': 35
        },
        technician_workload: {
          '张三': 12,
          '李四': 15,
          '王五': 10,
          '赵六': 18
        }
      };
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  // 智能分配算法
  const intelligentAssignment = (ticket: RepairTicket): { warehouse: Warehouse; technician?: Technician } | null => {
    // 按优先级排序的规则
    const sortedRules = assignmentRules
      .filter(rule => rule.enabled)
      .sort((a, b) => a.priority - b.priority);

    for (const rule of sortedRules) {
      let matches = true;

      // 检查问题类型
      if (rule.conditions.issue_types && !rule.conditions.issue_types.includes(ticket.issue_type)) {
        matches = false;
      }

      // 检查优先级
      if (rule.conditions.priorities && !rule.conditions.priorities.includes(ticket.priority)) {
        matches = false;
      }

      // 检查提交方式
      if (rule.conditions.submission_method && !rule.conditions.submission_method.includes(ticket.submission_method)) {
        matches = false;
      }

      if (matches) {
        const warehouse = warehouses.find(w => w.id === rule.assignment.warehouse_id);
        const technician = rule.assignment.technician_id 
          ? technicians.find(t => t.id === rule.assignment.technician_id)
          : undefined;

        if (warehouse) {
          return { warehouse, technician };
        }
      }
    }

    // 如果没有匹配的规则，使用默认分配策略
    return getDefaultAssignment(ticket);
  };

  // 默认分配策略
  const getDefaultAssignment = (ticket: RepairTicket): { warehouse: Warehouse; technician?: Technician } | null => {
    // 根据地理位置分配
    if (ticket.location_address) {
      const warehouse = warehouses.find(w => 
        ticket.location_address?.includes(w.address.split(' ')[0])
      );
      if (warehouse) {
        return { warehouse };
      }
    }

    // 根据工作负载分配
    if (stats) {
      const sortedWarehouses = warehouses.sort((a, b) => {
        const aWorkload = stats.warehouse_workload[a.name] || 0;
        const bWorkload = stats.warehouse_workload[b.name] || 0;
        return aWorkload - bWorkload;
      });

      if (sortedWarehouses.length > 0) {
        return { warehouse: sortedWarehouses[0] };
      }
    }

    return null;
  };

  // 自动分配单个工单
  const autoAssignTicket = async (ticket: RepairTicket) => {
    const assignment = intelligentAssignment(ticket);
    
    if (!assignment) {
      message.warning('无法自动分配，请手动分配');
      return;
    }

    try {
      const response = await repairService.assignRepairTicket(
        ticket.id,
        assignment.warehouse.id,
        assignment.technician?.id || 0
      );

      if (response.success) {
        message.success(`工单 ${ticket.ticket_number} 已自动分配到 ${assignment.warehouse.name}`);
        loadPendingTickets();
        onAssignmentComplete?.(response.data);
      }
    } catch (error) {
      console.error('Auto assign error:', error);
      message.error('自动分配失败');
    }
  };

  // 批量自动分配
  const batchAutoAssign = async () => {
    if (selectedTickets.length === 0) {
      message.warning('请选择要分配的工单');
      return;
    }

    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    for (const ticketId of selectedTickets) {
      const ticket = pendingTickets.find(t => t.id === ticketId);
      if (ticket) {
        try {
          await autoAssignTicket(ticket);
          successCount++;
        } catch (error) {
          failCount++;
        }
      }
    }

    setLoading(false);
    setSelectedTickets([]);
    
    if (successCount > 0) {
      message.success(`成功分配 ${successCount} 个工单`);
    }
    if (failCount > 0) {
      message.warning(`${failCount} 个工单分配失败`);
    }
  };

  // 手动分配
  const manualAssign = async (values: any) => {
    if (selectedTickets.length === 0) {
      message.warning('请选择要分配的工单');
      return;
    }

    setLoading(true);
    try {
      const response = await repairService.batchUpdateRepairTickets(
        selectedTickets,
        'assign',
        {
          warehouse_id: values.warehouse_id,
          technician_id: values.technician_id
        }
      );

      if (response.success) {
        message.success('手动分配成功');
        setSelectedTickets([]);
        assignForm.resetFields();
        loadPendingTickets();
      }
    } catch (error) {
      console.error('Manual assign error:', error);
      message.error('手动分配失败');
    } finally {
      setLoading(false);
    }
  };

  // 保存分配规则
  const saveAssignmentRule = async (values: any) => {
    try {
      const ruleData = {
        ...values,
        id: editingRule?.id || Date.now(),
        created_at: editingRule?.created_at || new Date().toISOString()
      };

      if (editingRule) {
        setAssignmentRules(prev => prev.map(rule => 
          rule.id === editingRule.id ? { ...rule, ...ruleData } : rule
        ));
        message.success('规则更新成功');
      } else {
        setAssignmentRules(prev => [...prev, ruleData]);
        message.success('规则创建成功');
      }

      setRuleModalVisible(false);
      setEditingRule(null);
      ruleForm.resetFields();
    } catch (error) {
      console.error('Save rule error:', error);
      message.error('保存失败');
    }
  };

  // 删除分配规则
  const deleteAssignmentRule = (ruleId: number) => {
    setAssignmentRules(prev => prev.filter(rule => rule.id !== ruleId));
    message.success('规则删除成功');
  };

  // 切换规则状态
  const toggleRule = (ruleId: number) => {
    setAssignmentRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  // 待分配工单表格列
  const ticketColumns: ColumnsType<RepairTicket> = [
    {
      title: '工单编号',
      dataIndex: 'ticket_number',
      key: 'ticket_number',
      width: 150
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true
    },
    {
      title: '问题类型',
      dataIndex: 'issue_type',
      key: 'issue_type',
      width: 120,
      render: (type: RepairIssueType) => {
        const option = issueTypeOptions.find(opt => opt.value === type);
        return <Tag>{option?.label}</Tag>;
      }
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: RepairPriority) => {
        const option = priorityOptions.find(opt => opt.value === priority);
        return <Tag color={option?.color}>{option?.label}</Tag>;
      }
    },
    {
      title: '客户信息',
      key: 'customer',
      width: 180,
      render: (_, record: RepairTicket) => (
        <div>
          <div>{record.customer_name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.customer_phone}
          </div>
        </div>
      )
    },
    {
      title: '地理位置',
      dataIndex: 'location_address',
      key: 'location_address',
      width: 200,
      ellipsis: true,
      render: (address: string) => address ? (
        <Tooltip title={address}>
          <EnvironmentOutlined /> {address}
        </Tooltip>
      ) : '-'
    },
    {
      title: '建议分配',
      key: 'suggestion',
      width: 200,
      render: (_, record: RepairTicket) => {
        const suggestion = intelligentAssignment(record);
        return suggestion ? (
          <div>
            <div><EnvironmentOutlined /> {suggestion.warehouse.name}</div>
            {suggestion.technician && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <UserOutlined /> {suggestion.technician.name}
              </div>
            )}
          </div>
        ) : (
          <Text type="secondary">需手动分配</Text>
        );
      }
    },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_, record: RepairTicket) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<RocketOutlined />}
            onClick={() => autoAssignTicket(record)}
          >
            自动分配
          </Button>
        </Space>
      )
    }
  ];

  // 分配规则表格列
  const ruleColumns: ColumnsType<AssignmentRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: number) => (
        <Badge count={priority} style={{ backgroundColor: '#1890ff' }} />
      )
    },
    {
      title: '触发条件',
      key: 'conditions',
      width: 300,
      render: (_, record: AssignmentRule) => (
        <div>
          {record.conditions.issue_types && (
            <div>
              <Text strong>问题类型:</Text>{' '}
              {record.conditions.issue_types.map(type => (
                <Tag key={type} size="small">
                  {issueTypeOptions.find(opt => opt.value === type)?.label}
                </Tag>
              ))}
            </div>
          )}
          {record.conditions.priorities && (
            <div>
              <Text strong>优先级:</Text>{' '}
              {record.conditions.priorities.map(priority => (
                <Tag key={priority} size="small" color={priorityOptions.find(opt => opt.value === priority)?.color}>
                  {priorityOptions.find(opt => opt.value === priority)?.label}
                </Tag>
              ))}
            </div>
          )}
        </div>
      )
    },
    {
      title: '分配目标',
      key: 'assignment',
      width: 200,
      render: (_, record: AssignmentRule) => {
        const warehouse = warehouses.find(w => w.id === record.assignment.warehouse_id);
        const technician = record.assignment.technician_id 
          ? technicians.find(t => t.id === record.assignment.technician_id)
          : null;
        
        return (
          <div>
            <div><EnvironmentOutlined /> {warehouse?.name}</div>
            {technician && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                <UserOutlined /> {technician.name}
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      width: 100,
      render: (enabled: boolean, record: AssignmentRule) => (
        <Switch
          checked={enabled}
          onChange={() => toggleRule(record.id)}
          size="small"
        />
      )
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      render: (_, record: AssignmentRule) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRule(record);
              ruleForm.setFieldsValue(record);
              setRuleModalVisible(true);
            }}
          />
          <Button
            type="link"
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => deleteAssignmentRule(record.id)}
          />
        </Space>
      )
    }
  ];

  const content = (
    <div>
      {/* 标签页导航 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type={activeTab === 'assign' ? 'primary' : 'default'}
            icon={<UserOutlined />}
            onClick={() => setActiveTab('assign')}
          >
            工单分配
          </Button>
          <Button
            type={activeTab === 'rules' ? 'primary' : 'default'}
            icon={<SettingOutlined />}
            onClick={() => setActiveTab('rules')}
          >
            分配规则
          </Button>
          <Button
            type={activeTab === 'stats' ? 'primary' : 'default'}
            icon={<TeamOutlined />}
            onClick={() => setActiveTab('stats')}
          >
            分配统计
          </Button>
        </Space>
      </div>

      {/* 工单分配 */}
      {activeTab === 'assign' && (
        <div>
          {/* 批量操作栏 */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Row gutter={16}>
              <Col span={8}>
                <Form
                  form={assignForm}
                  layout="inline"
                  onFinish={manualAssign}
                >
                  <Form.Item
                    name="warehouse_id"
                    label="分配仓库"
                    rules={[{ required: true, message: '请选择仓库' }]}
                  >
                    <Select
                      placeholder="选择仓库"
                      style={{ width: 150 }}
                      onChange={(warehouseId) => loadTechnicians(warehouseId)}
                    >
                      {warehouses.map(warehouse => (
                        <Option key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item name="technician_id" label="技术员">
                    <Select
                      placeholder="选择技术员"
                      style={{ width: 150 }}
                      allowClear
                    >
                      {technicians.map(technician => (
                        <Option key={technician.id} value={technician.id}>
                          {technician.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>
                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={loading}
                      disabled={selectedTickets.length === 0}
                    >
                      手动分配
                    </Button>
                  </Form.Item>
                </Form>
              </Col>
              <Col span={16} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    type="primary"
                    icon={<RocketOutlined />}
                    onClick={batchAutoAssign}
                    loading={loading}
                    disabled={selectedTickets.length === 0}
                  >
                    批量自动分配
                  </Button>
                  <Text type="secondary">
                    已选择 {selectedTickets.length} 个工单
                  </Text>
                </Space>
              </Col>
            </Row>
          </Card>

          {/* 待分配工单表格 */}
          <Card title="待分配工单" size="small">
            <Table
              columns={ticketColumns}
              dataSource={pendingTickets}
              rowKey="id"
              size="small"
              scroll={{ x: 1200 }}
              rowSelection={{
                selectedRowKeys: selectedTickets,
                onChange: setSelectedTickets
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total) => `共 ${total} 条记录`
              }}
            />
          </Card>
        </div>
      )}

      {/* 分配规则 */}
      {activeTab === 'rules' && (
        <Card
          title="分配规则"
          size="small"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingRule(null);
                ruleForm.resetFields();
                setRuleModalVisible(true);
              }}
            >
              新增规则
            </Button>
          }
        >
          <Table
            columns={ruleColumns}
            dataSource={assignmentRules}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </Card>
      )}

      {/* 分配统计 */}
      {activeTab === 'stats' && stats && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TeamOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>总分配数</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.total_assignments}</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <RocketOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>自动分配</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3f8600' }}>{stats.auto_assignments}</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <UserOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>手动分配</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#cf1322' }}>{stats.manual_assignments}</div>
                  </div>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <ClockCircleOutlined style={{ fontSize: '20px', marginRight: '8px' }} />
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>平均分配时间</div>
                    <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats.avg_assignment_time}分钟</div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="仓库工作负载" size="small">
                {Object.entries(stats.warehouse_workload).map(([warehouse, workload]) => (
                  <div key={warehouse} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>{warehouse}</Text>
                      <Text>{workload}</Text>
                    </div>
                    <Progress
                      percent={(workload / Math.max(...Object.values(stats.warehouse_workload))) * 100}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                ))}
              </Card>
            </Col>
            <Col span={12}>
              <Card title="技术员工作负载" size="small">
                {Object.entries(stats.technician_workload).map(([technician, workload]) => (
                  <div key={technician} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Text>{technician}</Text>
                      <Text>{workload}</Text>
                    </div>
                    <Progress
                      percent={(workload / Math.max(...Object.values(stats.technician_workload))) * 100}
                      size="small"
                      showInfo={false}
                    />
                  </div>
                ))}
              </Card>
            </Col>
          </Row>
        </div>
      )}

      {/* 规则编辑模态框 */}
      <Modal
        title={editingRule ? '编辑分配规则' : '新增分配规则'}
        open={ruleModalVisible}
        onCancel={() => {
          setRuleModalVisible(false);
          setEditingRule(null);
          ruleForm.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form
          form={ruleForm}
          layout="vertical"
          onFinish={saveAssignmentRule}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            name="priority"
            label="优先级"
            rules={[{ required: true, message: '请输入优先级' }]}
            tooltip="数字越小优先级越高"
          >
            <Input type="number" placeholder="请输入优先级（1-100）" />
          </Form.Item>

          <Divider>触发条件</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['conditions', 'issue_types']}
                label="问题类型"
              >
                <Select
                  mode="multiple"
                  placeholder="选择问题类型"
                  allowClear
                >
                  {issueTypeOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['conditions', 'priorities']}
                label="优先级"
              >
                <Select
                  mode="multiple"
                  placeholder="选择优先级"
                  allowClear
                >
                  {priorityOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider>分配目标</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['assignment', 'warehouse_id']}
                label="分配仓库"
                rules={[{ required: true, message: '请选择仓库' }]}
              >
                <Select
                  placeholder="选择仓库"
                  onChange={(warehouseId) => loadTechnicians(warehouseId)}
                >
                  {warehouses.map(warehouse => (
                    <Option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['assignment', 'technician_id']}
                label="指定技术员"
                tooltip="可选，不选择则由仓库自动分配"
              >
                <Select
                  placeholder="选择技术员（可选）"
                  allowClear
                >
                  {technicians.map(technician => (
                    <Option key={technician.id} value={technician.id}>
                      {technician.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['assignment', 'auto_assign']}
            label="自动分配"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>

          <Form.Item
            name="enabled"
            label="启用规则"
            valuePropName="checked"
          >
            <Switch
              checkedChildren="启用"
              unCheckedChildren="禁用"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                保存规则
              </Button>
              <Button
                onClick={() => {
                  setRuleModalVisible(false);
                  setEditingRule(null);
                  ruleForm.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <EnvironmentOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <span>仓库分配系统</span>
        </div>
      }
      style={{ maxWidth: 1400, margin: '0 auto' }}
    >
      <Alert
        message="智能分配系统"
        description="支持基于问题类型、优先级、地理位置等条件的智能分配，提高工单处理效率和客户满意度。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {content}
    </Card>
  );
};

export default WarehouseAssignmentSystem; 