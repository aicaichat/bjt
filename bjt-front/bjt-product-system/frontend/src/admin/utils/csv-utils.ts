import { message } from 'antd';

export interface ExportColumn {
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => string | number;
}

/**
 * 导出数据到CSV文件
 */
export const exportToCsv = <T = any>(
  data: T[],
  columns: ExportColumn[],
  filename: string = 'export.csv'
): void => {
  try {
    // 准备表头
    const headers = columns.map(col => col.title);
    
    // 准备数据
    const exportData = data.map(record => {
      return columns.map(col => {
        const value = record[col.dataIndex as keyof T];
        const processedValue = col.render ? col.render(value, record) : value;
        // 处理CSV特殊字符
        const stringValue = String(processedValue || '');
        return stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')
          ? `"${stringValue.replace(/"/g, '""')}"` // 转义引号
          : stringValue;
      });
    });

    // 创建CSV内容
    const csvContent = [headers.join(','), ...exportData.map(row => row.join(','))].join('\n');
    
    // 添加BOM以支持中文
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // 下载文件
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    message.success('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
  }
};

/**
 * 解析CSV文件内容
 */
export const parseCsvFile = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          reject(new Error('文件内容为空'));
          return;
        }
        
        // 简单的CSV解析（不处理复杂的转义情况）
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => {
          // 简单的CSV分割，假设没有复杂的嵌套引号
          return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
        });
        
        resolve(data);
      } catch (error) {
        reject(new Error('文件解析失败'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('文件读取失败'));
    };
    
    reader.readAsText(file, 'utf-8');
  });
};

/**
 * 下载导入模板
 */
export const downloadTemplate = (columns: ExportColumn[], filename: string = 'template.csv'): void => {
  const headers = columns.map(col => col.title);
  const sampleData = columns.map(() => ''); // 空的示例行

  const csvContent = [headers.join(','), sampleData.join(',')].join('\n');
  
  // 添加BOM以支持中文
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  message.success('模板下载成功！');
}; 