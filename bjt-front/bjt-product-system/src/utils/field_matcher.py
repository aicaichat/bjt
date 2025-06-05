from typing import Dict, List, Optional
import pandas as pd
from dataclasses import dataclass
from enum import Enum

class FieldSource(Enum):
    MODEL_TABLE = "各产品线型号表"
    CRM = "CRM"
    PRODUCT_LIST = "商品列表"
    SELF_MANAGED = "商城自管理"

class DisplayPage(Enum):
    SELECTION = "选型页"
    RELATION = "关系关联页"
    CART = "购物车与PO确认"
    DETAIL = "详细信息弹窗"
    PO = "PO页"

@dataclass
class FieldDefinition:
    name: str
    db_field: str
    field_type: str
    source: FieldSource
    display_pages: List[DisplayPage]
    description: str
    is_required: bool = False
    unit: Optional[str] = None

class HostFieldMatcher:
    def __init__(self):
        self.field_definitions = self._initialize_field_definitions()
        
    def _initialize_field_definitions(self) -> List[FieldDefinition]:
        return [
            # 基础字段
            FieldDefinition(
                name="产品图片",
                db_field="image_url",
                field_type="varchar(255)",
                source=FieldSource.MODEL_TABLE,
                display_pages=[DisplayPage.SELECTION, DisplayPage.RELATION],
                description="产品图片URL",
                is_required=True
            ),
            FieldDefinition(
                name="型号",
                db_field="model",
                field_type="varchar(100)",
                source=FieldSource.MODEL_TABLE,
                display_pages=[DisplayPage.SELECTION, DisplayPage.RELATION, DisplayPage.CART, DisplayPage.PO],
                description="产品型号编码",
                is_required=True
            ),
            FieldDefinition(
                name="品牌",
                db_field="brand",
                field_type="varchar(100)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.RELATION, DisplayPage.CART, DisplayPage.PO],
                description="品牌名称",
                is_required=True
            ),
            FieldDefinition(
                name="料号",
                db_field="part_number",
                field_type="varchar(100)",
                source=FieldSource.PRODUCT_LIST,
                display_pages=[DisplayPage.SELECTION, DisplayPage.RELATION, DisplayPage.CART, DisplayPage.PO],
                description="产品料号",
                is_required=True
            ),
            FieldDefinition(
                name="产品名称",
                db_field="name_zh",
                field_type="varchar(255)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.RELATION, DisplayPage.CART, DisplayPage.PO],
                description="产品中文名称",
                is_required=True
            ),
            FieldDefinition(
                name="Spec.",
                db_field="spec",
                field_type="varchar(255)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.PO],
                description="规格参数(公制)"
            ),
            FieldDefinition(
                name="Spec.(英制)",
                db_field="spec_imperial",
                field_type="varchar(255)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.PO],
                description="规格参数(英制)"
            ),
            FieldDefinition(
                name="电压",
                db_field="voltage",
                field_type="varchar(50)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.RELATION, DisplayPage.CART],
                description="电压值",
                unit="V"
            ),
            
            # 包装信息字段
            FieldDefinition(
                name="包装尺寸",
                db_field="package_size_cm",
                field_type="varchar(100)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.DETAIL],
                description="包装尺寸(公制)",
                unit="cm"
            ),
            FieldDefinition(
                name="包装尺寸(英制)",
                db_field="package_size_inch",
                field_type="varchar(100)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.DETAIL],
                description="包装尺寸(英制)",
                unit="inch"
            ),
            FieldDefinition(
                name="单件净重",
                db_field="net_weight_kg",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.DETAIL],
                description="单件净重(公制)",
                unit="kg"
            ),
            FieldDefinition(
                name="单件净重(英制)",
                db_field="net_weight_lbs",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[],
                description="单件净重(英制)",
                unit="lbs"
            ),
            FieldDefinition(
                name="包装毛重",
                db_field="gross_weight_kg",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.DETAIL],
                description="包装毛重(公制)",
                unit="kg"
            ),
            FieldDefinition(
                name="包装毛重(英制)",
                db_field="gross_weight_lbs",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[],
                description="包装毛重(英制)",
                unit="lbs"
            ),
            FieldDefinition(
                name="单箱数量",
                db_field="pcs_per_box",
                field_type="int",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.CART],
                description="单箱数量"
            ),
            
            # 托盘信息字段
            FieldDefinition(
                name="托盘尺寸",
                db_field="pallet_size_cm",
                field_type="varchar(100)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.DETAIL],
                description="托盘尺寸(公制)",
                unit="cm"
            ),
            FieldDefinition(
                name="托盘尺寸(英制)",
                db_field="pallet_size_inch",
                field_type="varchar(100)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.DETAIL],
                description="托盘尺寸(英制)",
                unit="inch"
            ),
            FieldDefinition(
                name="一托数量",
                db_field="pcs_per_pallet",
                field_type="int",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.DETAIL],
                description="一托数量"
            ),
            FieldDefinition(
                name="打托高度",
                db_field="pallet_height_cm",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.DETAIL],
                description="打托高度(公制)",
                unit="cm"
            ),
            FieldDefinition(
                name="打托高度(英制)",
                db_field="pallet_height_inch",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.DETAIL],
                description="打托高度(英制)",
                unit="inch"
            ),
            FieldDefinition(
                name="整托毛重",
                db_field="pallet_gross_weight_kg",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.DETAIL],
                description="整托毛重(公制)",
                unit="kg"
            ),
            FieldDefinition(
                name="整托毛重(英制)",
                db_field="pallet_gross_weight_lbs",
                field_type="decimal(10,2)",
                source=FieldSource.CRM,
                display_pages=[DisplayPage.SELECTION, DisplayPage.DETAIL],
                description="整托毛重(英制)",
                unit="lbs"
            ),
        ]

    def get_fields_by_page(self, page: DisplayPage) -> List[FieldDefinition]:
        """获取指定页面需要展示的字段"""
        return [field for field in self.field_definitions if page in field.display_pages]

    def get_fields_by_source(self, source: FieldSource) -> List[FieldDefinition]:
        """获取指定来源的字段"""
        return [field for field in self.field_definitions if field.source == source]

    def get_required_fields(self) -> List[FieldDefinition]:
        """获取所有必填字段"""
        return [field for field in self.field_definitions if field.is_required]

    def get_field_by_name(self, name: str) -> Optional[FieldDefinition]:
        """根据字段名称获取字段定义"""
        for field in self.field_definitions:
            if field.name == name:
                return field
        return None

    def get_field_by_db_field(self, db_field: str) -> Optional[FieldDefinition]:
        """根据数据库字段名获取字段定义"""
        for field in self.field_definitions:
            if field.db_field == db_field:
                return field
        return None

    def validate_field_value(self, field: FieldDefinition, value: any) -> bool:
        """验证字段值是否符合要求"""
        if field.is_required and value is None:
            return False
            
        if value is None:
            return True
            
        if field.field_type.startswith('varchar'):
            max_length = int(field.field_type.split('(')[1].split(')')[0])
            return len(str(value)) <= max_length
            
        if field.field_type.startswith('decimal'):
            try:
                float(value)
                return True
            except ValueError:
                return False
                
        if field.field_type == 'int':
            try:
                int(value)
                return True
            except ValueError:
                return False
                
        return True

    def get_field_display_info(self, field: FieldDefinition) -> Dict:
        """获取字段的展示信息"""
        return {
            'name': field.name,
            'db_field': field.db_field,
            'type': field.field_type,
            'source': field.source.value,
            'display_pages': [page.value for page in field.display_pages],
            'description': field.description,
            'is_required': field.is_required,
            'unit': field.unit
        }

# 使用示例
if __name__ == "__main__":
    matcher = HostFieldMatcher()
    
    # 获取选型页需要展示的字段
    selection_fields = matcher.get_fields_by_page(DisplayPage.SELECTION)
    print("选型页字段:")
    for field in selection_fields:
        print(f"- {field.name} ({field.db_field})")
    
    # 获取CRM来源的字段
    crm_fields = matcher.get_fields_by_source(FieldSource.CRM)
    print("\nCRM来源字段:")
    for field in crm_fields:
        print(f"- {field.name} ({field.db_field})")
    
    # 获取必填字段
    required_fields = matcher.get_required_fields()
    print("\n必填字段:")
    for field in required_fields:
        print(f"- {field.name} ({field.db_field})") 