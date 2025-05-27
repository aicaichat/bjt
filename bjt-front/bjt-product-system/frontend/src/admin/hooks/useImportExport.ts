import { useState } from 'react';
import { message } from 'antd';
import { exportToCsv, downloadTemplate, parseCsvFile, ExportColumn } from '../utils/csv-utils';

export interface ImportExportConfig<T = any> {
  // 数据和列配置
  data: T[];
  columns: ExportColumn[];
  
  // 文件名配置
  exportFileName?: string;
  templateFileName?: string;
  
  // 导入配置
  onImportSuccess?: (data: T[]) => Promise<void> | void;
  validateRow?: (row: any, rowIndex: number) => { valid: boolean; errors: string[] };
  
  // 字段映射（可选）
  fieldMapping?: { [key: string]: string };
  
  // 必填字段验证
  requiredFields?: string[];
}

export interface ImportResult<T = any> {
  success: boolean;
  data: T[];
  errors: string[];
  total: number;
}

export const useImportExport = <T = any>(config: ImportExportConfig<T>) => {
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult<T> | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const {
    data,
    columns,
    exportFileName,
    templateFileName,
    onImportSuccess,
    validateRow,
    fieldMapping = {},
    requiredFields = []
  } = config;

  // 导出功能
  const handleExport = () => {
    try {
      const filename = exportFileName || `导出数据_${new Date().toISOString().split('T')[0]}.csv`;
      exportToCsv(data, columns, filename);
    } catch (error) {
      console.error('导出失败:', error);
      message.error('导出失败，请重试');
    }
  };

  // 下载模板
  const handleDownloadTemplate = () => {
    try {
      const filename = templateFileName || '导入模板.csv';
      downloadTemplate(columns, filename);
    } catch (error) {
      console.error('模板下载失败:', error);
      message.error('模板下载失败，请重试');
    }
  };

  // 解析导入文件
  const handleImportFile = async (file: File) => {
    setImportLoading(true);
    setImportResult(null);

    try {
      let parsedData: string[][];
      
      // 根据文件类型解析
      if (file.name.toLowerCase().endsWith('.csv')) {
        parsedData = await parseCsvFile(file);
      } else {
        // 简单的文本解析作为fallback
        const text = await file.text();
        const lines = text.split('\n').filter(line => line.trim());
        parsedData = lines.map(line => line.split(',').map(cell => cell.trim()));
      }

      if (parsedData.length === 0) {
        setImportResult({
          success: false,
          data: [],
          errors: ['文件为空'],
          total: 0
        });
        return;
      }

      const [headers, ...dataRows] = parsedData;
      
      // 验证表头
      const requiredHeaders = columns.map(col => col.title);
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setImportResult({
          success: false,
          data: [],
          errors: [`缺少必需的列: ${missingHeaders.join(', ')}`],
          total: 0
        });
        return;
      }

      // 创建列索引映射
      const columnMap: { [key: string]: number } = {};
      columns.forEach(col => {
        const headerIndex = headers.findIndex(h => h === col.title);
        if (headerIndex !== -1) {
          columnMap[col.dataIndex] = headerIndex;
        }
      });

      const result: T[] = [];
      const errors: string[] = [];

      // 解析数据行
      dataRows.forEach((row, rowIndex) => {
        if (!row || row.every(cell => !cell && cell !== '0')) return; // 跳过空行
        
        const record: any = {};
        let hasData = false;

        // 根据列映射提取数据
        columns.forEach(col => {
          const cellIndex = columnMap[col.dataIndex];
          if (cellIndex !== undefined && cellIndex < row.length) {
            const cellValue = row[cellIndex];
            if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
              // 应用字段映射
              const mappedField = fieldMapping[col.dataIndex] || col.dataIndex;
              record[mappedField] = cellValue;
              hasData = true;
            }
          }
        });

        if (!hasData) return; // 跳过没有有效数据的行

        // 必填字段验证
        const missingRequired = requiredFields.filter(field => !record[field]);
        if (missingRequired.length > 0) {
          errors.push(`第${rowIndex + 2}行: 缺少必填字段 ${missingRequired.join(', ')}`);
          return;
        }

        // 自定义验证
        if (validateRow) {
          const validation = validateRow(record, rowIndex + 2);
          if (!validation.valid) {
            errors.push(`第${rowIndex + 2}行: ${validation.errors.join(', ')}`);
            return;
          }
        }

        result.push(record);
      });

      setImportResult({
        success: errors.length === 0,
        data: result,
        errors,
        total: result.length
      });

    } catch (error) {
      console.error('导入失败:', error);
      setImportResult({
        success: false,
        data: [],
        errors: ['文件解析失败，请检查文件格式'],
        total: 0
      });
    } finally {
      setImportLoading(false);
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!importResult?.success || importResult.data.length === 0) return;

    try {
      if (onImportSuccess) {
        await onImportSuccess(importResult.data);
      }
      setModalVisible(false);
      setImportResult(null);
    } catch (error) {
      console.error('导入处理失败:', error);
      message.error('导入处理失败，请重试');
    }
  };

  // 显示导入对话框
  const showImportModal = () => {
    setModalVisible(true);
    setImportResult(null);
  };

  // 关闭对话框
  const hideImportModal = () => {
    setModalVisible(false);
    setImportResult(null);
  };

  return {
    // 状态
    importLoading,
    importResult,
    modalVisible,
    
    // 方法
    handleExport,
    handleDownloadTemplate,
    handleImportFile,
    handleConfirmImport,
    showImportModal,
    hideImportModal,
    
    // 配置
    columns,
  };
}; 