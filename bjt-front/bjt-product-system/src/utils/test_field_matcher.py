import unittest
from field_matcher import HostFieldMatcher, DisplayPage, FieldSource, FieldDefinition

class TestHostFieldMatcher(unittest.TestCase):
    def setUp(self):
        self.matcher = HostFieldMatcher()

    def test_get_fields_by_page(self):
        # 测试获取选型页字段
        selection_fields = self.matcher.get_fields_by_page(DisplayPage.SELECTION)
        self.assertTrue(len(selection_fields) > 0)
        self.assertTrue(any(field.name == "产品图片" for field in selection_fields))
        self.assertTrue(any(field.name == "型号" for field in selection_fields))

        # 测试获取PO页字段
        po_fields = self.matcher.get_fields_by_page(DisplayPage.PO)
        self.assertTrue(len(po_fields) > 0)
        self.assertTrue(any(field.name == "Spec." for field in po_fields))
        self.assertTrue(any(field.name == "Spec.(英制)" for field in po_fields))

    def test_get_fields_by_source(self):
        # 测试获取CRM来源字段
        crm_fields = self.matcher.get_fields_by_source(FieldSource.CRM)
        self.assertTrue(len(crm_fields) > 0)
        self.assertTrue(all(field.source == FieldSource.CRM for field in crm_fields))

        # 测试获取型号表来源字段
        model_fields = self.matcher.get_fields_by_source(FieldSource.MODEL_TABLE)
        self.assertTrue(len(model_fields) > 0)
        self.assertTrue(all(field.source == FieldSource.MODEL_TABLE for field in model_fields))

    def test_get_required_fields(self):
        required_fields = self.matcher.get_required_fields()
        self.assertTrue(len(required_fields) > 0)
        self.assertTrue(all(field.is_required for field in required_fields))
        self.assertTrue(any(field.name == "产品图片" for field in required_fields))
        self.assertTrue(any(field.name == "型号" for field in required_fields))

    def test_get_field_by_name(self):
        # 测试获取存在的字段
        field = self.matcher.get_field_by_name("产品图片")
        self.assertIsNotNone(field)
        self.assertEqual(field.name, "产品图片")
        self.assertEqual(field.db_field, "image_url")

        # 测试获取不存在的字段
        field = self.matcher.get_field_by_name("不存在的字段")
        self.assertIsNone(field)

    def test_get_field_by_db_field(self):
        # 测试获取存在的字段
        field = self.matcher.get_field_by_db_field("image_url")
        self.assertIsNotNone(field)
        self.assertEqual(field.name, "产品图片")
        self.assertEqual(field.db_field, "image_url")

        # 测试获取不存在的字段
        field = self.matcher.get_field_by_db_field("non_existent_field")
        self.assertIsNone(field)

    def test_validate_field_value(self):
        # 测试必填字段验证
        field = self.matcher.get_field_by_name("产品图片")
        self.assertFalse(self.matcher.validate_field_value(field, None))
        self.assertTrue(self.matcher.validate_field_value(field, "http://example.com/image.jpg"))

        # 测试varchar字段长度验证
        field = self.matcher.get_field_by_name("型号")
        self.assertTrue(self.matcher.validate_field_value(field, "A" * 100))
        self.assertFalse(self.matcher.validate_field_value(field, "A" * 101))

        # 测试decimal字段验证
        field = self.matcher.get_field_by_name("单件净重")
        self.assertTrue(self.matcher.validate_field_value(field, "10.5"))
        self.assertFalse(self.matcher.validate_field_value(field, "not_a_number"))

        # 测试int字段验证
        field = self.matcher.get_field_by_name("单箱数量")
        self.assertTrue(self.matcher.validate_field_value(field, "10"))
        self.assertFalse(self.matcher.validate_field_value(field, "10.5"))

    def test_get_field_display_info(self):
        field = self.matcher.get_field_by_name("产品图片")
        display_info = self.matcher.get_field_display_info(field)
        
        self.assertEqual(display_info['name'], "产品图片")
        self.assertEqual(display_info['db_field'], "image_url")
        self.assertEqual(display_info['type'], "varchar(255)")
        self.assertEqual(display_info['source'], "各产品线型号表")
        self.assertTrue("选型页" in display_info['display_pages'])
        self.assertTrue("关系关联页" in display_info['display_pages'])
        self.assertEqual(display_info['description'], "产品图片URL")
        self.assertTrue(display_info['is_required'])
        self.assertIsNone(display_info['unit'])

if __name__ == '__main__':
    unittest.main() 