# BJT API接口文档更新摘要

**更新日期**: 2025-05-27  
**版本**: v1.2.0  
**文档路径**: `docs/api/API接口文档.md`

## 主要更新内容

### 1. 版本信息更新
- **版本号**: v1.1.0 → v1.2.0
- **更新日期**: 2024-01-15 → 2025-05-27
- **新增更新日志**: v1.2.0版本的功能更新说明

### 2. 备件接口全面增强

#### 2.1 新增功能支持
- ✨ **必选配件关系**: 支持`required_parts`和`required_quantity`字段
- 🚀 **定价层级**: 完整的区域化定价信息
- 📊 **库存管理**: 多区域库存数据支持
- 🔍 **筛选选项**: 新增`/spare-parts/filter-options`端点

#### 2.2 数据结构优化
- **基础信息字段**: 完善了所有备件基础属性
- **包装信息字段**: 详细的包装和重量信息
- **必选配件字段**: 支持多个必选配件的关联关系
- **定价信息字段**: 多层级、多区域的价格体系
- **库存信息字段**: 按区域分组的库存数据

#### 2.3 API端点更新

##### 获取备件列表 (`GET /spare-parts`)
**新增查询参数**:
- `is_consumable`: 是否为耗材筛选
- `lang`: 多语言支持

**响应数据增强**:
```json
{
  "required_parts": "05A0101289,05A0101290",
  "required_quantity": "2,2",
  "pricing": [
    {
      "range": "1-10",
      "price": 15.50,
      "regionalPrices": {
        "cn": 15.50,
        "eu": 18.60,
        "na": 17.25,
        "au": 19.80
      }
    }
  ],
  "inventory": {
    "CN": 150,
    "EU": 75,
    "NA": 100,
    "AU": 50
  }
}
```

##### 获取备件详情 (`GET /spare-parts/{id}`)
**新增功能**:
- 完整的字段说明文档
- 必选配件关系说明
- 定价层级详细说明
- 库存区域分布信息

##### 获取备件兼容性信息 (`GET /spare-parts/{id}/compatibility`)
**响应数据增强**:
```json
{
  "required_parts_info": {
    "has_required_parts": false,
    "required_parts": null,
    "required_quantity": null,
    "parsed_requirements": []
  }
}
```

##### 新增筛选选项端点 (`GET /spare-parts/filter-options`)
**功能**: 获取备件页面的筛选选项数据
**响应数据**:
```json
{
  "hostModels": ["\"LA-E4S V2.0\"", "LA-E4S(paper)"],
  "accessoryModels": ["ET400", "ET1003", "FR8002"],
  "partTypes": [
    {"id": "consumable", "name": "耗材"},
    {"id": "component", "name": "组件"}
  ]
}
```

### 3. 错误码体系完善

#### 3.1 产品相关错误码增强
新增错误码:
- `missing_part_number`: 缺少料号
- `missing_product_line_id`: 缺少产品线ID
- `duplicate_spare_part`: 该产品线中已存在相同料号的备件
- `invalid_required_parts_format`: 必选配件格式无效
- `required_parts_not_found`: 必选配件不存在
- `insufficient_inventory`: 库存不足
- `invalid_pricing_tier`: 定价层级无效

#### 3.2 新增备件专用错误码
- `spare_part_not_found`: 备件不存在
- `invalid_spare_part_id`: 备件ID无效
- `spare_part_required_parts_missing`: 必选配件缺失
- `spare_part_compatibility_check_failed`: 备件兼容性检查失败
- `invalid_app_model_format`: 适用机型格式无效
- `invalid_serial_number_format`: 序列号格式无效
- `spare_part_filter_options_unavailable`: 备件筛选选项不可用

### 4. 技术实现说明

#### 4.1 必选配件关系
- **数据来源**: 从`wp_bjt_relations`表动态获取
- **格式**: 逗号分隔的料号和数量字符串
- **示例**: `"05A0101289,05A0101290"` 对应 `"2,2"`

#### 4.2 定价层级系统
- **层级类型**: 
  - `"base"`: 基础价格
  - `"1-10"`: 数量范围价格
  - `">10"`: 大于某数量的价格
- **区域支持**: CN(中国)、EU(欧洲)、NA(北美)、AU(澳洲)

#### 4.3 库存管理
- **区域分组**: 按地理区域分组管理库存
- **实时查询**: 从`wp_bjt_inventory`表实时获取数据

#### 4.4 序列号兼容性
支持多种序列号格式:
- `"ALL"`: 适用于所有序列号
- `"SN10001-SN20000"`: 序列号范围
- `"BJTE4S-21-****"`: 带通配符的序列号模式
- `">BJTE4S-3511153"`: 大于某个序列号的所有设备

### 5. 使用注意事项

#### 5.1 必选配件处理
1. 添加备件到购物车时，系统会自动检查`required_parts`
2. 如有必选配件，会提示用户并自动计算相关数量
3. 删除主备件时，会同步处理相关的必选配件

#### 5.2 定价计算
1. 根据购买数量自动匹配对应的价格层级
2. 优先使用用户所在区域的价格
3. 如区域价格不存在，使用默认价格

#### 5.3 库存检查
1. 添加到购物车前会检查对应区域的库存数量
2. 库存不足时会返回相应的错误信息
3. 支持预留库存的概念

### 6. 向后兼容性

- ✅ 所有现有API端点保持兼容
- ✅ 新增字段为可选，不影响现有客户端
- ✅ 错误码采用新增方式，不修改现有错误码
- ✅ 响应格式保持一致的JSON结构

### 7. 相关文件

#### 7.1 文档文件
- `docs/api/API接口文档.md` - 主要API文档
- `API_INTERFACE_DOCUMENTATION_UPDATE.md` - 本更新摘要

#### 7.2 实现文件
- `plugins/bjt-core-entities/controllers/class-spare-part-controller.php` - 备件控制器
- `frontend/src/pages/SpareParts/index.tsx` - 前端备件页面
- `frontend/src/types/spareParts.ts` - 备件类型定义

#### 7.3 数据库表
- `wp_bjt_spare_parts` - 备件基础信息
- `wp_bjt_relations` - 备件关系（必选配件）
- `wp_bjt_prices` - 定价信息
- `wp_bjt_inventory` - 库存信息

### 8. 后续计划

#### 8.1 短期计划
- 🔄 实现`/spare-parts/filter-options`端点
- 🔧 优化必选配件的前端交互体验
- 📊 完善库存预警机制

#### 8.2 长期计划
- 🚀 支持批量操作API
- 📈 增加价格历史记录
- 🔍 实现高级搜索功能
- 📱 移动端API优化

---

**更新完成**: API接口文档已更新至v1.2.0版本，全面支持备件必选配件关系、定价层级和库存管理功能。 