import React, { useState, useCallback } from 'react';
import {
  Upload,
  Button,
  message,
  Progress,
  Card,
  List,
  Image,
  Space,
  Modal,
  Typography,
  Tag,
  Tooltip,
  Alert
} from 'antd';
import {
  UploadOutlined,
  DeleteOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';
import { repairService } from '../../services/repair.service';
import type { FileUploadResponse } from '../../types/repair.types';

const { Dragger } = Upload;
const { Text } = Typography;

interface FileUploadHandlerProps {
  ticketId?: number;
  maxFiles?: number;
  maxFileSize?: number; // MB
  allowedTypes?: string[];
  onUploadSuccess?: (files: FileUploadResponse[]) => void;
  onUploadError?: (error: Error) => void;
  disabled?: boolean;
  showPreview?: boolean;
  compact?: boolean;
}

interface UploadingFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'uploading' | 'done' | 'error';
  url?: string;
  error?: string;
}

const FileUploadHandler: React.FC<FileUploadHandlerProps> = ({
  ticketId,
  maxFiles = 10,
  maxFileSize = 10,
  allowedTypes = ['image/*', '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx'],
  onUploadSuccess,
  onUploadError,
  disabled = false,
  showPreview = true,
  compact = false
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadResponse[]>([]);

  // 获取文件图标
  const getFileIcon = (fileName: string, fileType: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (fileType.startsWith('image/')) {
      return <FileImageOutlined style={{ color: '#52c41a' }} />;
    }
    
    switch (extension) {
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
      case 'doc':
      case 'docx':
        return <FileWordOutlined style={{ color: '#1890ff' }} />;
      case 'xls':
      case 'xlsx':
        return <FileExcelOutlined style={{ color: '#52c41a' }} />;
      case 'txt':
        return <FileTextOutlined style={{ color: '#faad14' }} />;
      default:
        return <FileOutlined style={{ color: '#666' }} />;
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 验证文件
  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxFileSize * 1024 * 1024) {
      return `文件大小不能超过 ${maxFileSize}MB`;
    }

    // 检查文件类型
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        const mainType = type.split('/')[0];
        return file.type.startsWith(mainType);
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return `不支持的文件类型，支持的类型: ${allowedTypes.join(', ')}`;
    }

    // 检查文件数量
    if (fileList.length + uploadingFiles.length >= maxFiles) {
      return `最多只能上传 ${maxFiles} 个文件`;
    }

    return null;
  };

  // 自定义上传处理
  const handleUpload: UploadProps['customRequest'] = async ({ file, onProgress, onSuccess, onError }) => {
    const uploadFile = file as File;
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // 验证文件
    const validationError = validateFile(uploadFile);
    if (validationError) {
      message.error(validationError);
      onError?.(new Error(validationError));
      return;
    }

    // 添加到上传中列表
    const uploadingFile: UploadingFile = {
      uid: fileId,
      name: uploadFile.name,
      size: uploadFile.size,
      type: uploadFile.type,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => prev.map(f => 
          f.uid === fileId ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
        ));
      }, 200);

      // 实际上传
      let response: FileUploadResponse;
      
      if (ticketId) {
        response = await repairService.uploadAttachment(ticketId, uploadFile);
      } else {
        // 临时上传，稍后关联到工单
        response = {
          success: true,
          data: {
            id: parseInt(fileId),
            filename: `temp_${fileId}`,
            original_name: uploadFile.name,
            file_size: uploadFile.size,
            mime_type: uploadFile.type,
            file_url: URL.createObjectURL(uploadFile)
          }
        };
      }

      clearInterval(progressInterval);

      if (response.success) {
        // 更新上传状态
        setUploadingFiles(prev => prev.map(f => 
          f.uid === fileId ? { 
            ...f, 
            progress: 100, 
            status: 'done',
            url: response.data.file_url 
          } : f
        ));

        // 添加到已上传列表
        setUploadedFiles(prev => [...prev, response]);
        
        // 通知父组件
        onUploadSuccess?.([...uploadedFiles, response]);
        
        onSuccess?.(response);
        message.success(`${uploadFile.name} 上传成功`);
      } else {
        throw new Error('上传失败');
      }
    } catch (error) {
      clearInterval(progressInterval);
      
      // 更新错误状态
      setUploadingFiles(prev => prev.map(f => 
        f.uid === fileId ? { 
          ...f, 
          status: 'error',
          error: error instanceof Error ? error.message : '上传失败'
        } : f
      ));

      onError?.(error instanceof Error ? error : new Error('上传失败'));
      onUploadError?.(error instanceof Error ? error : new Error('上传失败'));
      message.error(`${uploadFile.name} 上传失败`);
    }
  };

  // 删除文件
  const handleRemove = (file: UploadFile | UploadingFile) => {
    if ('uid' in file) {
      // 删除上传中的文件
      setUploadingFiles(prev => prev.filter(f => f.uid !== file.uid));
    } else {
      // 删除已上传的文件
      setFileList(prev => prev.filter(f => f.uid !== file.uid));
      
      // 如果有工单ID，调用删除API
      if (ticketId && file.response?.data?.id) {
        repairService.deleteAttachment(ticketId, file.response.data.id)
          .then(() => {
            message.success('文件删除成功');
          })
          .catch(error => {
            console.error('Delete file error:', error);
            message.error('文件删除失败');
          });
      }
    }
  };

  // 预览文件
  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = URL.createObjectURL(file.originFileObj as File);
    }

    setPreviewImage(file.url || file.preview || '');
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  // 下载文件
  const handleDownload = (file: UploadFile | UploadingFile) => {
    const url = 'url' in file ? file.url : file.response?.data?.file_url;
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
    }
  };

  // 拖拽上传组件
  const uploadComponent = (
    <Dragger
      multiple
      customRequest={handleUpload}
      fileList={fileList}
      onChange={({ fileList: newFileList }) => setFileList(newFileList)}
      onRemove={handleRemove}
      onPreview={showPreview ? handlePreview : undefined}
      disabled={disabled}
      accept={allowedTypes.join(',')}
      style={{ 
        padding: compact ? '16px' : '24px',
        backgroundColor: disabled ? '#f5f5f5' : '#fafafa'
      }}
    >
      <p className="ant-upload-drag-icon">
        <UploadOutlined style={{ fontSize: compact ? '24px' : '48px' }} />
      </p>
      <p className="ant-upload-text">
        {compact ? '点击或拖拽文件到此处上传' : '点击或拖拽文件到此处上传'}
      </p>
      <p className="ant-upload-hint">
        支持单个或批量上传，最多 {maxFiles} 个文件，每个文件最大 {maxFileSize}MB
      </p>
    </Dragger>
  );

  // 上传中文件列表
  const uploadingList = uploadingFiles.length > 0 && (
    <Card title="上传中" size="small" style={{ marginTop: 16 }}>
      <List
        size="small"
        dataSource={uploadingFiles}
        renderItem={(file) => (
          <List.Item
            actions={[
              <Button
                type="link"
                size="small"
                danger
                icon={<DeleteOutlined />}
                onClick={() => handleRemove(file)}
              />
            ]}
          >
            <List.Item.Meta
              avatar={
                file.status === 'uploading' ? 
                  <LoadingOutlined /> : 
                  getFileIcon(file.name, file.type)
              }
              title={
                <div>
                  <Text>{file.name}</Text>
                  <Tag 
                    color={file.status === 'error' ? 'red' : file.status === 'done' ? 'green' : 'blue'}
                    style={{ marginLeft: 8 }}
                  >
                    {file.status === 'uploading' ? '上传中' : 
                     file.status === 'done' ? '完成' : '失败'}
                  </Tag>
                </div>
              }
              description={
                <div>
                  <Text type="secondary">{formatFileSize(file.size)}</Text>
                  {file.status === 'uploading' && (
                    <Progress
                      percent={file.progress}
                      size="small"
                      style={{ marginTop: 4 }}
                    />
                  )}
                  {file.status === 'error' && (
                    <div>
                      <Text type="danger">{file.error}</Text>
                    </div>
                  )}
                </div>
              }
            />
          </List.Item>
        )}
      />
    </Card>
  );

  // 已上传文件列表
  const uploadedList = uploadedFiles.length > 0 && (
    <Card title="已上传文件" size="small" style={{ marginTop: 16 }}>
      <List
        size="small"
        dataSource={uploadedFiles}
        renderItem={(response) => {
          const file = response.data;
          return (
            <List.Item
              actions={[
                <Tooltip title="预览">
                  <Button
                    type="link"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => {
                      setPreviewImage(file.file_url);
                      setPreviewVisible(true);
                      setPreviewTitle(file.original_name);
                    }}
                  />
                </Tooltip>,
                <Tooltip title="下载">
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={() => handleDownload({ 
                      name: file.original_name, 
                      url: file.file_url 
                    } as any)}
                  />
                </Tooltip>,
                <Tooltip title="删除">
                  <Button
                    type="link"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemove({ 
                      uid: file.id.toString(), 
                      response 
                    } as any)}
                  />
                </Tooltip>
              ]}
            >
              <List.Item.Meta
                avatar={getFileIcon(file.original_name, file.mime_type)}
                title={<Text>{file.original_name}</Text>}
                description={<Text type="secondary">{formatFileSize(file.file_size)}</Text>}
              />
            </List.Item>
          );
        }}
      />
    </Card>
  );

  return (
    <div>
      {/* 上传提示 */}
      <Alert
        message="文件上传说明"
        description={
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>支持的文件格式：{allowedTypes.join(', ')}</li>
            <li>单个文件最大 {maxFileSize}MB</li>
            <li>最多可上传 {maxFiles} 个文件</li>
            <li>支持拖拽上传和批量上传</li>
          </ul>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* 上传组件 */}
      {uploadComponent}

      {/* 上传中列表 */}
      {uploadingList}

      {/* 已上传列表 */}
      {uploadedList}

      {/* 预览模态框 */}
      <Modal
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
        width="80%"
        style={{ top: 20 }}
      >
        <Image
          alt="preview"
          style={{ width: '100%' }}
          src={previewImage}
        />
      </Modal>
    </div>
  );
};

export default FileUploadHandler; 