import unittest
import os
import pandas as pd
from sql_to_excel_converter import SQLExcelConverter, convert_sql_to_excel, convert_excel_to_sql

class TestDBTablesConverter(unittest.TestCase):
    def setUp(self):
        """Set up test environment"""
        self.test_dir = 'test_data'
        self.output_dir = 'test_output'
        
        # Create test directories
        os.makedirs(self.test_dir, exist_ok=True)
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Create test SQL files for each table
        self.tables = {
            'product_lines': """
            INSERT INTO `wp_bjt_product_lines` 
            (`title_zh`, `title_en`, `description_zh`, `description_en`, 
            `subitem1_zh`, `subitem1_en`, `subitem2_zh`, `subitem2_en`, 
            `subitem3_zh`, `subitem3_en`, `image_url`, `code`, `status`, `sort_order`) VALUES
            ('气垫机', 'Air Cushion Machine', '高效防震气垫包装解决方案', 'Efficient air cushion packaging solution',
            '子项1中文', 'Subitem 1 EN', '子项2中文', 'Subitem 2 EN',
            '子项3中文', 'Subitem 3 EN', '/images/shop/LA-E4S.jpg', 'air_cushion', 'publish', 10),
            ('纸机', 'Paper Machine', '高质量纸包装系统', 'High-quality paper packaging system',
            '子项1中文', 'Subitem 1 EN', '子项2中文', 'Subitem 2 EN',
            '子项3中文', 'Subitem 3 EN', '/images/shop/ET2002.jpg', 'paper_machine', 'publish', 20);
            """,
            
            'shapes': """
            INSERT INTO `wp_bjt_shapes` 
            (`product_line_id`, `code`, `name_zh`, `name_en`, `image_url`, `status`, `sort_order`) VALUES
            (1, 'pillow', '平袋', 'Pillow', '/images/shop/MFB25.jpg', 'publish', 10),
            (1, 'bubble', '气泡袋', 'Bubble', '/images/shop/MEX.JPG', 'publish', 20);
            """,
            
            'materials': """
            INSERT INTO `wp_bjt_materials` 
            (`product_line_id`, `code`, `name_zh`, `name_en`, `base_material`, `status`, `sort_order`) VALUES
            (1, 'HDPE', '高密度聚乙烯', 'High-Density Polyethylene', 'PE', 'publish', 10),
            (1, 'LDPE', '低密度聚乙烯', 'Low-Density Polyethylene', 'PE', 'publish', 20);
            """,
            
            'specifications': """
            INSERT INTO `wp_bjt_specifications` 
            (`product_line_id`, `spec_type`, `metric_value`, `metric_unit`, 
            `imperial_value`, `imperial_unit`, `status`, `sort_order`) VALUES
            (1, 'thickness', 25.0, 'um', 1.0, 'mil', 'publish', 10),
            (1, 'width', 20.0, 'cm', 7.9, 'in', 'publish', 20),
            (1, 'length', 100.0, 'm', 328.1, 'ft', 'publish', 30),
            (1, 'weight', 120.0, 'gsm', 3.5, 'oz/yd²', 'publish', 40);
            """,
            
            'spare_part_models': """
            INSERT INTO `wp_bjt_spare_part_models` 
            (`product_line_id`, `model`, `title_zh`, `title_en`, 
            `description_zh`, `description_en`, `type`, 
            `image1_url`, `image2_url`, `explosion_diagram_pdf`, 
            `status`, `sort_order`) VALUES
            (1, 'SPR-100', '气泵皮膜', 'Pump Membrane', 
            '气垫机专用气泵皮膜', 'Pump membrane for air cushion machine', 'pump',
            '/images/shop/MPV.jpg', '/images/shop/MPV-2.jpg', '/docs/explosion/SPR-100.pdf',
            'publish', 10),
            (1, 'SPR-200', '加热丝', 'Heating Wire',
            '气垫机专用加热丝', 'Heating wire for air cushion machine', 'heating',
            '/images/shop/LA-F2.jpg', '/images/shop/LA-F2-2.jpg', '/docs/explosion/SPR-200.pdf',
            'publish', 20);
            """
        }
        
        # Create SQL files for each table
        for table_name, sql_content in self.tables.items():
            sql_file = os.path.join(self.test_dir, f'{table_name}.sql')
            with open(sql_file, 'w', encoding='utf-8') as f:
                f.write(sql_content)

    def tearDown(self):
        """Clean up test files"""
        import shutil
        shutil.rmtree(self.test_dir)
        shutil.rmtree(self.output_dir)

    def test_generate_excel_templates(self):
        """Test generating Excel templates for all tables"""
        # Convert SQL to Excel for each table
        for table_name in self.tables.keys():
            result = convert_sql_to_excel(
                sql_dir=self.test_dir,
                output_dir=self.output_dir
            )
            
            # Verify output files exist
            self.assertTrue(os.path.exists(result['excel_path']))
            self.assertTrue(os.path.exists(result['import_script_path']))
            
            # Verify Excel content
            excel_data = pd.read_excel(result['excel_path'], sheet_name=None)
            
            # Check if the table sheet exists
            self.assertIn(table_name, excel_data)
            
            # Verify the table data
            df = excel_data[table_name]
            self.assertGreater(len(df.columns), 0)
            
            print(f"\nGenerated Excel template for {table_name}:")
            print(f"Excel file: {result['excel_path']}")
            print(f"Import script: {result['import_script_path']}")
            print(f"Columns: {', '.join(df.columns)}")

    def test_convert_excel_to_sql(self):
        """Test converting Excel back to SQL"""
        # First generate Excel templates
        for table_name in self.tables.keys():
            # Convert SQL to Excel
            excel_result = convert_sql_to_excel(
                sql_dir=self.test_dir,
                output_dir=self.output_dir
            )
            
            # Convert Excel back to SQL
            sql_result = convert_excel_to_sql(
                excel_path=excel_result['excel_path'],
                output_dir=self.output_dir,
                dialect='mysql',
                insert_format='multi-row',
                batch_size=1000,
                on_duplicate=True
            )
            
            # Verify SQL file exists
            self.assertTrue(os.path.exists(sql_result['sql_path']))
            
            # Read and verify SQL content
            with open(sql_result['sql_path'], 'r', encoding='utf-8') as f:
                sql_content = f.read()
                
            # Verify table name in SQL
            self.assertIn(f'INSERT INTO `{table_name}`', sql_content)
            
            print(f"\nConverted Excel back to SQL for {table_name}:")
            print(f"SQL file: {sql_result['sql_path']}")

if __name__ == '__main__':
    unittest.main() 