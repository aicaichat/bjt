import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  Table,
  Alert,
  Progress,
  Typography,
  Space,
  Divider,
  List,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileAddOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd/es/upload';
import { ImportResult } from '../hooks/useImportExport';

const { Title, Text } = Typography;

export interface ImportExportModalProps {
  visible: boolean;
  onCancel: () => void;
  onImportSuccess: () => Promise<void> | void;
  onExport: () => void;
  onDownloadTemplate: () => void;
  onImportFile?: (file: File) => Promise<void>;
  title: string;
  templateColumns: Array<{ title: string; dataIndex: string }>;
  importResult?: ImportResult | null;
  importLoading?: boolean;
}

const ImportExportModal: React.FC<ImportExportModalProps> = ({
  visible,
  onCancel,
  onImportSuccess,
  onExport,
  onDownloadTemplate,
  onImportFile,
  title,
  templateColumns,
  importResult,
  importLoading = false,
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [localImportResult, setLocalImportResult] = useState<ImportResult | null>(null);
  const [localImportLoading, setLocalImportLoading] = useState(false);

  // 使用外部传入的状态或本地状态
  const currentImportResult = importResult || localImportResult;
  const currentImportLoading = importLoading || localImportLoading;

  const handleCancel = () => {
    setLocalImportResult(null);
    setFileList([]);
    setActiveTab('import');
    onCancel();
  };

  const handleImportFile = async (file: File) => {
    if (onImportFile) {
      // 使用外部提供的导入函数
      await onImportFile(file);
    } else {
      // 使用内部的简单导入逻辑（向后兼容）
      setLocalImportLoading(true);
      setLocalImportResult(null);

      try {
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          setLocalImportResult({
            success: false,
            data: [],
            errors: ['文件为空'],
            total: 0
          });
          return;
        }

        const [header, ...dataLines] = lines;
        const headers = header.split(',').map(h => h.trim());
        
        // 验证表头
        const requiredHeaders = templateColumns.map(col => col.title);
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setLocalImportResult({
            success: false,
            data: [],
            errors: [`缺少必需的列: ${missingHeaders.join(', ')}`],
            total: 0
          });
          return;
        }

        // 解析数据
        const data: any[] = [];
        const errors: string[] = [];

        dataLines.forEach((line, index) => {
          if (!line.trim()) return;
          
          const values = line.split(',').map(v => v.trim());
          const record: any = {};
          
          headers.forEach((header, headerIndex) => {
            const column = templateColumns.find(col => col.title === header);
            if (column && values[headerIndex]) {
              record[column.dataIndex] = values[headerIndex];
            }
          });

          // 简单验证
          if (!record.model && !record.code) {
            errors.push(`第${index + 2}行: 缺少型号`);
            return;
          }

          data.push(record);
        });

        setLocalImportResult({
          success: errors.length === 0,
          data,
          errors,
          total: data.length
        });

      } catch (error) {
        console.error('导入失败:', error);
        setLocalImportResult({
          success: false,
          data: [],
          errors: ['文件解析失败'],
          total: 0
        });
      } finally {
        setLocalImportLoading(false);
      }
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file) => {
      setFileList([file]);
      handleImportFile(file);
      return false; // 阻止自动上传
    },
    onRemove: () => {
      setFileList([]);
      setLocalImportResult(null);
    },
    accept: '.xlsx,.xls,.csv',
    showUploadList: {
      showDownloadIcon: false,
      showPreviewIcon: false,
    },
  };

  const handleConfirmImport = () => {
    if (currentImportResult?.success && currentImportResult.data.length > 0) {
      onImportSuccess();
      handleCancel();
    }
  };

  const renderImportContent = () => (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div>
          <Title level={5}>上传文件</Title>
          <Text type="secondary">
            支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式的文件
          </Text>
        </div>
        
        <div style={{ border: '2px dashed #d9d9d9', borderRadius: '8px', padding: '40px', textAlign: 'center' }}>
          <FileAddOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
          <div style={{ marginBottom: '16px' }}>
            <Text>点击或拖拽文件到此区域上传</Text>
          </div>
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />}>选择文件</Button>
          </Upload>
          <div style={{ marginTop: '8px' }}>
            <Text type="secondary">请确保文件格式正确，包含所需的表头</Text>
          </div>
        </div>

        {currentImportLoading && (
          <div>
            <Progress percent={50} status="active" />
            <Text>正在解析文件...</Text>
          </div>
        )}

        {currentImportResult && (
          <div>
            <Divider />
            {currentImportResult.success ? (
              <Alert
                message="导入预览成功"
                description={`成功解析 ${currentImportResult.total} 条记录，点击确认导入按钮完成导入。`}
                type="success"
                icon={<CheckCircleOutlined />}
                showIcon
              />
            ) : (
              <Alert
                message="导入失败"
                description="请检查文件格式和数据完整性"
                type="error"
                icon={<ExclamationCircleOutlined />}
                showIcon
              />
            )}

            {currentImportResult.errors.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>错误信息</Title>
                <List
                  size="small"
                  dataSource={currentImportResult.errors}
                  renderItem={(error: string) => (
                    <List.Item>
                      <Text type="danger">{error}</Text>
                    </List.Item>
                  )}
                />
              </div>
            )}

            {currentImportResult.success && currentImportResult.data.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <Title level={5}>预览数据 (前5条)</Title>
                <Table
                  dataSource={currentImportResult.data.slice(0, 5)}
                  columns={templateColumns.map(col => ({
                    title: col.title,
                    dataIndex: col.dataIndex,
                    key: col.dataIndex,
                  }))}
                  pagination={false}
                  size="small"
                  rowKey={(record: any, index?: number) => index || 0}
                />
              </div>
            )}
          </div>
        )}
      </Space>
    </div>
  );

  const renderExportContent = () => (
    <div>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Alert
          message="导出说明"
          description="将会导出当前页面筛选条件下的所有数据到CSV文件"
          type="info"
          showIcon
        />
        
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={() => {
              onExport();
              handleCancel();
            }}
          >
            立即导出
          </Button>
        </div>
      </Space>
    </div>
  );

  const footerButtons = () => {
    if (activeTab === 'import') {
      return [
        <Button key="template" onClick={onDownloadTemplate}>
          下载模板
        </Button>,
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
        <Button
          key="confirm"
          type="primary"
          disabled={!currentImportResult?.success || currentImportResult.data.length === 0}
          onClick={handleConfirmImport}
        >
          确认导入 ({currentImportResult?.total || 0} 条)
        </Button>,
      ];
    } else {
      return [
        <Button key="cancel" onClick={handleCancel}>
          取消
        </Button>,
      ];
    }
  };

  return (
    <Modal
      title={
        <div>
          <Space>
            <Button
              type={activeTab === 'import' ? 'primary' : 'default'}
              onClick={() => setActiveTab('import')}
            >
              导入数据
            </Button>
            <Button
              type={activeTab === 'export' ? 'primary' : 'default'}
              onClick={() => setActiveTab('export')}
            >
              导出数据
            </Button>
          </Space>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      footer={footerButtons()}
      width={800}
      destroyOnHidden
    >
      {activeTab === 'import' ? renderImportContent() : renderExportContent()}
    </Modal>
  );
};

export default ImportExportModal; 