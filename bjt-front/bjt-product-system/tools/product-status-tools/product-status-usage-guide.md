# 产品上下线状态检查使用指南

## 🎯 快速开始

### 1. 检查当前状态
```bash
# 运行简单检查
./tools/simple-status-check.sh

# 运行完整检查（如果API服务运行中）
./tools/product-status-checker.sh all
```

### 2. 修复发现的问题
```bash
# 自动修复API参数问题
./tools/quick-fix-status.sh api-params

# 修复所有可自动修复的问题
./tools/quick-fix-status.sh all
```

### 3. 验证修复结果
```bash
# 重新检查
./tools/simple-status-check.sh

# 启动前端验证功能
cd frontend && npm run dev
```

---

## 📋 核心检查要点

### ✅ 必须修复（关键问题）
1. **machineparts API** - 必须包含 `status=publish` 参数
2. **host-models API** - 必须包含 `status=publish` 参数  
3. **类型定义** - TypeScript接口必须包含 `status?: string` 字段

### ⚠️ 建议修复（优化项）
1. **accessories API** - 建议添加 `status=publish` 参数
2. **consumables API** - 建议添加 `status=publish` 参数
3. **硬编码过滤** - 移除客户端状态过滤，使用API参数

---

## 🔧 修复经验总结

### 问题根因
1. **API调用缺少status参数** → 前端显示草稿数据
2. **后端状态设置不当** → 测试数据污染生产
3. **前端过滤逻辑不统一** → 不同页面行为不一致

### 修复策略
1. **最小改动原则** - 优先通过API参数过滤，避免大范围代码修改
2. **统一标准** - 所有产品类型使用相同的状态过滤逻辑
3. **自动化工具** - 使用脚本检查和修复，减少人工错误

### 关键文件
```
frontend/src/pages/Machines/index.tsx  # 主要产品页面
frontend/index.tsx                     # 备用产品页面  
frontend/src/utils/authTest.ts         # API测试工具
frontend/src/types/machines.ts         # 类型定义
```

---

## 🎯 标准修复模式

### API调用修复
```typescript
// ❌ 修复前
const apiUrl = `${baseUrl}/machineparts?lang=${lang}`;

// ✅ 修复后
const apiUrl = `${baseUrl}/machineparts?status=publish&lang=${lang}`;
```

### 类型定义修复
```typescript
// ✅ 确保包含status字段
export interface MachinePart {
  id: number;
  // ... 其他字段
  status?: string;  // 必须包含此字段
}
```

---

## 🔍 检查清单

### 部署前检查
- [ ] 运行 `./tools/simple-status-check.sh` 确认无错误
- [ ] 检查主要API调用包含 `status=publish` 参数
- [ ] 验证TypeScript类型定义包含status字段
- [ ] 测试前端页面不显示草稿数据

### 部署后验证  
- [ ] 启动前端服务验证功能正常
- [ ] 检查不同产品线切换功能
- [ ] 验证配件层级显示正确
- [ ] 确认性能无明显影响

### 回滚准备
- [ ] 记录修改的文件列表
- [ ] 保存修改前的备份文件
- [ ] 准备快速回滚脚本

---

## 🚨 常见问题处理

### Q: 修复后仍显示草稿数据？
**A**: 检查以下几点：
1. 清除浏览器缓存和localStorage
2. 确认API服务已重启
3. 检查数据库中的status字段值
4. 验证Mock数据模式是否正确

### Q: API响应为空或报错？
**A**: 可能原因：
1. 后端服务未启动
2. 数据库中所有数据都是draft状态
3. API参数格式错误
4. 权限认证问题

### Q: TypeScript编译错误？
**A**: 修复方法：
1. 确保类型定义包含status字段
2. 检查import语句是否正确
3. 运行 `npm run type-check` 检查类型错误

---

## 📖 相关文档

- [详细检查清单](product-status-checklist.md) - 完整的检查指南
- [工具使用说明](../tools/) - 检查和修复工具详细说明
- [API文档](../api/) - 后端API status参数说明

---

## 🎉 成功标准

修复完成的标志：
1. ✅ `./tools/simple-status-check.sh` 显示所有检查通过
2. ✅ 前端页面不显示任何测试/草稿数据
3. ✅ 产品线切换功能正常工作
4. ✅ 现有功能无任何异常

**记住：最小改动，最大效果！** 🚀 