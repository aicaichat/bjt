import React, { useState, useEffect } from 'react';
import { Input, Upload, Button, Space, message, Modal } from 'antd';
import { UploadOutlined, LinkOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps, UploadFile } from 'antd/es/upload';

export interface FileUrlInputProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fileType?: 'image' | 'pdf' | 'document';
  maxSize?: number; // MB
  accept?: string;
  preview?: boolean;
  uploadPath?: string; // 上传后的文件路径前缀，默认 '/uploads/'
}

const FileUrlInput: React.FC<FileUrlInputProps> = ({
  value = '',
  onChange,
  placeholder = '请输入URL或上传文件',
  disabled = false,
  fileType = 'image',
  maxSize = 10,
  accept,
  preview = true,
  uploadPath = '/uploads/',
}) => {
  const [inputValue, setInputValue] = useState<string>(value);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string>('');

  // 根据文件类型设置默认accept
  const getDefaultAccept = () => {
    switch (fileType) {
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
    setInputValue(value);
    
    // 如果有值且来自上传，设置文件列表用于显示
    if (value) {
      const fileName = value.split('/').pop() || 'file';
      setFileList([
        {
          uid: '-1',
          name: fileName,
          status: 'done',
          url: value,
        },
      ]);
    } else {
      setFileList([]);
    }
  }, [value, uploadPath]);

  // 处理URL输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    
    // 清除文件列表（如果是手动输入）
    if (!newValue.startsWith(uploadPath)) {
      setFileList([]);
    }
  };

  // 验证文件
  const beforeUpload = (file: File) => {
    // 检查文件大小
    const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
    if (!isLtMaxSize) {
      message.error(`文件大小不能超过 ${maxSize}MB!`);
      return false;
    }

    // 检查文件类型
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = acceptTypes.split(',').map(ext => ext.replace('.', '').toLowerCase());
    
    if (fileExtension && !allowedExtensions.includes(fileExtension)) {
      message.error(`不支持的文件类型！请上传 ${acceptTypes} 格式的文件`);
      return false;
    }

    return true;
  };

  // 真实文件上传处理
  const customRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError, onProgress }) => {
    try {
      setUploading(true);
      console.log('FileUrlInput: Starting real upload for file:', file);
      
      // 上传进度模拟
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        onProgress?.({ percent: Math.min(progress, 90) });
      }, 200);

      // 创建FormData
      const formData = new FormData();
      formData.append('file', file as File);
      formData.append('upload_dir', uploadPath.replace(/^\//, '').replace(/\/$/, ''));
      
      // 调试日志：检查FormData内容
      console.log('FileUrlInput: FormData contents:');
      console.log('  - file:', file);
      console.log('  - file.name:', (file as File).name);
      console.log('  - file.size:', (file as File).size);
      console.log('  - file.type:', (file as File).type);
      console.log('  - upload_dir:', uploadPath.replace(/^\//, '').replace(/\/$/, ''));
      
      // 验证FormData
      for (let [key, value] of formData.entries()) {
        console.log(`  - FormData[${key}]:`, value);
      }
      
      // 根据文件类型选择合适的上传端点
      let uploadEndpoint = '/wp-json/bjt/v1/upload/file';
      if (fileType === 'image') {
        uploadEndpoint = '/wp-json/bjt/v1/upload/image';
        // file字段已经添加了，不需要额外的image_file字段
      }
      // 注意：对于PDF文件，我们使用通用的file端点而不是specification端点
      // 因为specification端点要求有效的host_id，而通用文件上传不需要

      console.log('FileUrlInput: Uploading to endpoint:', uploadEndpoint);
      console.log('FileUrlInput: Upload path:', uploadPath);

      // 获取认证token
      const getAuthToken = async (): Promise<string> => {
        try {
          // 在管理员系统中，优先使用admin_token
          const adminToken = localStorage.getItem('admin_token');
          if (adminToken) {
            console.log('FileUrlInput: Using admin token');
            return adminToken;
          }
          
          // 如果没有admin_token，尝试自动登录获取
          console.log('FileUrlInput: No admin token found, attempting admin login...');
          try {
            const loginResponse = await fetch('/wp-json/bjt/v1/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                username: 'admin',
                password: 'password123',
                login_type: 'admin_login'
              })
            });
            
            if (loginResponse.ok) {
              const loginData = await loginResponse.json();
              if (loginData.success && loginData.data?.token) {
                // 保存admin token
                localStorage.setItem('admin_token', loginData.data.token);
                console.log('FileUrlInput: Admin token obtained and saved');
                return loginData.data.token;
              }
            }
          } catch (loginError) {
            console.warn('FileUrlInput: Admin login failed:', loginError);
          }
          
          // 作为fallback，尝试其他token
          const authToken = localStorage.getItem('auth_token');
          if (authToken) {
            console.log('FileUrlInput: Using auth token');
            return authToken;
          }
          
          const jwtToken = localStorage.getItem('bjt_token') || sessionStorage.getItem('bjt_token');
          if (jwtToken) {
            console.log('FileUrlInput: Using JWT token from storage');
            return jwtToken;
          }
          
          // 作为最后的fallback，尝试从全局变量获取
          const globalToken = (window as any).bjtApiToken || (window as any).wpApiSettings?.nonce;
          if (globalToken) {
            console.log('FileUrlInput: Using global token:', globalToken.substring(0, 20) + '...');
            return globalToken;
          }
          
          console.warn('FileUrlInput: No authentication token found');
          return '';
        } catch (error) {
          console.error('FileUrlInput: Error getting auth token:', error);
          return '';
        }
      };

      const authToken = await getAuthToken();
      
      // 执行上传
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          ...(authToken && { 'Authorization': `Bearer ${authToken}` })
        },
      });

      clearInterval(interval);
      onProgress?.({ percent: 100 });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('FileUrlInput: Upload failed with status:', response.status);
        console.error('FileUrlInput: Error response:', errorText);
        throw new Error(`上传失败: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('FileUrlInput: Upload result:', result);
      
      if (result.success && result.data?.url) {
        const fileUrl = result.data.url;
        
        // 确保URL是相对路径格式
        let finalUrl = fileUrl;
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          // 如果是绝对URL，转换为相对路径
          const url = new URL(fileUrl);
          finalUrl = url.pathname;
        }
        
        console.log('FileUrlInput: Real upload successful, file URL:', finalUrl);
        
        onSuccess?.(result);
        setInputValue(finalUrl);
        onChange?.(finalUrl);
        message.success('文件上传成功！');
      } else {
        throw new Error(result.message || '上传失败');
      }
    } catch (error) {
      console.error('FileUrlInput: Upload error:', error);
      onError?.(error as Error);
      
      // 提供更友好的错误信息
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          message.error('上传服务未找到，请检查服务器配置');
        } else if (error.message.includes('403') || error.message.includes('401')) {
          message.error('权限不足，请检查登录状态');
        } else {
          message.error(error.message || '文件上传失败，请重试');
        }
      } else {
        message.error('文件上传失败，请重试');
      }
    } finally {
      setUploading(false);
    }
  };

  // 处理上传状态变化
  const handleUploadChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    
    // 只保留一个文件
    newFileList = newFileList.slice(-1);
    
    // 过滤掉错误状态的文件
    newFileList = newFileList.filter(file => {
      if (file.response && file.response.url) {
        file.url = file.response.url;
      }
      return file.status !== 'error';
    });
    
    setFileList(newFileList);
  };

  // 删除文件
  const handleRemove = () => {
    setFileList([]);
    setInputValue('');
    onChange?.('');
    message.success('文件已删除');
  };

  // 预览图片
  const handlePreview = async (file: UploadFile) => {
    if (fileType === 'image' && file.url) {
      setPreviewImage(file.url);
      setPreviewVisible(true);
    } else if (file.url) {
      // 对于PDF和其他文档，在新窗口打开
      window.open(file.url, '_blank');
    }
  };

  // 清空输入
  const handleClear = () => {
    setInputValue('');
    setFileList([]);
    onChange?.('');
  };

  return (
    <div className="file-url-input">
      <div style={{ display: 'flex', width: '100%' }}>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled}
          prefix={<LinkOutlined />}
          allowClear
          onClear={handleClear}
          style={{ flex: 1, borderRadius: '6px 0 0 6px', borderRight: 'none' }}
        />
        
        <Upload
          fileList={fileList}
          beforeUpload={beforeUpload}
          customRequest={customRequest}
          onChange={handleUploadChange}
          onRemove={handleRemove}
          onPreview={preview ? handlePreview : undefined}
          accept={acceptTypes}
          disabled={disabled || uploading}
          showUploadList={false}
          maxCount={1}
        >
          <Button 
            icon={<UploadOutlined />}
            disabled={disabled || uploading}
            loading={uploading}
            type="default"
            style={{ borderRadius: '0 6px 6px 0', borderLeft: 'none' }}
          >
            {uploading ? '上传中' : '上传'}
          </Button>
        </Upload>
      </div>

      {/* 文件预览和操作 */}
      {fileList.length > 0 && fileList[0].status === 'done' && (
        <div className="mt-2 p-2 border border-gray-200 rounded bg-gray-50">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <span className="text-sm text-gray-600">已上传：</span>
              <span className="text-sm font-medium">{fileList[0].name}</span>
            </Space>
            <Space>
              {preview && (
                <Button
                  size="small"
                  type="text"
                  icon={<EyeOutlined />}
                  onClick={() => handlePreview(fileList[0])}
                />
              )}
              <Button
                size="small"
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemove}
                disabled={disabled}
              />
            </Space>
          </div>
        </div>
      )}

      {/* URL格式提示 */}
      <div className="mt-1 text-xs text-gray-500">
        支持格式：{acceptTypes} | 最大文件大小：{maxSize}MB | 上传后自动生成 {uploadPath} 相对路径
      </div>

      {/* 图片预览模态框 */}
      {fileType === 'image' && (
        <Modal
          open={previewVisible}
          title="图片预览"
          footer={null}
          onCancel={() => setPreviewVisible(false)}
          width="80%"
          style={{ maxWidth: 800 }}
        >
          <img alt="preview" style={{ width: '100%' }} src={previewImage} />
        </Modal>
      )}
    </div>
  );
};

export default FileUrlInput; 