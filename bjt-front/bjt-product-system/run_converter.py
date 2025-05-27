#!/usr/bin/env python3
import os
import sys
import argparse
from sql_to_excel_converter import convert_sql_to_excel, convert_excel_to_sql

def main():
    parser = argparse.ArgumentParser(
        description='【SQL-Excel 双向转换工具】\n'
                    '支持将标准化 SQL 文件批量转为 Excel 模板，或将 Excel 数据批量转为 SQL 插入语句。\n'
                    '适用于数据初始化、批量导入、数据模板生成等场景。',
        formatter_class=argparse.RawTextHelpFormatter
    )
    parser.add_argument('--mode', choices=['sql-to-excel', 'excel-to-sql'], default='sql-to-excel',
                        help='转换模式：\n'
                             '  sql-to-excel  - 将 SQL 文件批量转为 Excel 模板（默认）\n'
                             '  excel-to-sql  - 将 Excel 文件批量转为 SQL 插入语句')
    parser.add_argument('--sql-dir', default='docker/dev/mysql',
                        help='SQL 文件目录（仅 sql-to-excel 模式需要），默认：docker/dev/mysql')
    parser.add_argument('--excel-path', 
                        help='Excel 文件路径（仅 excel-to-sql 模式需要）')
    parser.add_argument('--output-dir', default='.',
                        help='输出目录，默认：当前目录')
    parser.add_argument('--dialect', default='mysql', choices=['mysql', 'postgresql', 'sqlite'],
                        help='目标 SQL 方言（仅 excel-to-sql 模式需要），默认：mysql')
    parser.add_argument('--insert-format', default='multi-row', choices=['multi-row', 'single-row'],
                        help='生成 INSERT 语句格式（仅 excel-to-sql 模式）：\n'
                             '  multi-row   - 多行批量插入（推荐，默认）\n'
                             '  single-row  - 每行一条 INSERT')
    parser.add_argument('--batch-size', type=int, default=1000,
                        help='每个多行 INSERT 的最大行数（仅 multi-row 格式下有效），默认：1000')
    parser.add_argument('--on-duplicate', action='store_true',
                        help='生成 ON DUPLICATE KEY UPDATE 子句（仅 excel-to-sql 模式）')
    
    args = parser.parse_args()
    
    # 输出更清晰的操作提示
    print("========== SQL-Excel 双向转换工具 ==========")
    print(f"当前模式：{args.mode}")
    print(f"输出目录：{os.path.abspath(args.output_dir)}")
    print("===========================================")
    
    os.makedirs(args.output_dir, exist_ok=True)
    
    if args.mode == 'sql-to-excel':
        print(f"\n【SQL → Excel】正在批量转换 SQL 文件（目录：{args.sql_dir}）为 Excel 模板 ...")
        result = convert_sql_to_excel(args.sql_dir, args.output_dir)
        print("\n✅ 转换完成！")
        print(f"Excel 模板文件：{result['excel_path']}")
        print(f"SQL 导入脚本：{result['import_script_path']}")
        print(f"处理表：{', '.join(result['tables'])}")
        if result['warnings']:
            print("\n⚠️  警告：")
            for warning in result['warnings']:
                print(f"  - {warning}")
    else:
        if not args.excel_path:
            print("❌ 错误：excel-to-sql 模式下必须指定 --excel-path")
            parser.print_help()
            sys.exit(1)
        if not os.path.exists(args.excel_path):
            print(f"❌ 错误：未找到 Excel 文件：{args.excel_path}")
            sys.exit(1)
        print(f"\n【Excel → SQL】正在批量转换 Excel 文件（{args.excel_path}）为 SQL 插入语句 ...")
        result = convert_excel_to_sql(
            args.excel_path, 
            args.output_dir,
            args.dialect,
            args.insert_format,
            args.batch_size,
            args.on_duplicate
        )
        print("\n✅ 转换完成！")
        print(f"SQL 文件：{result['sql_path']}")
        print(f"INSERT 语句格式：{args.insert_format}，每批 {args.batch_size} 行")
        if args.on_duplicate:
            print("已启用 ON DUPLICATE KEY UPDATE 子句")

if __name__ == "__main__":
    main() 