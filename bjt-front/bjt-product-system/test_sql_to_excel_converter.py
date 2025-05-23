import unittest
import os
import pandas as pd
from sql_to_excel_converter import SQLExcelConverter, convert_sql_to_excel, convert_excel_to_sql

class TestSQLExcelConverter(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        self.test_dir = 'test_data'
        self.output_dir = 'test_output'
        
        # Create test directories
        os.makedirs(self.test_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Create test SQL file
        self.test_sql = os.path.join(self.test_dir, 'test.sql')
        with open(self.test_sql, 'w', encoding='utf-8') as f:
            f.write("""
            INSERT INTO `users` (`id`, `name`, `email`, `created_at`) VALUES
            (1, 'John Doe', 'john@example.com', NOW()),
            (2, 'Jane Smith', 'jane@example.com', '2024-01-01 12:00:00'),
            (3, 'Bob Johnson', 'bob@example.com', NULL);

            INSERT INTO `products` (`id`, `name`, `price`, `status`) VALUES
            (1, 'Product A', 99.99, 'active'),
            (2, 'Product B', 149.99, 'inactive'),
            (3, 'Product C', 199.99, 'active');
            """)
        
        # Create test Excel file
        self.test_excel = os.path.join(self.test_dir, 'test.xlsx')
        with pd.ExcelWriter(self.test_excel) as writer:
            # Users sheet
            users_df = pd.DataFrame({
                'id': [4, 5],
                'name': ['Test User 1', 'Test User 2'],
                'email': ['test1@example.com', 'test2@example.com'],
                'created_at': ['NOW()', '2024-01-02 12:00:00']
            })
            users_df.to_excel(writer, sheet_name='users', index=False)
            
            # Products sheet
            products_df = pd.DataFrame({
                'id': [4, 5],
                'name': ['Test Product 1', 'Test Product 2'],
                'price': [299.99, 399.99],
                'status': ['active', 'inactive']
            })
            products_df.to_excel(writer, sheet_name='products', index=False)

    def tearDown(self):
        """Clean up test files"""
        import shutil
        shutil.rmtree(self.test_dir)
        shutil.rmtree(self.output_dir)

    def test_sql_to_excel_conversion(self):
        """Test SQL to Excel conversion"""
        # Convert SQL to Excel
        result = convert_sql_to_excel(
            sql_dir=self.test_dir,
            output_dir=self.output_dir
        )
        
        # Verify output files exist
        self.assertTrue(os.path.exists(result['excel_path']))
        self.assertTrue(os.path.exists(result['import_script_path']))
        
        # Verify tables were parsed
        self.assertEqual(len(result['tables']), 2)
        self.assertIn('users', result['tables'])
        self.assertIn('products', result['tables'])
        
        # Verify Excel content
        excel_data = pd.read_excel(result['excel_path'], sheet_name=None)
        self.assertIn('users', excel_data)
        self.assertIn('products', excel_data)
        
        # Verify users table data
        users_df = excel_data['users']
        self.assertEqual(len(users_df.columns), 4)
        self.assertIn('id', users_df.columns)
        self.assertIn('name', users_df.columns)
        self.assertIn('email', users_df.columns)
        self.assertIn('created_at', users_df.columns)

    def test_excel_to_sql_conversion(self):
        """Test Excel to SQL conversion"""
        # Convert Excel to SQL
        result = convert_excel_to_sql(
            excel_path=self.test_excel,
            output_dir=self.output_dir,
            dialect='mysql',
            insert_format='multi-row',
            batch_size=1000,
            on_duplicate=True
        )
        
        # Verify output file exists
        self.assertTrue(os.path.exists(result['sql_path']))
        
        # Verify SQL content
        with open(result['sql_path'], 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Check for table names
        self.assertIn('INSERT INTO `users`', sql_content)
        self.assertIn('INSERT INTO `products`', sql_content)
        
        # Check for ON DUPLICATE KEY UPDATE
        self.assertIn('ON DUPLICATE KEY UPDATE', sql_content)
        
        # Check for NOW() function
        self.assertIn('NOW()', sql_content)

    def test_single_row_insert_format(self):
        """Test single-row INSERT format"""
        result = convert_excel_to_sql(
            excel_path=self.test_excel,
            output_dir=self.output_dir,
            dialect='mysql',
            insert_format='single-row',
            on_duplicate=True
        )
        
        with open(result['sql_path'], 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Check for single-row format
        self.assertNotIn('VALUES\n', sql_content)
        self.assertIn('VALUES (', sql_content)

    def test_postgresql_dialect(self):
        """Test PostgreSQL dialect"""
        result = convert_excel_to_sql(
            excel_path=self.test_excel,
            output_dir=self.output_dir,
            dialect='postgresql',
            insert_format='multi-row'
        )
        
        with open(result['sql_path'], 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Check for PostgreSQL-specific syntax
        self.assertIn('INSERT INTO "users"', sql_content)
        self.assertIn('INSERT INTO "products"', sql_content)

    def test_sqlite_dialect(self):
        """Test SQLite dialect"""
        result = convert_excel_to_sql(
            excel_path=self.test_excel,
            output_dir=self.output_dir,
            dialect='sqlite',
            insert_format='multi-row'
        )
        
        with open(result['sql_path'], 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Check for SQLite-specific syntax
        self.assertIn('INSERT INTO `users`', sql_content)
        self.assertIn('INSERT INTO `products`', sql_content)

    def test_batch_size(self):
        """Test batch size functionality"""
        # Create a larger test file
        large_excel = os.path.join(self.test_dir, 'large.xlsx')
        with pd.ExcelWriter(large_excel) as writer:
            # Create 1500 rows of data
            data = {
                'id': range(1, 1501),
                'name': [f'Test {i}' for i in range(1, 1501)],
                'value': [i * 1.1 for i in range(1, 1501)]
            }
            df = pd.DataFrame(data)
            df.to_excel(writer, sheet_name='test', index=False)
        
        # Convert with batch size of 500
        result = convert_excel_to_sql(
            excel_path=large_excel,
            output_dir=self.output_dir,
            batch_size=500
        )
        
        with open(result['sql_path'], 'r', encoding='utf-8') as f:
            sql_content = f.read()
            
        # Count the number of INSERT statements
        insert_count = sql_content.count('INSERT INTO')
        self.assertEqual(insert_count, 3)  # 1500 rows / 500 batch size = 3 batches

    def test_error_handling(self):
        """Test error handling"""
        # Test with non-existent SQL file
        with self.assertRaises(Exception):
            convert_sql_to_excel(
                sql_dir='non_existent_dir',
                output_dir=self.output_dir
            )
        
        # Test with invalid Excel file
        invalid_excel = os.path.join(self.test_dir, 'invalid.xlsx')
        with open(invalid_excel, 'w') as f:
            f.write('invalid content')
        
        with self.assertRaises(Exception):
            convert_excel_to_sql(
                excel_path=invalid_excel,
                output_dir=self.output_dir
            )

if __name__ == '__main__':
    unittest.main() 