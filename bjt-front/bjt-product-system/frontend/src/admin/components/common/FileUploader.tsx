import React, { useState, useEffect } from 'react';
import { Upload, Button, Image, Typography, Modal, Progress, message } from 'antd';
import { UploadOutlined, DeleteOutlined, EyeOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload';

const { Text } = Typography;

export interface FileUploaderProps {
  type: 'image' | 'pdf' | 'document';
  multiple?: boolean;
  maxSize?: number; // MB
  accept?: string;
  value?: string | string[];
  onChange?: (value: string | string[]) => void;
  preview?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  type = 'image',
  multiple = false,
  maxSize = 10, // 10MB default
  accept,
  value,
  onChange,
  preview = true,
  disabled = false,
  className = '',
  placeholder,
}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // 根据文件类型设置默认accept
  const getDefaultAccept = () => {
    switch (type) {
      case 'image':
        return '.jpg,.jpeg,.png,.gif,.webp';
      case 'pdf':
        return '.pdf';
      case 'document':
        return '.doc,.docx,.pdf,.txt,.xls,.xlsx';
      default:
        return '';
    }
  };

  const acceptTypes = accept || getDefaultAccept();

  useEffect(() => {
    if (value) {
      const urls = Array.isArray(value) ? value : [value];
      const files = urls.map((url, index) => ({
        uid: `${index}`,
        name: getFileNameFromUrl(url),
        status: 'done' as const,
        url,
      }));
      setFileList(files);
    } else {
      setFileList([]);
    }
  }, [value]);

  const getFileNameFromUrl = (url: string) => {
    return url.split('/').pop() || 'file';
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      return;
    }

    if (type === 'image') {
      setPreviewImage(file.url || file.preview || '');
      setPreviewVisible(true);
      setPreviewTitle(file.name || getFileNameFromUrl(file.url || ''));
    } else {
      // For PDF and documents, open in new tab
      window.open(file.url, '_blank');
    }
  };

  const handleChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);

    // Extract URLs from successful uploads
    const urls = newFileList
      .filter(file => file.status === 'done')
      .map(file => file.url || file.response?.url)
      .filter(Boolean);

    if (multiple) {
      onChange?.(urls);
    } else {
      onChange?.(urls[0] || '');
    }
  };

  const beforeUpload = (file: File) => {
    // Check file size
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`文件大小不能超过 ${maxSize}MB!`);
      return false;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = acceptTypes.split(',').map(ext => ext.replace('.', '').toLowerCase());
    
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      message.error(`不支持的文件类型！请上传 ${acceptTypes} 格式的文件`);
      return false;
    }

    return true;
  };

  const customRequest = async ({ file, onSuccess, onError, onProgress }: any) => {
    try {
      // 模拟上传进度
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (onProgress) {
          onProgress({ percent: progress });
        }
        if (progress >= 100) {
          clearInterval(interval);
          // 模拟成功响应 - 实际项目中这里应该调用真实的上传API
          const mockUrl = `https://example.com/uploads/${file.name}`;
          if (onSuccess) {
            onSuccess({ url: mockUrl });
          }
        }
      }, 200);
    } catch (error) {
      if (onError) {
        onError(error);
      }
    }
  };

  const renderFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    const EyeIcon = EyeOutlined as any;
    const FileIcon = FileOutlined as any;
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <EyeIcon />;
    } else if (extension === 'pdf') {
      return <FileIcon style={{ color: '#ff4d4f' }} />;
    } else {
      return <FileIcon style={{ color: '#1890ff' }} />;
    }
  };

  const UploadIcon = UploadOutlined as any;
  const uploadButton = (
    <div>
      <UploadIcon />
      <div style={{ marginTop: 8 }}>
        {placeholder || (type === 'image' ? '上传图片' : '上传文件')}
      </div>
    </div>
  );

  const UploadComponent = Upload as any;
  const ModalComponent = Modal as any;
  const TextComponent = Text as any;

  return (
    <div className={`file-uploader ${className}`}>
      <UploadComponent
        name="file"
        listType={type === 'image' ? 'picture-card' : 'text'}
        fileList={fileList}
        onPreview={preview ? handlePreview : undefined}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        customRequest={customRequest}
        multiple={multiple}
        accept={acceptTypes}
        disabled={disabled}
        showUploadList={{
          showPreviewIcon: preview,
          showRemoveIcon: !disabled,
          showDownloadIcon: false,
        }}
      >
        {!multiple && fileList.length >= 1 ? null : uploadButton}
      </UploadComponent>

      {/* Image Preview Modal */}
      <ModalComponent
        open={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewVisible(false)}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </ModalComponent>

      {/* File type and size hints */}
      <div className="mt-2">
        <TextComponent type="secondary" className="text-xs">
          支持格式：{acceptTypes} | 最大文件大小：{maxSize}MB
        </TextComponent>
      </div>
    </div>
  );
};

export default FileUploader; 