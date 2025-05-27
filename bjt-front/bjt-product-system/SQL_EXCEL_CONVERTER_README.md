# SQL-Excel 双向转换工具

这是一个功能强大的双向转换工具，可以在SQL文件和Excel文件之间进行转换。该工具支持将SQL INSERT语句转换为Excel模板，以及将填写好的Excel数据转换回SQL INSERT语句。

## 功能特点

### SQL → Excel 转换
- 解析SQL文件中的INSERT语句，提取表结构和示例数据
- 为每个表生成Excel工作表，包含列名和示例数据
- 提供空行供用户填写数据
- 自动生成导入脚本，方便将Excel数据导入到数据库

### Excel → SQL 转换
- 读取Excel文件中的数据，生成SQL INSERT语句
- 支持多种SQL方言（MySQL、PostgreSQL、SQLite）
- 支持单行INSERT和多行INSERT格式
- 支持ON DUPLICATE KEY UPDATE选项
- 智能处理数据类型和特殊值（NULL、NOW()等）

## 安装要求

- Python 3.6+
- pandas
- openpyxl
- mysql-connector-python（用于导入脚本）

安装依赖：

```bash
pip install pandas openpyxl mysql-connector-python
```

## 使用方法

### 命令行使用

#### SQL转Excel

```bash
python run_converter.py --mode sql-to-excel --sql-dir path/to/sql/files --output-dir path/to/output
```

#### Excel转SQL

```bash
python run_converter.py --mode excel-to-sql --excel-path path/to/excel/file.xlsx --output-dir path/to/output --dialect mysql --insert-format multi-row --batch-size 1000 --on-duplicate
```

### 参数说明

- `--mode`: 转换模式，可选 `sql-to-excel` 或 `excel-to-sql`，默认为 `sql-to-excel`
- `--sql-dir`: SQL文件目录，默认为 `docker/dev/mysql`
- `--excel-path`: Excel文件路径（Excel转SQL模式必需）
- `--output-dir`: 输出目录，默认为当前目录
- `--dialect`: SQL方言，可选 `mysql`、`postgresql` 或 `sqlite`，默认为 `mysql`
- `--insert-format`: INSERT语句格式，可选 `multi-row` 或 `single-row`，默认为 `multi-row`
- `--batch-size`: 多行INSERT的批次大小，默认为 1000
- `--on-duplicate`: 添加ON DUPLICATE KEY UPDATE子句（仅适用于MySQL）

### 通过Web界面使用

本工具也提供了一个React组件 `SqlExcelBidirectionalConverter`，可以集成到您的Web应用中，提供友好的用户界面。

```jsx
import SqlExcelBidirectionalConverter from './SqlExcelBidirectionalConverter';

function App() {
  return (
    <div className="App">
      <SqlExcelBidirectionalConverter />
    </div>
  );
}
```

## Excel模板格式

生成的Excel模板包含以下内容：

- 使用说明工作表：包含使用指南和注意事项
- 每个表对应一个工作表：
  - 第1行：列名（字段名）
  - 第2-6行：空行，供用户填写数据
  - 第7行：分隔行，标记示例数据开始
  - 第8行及以后：示例数据，仅供参考

## 导入脚本使用

SQL转Excel模式会生成一个导入脚本 `import_excel.py`，用于将Excel数据导入到数据库：

```bash
python import_excel.py
```

脚本会提示您输入数据库连接信息和Excel文件路径，然后将数据导入到指定的数据库中。

## 注意事项

- Excel转SQL时，只会处理每个工作表的前5行数据（用户填写区域）
- 空行会被自动忽略
- 支持的特殊值：NULL、NOW()、CURRENT_TIMESTAMP
- 字符串中的单引号会被自动转义

## 示例

### SQL转Excel示例

```bash
python run_converter.py
```

这将处理 `docker/dev/mysql` 目录中的所有SQL文件，并生成 `database_import_template.xlsx` 和 `import_excel.py`。

### Excel转SQL示例

```bash
python run_converter.py --mode excel-to-sql --excel-path database_import_template.xlsx
```

这将读取 `database_import_template.xlsx` 文件，并生成 `generated_inserts.sql`。

## 故障排除

- 如果遇到编码问题，请确保SQL文件使用UTF-8编码
- 如果Excel文件包含大量数据，可能需要增加内存限制：`export PYTHONMEM=4G`
- 如果生成的SQL文件过大，可以尝试减小批次大小：`--batch-size 100`

## 许可证

MIT 