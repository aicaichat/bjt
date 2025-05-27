# 导入导出组件使用指南

这套组件提供了通用的表格导入导出功能，可以轻松集成到任何列表页面。

## 🚀 快速开始

### 方案一：使用 TableWithImportExport（推荐）

最简单的使用方式，一个组件搞定表格+导入导出功能：

```tsx
import { TableWithImportExport } from '../components';

const MyPage = () => {
  const [data, setData] = useState([]);
  
  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '编码', dataIndex: 'code', key: 'code' },
  ];

  const exportColumns = [
    { title: '名称', dataIndex: 'name' },
    { title: '编码', dataIndex: 'code' },
  ];

  const handleImport = async (importData) => {
    // 处理导入数据
    for (const record of importData) {
      await api.create(record);
    }
    // 刷新数据
    fetchData();
  };

  return (
    <TableWithImportExport
      dataSource={data}
      columns={columns}
      rowKey="id"
      onAddClick={() => navigate('/create')}
      importExportConfig={{
        columns: exportColumns,
        exportFileName: '数据导出.csv',
        templateFileName: '导入模板.csv',
        onImportSuccess: handleImport,
        requiredFields: ['name', 'code'],
        validateRow: (row, index) => {
          const errors = [];
          if (!row.name) errors.push('缺少名称');
          return { valid: errors.length === 0, errors };
        }
      }}
      toolbarExtra={
        <Input.Search placeholder="搜索..." onSearch={handleSearch} />
      }
    />
  );
};
```

### 方案二：使用 TableImportExport 组件

适合需要自定义工具栏布局的场景：

```tsx
import { TableImportExport } from '../components';

const MyPage = () => {
  return (
    <div>
      {/* 自定义工具栏 */}
      <div className="toolbar">
        <Button onClick={handleAdd}>新增</Button>
        <TableImportExport
          data={data}
          columns={exportColumns}
          onImportSuccess={handleImport}
          className="ml-2"
        />
        <Input.Search placeholder="搜索..." />
      </div>
      
      {/* 表格 */}
      <Table dataSource={data} columns={columns} />
    </div>
  );
};
```

### 方案三：使用 useImportExport Hook

适合完全自定义UI的场景：

```tsx
import { useImportExport } from '../hooks/useImportExport';

const MyPage = () => {
  const {
    handleExport,
    showImportModal,
    modalVisible,
    hideImportModal,
    // ... 其他方法和状态
  } = useImportExport({
    data,
    columns: exportColumns,
    onImportSuccess: handleImport,
  });

  return (
    <div>
      <Button onClick={showImportModal}>导入</Button>
      <Button onClick={handleExport}>导出</Button>
      {/* 自定义模态框或其他UI */}
    </div>
  );
};
```

## 📋 配置参数

### 导入导出配置 (ImportExportConfig)

```tsx
interface ImportExportConfig<T> {
  // 必需参数
  data: T[];                    // 导出的数据
  columns: ExportColumn[];      // 列配置

  // 文件名配置
  exportFileName?: string;      // 导出文件名
  templateFileName?: string;    // 模板文件名

  // 导入配置
  onImportSuccess?: (data: T[]) => Promise<void> | void;  // 导入成功回调
  validateRow?: (row: any, rowIndex: number) => {         // 行验证函数
    valid: boolean;
    errors: string[];
  };

  // 高级配置
  fieldMapping?: { [key: string]: string };  // 字段映射
  requiredFields?: string[];                  // 必填字段
}
```

### 列配置 (ExportColumn)

```tsx
interface ExportColumn {
  title: string;              // 列标题
  dataIndex: string;          // 数据字段
  render?: (value: any, record: any) => string | number;  // 自定义渲染
}
```

## 🎯 高级用法

### 字段映射

CSV文件的列名与数据库字段不同时：

```tsx
{
  fieldMapping: {
    'code': 'model',        // CSV中的code列映射到数据的model字段
    'name_zh': 'title_zh'   // CSV中的name_zh列映射到数据的title_zh字段
  }
}
```

### 自定义验证

```tsx
{
  validateRow: (row, rowIndex) => {
    const errors = [];
    
    // 必填验证
    if (!row.name) errors.push('缺少名称');
    
    // 格式验证
    if (row.email && !isValidEmail(row.email)) {
      errors.push('邮箱格式错误');
    }
    
    // 业务逻辑验证
    if (row.status && !['active', 'inactive'].includes(row.status)) {
      errors.push('状态值无效');
    }
    
    return { valid: errors.length === 0, errors };
  }
}
```

### 自定义列渲染

```tsx
const exportColumns = [
  {
    title: '状态',
    dataIndex: 'status',
    render: (status) => status === 'publish' ? '已发布' : '草稿'
  },
  {
    title: '创建时间',
    dataIndex: 'created_at',
    render: (date) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  }
];
```

## 🔧 API 文档

### TableWithImportExport Props

继承自 Antd Table 的所有 props，额外添加：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| importExportConfig | ImportExportConfig | - | 导入导出配置 |
| showToolbar | boolean | true | 是否显示工具栏 |
| showAddButton | boolean | true | 是否显示新增按钮 |
| addButtonText | string | '新增' | 新增按钮文本 |
| onAddClick | () => void | - | 新增按钮点击回调 |
| toolbarExtra | ReactNode | - | 工具栏额外内容 |

### TableImportExport Props

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| showImport | boolean | true | 是否显示导入按钮 |
| showExport | boolean | true | 是否显示导出按钮 |
| buttonSize | 'small' \| 'middle' \| 'large' | 'middle' | 按钮大小 |
| buttonType | 'default' \| 'primary' \| 'text' \| 'link' | 'default' | 按钮类型 |
| importText | string | '导入' | 导入按钮文本 |
| exportText | string | '导出' | 导出按钮文本 |

## 🛠️ 开发指南

### 添加新的文件格式支持

当前支持 CSV 格式，如需支持 Excel：

1. 安装依赖：`npm install xlsx @types/xlsx`
2. 修改 `csv-utils.ts` 添加 Excel 解析功能
3. 更新 `ImportExportModal` 的文件类型限制

### 自定义样式

所有组件都支持 `className` 和 `style` props：

```tsx
<TableImportExport
  className="my-import-export"
  buttonType="primary"
  spacing="large"
/>
```

### 错误处理

组件内置了基本的错误处理，如需自定义：

```tsx
{
  onImportSuccess: async (data) => {
    try {
      await batchCreate(data);
      message.success('导入成功');
    } catch (error) {
      console.error('导入失败:', error);
      message.error('导入失败，请重试');
      throw error; // 重新抛出以阻止模态框关闭
    }
  }
}
``` 