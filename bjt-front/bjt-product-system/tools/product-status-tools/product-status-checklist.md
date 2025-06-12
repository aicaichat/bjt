# 产品上下线状态检查指南

## 📋 目录
- [🎯 检查概览](#overview)
- [🔍 检查清单](#checklist)
- [🛠️ 快速检查工具](#tools)
- [🔧 常见问题修复](#fixes)
- [📝 验证流程](#verification)

---

## 🎯 检查概览 {#overview}

### 产品状态系统架构
```
WordPress后端 → API接口 → 前端显示
     ↓           ↓         ↓
  status字段   参数过滤   显示逻辑
  (publish/   (status=   (过滤草稿
   draft)     publish)    状态)
```

### 核心检查原则
1. **数据库状态一致性** - 后端status字段正确设置
2. **API参数完整性** - 所有接口调用包含status过滤
3. **前端过滤逻辑** - 显示逻辑正确处理状态
4. **跨产品类型一致性** - 所有产品类型使用相同逻辑

---

## 🔍 检查清单 {#checklist}

### 1️⃣ 后端数据检查

#### 数据库状态验证
```bash
# 检查各产品类型的状态分布
# 产品线 (wp_bjt_product_lines)
SELECT status, COUNT(*) FROM wp_bjt_product_lines GROUP BY status;

# 主机型号 (wp_bjt_host_models) 
SELECT status, COUNT(*) FROM wp_bjt_host_models GROUP BY status;

# 主机配件 (wp_bjt_parts)
SELECT status, COUNT(*) FROM wp_bjt_parts GROUP BY status;

# 配件关系 (wp_bjt_accessory_relations)
SELECT status, COUNT(*) FROM wp_bjt_accessory_relations GROUP BY status;

# 耗材 (wp_bjt_consumables)
SELECT status, COUNT(*) FROM wp_bjt_consumables GROUP BY status;
```

#### 状态字段检查要点
- [ ] status字段只包含 `publish` 或 `draft` 值
- [ ] 没有NULL或空值状态
- [ ] 测试数据正确标记为draft状态
- [ ] 生产数据正确标记为publish状态

### 2️⃣ API接口检查

#### 关键API端点状态参数
```bash
# 检查以下API是否包含status=publish参数

# ✅ 主机型号API (已修复)
GET /wp-json/bjt/v1/host-models?status=publish

# ✅ 主机配件API (已修复) 
GET /wp-json/bjt/v1/machineparts?status=publish

# 🔍 需要检查的其他API
GET /wp-json/bjt/v1/accessories?status=publish
GET /wp-json/bjt/v1/consumables?status=publish
GET /wp-json/bjt/v1/accessory-relations?status=publish
```

#### API检查工具命令
```bash
# 1. 检查API响应是否包含draft状态数据
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/wp-json/bjt/v1/machineparts" | \
  jq '.data.items[] | select(.status == "draft")'

# 2. 验证status=publish参数生效
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/wp-json/bjt/v1/machineparts?status=publish" | \
  jq '.data.items[] | .status' | sort -u
```

### 3️⃣ 前端代码检查

#### 主要检查文件
- [ ] `frontend/src/pages/Machines/index.tsx`
- [ ] `frontend/index.tsx` 
- [ ] `frontend/src/utils/authTest.ts`
- [ ] `frontend/src/tests/real-api/pages/machines-page.real-api.test.ts`

#### API调用检查模式
```typescript
// ❌ 错误：缺少status参数
const response = await fetch(`${baseUrl}/machineparts?lang=${lang}`);

// ✅ 正确：包含status=publish参数
const response = await fetch(`${baseUrl}/machineparts?status=publish&lang=${lang}`);
```

#### 前端过滤逻辑检查
```typescript
// 检查是否有客户端过滤逻辑
const publishedItems = items.filter(item => item.status === 'publish');

// 检查Mock数据是否正确过滤
if (useMockData) {
  // Mock数据也应该只返回publish状态
}
```

### 4️⃣ 产品类型专项检查

#### 主机产品 (Host Models)
- [ ] API: `/host-models?status=publish`
- [ ] 显示: 只显示已发布的主机型号
- [ ] 过滤: 下拉选择器不包含草稿主机

#### 主机配件 (Machine Parts)  
- [ ] API: `/machineparts?status=publish`
- [ ] 显示: 配件列表只显示已发布配件
- [ ] 关联: 主机配件关系正确过滤

#### 配件层级 (Accessories)
- [ ] API: `/accessories?status=publish`
- [ ] API: `/accessory-relations?status=publish`
- [ ] 显示: 多级配件树正确过滤草稿节点
- [ ] 逻辑: 父子关系完整性检查

#### 耗材 (Consumables)
- [ ] API: `/consumables?status=publish`
- [ ] 显示: 耗材列表过滤草稿状态
- [ ] 分类: 耗材分类过滤正确

---

## 🛠️ 快速检查工具 {#tools}

### 自动化检查脚本
```bash
#!/bin/bash
# 产品状态检查脚本

echo "🔍 开始产品上下线状态检查..."

# 1. 检查API状态参数
echo "📡 检查API调用..."
grep -r "machineparts" frontend/src --include="*.ts" --include="*.tsx" | \
  grep -v "status=publish" | \
  head -5

# 2. 检查前端过滤逻辑  
echo "🎯 检查前端过滤..."
grep -r "\.status.*publish" frontend/src --include="*.ts" --include="*.tsx"

# 3. 检查Mock数据状态
echo "📊 检查Mock数据..."
find frontend/src -name "*.json" -exec grep -l "draft" {} \;

echo "✅ 检查完成"
```

### 代码搜索命令
```bash
# 查找缺少status参数的API调用
grep -rn "machineparts\|accessories\|consumables" frontend/src \
  --include="*.ts" --include="*.tsx" | \
  grep -v "status="

# 查找硬编码状态过滤
grep -rn "status.*===.*publish" frontend/src \
  --include="*.ts" --include="*.tsx"

# 查找可能的draft数据泄露
grep -rn "draft" frontend/src \
  --include="*.ts" --include="*.tsx" --include="*.json"
```

---

## 🔧 常见问题修复 {#fixes}

### 问题1: API调用缺少status参数

**症状**: 前端显示草稿状态的产品
**检查位置**: 
```typescript
// 在这些文件中搜索API调用
frontend/src/pages/Machines/index.tsx:493
frontend/index.tsx:493  
frontend/src/utils/authTest.ts:89
```

**修复模式**:
```typescript
// 修复前
const apiUrl = `${baseUrl}/machineparts?lang=${lang}`;

// 修复后  
const apiUrl = `${baseUrl}/machineparts?status=publish&lang=${lang}`;
```

### 问题2: 前端Mock数据包含草稿

**症状**: 即使API正确，Mock模式仍显示草稿数据
**检查位置**: Mock数据文件和useMockData hooks
**修复模式**:
```typescript
// 在Mock数据中添加状态过滤
const mockData = originalMockData.filter(item => item.status === 'publish');
```

### 问题3: 配件层级关系状态不一致

**症状**: 父配件发布但子配件是草稿，或反之
**检查方法**: 验证配件关系表状态一致性
**修复策略**: 级联状态检查和修复

### 问题4: 测试数据污染生产显示

**症状**: 开发测试数据在生产环境显示
**根本原因**: 测试数据status未设置为draft
**修复方法**: 批量更新测试数据状态

---

## 📝 验证流程 {#verification}

### 端到端验证步骤

#### Step 1: 后端数据准备
```sql
-- 1. 设置测试数据为草稿状态
UPDATE wp_bjt_parts SET status = 'draft' 
WHERE part_number LIKE 'TEST%' OR name_zh LIKE '%测试%';

-- 2. 确保正式数据为发布状态  
UPDATE wp_bjt_parts SET status = 'publish'
WHERE status IS NULL OR status = '';
```

#### Step 2: API验证
```bash
# 1. 验证API不返回草稿数据
curl -s "$API_URL/machineparts?status=publish" | \
  jq '.data.items[] | select(.status == "draft")' | \
  wc -l  # 应该返回0

# 2. 验证草稿数据存在但被过滤
curl -s "$API_URL/machineparts" | \
  jq '.data.items[] | select(.status == "draft")' | \
  wc -l  # 应该大于0
```

#### Step 3: 前端功能验证
```bash
# 1. 启动开发服务器
cd frontend && npm run dev

# 2. 验证页面显示
# - 打开 http://localhost:5173
# - 检查主机列表不包含测试数据
# - 切换不同产品线验证过滤正确
# - 检查配件层级不包含草稿配件
```

#### Step 4: 回归测试
```bash
# 运行自动化测试验证修复
npm run test:api
npm run test:integration
```

### 验证检查点
- [ ] 后端API正确过滤草稿状态
- [ ] 前端页面不显示测试/草稿数据  
- [ ] 产品线切换功能正常
- [ ] 配件层级显示完整且正确
- [ ] Mock数据模式也正确过滤
- [ ] 现有功能未受影响

### 性能验证
- [ ] API响应时间未明显增加
- [ ] 页面加载速度正常
- [ ] 内存使用无异常增长

---

## 📊 检查报告模板

### 检查结果记录
```markdown
## 产品上下线状态检查报告

**检查时间**: 2024-XX-XX
**检查范围**: 主机/配件/耗材/配件关系
**检查结果**: ✅通过 / ❌失败

### 发现问题
1. [问题描述]
   - 影响范围: [具体产品类型]
   - 严重程度: [高/中/低]
   - 修复状态: [已修复/处理中/待处理]

### 修复记录
1. [修复内容]
   - 修改文件: [文件列表]
   - 修改类型: [API参数/前端逻辑/数据状态]
   - 验证结果: [通过/失败]

### 建议改进
1. [改进建议]
2. [预防措施]
```

---

## 🎯 最佳实践总结

### 开发规范
1. **API设计**: 所有列表接口默认添加status参数支持
2. **前端调用**: 统一使用status=publish参数
3. **Mock数据**: 保持与真实API相同的过滤逻辑
4. **测试数据**: 始终标记为draft状态

### 部署检查
1. **部署前**: 运行完整状态检查脚本
2. **部署后**: 验证生产环境数据显示正确
3. **回滚准备**: 记录修改文件清单便于回滚

### 监控建议
1. **API监控**: 监控API响应中的状态分布
2. **错误监控**: 监控状态相关的前端错误
3. **数据监控**: 定期检查数据库状态字段一致性

---

**检查完成后，请确保所有测试通过，并更新相关文档！** ✅ 