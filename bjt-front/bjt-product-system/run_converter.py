#!/usr/bin/env python3
import os
import sys
import argparse
from sql_to_excel_converter import convert_sql_to_excel, convert_excel_to_sql

def main():
    parser = argparse.ArgumentParser(description='SQL-Excel Bidirectional Converter')
    parser.add_argument('--mode', choices=['sql-to-excel', 'excel-to-sql'], default='sql-to-excel',
                        help='Conversion mode (default: sql-to-excel)')
    parser.add_argument('--sql-dir', default='docker/dev/mysql',
                        help='Directory containing SQL files (default: docker/dev/mysql)')
    parser.add_argument('--excel-path', 
                        help='Path to Excel file for excel-to-sql mode')
    parser.add_argument('--output-dir', default='.',
                        help='Output directory (default: current directory)')
    parser.add_argument('--dialect', default='mysql', choices=['mysql', 'postgresql', 'sqlite'],
                        help='SQL dialect for excel-to-sql mode (default: mysql)')
    parser.add_argument('--insert-format', default='multi-row', choices=['multi-row', 'single-row'],
                        help='INSERT statement format for excel-to-sql mode (default: multi-row)')
    parser.add_argument('--batch-size', type=int, default=1000,
                        help='Batch size for multi-row INSERTs (default: 1000)')
    parser.add_argument('--on-duplicate', action='store_true',
                        help='Add ON DUPLICATE KEY UPDATE clause for excel-to-sql mode')
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    os.makedirs(args.output_dir, exist_ok=True)
    
    if args.mode == 'sql-to-excel':
        print(f"Converting SQL files from {args.sql_dir} to Excel template...")
        result = convert_sql_to_excel(args.sql_dir, args.output_dir)
        
        print("\nConversion completed successfully!")
        print(f"Excel template: {result['excel_path']}")
        print(f"Import script: {result['import_script_path']}")
        print(f"Tables processed: {', '.join(result['tables'])}")
        
        if result['warnings']:
            print("\nWarnings:")
            for warning in result['warnings']:
                print(f"  - {warning}")
    else:
        if not args.excel_path:
            print("Error: --excel-path is required for excel-to-sql mode")
            parser.print_help()
            sys.exit(1)
            
        if not os.path.exists(args.excel_path):
            print(f"Error: Excel file not found: {args.excel_path}")
            sys.exit(1)
            
        print(f"Converting Excel file {args.excel_path} to SQL...")
        result = convert_excel_to_sql(
            args.excel_path, 
            args.output_dir,
            args.dialect,
            args.insert_format,
            args.batch_size,
            args.on_duplicate
        )
        
        print("\nConversion completed successfully!")
        print(f"SQL file: {result['sql_path']}")

if __name__ == "__main__":
    main() 