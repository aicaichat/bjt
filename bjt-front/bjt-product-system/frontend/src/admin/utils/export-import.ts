import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { message } from 'antd';

export interface ExportColumn {
  title: string;
  dataIndex: string;
  render?: (value: any, record: any) => string | number;
}

export interface ImportResult<T = any> {
  success: boolean;
  data: T[];
  errors: string[];
  total: number;
}

/**
 * 导出数据到Excel文件
 */
export const exportToExcel = <T = any>(
  data: T[],
  columns: ExportColumn[],
  filename: string = 'export.xlsx'
): void => {
  try {
    // 准备表头
    const headers = columns.map(col => col.title);
    
    // 准备数据
    const exportData = data.map(record => {
      return columns.map(col => {
        const value = record[col.dataIndex as keyof T];
        return col.render ? col.render(value, record) : value;
      });
    });

    // 创建工作表
    const worksheetData = [headers, ...exportData];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // 设置列宽
    const colWidths = columns.map(() => ({ width: 20 }));
    worksheet['!cols'] = colWidths;

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // 导出文件
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, filename);
    
    message.success('导出成功！');
  } catch (error) {
    console.error('导出失败:', error);
    message.error('导出失败，请重试');
  }
};

/**
 * 从Excel文件导入数据
 */
export const importFromExcel = <T = any>(
  file: File,
  columns: ExportColumn[],
  validator?: (row: any, rowIndex: number) => { valid: boolean; errors: string[] }
): Promise<ImportResult<T>> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        const [headers, ...rows] = jsonData as any[][];
        
        if (!headers || headers.length === 0) {
          resolve({
            success: false,
            data: [],
            errors: ['文件格式错误：缺少表头'],
            total: 0
          });
          return;
        }

        // 创建列索引映射
        const columnMap: { [key: string]: number } = {};
        columns.forEach(col => {
          const headerIndex = headers.findIndex((h: string) => h === col.title);
          if (headerIndex !== -1) {
            columnMap[col.dataIndex] = headerIndex;
          }
        });

        const result: T[] = [];
        const errors: string[] = [];

        rows.forEach((row: any[], rowIndex: number) => {
          if (!row || row.every(cell => !cell && cell !== 0)) return; // 跳过空行
          
          const record: any = {};
          let hasData = false;

          // 根据列映射提取数据
          columns.forEach(col => {
            const cellIndex = columnMap[col.dataIndex];
            if (cellIndex !== undefined && cellIndex < row.length) {
              const cellValue = row[cellIndex];
              if (cellValue !== undefined && cellValue !== null && cellValue !== '') {
                record[col.dataIndex] = cellValue;
                hasData = true;
              }
            }
          });

          if (!hasData) return; // 跳过没有有效数据的行

          // 数据验证
          if (validator) {
            const validation = validator(record, rowIndex + 2); // +2 因为Excel行号从1开始，且有表头
            if (!validation.valid) {
              errors.push(`第${rowIndex + 2}行: ${validation.errors.join(', ')}`);
              return;
            }
          }

          result.push(record);
        });

        resolve({
          success: errors.length === 0,
          data: result,
          errors,
          total: result.length
        });

      } catch (error) {
        console.error('导入失败:', error);
        resolve({
          success: false,
          data: [],
          errors: ['文件解析失败，请检查文件格式'],
          total: 0
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        data: [],
        errors: ['文件读取失败'],
        total: 0
      });
    };

    reader.readAsBinaryString(file);
  });
};

/**
 * 下载导入模板
 */
export const downloadTemplate = (columns: ExportColumn[], filename: string = 'template.xlsx'): void => {
  const headers = columns.map(col => col.title);
  const sampleData = columns.map(col => ''); // 空的示例行

  const worksheetData = [headers, sampleData];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // 设置列宽
  const colWidths = columns.map(() => ({ width: 20 }));
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, filename);
  
  message.success('模板下载成功！');
}; 