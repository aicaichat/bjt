import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, Database, ArrowLeftRight, Settings, Eye, Copy } from 'lucide-react';

const SqlExcelBidirectionalConverter = () => {
  const [convertDirection, setConvertDirection] = useState('sql-to-excel'); // 'sql-to-excel' or 'excel-to-sql'
  const [files, setFiles] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [sqlOutput, setSqlOutput] = useState('');
  const [excelData, setExcelData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sqlOptions, setSqlOptions] = useState({
    dialect: 'mysql',
    insertFormat: 'multi-row',
    onDuplicate: false,
    batchSize: 1000
  });
  
  const fileInputRef = useRef(null);
  const sqlTextareaRef = useRef(null);

  // SQL解析函数
  const parseInsertStatement = (sql) => {
    const tables = {};
    const insertRegex = /INSERT\s+INTO\s+`?(\w+)`?\s*\((.*?)\)\s*VALUES\s*([\s\S]*?)(?=INSERT|$|;)/gi;
    let match;
    
    while ((match = insertRegex.exec(sql)) !== null) {
      const tableName = match[1];
      const columns = match[2]
        .split(',')
        .map(col => col.trim().replace(/`/g, '').replace(/'/g, ''))
        .filter(col => col);
      
      const valuesSection = match[3];
      const rows = [];
      
      const valueRegex = /\((.*?)\)/g;
      let valueMatch;
      
      while ((valueMatch = valueRegex.exec(valuesSection)) !== null) {
        const values = valueMatch[1]
          .split(',')
          .map(val => {
            val = val.trim();
            if (val === 'NULL' || val === 'NOW()') {
              return val;
            }
            if (val.startsWith("'") && val.endsWith("'")) {
              return val.slice(1, -1);
            }
            return val;
          });
        
        if (values.length === columns.length) {
          rows.push(values);
        }
      }
      
      if (!tables[tableName]) {
        tables[tableName] = { columns, rows: [] };
      }
      tables[tableName].rows.push(...rows);
    }
    
    return tables;
  };

  // Excel解析函数 (模拟，实际应用需要使用Excel库如SheetJS)
  const parseExcel = (data) => {
    // 这里假设data是从Excel读取的JSON格式数据
    // 实际应用中需要使用SheetJS等库来解析Excel文件
    const tables = {};
    
    for (const sheetName in data) {
      if (sheetName === '使用说明') continue;
      
      const sheet = data[sheetName];
      const headers = sheet[0];
      const rows = [];
      
      // 跳过标题行，读取用户输入的数据行（第2-6行）
      for (let i = 1; i <= 5; i++) {
        if (i < sheet.length && sheet[i].some(cell => cell !== null && cell !== '')) {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = sheet[i][index];
          });
          rows.push(row);
        }
      }
      
      tables[sheetName] = { headers, rows };
    }
    
    return tables;
  };

  // 数据类型检测
  const detectDataType = (value) => {
    if (value === null || value === undefined || value === '' || value === 'NULL') {
      return 'NULL';
    }
    if (value === 'NOW()' || value === 'CURRENT_TIMESTAMP') {
      return 'FUNCTION';
    }
    if (!isNaN(value) && !isNaN(parseFloat(value)) && value !== '') {
      return 'NUMBER';
    }
    if (value instanceof Date) {
      return 'DATE';
    }
    return 'STRING';
  };

  // 格式化SQL值
  const formatSqlValue = (value, type) => {
    switch (type) {
      case 'NULL':
        return 'NULL';
      case 'FUNCTION':
        return value;
      case 'NUMBER':
        return value;
      case 'DATE':
        if (value instanceof Date) {
          return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
        }
        return `'${value}'`;
      case 'STRING':
        // 转义单引号
        const escaped = String(value).replace(/'/g, "''");
        return `'${escaped}'`;
      default:
        return `'${value}'`;
    }
  };

  // Excel转SQL
  const excelToSql = (excelData) => {
    const sqlStatements = [];
    
    Object.keys(excelData).forEach(tableName => {
      const { headers, rows } = excelData[tableName];
      
      if (!headers || !rows || rows.length === 0) return;
      
      // 过滤掉空行
      const validRows = rows.filter(row => 
        Object.values(row).some(val => val !== null && val !== undefined && val !== '')
      );
      
      if (validRows.length === 0) return;
      
      // 生成列名部分
      const columnList = headers.map(col => `\`${col}\``).join(', ');
      
      // 根据选项生成不同格式的INSERT语句
      if (sqlOptions.insertFormat === 'single-row') {
        // 单行INSERT
        validRows.forEach(row => {
          const values = headers.map(col => {
            const value = row[col];
            const type = detectDataType(value);
            return formatSqlValue(value, type);
          }).join(', ');
          
          sqlStatements.push(`INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});`);
        });
      } else {
        // 多行INSERT
        const batchSize = sqlOptions.batchSize;
        for (let i = 0; i < validRows.length; i += batchSize) {
          const batch = validRows.slice(i, i + batchSize);
          const valuesList = batch.map(row => {
            const values = headers.map(col => {
              const value = row[col];
              const type = detectDataType(value);
              return formatSqlValue(value, type);
            }).join(', ');
            return `  (${values})`;
          }).join(',\n');
          
          let sql = `INSERT INTO \`${tableName}\` (${columnList}) VALUES\n${valuesList}`;
          
          // 添加ON DUPLICATE KEY UPDATE（如果选择）
          if (sqlOptions.onDuplicate) {
            const updateList = headers
              .filter(col => col !== 'id')
              .map(col => `\`${col}\` = VALUES(\`${col}\`)`)
              .join(',\n  ');
            sql += `\nON DUPLICATE KEY UPDATE\n  ${updateList}`;
          }
          
          sql += ';';
          sqlStatements.push(sql);
        }
      }
    });
    
    // 添加SQL注释
    const header = [
      `-- Generated SQL from Excel`,
      `-- Date: ${new Date().toISOString()}`,
      `-- Tables: ${Object.keys(excelData).join(', ')}`,
      `-- Format: ${sqlOptions.insertFormat}`,
      `-- Dialect: ${sqlOptions.dialect.toUpperCase()}`,
      '',
      ''
    ].join('\n');
    
    return header + sqlStatements.join('\n\n');
  };

  // 生成Excel文件内容
  const generateExcelContent = (table) => {
    // 实际应用中需要使用Excel库来生成Excel文件
    // 这里只是模拟生成Excel数据的结构
    const excelData = [];
    
    // 添加列标题
    excelData.push(table.columns);
    
    // 添加5行空行供用户填写
    for (let i = 0; i < 5; i++) {
      excelData.push(table.columns.map(() => ''));
    }
    
    // 添加分隔行
    excelData.push([]);
    excelData.push(['=== 示例数据 ===']);
    
    // 添加示例数据
    table.rows.slice(0, 3).forEach(row => {
      excelData.push(row);
    });
    
    return excelData;
  };

  // 处理文件上传
  const handleFileUpload = async (event) => {
    const uploadedFiles = Array.from(event.target.files);
    setFiles(uploadedFiles);
    setIsProcessing(true);
    
    try {
      if (convertDirection === 'sql-to-excel') {
        // SQL转Excel逻辑
        const allTables = {};
        
        for (const file of uploadedFiles) {
          const text = await file.text();
          const tables = parseInsertStatement(text);
          
          Object.keys(tables).forEach(tableName => {
            if (!allTables[tableName]) {
              allTables[tableName] = tables[tableName];
            } else {
              allTables[tableName].rows.push(...tables[tableName].rows);
            }
          });
        }
        
        setParsedData(Object.keys(allTables).map(name => ({
          name,
          ...allTables[name]
        })));
        
      } else {
        // Excel转SQL逻辑 (模拟)
        // 实际应用中需要使用SheetJS等库来解析Excel文件
        alert('Excel转SQL功能需要使用SheetJS等库来实现，此处仅为示例界面');
        
        // 模拟数据
        const mockExcelData = {
          'wp_bjt_product_lines': {
            headers: ['id', 'title_zh', 'title_en', 'description_zh', 'description_en', 'image_url', 'code', 'status', 'sort_order'],
            rows: [
              {
                'id': '5',
                'title_zh': '新产品线',
                'title_en': 'New Product Line',
                'description_zh': '这是一个新产品线描述',
                'description_en': 'This is a new product line description',
                'image_url': '/images/shop/new.jpg',
                'code': 'new_line',
                'status': 'publish',
                'sort_order': '50'
              }
            ]
          }
        };
        
        setExcelData(mockExcelData);
        const sql = excelToSql(mockExcelData);
        setSqlOutput(sql);
      }
    } catch (error) {
      console.error('文件处理错误:', error);
      alert('文件处理错误: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 下载单个Excel文件
  const downloadExcel = (table) => {
    // 实际应用中需要使用Excel库来生成Excel文件
    alert(`实际应用中需要使用Excel库来生成${table.name}.xlsx文件`);
    
    // 模拟下载
    const blob = new Blob([JSON.stringify(generateExcelContent(table))], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 下载所有Excel文件（打包）
  const downloadAllExcel = () => {
    alert('实际应用中需要使用Excel库来生成Excel文件，并使用JSZip等库来打包多个文件');
    parsedData.forEach(table => {
      downloadExcel(table);
    });
  };

  // 复制SQL到剪贴板
  const copySql = () => {
    if (sqlTextareaRef.current) {
      sqlTextareaRef.current.select();
      document.execCommand('copy');
      alert('SQL已复制到剪贴板');
    }
  };

  // 下载SQL文件
  const downloadSql = () => {
    const blob = new Blob([sqlOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_inserts.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center justify-center">
          <Database className="mr-3" />
          SQL ↔ Excel 双向转换器
        </h1>
        <p className="text-gray-600">SQL与Excel之间的智能转换工具</p>
      </div>

      {/* 转换方向选择 */}
      <div className="mb-6">
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => {
              setConvertDirection('sql-to-excel');
              setFiles([]);
              setParsedData(null);
              setSqlOutput('');
              setExcelData(null);
            }}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${
              convertDirection === 'sql-to-excel'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              SQL → Excel
            </div>
            <div className="text-sm text-gray-500 mt-1">生成Excel模板</div>
          </button>

          <div className="flex items-center">
            <ArrowLeftRight className="h-6 w-6 text-gray-400" />
          </div>

          <button
            onClick={() => {
              setConvertDirection('excel-to-sql');
              setFiles([]);
              setParsedData(null);
              setSqlOutput('');
              setExcelData(null);
            }}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${
              convertDirection === 'excel-to-sql'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Excel → SQL
            </div>
            <div className="text-sm text-gray-500 mt-1">生成INSERT语句</div>
          </button>
        </div>
      </div>

      {/* SQL选项配置（Excel转SQL时显示） */}
      {convertDirection === 'excel-to-sql' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Settings className="mr-2 h-5 w-5" />
            SQL生成选项
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                数据库方言
              </label>
              <select
                value={sqlOptions.dialect}
                onChange={(e) => setSqlOptions({...sqlOptions, dialect: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="mysql">MySQL</option>
                <option value="postgresql">PostgreSQL</option>
                <option value="sqlite">SQLite</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                INSERT格式
              </label>
              <select
                value={sqlOptions.insertFormat}
                onChange={(e) => setSqlOptions({...sqlOptions, insertFormat: e.target.value})}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="multi-row">多行INSERT</option>
                <option value="single-row">单行INSERT</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                批量大小
              </label>
              <input
                type="number"
                value={sqlOptions.batchSize}
                onChange={(e) => setSqlOptions({...sqlOptions, batchSize: parseInt(e.target.value)})}
                className="w-full p-2 border border-gray-300 rounded-md"
                min="1"
                max="10000"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={sqlOptions.onDuplicate}
                  onChange={(e) => setSqlOptions({...sqlOptions, onDuplicate: e.target.checked})}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">ON DUPLICATE KEY UPDATE</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 文件上传区域 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept={convertDirection === 'sql-to-excel' ? '.sql' : '.xlsx,.xls'}
          multiple={convertDirection === 'sql-to-excel'}
          className="hidden"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-xl font-semibold text-gray-700 mb-2">
          {convertDirection === 'sql-to-excel' ? '上传SQL文件' : '上传Excel文件'}
        </p>
        <p className="text-gray-500 mb-4">
          {convertDirection === 'sql-to-excel' 
            ? '支持包含INSERT语句的SQL文件（支持多文件）'
            : '上传填写好数据的Excel文件'
          }
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          选择文件
        </button>
      </div>

      {/* 处理状态 */}
      {isProcessing && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-gray-600">正在处理文件...</p>
        </div>
      )}

      {/* SQL转Excel结果 */}
      {convertDirection === 'sql-to-excel' && parsedData && parsedData.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">解析结果：</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {parsedData.map((table, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{table.name}</h4>
                <p className="text-sm text-gray-600 mb-2">列数: {table.columns.length}</p>
                <p className="text-sm text-gray-600 mb-3">示例数据: {table.rows.length} 行</p>
                <button
                  onClick={() => downloadExcel(table)}
                  className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  下载 {table.name}.xlsx
                </button>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={downloadAllExcel}
              className="bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center mx-auto"
            >
              <Download className="h-5 w-5 mr-2" />
              下载所有Excel文件
            </button>
          </div>
        </div>
      )}

      {/* Excel转SQL结果 */}
      {convertDirection === 'excel-to-sql' && sqlOutput && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">生成的SQL语句：</h3>
            <div className="flex space-x-2">
              <button
                onClick={copySql}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                <Copy className="h-4 w-4 mr-2" />
                复制
              </button>
              <button
                onClick={downloadSql}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                下载
              </button>
            </div>
          </div>
          <textarea
            ref={sqlTextareaRef}
            value={sqlOutput}
            readOnly
            className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm bg-gray-50"
          />
        </div>
      )}

      {/* Excel数据预览 */}
      {excelData && Object.keys(excelData).length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Eye className="mr-2 h-5 w-5" />
            数据预览：
          </h3>
          {Object.keys(excelData).map(tableName => (
            <div key={tableName} className="mb-4">
              <h4 className="font-medium text-gray-700 mb-2">{tableName}</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      {excelData[tableName].headers && excelData[tableName].headers.map(column => (
                        <th key={column} className="px-4 py-2 text-left text-sm font-medium text-gray-700 border-b">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {excelData[tableName].rows && excelData[tableName].rows.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {excelData[tableName].headers.map(header => (
                          <td key={header} className="px-4 py-2 text-sm text-gray-600 border-b">
                            {row[header] !== null && row[header] !== undefined ? String(row[header]) : 'NULL'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {excelData[tableName].rows && excelData[tableName].rows.length > 5 && (
                  <p className="text-sm text-gray-500 mt-2">
                    ... 还有 {excelData[tableName].rows.length - 5} 行数据
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 使用说明 */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">使用说明：</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2">SQL → Excel 流程：</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>1. 上传包含INSERT语句的SQL文件</li>
              <li>2. 系统自动解析表结构和数据</li>
              <li>3. 为每个表生成Excel模板文件</li>
              <li>4. 下载Excel文件，填写数据</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Excel → SQL 流程：</h4>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>1. 上传填写好的Excel文件</li>
              <li>2. 配置SQL生成选项</li>
              <li>3. 系统生成INSERT语句</li>
              <li>4. 复制或下载SQL文件</li>
            </ul>
          </div>
        </div>
        <div className="mt-4">
          <h4 className="font-medium mb-2">Excel格式要求：</h4>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• 第一行必须是列标题</li>
            <li>• 空行将被自动忽略</li>
            <li>• 遇到"=== 示例数据 ==="行时停止读取</li>
            <li>• 支持NULL值、NOW()函数等特殊值</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SqlExcelBidirectionalConverter; 