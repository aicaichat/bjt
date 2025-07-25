import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Card,
  Row,
  Col,
  message,
  Steps,
  Divider,
  Space,
  DatePicker,
  Radio,
  Checkbox,
  Progress,
  Alert,
  Tooltip
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import type { FormInstance } from 'antd/es/form';
import { repairService } from '../../services/repair.service';
import type {
  CreateRepairTicketRequest,
  RepairIssueType,
  RepairPriority,
  FileUploadResponse
} from '../../types/repair.types';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Step } = Steps;

interface RepairTicketFormProps {
  onSuccess?: (ticket: any) => void;
  onCancel?: () => void;
  initialValues?: Partial<CreateRepairTicketRequest>;
  submissionMethod?: 'online' | 'admin';
  showSteps?: boolean;
  embedded?: boolean;
}

const RepairTicketForm: React.FC<RepairTicketFormProps> = ({
  onSuccess,
  onCancel,
  initialValues,
  submissionMethod = 'online',
  showSteps = true,
  embedded = false
}) => {
  const { t } = useTranslation('repair');
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadedFiles, setUploadedFiles] = useState<number[]>([]);

  // 问题类型选项
  const issueTypeOptions = [
    { value: 'hardware_failure', label: '硬件故障', icon: '🔧' },
    { value: 'software_issue', label: '软件问题', icon: '💻' },
    { value: 'maintenance', label: '维护保养', icon: '🛠️' },
    { value: 'installation', label: '安装调试', icon: '⚙️' },
    { value: 'training', label: '培训支持', icon: '👨‍🏫' },
    { value: 'calibration', label: '校准服务', icon: '📏' },
    { value: 'upgrade', label: '升级服务', icon: '⬆️' },
    { value: 'other', label: '其他', icon: '❓' }
  ];

  // 优先级选项
  const priorityOptions = [
    { value: 'low', label: '低优先级', color: '#52c41a', description: '非紧急问题，可在1-2周内处理' },
    { value: 'normal', label: '普通优先级', color: '#1890ff', description: '常规问题，需在3-5天内处理' },
    { value: 'high', label: '高优先级', color: '#faad14', description: '重要问题，需在1-2天内处理' },
    { value: 'urgent', label: '紧急优先级', color: '#ff4d4f', description: '紧急问题，需立即处理' }
  ];

  // 保修状态选项
  const warrantyOptions = [
    { value: 'in_warranty', label: '保修期内', color: '#52c41a' },
    { value: 'out_of_warranty', label: '保修期外', color: '#faad14' },
    { value: 'extended', label: '延保服务', color: '#1890ff' }
  ];

  // 步骤配置
  const steps = [
    {
      title: '基本信息',
      description: '填写工单基本信息'
    },
    {
      title: '设备信息',
      description: '填写设备详细信息'
    },
    {
      title: '问题描述',
      description: '详细描述问题'
    },
    {
      title: '附件上传',
      description: '上传相关文件'
    }
  ];

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [initialValues, form]);

  // 文件上传处理
  const handleUpload: UploadProps['customRequest'] = async ({ file, onProgress, onSuccess, onError }) => {
    try {
      const uploadFile = file as File;
      const fileId = Date.now().toString();
      
      setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const currentProgress = prev[fileId] || 0;
          if (currentProgress >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [fileId]: currentProgress + 10 };
        });
      }, 200);

      // 实际上传（这里需要实现真实的上传逻辑）
      // const response = await repairService.uploadAttachment(0, uploadFile);
      
      // 模拟上传成功
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        const mockResponse: FileUploadResponse = {
          success: true,
          data: {
            id: parseInt(fileId),
            filename: `upload_${fileId}`,
            original_name: uploadFile.name,
            file_size: uploadFile.size,
            mime_type: uploadFile.type,
            file_url: URL.createObjectURL(uploadFile)
          }
        };

        setUploadedFiles(prev => [...prev, mockResponse.data.id]);
        onSuccess?.(mockResponse);
      }, 1000);

    } catch (error) {
      onError?.(error as Error);
      message.error('文件上传失败');
    }
  };

  // 文件删除处理
  const handleRemove = (file: UploadFile) => {
    const fileId = file.uid;
    setUploadedFiles(prev => prev.filter(id => id !== parseInt(fileId)));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  };

  // 表单提交
  const handleSubmit = async (values: CreateRepairTicketRequest) => {
    setLoading(true);
    try {
      const submitData: CreateRepairTicketRequest = {
        ...values,
        submission_method: submissionMethod,
        attachment_ids: uploadedFiles
      };

      const response = await repairService.createRepairTicket(submitData);
      
      if (response.success) {
        message.success(t('labels.submitSuccess'));
        form.resetFields();
        setFileList([]);
        setUploadedFiles([]);
        setCurrentStep(0);
        onSuccess?.(response.data);
      }
    } catch (error) {
      console.error('Submit error:', error);
      message.error('提交失败：' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 下一步
  const nextStep = () => {
    form.validateFields().then(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }).catch(() => {
      message.error('请填写必填字段');
    });
  };

  // 上一步
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  // 根据步骤索引渲染内容（默认使用当前步骤）
  const renderStepContent = (stepIndex: number = currentStep) => {
    switch (stepIndex) {
      case 0:
        return (
          <Row gutter={16}>
            {/* 工单标题、问题类型、优先级字段已移除 */}

            <Col span={12}>
              <Form.Item
                name="customer_name"
                label={t('labels.customerName')}
                rules={[{ required: true, message: '请输入联系人姓名' }]}
              >
                <Input placeholder={t('placeholders.customerName')} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="customer_email"
                label={t('labels.customerEmail')}
                rules={[
                  { required: true, message: '请输入邮箱地址' },
                  { type: 'email', message: '请输入有效的邮箱地址' }
                ]}
              >
                <Input placeholder={t('placeholders.customerEmail')} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="customer_phone"
                label={t('labels.customerPhone')}
              >
                <Input placeholder={t('placeholders.customerPhone')} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="company_name"
                label={t('labels.companyName')}
              >
                <Input placeholder={t('placeholders.companyName')} />
              </Form.Item>
            </Col>
          </Row>
        );

      case 1:
        return (
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="device_model"
                label={t('labels.deviceModel')}
                tooltip="请提供设备的具体型号，有助于我们快速定位问题"
                rules={[{ required: true, message: t('labels.deviceModel') + ' ' + t('validation.required','is required') }]}
              >
                <Input placeholder={t('placeholders.deviceModel')} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                name="device_serial"
                label={t('labels.deviceSerial')}
                tooltip="序列号通常位于设备标签上"
                rules={[{ required: true, message: t('labels.deviceSerial') + ' ' + t('validation.required','is required') }]}
              >
                <Input placeholder={t('placeholders.deviceSerial')} />
              </Form.Item>
            </Col>
          </Row>
        );

      case 2:
        return (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="description"
                label={t('labels.description')}
                rules={[{ required: true, message: '请详细描述问题' }]}
              >
                <TextArea
                  rows={6}
                  placeholder={t('placeholders.description')}
                  showCount
                  maxLength={2000}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                name="customer_notes"
                label={t('labels.customerNotes')}
              >
                <TextArea
                  rows={3}
                  placeholder={t('placeholders.customerNotes')}
                  showCount
                  maxLength={500}
                />
              </Form.Item>
            </Col>
          </Row>
        );

      case 3:
        return (
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label={t('labels.uploadFiles')}
                tooltip="支持图片、PDF、Word文档等格式，单个文件最大10MB"
              >
                <Upload
                  customRequest={handleUpload}
                  fileList={fileList}
                  onChange={({ fileList: newFileList }) => setFileList(newFileList)}
                  onRemove={handleRemove}
                  multiple
                  listType="picture-card"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                >
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>{t('buttons.upload')}</div>
                  </div>
                </Upload>
              </Form.Item>
            </Col>

            <Col span={24}>
              <Alert
                message={t('labels.fileUploadNote')}
                description={
                  <ul style={{ margin: 0, paddingLeft: 20 }}>
                    <li>{t('uploadInfo.supportedFormats')}</li>
                    <li>{t('uploadInfo.sizeLimit')}</li>
                    <li>{t('uploadInfo.tip')}</li>
                    <li>{t('uploadInfo.security')}</li>
                  </ul>
                }
                type="info"
                showIcon
              />
            </Col>
          </Row>
        );

      default:
        return null;
    }
  };

  const formContent = (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{
        // 移除默认的优先级和问题类型字段
        warranty_status: 'in_warranty',
        ...initialValues
      }}
    >
      {showSteps && (
        <>
          <Steps current={currentStep} style={{ marginBottom: 24 }}>
            {steps.map((step, index) => (
              <Step
                key={index}
                title={step.title}
                description={step.description}
                icon={currentStep > index ? <CheckCircleOutlined /> : undefined}
              />
            ))}
          </Steps>
          <Divider />
        </>
      )}

      {showSteps ? renderStepContent() : (
        <div>
          {[0, 1, 2, 3].map(step => (
            <div key={step}>
              {step > 0 && <Divider />}
              {renderStepContent(step)}
            </div>
          ))}
        </div>
      )}

      <Divider />

      <Row justify="space-between">
        <Col>
          {showSteps && currentStep > 0 && (
            <Button onClick={prevStep}>
              上一步
            </Button>
          )}
        </Col>
        <Col>
          <Space>
            {onCancel && (
              <Button onClick={onCancel}>
                取消
              </Button>
            )}
            {showSteps && currentStep < steps.length - 1 ? (
              <Button type="primary" onClick={nextStep}>
                下一步
              </Button>
            ) : (
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                icon={loading ? <LoadingOutlined /> : undefined}
              >
                提交工单
              </Button>
            )}
          </Space>
        </Col>
      </Row>
    </Form>
  );

  if (embedded) {
    return formContent;
  }

  return (
    <Card
      title={t('titles.createTicket')}
      style={{ maxWidth: 800, margin: '0 auto' }}
    >
      {formContent}
    </Card>
  );
};

export default RepairTicketForm; 