#!/bin/bash

# 翻译文件生成工具
# 使用方法: ./tools/i18n-fixer/generate-i18n-files.sh <页面名称> [类型]

PAGE_NAME="$1"
FILE_TYPE="${2:-page}"

if [ -z "$PAGE_NAME" ]; then
    echo "用法: $0 <页面名称> [类型]"
    echo "示例: $0 profile page"
    echo "     $0 machines page"
    echo "     $0 common component"
    exit 1
fi

echo "🏗️ 生成翻译文件..."
echo "📝 页面名称: $PAGE_NAME"
echo "🔖 文件类型: $FILE_TYPE"
echo "=================================================="

# 创建目录（如果不存在）
mkdir -p frontend/src/i18n/locales/zh
mkdir -p frontend/src/i18n/locales/en

ZH_FILE="frontend/src/i18n/locales/zh/${PAGE_NAME}.json"
EN_FILE="frontend/src/i18n/locales/en/${PAGE_NAME}.json"

# 检查文件是否已存在
if [ -f "$ZH_FILE" ] || [ -f "$EN_FILE" ]; then
    echo "⚠️ 翻译文件已存在，是否覆盖？[y/N]"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ 操作已取消"
        exit 1
    fi
fi

# 生成中文翻译文件模板
cat > "$ZH_FILE" << EOF
{
  "pageTitle": "${PAGE_NAME}页面",
  "loading": "加载中...",
  "error": "加载失败",
  "noData": "暂无数据",
  "fields": {
    "model": "型号",
    "voltage": "电压",
    "price": "价格",
    "inventory": "库存",
    "packageSize": "包装尺寸",
    "netWeight": "单件净重",
    "grossWeight": "单件毛重",
    "palletHeight": "打托高度",
    "palletGrossWeight": "整托毛重",
    "pcsPerBox": "单箱数量",
    "palletSize": "托盘尺寸",
    "pcsPerPallet": "一托数量",
    "frequency": "频率"
  },
  "units": {
    "cm": "cm",
    "inch": "inch",
    "kg": "kg",
    "lbs": "lbs",
    "V": "V",
    "Hz": "Hz"
  },
  "actions": {
    "add": "添加",
    "edit": "编辑",
    "delete": "删除",
    "save": "保存",
    "cancel": "取消",
    "confirm": "确认",
    "submit": "提交",
    "reset": "重置",
    "search": "搜索",
    "filter": "筛选",
    "export": "导出",
    "import": "导入",
    "addToCart": "添加到购物车"
  },
  "messages": {
    "loadFailed": "加载失败",
    "processFailed": "处理失败",
    "addSuccess": "添加成功",
    "updateSuccess": "更新成功",
    "deleteSuccess": "删除成功",
    "saveSuccess": "保存成功",
    "loading": "正在加载",
    "processing": "正在处理",
    "operationSuccess": "操作成功",
    "operationFailed": "操作失败"
  },
  "prompts": {
    "pleaseSelect": "请选择",
    "pleaseInput": "请输入",
    "confirmDelete": "确认删除",
    "unsavedChanges": "有未保存的更改"
  },
  "validation": {
    "required": "此字段为必填项",
    "invalidFormat": "格式不正确",
    "tooShort": "内容过短",
    "tooLong": "内容过长"
  }
}
EOF

# 生成英文翻译文件模板
cat > "$EN_FILE" << EOF
{
  "pageTitle": "$(echo ${PAGE_NAME} | sed 's/\b\w/\U&/g') Page",
  "loading": "Loading...",
  "error": "Failed to load",
  "noData": "No data available",
  "fields": {
    "model": "Model",
    "voltage": "Voltage",
    "price": "Price",
    "inventory": "Inventory",
    "packageSize": "Package Size",
    "netWeight": "Net Weight",
    "grossWeight": "Gross Weight",
    "palletHeight": "Pallet Height",
    "palletGrossWeight": "Pallet Gross Weight",
    "pcsPerBox": "PCS per Box",
    "palletSize": "Pallet Size",
    "pcsPerPallet": "PCS per Pallet",
    "frequency": "Frequency"
  },
  "units": {
    "cm": "cm",
    "inch": "inch",
    "kg": "kg",
    "lbs": "lbs",
    "V": "V",
    "Hz": "Hz"
  },
  "actions": {
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "submit": "Submit",
    "reset": "Reset",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "import": "Import",
    "addToCart": "Add to Cart"
  },
  "messages": {
    "loadFailed": "Failed to load",
    "processFailed": "Failed to process",
    "addSuccess": "Added successfully",
    "updateSuccess": "Updated successfully",
    "deleteSuccess": "Deleted successfully",
    "saveSuccess": "Saved successfully",
    "loading": "Loading",
    "processing": "Processing",
    "operationSuccess": "Operation successful",
    "operationFailed": "Operation failed"
  },
  "prompts": {
    "pleaseSelect": "Please select",
    "pleaseInput": "Please input",
    "confirmDelete": "Confirm delete",
    "unsavedChanges": "You have unsaved changes"
  },
  "validation": {
    "required": "This field is required",
    "invalidFormat": "Invalid format",
    "tooShort": "Content too short",
    "tooLong": "Content too long"
  }
}
EOF

echo "✅ 翻译文件生成完成："
echo "   📄 中文: $ZH_FILE"
echo "   📄 英文: $EN_FILE"
echo ""
echo "📝 下一步操作："
echo "   1. 根据实际需求编辑翻译内容"
echo "   2. 在组件中导入翻译函数: import { useTranslation } from 'react-i18next'"
echo "   3. 使用翻译函数: const { t } = useTranslation('$PAGE_NAME')"
echo "   4. 替换硬编码文本: t('fields.model')" 