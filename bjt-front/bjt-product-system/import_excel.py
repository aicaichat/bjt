#!/usr/bin/env python3
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
    excel_path = input(f"Excel file path [{os.path.basename(r'./database_import_template.xlsx')}]: ") or r'./database_import_template.xlsx'
    
    try:
        # Read Excel file
        xl = pd.ExcelFile(excel_path)
        
        # Process each sheet (table)
        for sheet_name in xl.sheet_names:
            if sheet_name == '使用说明':
                continue
                
            print(f"
Processing table: {sheet_name}")
            
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
        print("
All data imported successfully!")
        
    except Exception as e:
        print(f"Error processing Excel file: {str(e)}")
    finally:
        if 'conn' in locals() and conn.is_connected():
            cursor.close()
            conn.close()
            print("Database connection closed.")

if __name__ == "__main__":
    main()
