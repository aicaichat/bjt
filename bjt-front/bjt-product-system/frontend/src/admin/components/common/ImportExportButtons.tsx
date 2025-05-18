import React from 'react';
import { Button, Upload, message } from 'antd';
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

interface ImportExportButtonsProps {
  onImport?: (file: File) => Promise<void>;
  onExport?: () => Promise<void>;
  accept?: string;
  maxSize?: number;
  importButtonText?: string;
  exportButtonText?: string;
}

function ImportExportButtons({
  onImport,
  onExport,
  accept = '.xlsx,.xls,.csv',
  maxSize = 5,
  importButtonText = '导入',
  exportButtonText = '导出'
}: ImportExportButtonsProps) {
  const handleImport: UploadProps['customRequest'] = async ({ file }) => {
    if (!onImport) return;

    try {
      await onImport(file as File);
      message.success('导入成功');
    } catch (error) {
      message.error('导入失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleExport = async () => {
    if (!onExport) return;

    try {
      await onExport();
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  return (
    <div className="flex space-x-2">
      {onImport && (
        <Upload
          accept={accept}
          showUploadList={false}
          beforeUpload={(file) => {
            const isLtMaxSize = file.size / 1024 / 1024 < maxSize;
            if (!isLtMaxSize) {
              message.error(`文件大小不能超过 ${maxSize}MB!`);
              return false;
            }
            return false;
          }}
          customRequest={handleImport}
        >
          <Button icon={<UploadOutlined />}>
            {importButtonText}
          </Button>
        </Upload>
      )}
      
      {onExport && (
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
        >
          {exportButtonText}
        </Button>
      )}
    </div>
  );
}

export default ImportExportButtons; 