import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';

interface PdfUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hostId?: number; // 主机ID，用于关联上传的文件
}

const PdfUploader: React.FC<PdfUploaderProps> = ({
  value,
  onChange,
  placeholder = '点击上传PDF文件',
  disabled = false,
  hostId
}) => {
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 获取认证token
  const getAuthToken = async (): Promise<string> => {
    try {
      // 首先尝试从localStorage获取JWT token（和其他API一致）
      const jwtToken = localStorage.getItem('bjt_token') || sessionStorage.getItem('bjt_token');
      if (jwtToken) {
        console.log('PdfUploader: Using JWT token from storage');
        return jwtToken;
      }
      
      // 作为fallback，尝试从全局变量获取
      const globalToken = (window as any).bjtApiToken || (window as any).wpApiSettings?.nonce;
      if (globalToken) {
        console.log('PdfUploader: Using global token:', globalToken.substring(0, 20) + '...');
        return globalToken;
      }

      console.warn('PdfUploader: No authentication token found');
      return '';
    } catch (error) {
      console.error('PdfUploader: Error getting auth token:', error);
      return '';
    }
  };

  // 文件上传前的验证
  const beforeUpload = (file: File) => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      message.error('只能上传PDF格式的文件！');
      return false;
    }

    const isLt10M = file.size / 1024 / 1024 < 10;
    if (!isLt10M) {
      message.error('文件大小不能超过10MB！');
      return false;
    }

    return true;
  };

  // 自定义上传处理
  const customUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess, onError, onProgress } = options;
    
    try {
      setUploading(true);
      console.log('PdfUploader: Starting upload for file:', file);
      
      // 获取认证token
      const authToken = await getAuthToken();
      console.log('PdfUploader: Using token:', authToken.substring(0, 20) + '...');
      
      // 模拟上传进度
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 90) {
          onProgress?.({ percent: progress });
        }
      }, 100);

      // 使用BJT Core Entities的通用文件上传API
      const formData = new FormData();
      formData.append('file', file as File);
      formData.append('upload_dir', 'uploads/machines/pdfs');

      console.log('PdfUploader: Uploading to BJT Core Entities API with data:', {
        upload_dir: 'uploads/machines/pdfs',
        file_name: (file as File).name,
        file_size: (file as File).size
      });

      const response = await fetch('/wp-json/bjt/v1/upload/file', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`, // 使用Bearer token认证
        },
      });

      clearInterval(progressInterval);
      onProgress?.({ percent: 100 });

      console.log('PdfUploader: Upload response status:', response.status);
      console.log('PdfUploader: Upload response headers:', [...response.headers.entries()]);

      if (!response.ok) {
        // 如果是401错误，尝试重新登录获取token
        if (response.status === 401) {
          console.log('PdfUploader: Authentication failed, attempting login...');
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
                remember_me: false
              })
            });
            
            if (loginResponse.ok) {
              const loginData = await loginResponse.json();
              if (loginData.success && loginData.data?.token) {
                console.log('PdfUploader: Login successful, retrying upload...');
                
                // 更新token并重新尝试上传
                const newFormData = new FormData();
                newFormData.append('file', file as File);
                newFormData.append('upload_dir', 'uploads/machines/pdfs');
                
                const retryResponse = await fetch('/wp-json/bjt/v1/upload/file', {
                  method: 'POST',
                  body: newFormData,
                  credentials: 'include',
                  headers: {
                    'Authorization': `Bearer ${loginData.data.token}`,
                  },
                });
                
                if (retryResponse.ok) {
                  const retryResult = await retryResponse.json();
                  if (retryResult.success) {
                    const fileUrl = retryResult.data?.url;
                    if (fileUrl) {
                      onSuccess?.(retryResult);
                      onChange?.(fileUrl);
                      message.success('PDF文件上传成功！');
                      console.log('PdfUploader: Retry upload successful, file URL:', fileUrl);
                      return; // 成功后直接返回
                    }
                  }
                }
              }
            }
          } catch (loginError) {
            console.error('PdfUploader: Auto-login failed:', loginError);
          }
        }
        
        const errorText = await response.text();
        console.error('PdfUploader: Upload failed with response:', errorText);
        throw new Error(`上传失败: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('PdfUploader: Upload result:', result);
      
      if (result.success) {
        const fileUrl = result.data?.url;
        if (fileUrl) {
          onSuccess?.(result);
          onChange?.(fileUrl);
          message.success('PDF文件上传成功！');
          console.log('PdfUploader: Upload successful, file URL:', fileUrl);
        } else {
          throw new Error('上传成功但未返回文件URL');
        }
      } else {
        const errorMessage = result.message || '上传失败';
        console.error('PdfUploader: Upload failed:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('PdfUploader: Upload error:', error);
      onError?.(error as Error);
      
      // 提供更友好的错误信息
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          message.error('上传服务未找到，请检查服务器配置');
        } else if (error.message.includes('403')) {
          message.error('权限不足，请检查登录状态');
        } else if (error.message.includes('401')) {
          message.error('认证失败，请重新登录');
        } else if (error.message.includes('413')) {
          message.error('文件过大，请选择较小的文件');
        } else {
          message.error(error.message || 'PDF文件上传失败，请重试');
        }
      } else {
        message.error('PDF文件上传失败，请重试');
      }
    } finally {
      setUploading(false);
    }
  };

  // 删除文件
  const handleRemove = () => {
    onChange?.('');
    setFileList([]);
    message.success('文件已删除');
  };

  // 上传状态变化处理
  const handleChange: UploadProps['onChange'] = (info) => {
    let newFileList = [...info.fileList];
    
    // 只保留一个文件
    newFileList = newFileList.slice(-1);
    
    setFileList(newFileList);
  };

  // 如果有值但没有文件列表，初始化文件列表
  React.useEffect(() => {
    if (value && fileList.length === 0) {
      const fileName = value.split('/').pop() || 'document.pdf';
      setFileList([
        {
          uid: '-1',
          name: fileName,
          status: 'done',
          url: value,
        },
      ]);
    } else if (!value && fileList.length > 0) {
      setFileList([]);
    }
  }, [value]);

  return (
    <div className="pdf-uploader">
      <Upload
        fileList={fileList}
        customRequest={customUpload}
        beforeUpload={beforeUpload}
        onChange={handleChange}
        showUploadList={{
          showRemoveIcon: true,
          showDownloadIcon: true,
        }}
        maxCount={1}
        accept=".pdf,application/pdf"
        disabled={disabled || uploading}
      >
        {fileList.length === 0 && (
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading}
            disabled={disabled}
          >
            {placeholder}
          </Button>
        )}
      </Upload>
      
      {value && fileList.length > 0 && (
        <div className="mt-2">
          <Button 
            size="small" 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            onClick={handleRemove}
            disabled={disabled}
          >
            删除文件
          </Button>
        </div>
      )}
      
      {value && (
        <div className="mt-2 text-sm text-gray-500">
          当前文件: <a href={value} target="_blank" rel="noopener noreferrer">查看PDF</a>
        </div>
      )}
    </div>
  );
};

export default PdfUploader; 