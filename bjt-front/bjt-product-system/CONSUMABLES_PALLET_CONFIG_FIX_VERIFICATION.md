# 耗材页面托盘配置字段修复验证报告

## 修复概述
根据用户要求，修正了耗材页面托盘配置部分的字段显示名称，确保中英文显示符合标准。

## 修复内容

### 字段名称修正
| 原字段名称 | 修正后字段名称 | 语言 |
|-----------|---------------|------|
| 卷 | 一托数量 | 中文 |
| 重量 | 整托毛重 | 中文 |
| 高度 | 打托高度 | 中文 |
| Rolls | Packs per Pallet | 英文 |
| Weight | GW per Pallet | 英文 |
| Height | Pallet Height | 英文 |

### 显示效果
修复后的托盘配置显示格式：
- **中文版**：
  - 一托数量: 10
  - 整托毛重(kg): 10.00
  - 打托高度(cm): 10.00

- **英文版**：
  - Packs per Pallet: 10
  - GW per Pallet(kg): 10.00
  - Pallet Height(cm): 10.00

## 修改的文件

### 1. 主要翻译文件
- ✅ `frontend/src/i18n/locales/zh.json` (第659-661行)
- ✅ `frontend/src/i18n/locales/en.json` (第566-568行)

### 2. 耗材专用翻译文件
- ✅ `frontend/src/i18n/locales/zh/consumables.json` (第378-380行)
- ✅ `frontend/src/i18n/locales/en/consumables.json` (第378-380行)

## 修改详情

### 中文翻译修改
```json
// frontend/src/i18n/locales/zh.json 和 zh/consumables.json
"tooltip": {
  "units": {
    "rolls": "一托数量",     // 原: "卷"
    "weight": "整托毛重",   // 原: "重量" 
    "height": "打托高度"    // 原: "高度"
  }
}
```

### 英文翻译修改
```json
// frontend/src/i18n/locales/en.json 和 en/consumables.json
"tooltip": {
  "units": {
    "rolls": "Packs per Pallet",  // 原: "Rolls"
    "weight": "GW per Pallet",    // 原: "Weight"
    "height": "Pallet Height"     // 原: "Height"
  }
}
```

## 验证确认

### 文件修改验证
- ✅ 所有4个翻译文件都已正确修改
- ✅ 字段名称完全符合用户要求
- ✅ 格式保持一致性

### 服务重启
- ✅ 前端容器已重启 (`docker-compose restart frontend`)
- ✅ 翻译文件热重载已生效

## 影响范围
- **页面**：耗材页面 (`/consumables`)
- **组件**：托盘配置显示部分
- **功能**：仅影响显示标签，不影响数据逻辑
- **语言**：中文和英文界面

## 测试建议
1. 访问耗材页面
2. 查看任意耗材产品的托盘配置部分
3. 切换中英文语言验证显示效果
4. 确认显示格式为：
   - 一托数量: X / Packs per Pallet: X
   - 整托毛重(kg): X.XX / GW per Pallet(kg): X.XX
   - 打托高度(cm): X.XX / Pallet Height(cm): X.XX

## 修复状态
✅ **修复完成** - 所有托盘配置字段显示名称已按要求修正

---
*修复时间: 2025-01-18*
*修复人员: AI Assistant* 