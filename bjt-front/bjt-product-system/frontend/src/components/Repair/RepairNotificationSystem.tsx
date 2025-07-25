import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Table,
  Tag,
  Modal,
  Checkbox,
  Divider,
  Typography,
  Alert,
  Row,
  Col,
  Switch,
  TimePicker,
  DatePicker,
  Tooltip
} from 'antd';
import {
  MailOutlined,
  BellOutlined,
  UploadOutlined,
  SettingOutlined,
  UserOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DeleteOutlined,
  EditOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { repairService } from '../../services/repair.service';
import type {
  RepairTicket,
  RepairTicketStatus,
  Warehouse,
  Technician
} from '../../types/repair.types';

const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;

interface NotificationRule {
  id: number;
  name: string;
  trigger: 'status_change' | 'assignment' | 'overdue' | 'created' | 'completed';
  conditions: {
    status?: RepairTicketStatus[];
    priority?: string[];
    warehouse?: string[];
    technician?: number[];
  };
  recipients: {
    type: 'email' | 'system';
    addresses: string[];
    roles: string[];
  };
  template: string;
  enabled: boolean;
  created_at: string;
}

interface NotificationLog {
  id: number;
  ticket_id: number;
  ticket_number: string;
  type: 'email' | 'system';
  recipient: string;
  subject: string;
  content: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  error_message?: string;
}

interface RepairNotificationSystemProps {
  ticketId?: number;
  embedded?: boolean;
}

const RepairNotificationSystem: React.FC<RepairNotificationSystemProps> = ({
  ticketId,
  embedded = false
}) => {
  const [activeTab, setActiveTab] = useState<'send' | 'rules' | 'logs'>('send');
  const [sendForm] = Form.useForm();
  const [ruleForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [ruleModalVisible, setRuleModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<NotificationRule | null>(null);

  // 通知触发器选项
  const triggerOptions = [
    { value: 'created', label: '工单创建时', icon: <BellOutlined /> },
    { value: 'status_change', label: '状态变更时', icon: <ExclamationCircleOutlined /> },
    { value: 'assignment', label: '分配工单时', icon: <UserOutlined /> },
    { value: 'overdue', label: '工单逾期时', icon: <ClockCircleOutlined /> },
    { value: 'completed', label: '工单完成时', icon: <CheckCircleOutlined /> }
  ];

  // 邮件模板
  const emailTemplates = {
    created: {
      subject: '新维修工单已创建 - {{ticket_number}}',
      content: `尊敬的 {{recipient_name}}，

您好！有一个新的维修工单需要处理：

工单编号：{{ticket_number}}
工单标题：{{title}}
问题类型：{{issue_type}}
优先级：{{priority}}
客户姓名：{{customer_name}}
联系电话：{{customer_phone}}
创建时间：{{created_at}}

问题描述：
{{description}}

请及时处理此工单。

此致
BJT维修服务系统`
    },
    assignment: {
      subject: '维修工单已分配给您 - {{ticket_number}}',
      content: `尊敬的 {{technician_name}}，

您好！有一个维修工单已分配给您：

工单编号：{{ticket_number}}
工单标题：{{title}}
问题类型：{{issue_type}}
优先级：{{priority}}
客户姓名：{{customer_name}}
联系电话：{{customer_phone}}
分配时间：{{assigned_at}}

问题描述：
{{description}}

请及时联系客户并处理此工单。

此致
BJT维修服务系统`
    },
    status_change: {
      subject: '工单状态已更新 - {{ticket_number}}',
      content: `尊敬的 {{recipient_name}}，

您好！工单状态已更新：

工单编号：{{ticket_number}}
工单标题：{{title}}
原状态：{{old_status}}
新状态：{{new_status}}
更新时间：{{updated_at}}

如有疑问，请联系相关技术人员。

此致
BJT维修服务系统`
    },
    completed: {
      subject: '维修工单已完成 - {{ticket_number}}',
      content: `尊敬的 {{customer_name}}，

您好！您的维修工单已完成：

工单编号：{{ticket_number}}
工单标题：{{title}}
完成时间：{{completed_at}}
处理技术员：{{technician_name}}

解决方案：
{{resolution_notes}}

如果您对我们的服务有任何意见或建议，请随时联系我们。

此致
BJT维修服务系统`
    },
    overdue: {
      subject: '工单逾期提醒 - {{ticket_number}}',
      content: `尊敬的 {{technician_name}}，

您好！以下工单已逾期，请及时处理：

工单编号：{{ticket_number}}
工单标题：{{title}}
创建时间：{{created_at}}
逾期时间：{{overdue_hours}}小时

请尽快联系客户并处理此工单。

此致
BJT维修服务系统`
    }
  };

  useEffect(() => {
    loadWarehouses();
    loadTechnicians();
    loadRules();
    loadLogs();
  }, []);

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
  const loadTechnicians = async () => {
    try {
      const response = await repairService.getTechnicians();
      if (response.success) {
        setTechnicians(response.data);
      }
    } catch (error) {
      console.error('Failed to load technicians:', error);
    }
  };

  // 加载通知规则
  const loadRules = async () => {
    try {
      // 模拟数据
      const mockRules: NotificationRule[] = [
        {
          id: 1,
          name: '新工单创建通知',
          trigger: 'created',
          conditions: {
            priority: ['urgent', 'high']
          },
          recipients: {
            type: 'email',
            addresses: ['admin@example.com'],
            roles: ['admin', 'manager']
          },
          template: 'created',
          enabled: true,
          created_at: '2024-01-01 00:00:00'
        },
        {
          id: 2,
          name: '工单分配通知',
          trigger: 'assignment',
          conditions: {},
          recipients: {
            type: 'email',
            addresses: [],
            roles: ['technician']
          },
          template: 'assignment',
          enabled: true,
          created_at: '2024-01-01 00:00:00'
        }
      ];
      setRules(mockRules);
    } catch (error) {
      console.error('Failed to load rules:', error);
    }
  };

  // 加载通知日志
  const loadLogs = async () => {
    try {
      // 模拟数据
      const mockLogs: NotificationLog[] = [
        {
          id: 1,
          ticket_id: 1,
          ticket_number: 'RT-2024-001',
          type: 'email',
          recipient: 'tech@example.com',
          subject: '新维修工单已创建 - RT-2024-001',
          content: '您有一个新的维修工单需要处理...',
          status: 'sent',
          sent_at: '2024-01-01 10:00:00'
        },
        {
          id: 2,
          ticket_id: 1,
          ticket_number: 'RT-2024-001',
          type: 'email',
          recipient: 'customer@example.com',
          subject: '工单状态已更新 - RT-2024-001',
          content: '您的工单状态已更新...',
          status: 'failed',
          sent_at: '2024-01-01 11:00:00',
          error_message: '邮箱地址无效'
        }
      ];
      setLogs(mockLogs);
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  };

  // 发送通知
  const sendNotification = async (values: any) => {
    if (!ticketId) {
      message.error('请先选择工单');
      return;
    }

    setLoading(true);
    try {
      const response = await repairService.sendNotification(
        ticketId,
        values.type,
        values.recipients,
        values.message
      );

      if (response.success) {
        message.success('通知发送成功');
        sendForm.resetFields();
        loadLogs();
      }
    } catch (error) {
      console.error('Send notification error:', error);
      message.error('发送失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 保存通知规则
  const saveRule = async (values: any) => {
    try {
      const ruleData = {
        ...values,
        id: editingRule?.id || Date.now()
      };

      if (editingRule) {
        // 更新规则
        setRules(prev => prev.map(rule => 
          rule.id === editingRule.id ? { ...rule, ...ruleData } : rule
        ));
        message.success('规则更新成功');
      } else {
        // 创建规则
        setRules(prev => [...prev, ruleData]);
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

  // 删除规则
  const deleteRule = (ruleId: number) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    message.success('规则删除成功');
  };

  // 切换规则状态
  const toggleRule = (ruleId: number) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  // 规则表格列
  const ruleColumns: ColumnsType<NotificationRule> = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '触发条件',
      dataIndex: 'trigger',
      key: 'trigger',
      render: (trigger: string) => {
        const option = triggerOptions.find(opt => opt.value === trigger);
        return (
          <span>
            {option?.icon} {option?.label}
          </span>
        );
      }
    },
    {
      title: '通知方式',
      dataIndex: 'recipients',
      key: 'recipients',
      render: (recipients: any) => (
        <Tag color={recipients.type === 'email' ? 'blue' : 'green'}>
          {recipients.type === 'email' ? '邮件' : '系统'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      key: 'enabled',
      render: (enabled: boolean, record: NotificationRule) => (
        <Switch
          checked={enabled}
          onChange={() => toggleRule(record.id)}
          checkedChildren="启用"
          unCheckedChildren="禁用"
        />
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, record: NotificationRule) => (
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
            onClick={() => deleteRule(record.id)}
          />
        </Space>
      )
    }
  ];

  // 日志表格列
  const logColumns: ColumnsType<NotificationLog> = [
    {
      title: '工单编号',
      dataIndex: 'ticket_number',
      key: 'ticket_number'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'email' ? 'blue' : 'green'}>
          {type === 'email' ? '邮件' : '系统'}
        </Tag>
      )
    },
    {
      title: '收件人',
      dataIndex: 'recipient',
      key: 'recipient'
    },
    {
      title: '主题',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={
          status === 'sent' ? 'green' :
          status === 'failed' ? 'red' : 'orange'
        }>
          {status === 'sent' ? '已发送' :
           status === 'failed' ? '发送失败' : '发送中'}
        </Tag>
      )
    },
    {
      title: '发送时间',
      dataIndex: 'sent_at',
      key: 'sent_at',
      render: (date: string) => new Date(date).toLocaleString('zh-CN')
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      render: (error: string) => error ? (
        <Tooltip title={error}>
          <Text type="danger" ellipsis>
            {error}
          </Text>
        </Tooltip>
      ) : '-'
    }
  ];

  const content = (
    <div>
      {/* 标签页导航 */}
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Button
            type={activeTab === 'send' ? 'primary' : 'default'}
            icon={<UploadOutlined />}
            onClick={() => setActiveTab('send')}
          >
            发送通知
          </Button>
          <Button
            type={activeTab === 'rules' ? 'primary' : 'default'}
            icon={<SettingOutlined />}
            onClick={() => setActiveTab('rules')}
          >
            通知规则
          </Button>
          <Button
            type={activeTab === 'logs' ? 'primary' : 'default'}
            icon={<BellOutlined />}
            onClick={() => setActiveTab('logs')}
          >
            通知日志
          </Button>
        </Space>
      </div>

      {/* 发送通知 */}
      {activeTab === 'send' && (
        <Card title="发送通知" size="small">
          <Form
            form={sendForm}
            layout="vertical"
            onFinish={sendNotification}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="type"
                  label="通知类型"
                  rules={[{ required: true, message: '请选择通知类型' }]}
                >
                  <Select placeholder="请选择通知类型">
                    <Option value="email">
                      <MailOutlined /> 邮件通知
                    </Option>
                    <Option value="system">
                      <BellOutlined /> 系统通知
                    </Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="recipients"
                  label="收件人"
                  rules={[{ required: true, message: '请输入收件人' }]}
                >
                  <Select
                    mode="tags"
                    placeholder="请输入邮箱地址或选择技术员"
                    style={{ width: '100%' }}
                  >
                    {technicians.map(tech => (
                      <Option key={tech.email} value={tech.email}>
                        {tech.name} ({tech.email})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="subject"
              label="主题"
              rules={[{ required: true, message: '请输入主题' }]}
            >
              <Input placeholder="请输入通知主题" />
            </Form.Item>

            <Form.Item
              name="message"
              label="消息内容"
              rules={[{ required: true, message: '请输入消息内容' }]}
            >
              <TextArea
                rows={6}
                placeholder="请输入通知内容..."
                showCount
                maxLength={1000}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={<UploadOutlined />}
              >
                发送通知
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}

      {/* 通知规则 */}
      {activeTab === 'rules' && (
        <Card
          title="通知规则"
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
            dataSource={rules}
            rowKey="id"
            size="small"
            pagination={false}
          />
        </Card>
      )}

      {/* 通知日志 */}
      {activeTab === 'logs' && (
        <Card title="通知日志" size="small">
          <Table
            columns={logColumns}
            dataSource={logs}
            rowKey="id"
            size="small"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`
            }}
          />
        </Card>
      )}

      {/* 规则编辑模态框 */}
      <Modal
        title={editingRule ? '编辑通知规则' : '新增通知规则'}
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
          onFinish={saveRule}
        >
          <Form.Item
            name="name"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="请输入规则名称" />
          </Form.Item>

          <Form.Item
            name="trigger"
            label="触发条件"
            rules={[{ required: true, message: '请选择触发条件' }]}
          >
            <Select placeholder="请选择触发条件">
              {triggerOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.icon} {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['recipients', 'type']}
                label="通知方式"
                rules={[{ required: true, message: '请选择通知方式' }]}
              >
                <Select placeholder="请选择通知方式">
                  <Option value="email">
                    <MailOutlined /> 邮件通知
                  </Option>
                  <Option value="system">
                    <BellOutlined /> 系统通知
                  </Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enabled"
                label="启用状态"
                valuePropName="checked"
              >
                <Switch
                  checkedChildren="启用"
                  unCheckedChildren="禁用"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name={['recipients', 'addresses']}
            label="收件人地址"
          >
            <Select
              mode="tags"
              placeholder="请输入邮箱地址"
              style={{ width: '100%' }}
            >
              {technicians.map(tech => (
                <Option key={tech.email} value={tech.email}>
                  {tech.name} ({tech.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="template"
            label="邮件模板"
          >
            <Select placeholder="请选择邮件模板">
              {Object.entries(emailTemplates).map(([key, template]) => (
                <Option key={key} value={key}>
                  {template.subject}
                </Option>
              ))}
            </Select>
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
          <BellOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          <span>通知系统</span>
        </div>
      }
      style={{ maxWidth: 1200, margin: '0 auto' }}
    >
      <Alert
        message="通知系统说明"
        description="支持邮件和系统通知，可以设置自动通知规则，确保相关人员及时收到工单状态更新。"
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />
      {content}
    </Card>
  );
};

export default RepairNotificationSystem; 