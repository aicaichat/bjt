import unittest
from decimal import Decimal
from field_converter import FieldConverter
from field_matcher import HostFieldMatcher, FieldDefinition

class TestFieldConverter(unittest.TestCase):
    def setUp(self):
        self.converter = FieldConverter()
        self.matcher = HostFieldMatcher()

    def test_convert_value(self):
        # 测试varchar类型转换
        field = self.matcher.get_field_by_name("产品图片")
        self.assertEqual(self.converter.convert_value(field, "test.jpg"), "test.jpg")
        self.assertEqual(self.converter.convert_value(field, 123), "123")
        self.assertIsNone(self.converter.convert_value(field, None))

        # 测试decimal类型转换
        field = self.matcher.get_field_by_name("单件净重")
        self.assertEqual(self.converter.convert_value(field, "10.5"), Decimal("10.5"))
        self.assertEqual(self.converter.convert_value(field, 10.5), Decimal("10.5"))
        self.assertIsNone(self.converter.convert_value(field, "not_a_number"))

        # 测试int类型转换
        field = self.matcher.get_field_by_name("单箱数量")
        self.assertEqual(self.converter.convert_value(field, "10"), 10)
        self.assertEqual(self.converter.convert_value(field, 10.5), 10)
        self.assertIsNone(self.converter.convert_value(field, "not_a_number"))

    def test_format_value(self):
        # 测试decimal类型格式化
        field = self.matcher.get_field_by_name("单件净重")
        self.assertEqual(self.converter.format_value(field, Decimal("10.5")), "10.50")
        self.assertEqual(self.converter.format_value(field, None), "")

        # 测试其他类型格式化
        field = self.matcher.get_field_by_name("产品图片")
        self.assertEqual(self.converter.format_value(field, "test.jpg"), "test.jpg")
        self.assertEqual(self.converter.format_value(field, None), "")

    def test_add_unit(self):
        # 测试添加单位
        self.assertEqual(self.converter.add_unit("10.5", "kg"), "10.5 kg")
        self.assertEqual(self.converter.add_unit("", "kg"), "")
        self.assertEqual(self.converter.add_unit("10.5", None), "10.5")
        self.assertEqual(self.converter.add_unit(None, "kg"), None)

    def test_parse_size(self):
        # 测试尺寸解析
        size_str = "50.0x50.0x38.0"
        expected = {'length': 50.0, 'width': 50.0, 'height': 38.0}
        self.assertEqual(self.converter.parse_size(size_str), expected)

        # 测试无效尺寸
        self.assertEqual(self.converter.parse_size(""), {})
        self.assertEqual(self.converter.parse_size("invalid"), {})
        self.assertEqual(self.converter.parse_size("50.0x50.0"), {'length': 50.0, 'width': 50.0, 'height': 0})

    def test_format_size(self):
        # 测试尺寸格式化
        dimensions = {'length': 50.0, 'width': 50.0, 'height': 38.0}
        self.assertEqual(self.converter.format_size(dimensions, "cm"), "50.0x50.0x38.0 cm")
        self.assertEqual(self.converter.format_size({}, "cm"), "")

    def test_unit_conversion(self):
        # 测试公制转英制
        self.assertAlmostEqual(self.converter.convert_metric_to_imperial(100, 'length'), 39.37, places=2)
        self.assertAlmostEqual(self.converter.convert_metric_to_imperial(100, 'weight'), 220.46, places=2)

        # 测试英制转公制
        self.assertAlmostEqual(self.converter.convert_imperial_to_metric(39.37, 'length'), 100, places=2)
        self.assertAlmostEqual(self.converter.convert_imperial_to_metric(220.46, 'weight'), 100, places=2)

    def test_validate_numeric_range(self):
        # 测试数值范围验证
        self.assertTrue(self.converter.validate_numeric_range(5, 0, 10))
        self.assertFalse(self.converter.validate_numeric_range(5, 6, 10))
        self.assertFalse(self.converter.validate_numeric_range(5, 0, 4))
        self.assertTrue(self.converter.validate_numeric_range(5))

    def test_validate_string_pattern(self):
        # 测试字符串模式验证
        self.assertTrue(self.converter.validate_string_pattern("test.jpg", r"^[\w\.]+$"))
        self.assertFalse(self.converter.validate_string_pattern("test*.jpg", r"^[\w\.]+$"))
        self.assertTrue(self.converter.validate_string_pattern("", r"^[\w\.]+$"))
        self.assertTrue(self.converter.validate_string_pattern("test.jpg", ""))

    def test_format_currency(self):
        # 测试货币格式化
        self.assertEqual(self.converter.format_currency(1000.5, "USD"), "$1,000.50")
        self.assertEqual(self.converter.format_currency(1000.5, "CNY"), "¥1,000.50")
        self.assertEqual(self.converter.format_currency(1000.5, "EUR"), "1,000.50 EUR")

if __name__ == '__main__':
    unittest.main() 