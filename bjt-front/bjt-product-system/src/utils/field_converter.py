from typing import Any, Optional, Dict
from decimal import Decimal
import re
from field_matcher import FieldDefinition

class FieldConverter:
    @staticmethod
    def convert_value(field: FieldDefinition, value: Any) -> Optional[Any]:
        """转换字段值到正确的类型"""
        if value is None:
            return None

        try:
            if field.field_type.startswith('varchar'):
                return str(value)
            elif field.field_type.startswith('decimal'):
                return Decimal(str(value))
            elif field.field_type == 'int':
                return int(value)
            else:
                return value
        except (ValueError, TypeError):
            return None

    @staticmethod
    def format_value(field: FieldDefinition, value: Any) -> str:
        """格式化字段值用于显示"""
        if value is None:
            return ""

        if field.field_type.startswith('decimal'):
            # 对于decimal类型，保留2位小数
            return f"{float(value):.2f}"
        else:
            return str(value)

    @staticmethod
    def add_unit(value: str, unit: Optional[str]) -> str:
        """添加单位到值"""
        if not value or not unit:
            return value
        return f"{value} {unit}"

    @staticmethod
    def parse_size(size_str: str) -> Dict[str, float]:
        """解析尺寸字符串，如 "50.0x50.0x38.0" """
        if not size_str:
            return {}
        
        try:
            dimensions = [float(dim) for dim in size_str.split('x')]
            return {
                'length': dimensions[0] if len(dimensions) > 0 else 0,
                'width': dimensions[1] if len(dimensions) > 1 else 0,
                'height': dimensions[2] if len(dimensions) > 2 else 0
            }
        except (ValueError, IndexError):
            return {}

    @staticmethod
    def format_size(dimensions: Dict[str, float], unit: str) -> str:
        """格式化尺寸为字符串"""
        if not dimensions:
            return ""
        return f"{dimensions['length']}x{dimensions['width']}x{dimensions['height']} {unit}"

    @staticmethod
    def convert_metric_to_imperial(value: float, unit_type: str) -> float:
        """公制转英制"""
        if unit_type == 'length':
            return value * 0.3937  # cm to inch
        elif unit_type == 'weight':
            return value * 2.2046  # kg to lbs
        return value

    @staticmethod
    def convert_imperial_to_metric(value: float, unit_type: str) -> float:
        """英制转公制"""
        if unit_type == 'length':
            return value * 2.54  # inch to cm
        elif unit_type == 'weight':
            return value * 0.4536  # lbs to kg
        return value

    @staticmethod
    def validate_numeric_range(value: float, min_value: Optional[float] = None, max_value: Optional[float] = None) -> bool:
        """验证数值是否在指定范围内"""
        if min_value is not None and value < min_value:
            return False
        if max_value is not None and value > max_value:
            return False
        return True

    @staticmethod
    def validate_string_pattern(value: str, pattern: str) -> bool:
        """验证字符串是否符合指定模式"""
        if not value or not pattern:
            return True
        return bool(re.match(pattern, value))

    @staticmethod
    def format_currency(value: float, currency: str = 'USD') -> str:
        """格式化货币值"""
        if currency == 'USD':
            return f"${value:,.2f}"
        elif currency == 'CNY':
            return f"¥{value:,.2f}"
        else:
            return f"{value:,.2f} {currency}"

# 使用示例
if __name__ == "__main__":
    from field_matcher import HostFieldMatcher, FieldDefinition
    
    matcher = HostFieldMatcher()
    converter = FieldConverter()
    
    # 测试数值转换
    field = matcher.get_field_by_name("单件净重")
    value = converter.convert_value(field, "10.5")
    print(f"转换后的值: {value}, 类型: {type(value)}")
    
    # 测试尺寸解析
    size_str = "50.0x50.0x38.0"
    dimensions = converter.parse_size(size_str)
    print(f"解析后的尺寸: {dimensions}")
    
    # 测试单位转换
    metric_value = 100
    imperial_value = converter.convert_metric_to_imperial(metric_value, 'length')
    print(f"公制值: {metric_value}cm, 英制值: {imperial_value:.2f}inch")
    
    # 测试格式化
    formatted_value = converter.format_value(field, value)
    print(f"格式化后的值: {formatted_value}")
    
    # 测试添加单位
    value_with_unit = converter.add_unit(formatted_value, field.unit)
    print(f"带单位的值: {value_with_unit}") 