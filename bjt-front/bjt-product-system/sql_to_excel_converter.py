import re
import os
import pandas as pd
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
import sys
import json


class SQLExcelConverter:
    def __init__(self, sql_dir=None, output_dir=None):
        self.sql_dir = sql_dir or os.path.join(os.getcwd(), 'docker', 'dev', 'mysql')
        self.output_dir = output_dir or os.getcwd()
        self.tables = {}
        self.warnings = []
        
    def parse_sql_files(self, file_paths=None):
        """Parse SQL files and extract table structures and data"""
        if file_paths is None:
            # Use all SQL files in the directory
            file_paths = [os.path.join(self.sql_dir, f) for f in os.listdir(self.sql_dir) 
                         if f.endswith('.sql')]
        
        for file_path in file_paths:
            self._parse_sql_file(file_path)
            
        print(f"Successfully parsed {len(self.tables)} tables from SQL files.")
        return self.tables
    
    def _parse_sql_file(self, file_path):
        """Parse a single SQL file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                sql_content = f.read()
                
            # Extract INSERT statements
            insert_pattern = r'INSERT\s+INTO\s+`?(\w+)`?\s*\((.*?)\)\s*VALUES\s*([\s\S]*?)(?=INSERT|$|;)'
            matches = re.finditer(insert_pattern, sql_content, re.IGNORECASE)
            
            for match in matches:
                table_name = match.group(1)
                columns_str = match.group(2)
                values_str = match.group(3)
                
                # Parse columns
                columns = [col.strip().replace('`', '') for col in columns_str.split(',')]
                
                # Parse values
                values_pattern = r'\((.*?)\)'
                values_matches = re.finditer(values_pattern, values_str)
                rows = []
                
                for val_match in values_matches:
                    val_str = val_match.group(1)
                    # Split by comma but respect quoted strings
                    values = []
                    current_value = ""
                    in_quote = False
                    quote_char = None
                    
                    for char in val_str + ',':  # Add comma to process the last value
                        if char in ["'", '"'] and (not in_quote or char == quote_char):
                            in_quote = not in_quote
                            if in_quote:
                                quote_char = char
                            else:
                                quote_char = None
                            current_value += char
                        elif char == ',' and not in_quote:
                            values.append(current_value.strip())
                            current_value = ""
                        else:
                            current_value += char
                    
                    # Clean up values
                    cleaned_values = []
                    for val in values:
                        val = val.strip()
                        if val.upper() == 'NULL':
                            cleaned_values.append(None)
                        elif val.upper() == 'NOW()':
                            cleaned_values.append('NOW()')
                        elif (val.startswith("'") and val.endswith("'")) or (val.startswith('"') and val.endswith('"')):
                            cleaned_values.append(val[1:-1])
                        else:
                            cleaned_values.append(val)
                    
                    if len(cleaned_values) != len(columns):
                        self.warnings.append(f"Warning: Column count mismatch in table {table_name}. Expected {len(columns)}, got {len(cleaned_values)}.")
                        # Skip this row if column count doesn't match
                        continue
                        
                    rows.append(cleaned_values)
                
                # Add or update table data
                if table_name not in self.tables:
                    self.tables[table_name] = {
                        'columns': columns,
                        'rows': rows
                    }
                else:
                    self.tables[table_name]['rows'].extend(rows)
                    
        except Exception as e:
            print(f"Error parsing SQL file {file_path}: {str(e)}")
            raise
    
    def generate_excel_template(self, output_path=None):
        """Generate Excel template with sheets for each table"""
        if not self.tables:
            raise ValueError("No tables parsed. Please parse SQL files first.")
        
        if output_path is None:
            output_path = os.path.join(self.output_dir, 'database_import_template.xlsx')
        
        # Create a new workbook
        wb = Workbook()
        
        # Remove the default sheet
        default_sheet = wb.active
        wb.remove(default_sheet)
        
        # Add instructions sheet
        self._add_instructions_sheet(wb)
        
        # Add sheets for each table
        for table_name, table_data in self.tables.items():
            self._add_table_sheet(wb, table_name, table_data)
        
        # Save the workbook
        wb.save(output_path)
        print(f"Excel template generated at: {output_path}")
        return output_path
    
    def _add_instructions_sheet(self, workbook):
        """Add instructions sheet to the workbook"""
        ws = workbook.create_sheet("使用说明")
        
        # Set column widths
        ws.column_dimensions['A'].width = 100
        
        # Title
        ws['A1'] = "数据库导入模板使用说明"
        ws['A1'].font = Font(bold=True, size=16)
        
        # Instructions
        instructions = [
            "",
            "1. 本Excel文件包含多个工作表，每个工作表对应一个数据库表。",
            "2. 每个工作表的第一行是列名，对应数据库表的字段名。",
            "3. 第2-6行是留给用户填写数据的空行。",
            "4. 第8行开始是示例数据，仅供参考，不会被导入。",
            "5. 填写数据时，请遵循以下规则：",
            "   - 数字类型直接填写数字，不需要引号",
            "   - 字符串类型直接填写文本，不需要引号",
            "   - 日期类型请使用YYYY-MM-DD格式",
            "   - 日期时间类型请使用YYYY-MM-DD HH:MM:SS格式",
            "   - 空值请留空或填写NULL",
            "   - 如需使用数据库函数如NOW()，请直接填写函数名",
            "",
            "6. 填写完毕后，使用导入脚本将数据导入数据库。",
            "",
            "注意：请不要修改表格的结构，包括列名和格式。"
        ]
        
        for i, text in enumerate(instructions):
            ws[f'A{i+2}'] = text
            if text.startswith("   -"):
                ws[f'A{i+2}'].font = Font(italic=True)
            elif not text:
                continue
            elif text[0].isdigit():
                ws[f'A{i+2}'].font = Font(bold=True)
        
        return ws
    
    def _add_table_sheet(self, workbook, table_name, table_data):
        """Add a sheet for the table to the workbook"""
        ws = workbook.create_sheet(table_name)
        
        columns = table_data['columns']
        rows = table_data['rows']
        
        # Set column widths
        for i, col in enumerate(columns):
            col_letter = get_column_letter(i + 1)
            ws.column_dimensions[col_letter].width = max(15, min(30, len(col) + 5))
        
        # Header row
        header_fill = PatternFill(start_color="DDEBF7", end_color="DDEBF7", fill_type="solid")
        header_font = Font(bold=True)
        header_border = Border(
            bottom=Side(style='medium'),
            top=Side(style='thin'),
            left=Side(style='thin'),
            right=Side(style='thin')
        )
        
        for i, col in enumerate(columns):
            cell = ws.cell(row=1, column=i+1, value=col)
            cell.fill = header_fill
            cell.font = header_font
            cell.border = header_border
            cell.alignment = Alignment(horizontal='center', vertical='center')
        
        # Empty rows for data entry
        data_border = Border(
            bottom=Side(style='thin'),
            top=Side(style='thin'),
            left=Side(style='thin'),
            right=Side(style='thin')
        )
        
        for row_idx in range(2, 7):
            for col_idx in range(1, len(columns) + 1):
                cell = ws.cell(row=row_idx, column=col_idx, value="")
                cell.border = data_border
        
        # Separator row
        ws.cell(row=7, column=1, value="=== 示例数据 ===")
        ws.merge_cells(start_row=7, start_column=1, end_row=7, end_column=len(columns))
        ws.cell(row=7, column=1).alignment = Alignment(horizontal='center')
        ws.cell(row=7, column=1).font = Font(bold=True, italic=True)
        ws.cell(row=7, column=1).fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
        
        # Example data rows
        example_fill = PatternFill(start_color="F2F2F2", end_color="F2F2F2", fill_type="solid")
        example_border = Border(
            bottom=Side(style='thin'),
            top=Side(style='thin'),
            left=Side(style='thin'),
            right=Side(style='thin')
        )
        
        for row_idx, row_data in enumerate(rows[:5], start=8):
            for col_idx, value in enumerate(row_data, start=1):
                cell = ws.cell(row=row_idx, column=col_idx, value=value)
                cell.fill = example_fill
                cell.border = example_border
        
        return ws
    
    def generate_import_script(self, excel_path=None, output_path=None):
        """Generate Python script to import data from Excel to database"""
        if excel_path is None:
            excel_path = os.path.join(self.output_dir, 'database_import_template.xlsx')
        
        if output_path is None:
            output_path = os.path.join(self.output_dir, 'import_excel.py')
        
        script_content = """#!/usr/bin/env python3
import os
import pandas as pd
import mysql.connector
import getpass
import sys

def main():
    # Get database connection info
    print("=== Database Import Tool ===")
    host = input("Database host [localhost]: ") or "localhost"
    port = input("Database port [3306]: ") or "3306"
    user = input("Database user [root]: ") or "root"
    password = getpass.getpass("Database password: ")
    database = input("Database name: ")
    
    if not database:
        print("Error: Database name is required.")
        sys.exit(1)
    
    # Connect to database
    try:
        conn = mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        print(f"Connected to database {database} on {host}:{port}")
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        sys.exit(1)
    
    # Get Excel file path
    excel_path = input(f"Excel file path [{os.path.basename(r'__EXCEL_PATH__')}]: ") or r'__EXCEL_PATH__'
    
    try:
        # Read Excel file
        xl = pd.ExcelFile(excel_path)
        
        # Process each sheet (table)
        for sheet_name in xl.sheet_names:
            if sheet_name == '使用说明':
                continue
                
            print(f"\nProcessing table: {sheet_name}")
            
            # Read sheet data
            df = pd.read_excel(excel_path, sheet_name=sheet_name)
            
            # Get only the first 5 rows (user data)
            df = df.iloc[:5]
            
            # Remove empty rows
            df = df.dropna(how='all')
            
            if df.empty:
                print(f"No data to import for table {sheet_name}")
                continue
            
            # Process each row
            for _, row in df.iterrows():
                # Replace NaN with None
                values = [None if pd.isna(val) else val for val in row]
                
                # Generate placeholders
                placeholders = ", ".join(["%s"] * len(values))
                
                # Generate column names
                columns = ", ".join([f"`{col}`" for col in df.columns])
                
                # Generate SQL
                sql = f"INSERT INTO `{sheet_name}` ({columns}) VALUES ({placeholders})"
                
                try:
                    cursor.execute(sql, values)
                    print(f"Inserted row into {sheet_name}")
                except Exception as e:
                    print(f"Error inserting row into {sheet_name}: {str(e)}")
        
        # Commit changes
        conn.commit()
        print("\nAll data imported successfully!")
        
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    main()
"""
        
        # Replace placeholder with actual Excel path
        script_content = script_content.replace('__EXCEL_PATH__', excel_path)
        
        # Write script to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        # Make script executable
        os.chmod(output_path, 0o755)
        
        print(f"Import script generated at: {output_path}")
        return output_path

    def excel_to_sql(self, excel_path, output_path=None, dialect='mysql', insert_format='multi-row', batch_size=1000, on_duplicate=False):
        """Convert Excel file to SQL INSERT statements"""
        if output_path is None:
            output_path = os.path.join(self.output_dir, 'generated_inserts.sql')
        
        # Read Excel file
        xl = pd.ExcelFile(excel_path)
        
        sql_statements = []
        tables = []
        
        # Add header comments
        sql_statements.append(f"-- Generated SQL from Excel")
        sql_statements.append(f"-- Date: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}")
        sql_statements.append(f"-- Format: {insert_format}")
        sql_statements.append(f"-- Dialect: {dialect.upper()}")
        sql_statements.append("")
        
        # Process each sheet (table)
        for sheet_name in xl.sheet_names:
            if sheet_name == '使用说明':
                continue
                
            tables.append(sheet_name)
            
            # Read sheet data
            df = pd.read_excel(excel_path, sheet_name=sheet_name)
            
            # Get only the first 5 rows (user data)
            df = df.iloc[:5]
            
            # Remove empty rows
            df = df.dropna(how='all')
            
            if df.empty:
                continue
            
            # Generate column list
            columns = [f"`{col}`" for col in df.columns]
            column_list = ", ".join(columns)
            
            if insert_format == 'single-row':
                # Generate single-row INSERT statements
                for _, row in df.iterrows():
                    values = []
                    for val in row:
                        if pd.isna(val):
                            values.append("NULL")
                        elif isinstance(val, str) and val.upper() == "NULL":
                            values.append("NULL")
                        elif isinstance(val, str) and (val.upper() == "NOW()" or val.upper() == "CURRENT_TIMESTAMP"):
                            values.append(val.upper())
                        elif isinstance(val, (int, float)):
                            values.append(str(val))
                        else:
                            # Escape single quotes
                            escaped_val = str(val).replace("'", "''")
                            values.append(f"'{escaped_val}'")
                    
                    value_list = ", ".join(values)
                    sql_statements.append(f"INSERT INTO `{sheet_name}` ({column_list}) VALUES ({value_list});")
            else:
                # Generate multi-row INSERT statements
                rows = []
                for _, row in df.iterrows():
                    values = []
                    for val in row:
                        if pd.isna(val):
                            values.append("NULL")
                        elif isinstance(val, str) and val.upper() == "NULL":
                            values.append("NULL")
                        elif isinstance(val, str) and (val.upper() == "NOW()" or val.upper() == "CURRENT_TIMESTAMP"):
                            values.append(val.upper())
                        elif isinstance(val, (int, float)):
                            values.append(str(val))
                        else:
                            # Escape single quotes
                            escaped_val = str(val).replace("'", "''")
                            values.append(f"'{escaped_val}'")
                    
                    rows.append(f"  ({', '.join(values)})")
                
                # Split into batches
                for i in range(0, len(rows), batch_size):
                    batch = rows[i:i+batch_size]
                    values_list = ",\n".join(batch)
                    
                    sql = f"INSERT INTO `{sheet_name}` ({column_list}) VALUES\n{values_list}"
                    
                    # Add ON DUPLICATE KEY UPDATE if requested
                    if on_duplicate:
                        update_list = []
                        for col in df.columns:
                            if col.lower() != 'id':
                                update_list.append(f"`{col}` = VALUES(`{col}`)")
                        
                        if update_list:
                            sql += "\nON DUPLICATE KEY UPDATE\n  " + ",\n  ".join(update_list)
                    
                    sql += ";"
                    sql_statements.append(sql)
        
        # Update header with tables
        sql_statements[2] = f"-- Tables: {', '.join(tables)}"
        
        # Write SQL to file
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(sql_statements))
        
        print(f"SQL file generated at: {output_path}")
        return output_path

def convert_sql_to_excel(sql_dir=None, output_dir=None):
    """Convert SQL files to Excel template"""
    converter = SQLExcelConverter(sql_dir, output_dir)
    converter.parse_sql_files()
    excel_path = converter.generate_excel_template()
    import_script_path = converter.generate_import_script(excel_path)
    
    if converter.warnings:
        print("\nWarnings:")
        for warning in converter.warnings:
            print(warning)
    
    return {
        'excel_path': excel_path,
        'import_script_path': import_script_path,
        'tables': list(converter.tables.keys()),
        'warnings': converter.warnings
    }

def convert_excel_to_sql(excel_path, output_dir=None, dialect='mysql', insert_format='multi-row', batch_size=1000, on_duplicate=False):
    """Convert Excel file to SQL INSERT statements"""
    converter = SQLExcelConverter(output_dir=output_dir)
    sql_path = converter.excel_to_sql(excel_path, dialect=dialect, insert_format=insert_format, 
                                     batch_size=batch_size, on_duplicate=on_duplicate)
    
    return {
        'sql_path': sql_path
    }

if __name__ == "__main__":
    # Command line interface
    import argparse
    
    parser = argparse.ArgumentParser(description='Convert between SQL and Excel')
    parser.add_argument('--mode', choices=['sql-to-excel', 'excel-to-sql'], required=True,
                        help='Conversion mode')
    parser.add_argument('--sql-dir', help='Directory containing SQL files')
    parser.add_argument('--excel-path', help='Path to Excel file')
    parser.add_argument('--output-dir', help='Output directory')
    parser.add_argument('--dialect', default='mysql', choices=['mysql', 'postgresql', 'sqlite'],
                        help='SQL dialect')
    parser.add_argument('--insert-format', default='multi-row', choices=['multi-row', 'single-row'],
                        help='INSERT statement format')
    parser.add_argument('--batch-size', type=int, default=1000,
                        help='Batch size for multi-row INSERTs')
    parser.add_argument('--on-duplicate', action='store_true',
                        help='Add ON DUPLICATE KEY UPDATE clause')
    
    args = parser.parse_args()
    
    if args.mode == 'sql-to-excel':
        result = convert_sql_to_excel(args.sql_dir, args.output_dir)
        print(f"\nConversion completed:")
        print(f"Excel template: {result['excel_path']}")
        print(f"Import script: {result['import_script_path']}")
        print(f"Tables: {', '.join(result['tables'])}")
    else:
        if not args.excel_path:
            parser.error("--excel-path is required for excel-to-sql mode")
        
        result = convert_excel_to_sql(args.excel_path, args.output_dir, args.dialect,
                                     args.insert_format, args.batch_size, args.on_duplicate)
        print(f"\nConversion completed:")
        print(f"SQL file: {result['sql_path']}") 