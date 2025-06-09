# Consumer页面标准字段展示自动化改造提示词模板

## 🎯 改造目标
将Consumer页面的字段展示完全对齐JSON标准(`output/display-fields.json`)，实现智能单位制显示、多语言支持，最小化改动且不影响现有功能。

## 📋 改造前置条件检查

### 1. 依赖文件确认
```bash
# 检查关键文件存在性
ls -la frontend/src/pages/Consumables/index.tsx
ls -la frontend/src/components/Cart/CartSidebar.tsx
ls -la output/display-fields.json
ls -la frontend/src/hooks/useUserRegion.ts
ls -la frontend/src/i18n/locales/
```

## 🔄 执行状态检查机制 (避免重复修改和遗漏)

### 🤖 智能检查脚本
在每次开始改造前，**必须**先运行状态检查脚本：

```bash
#!/bin/bash
# Consumer页面改造状态检查脚本 (避免重复修改)

echo "🔍 Consumer页面改造状态检查"
echo "=================================="

# 创建状态跟踪文件
PROGRESS_FILE="frontend/.consumable-progress.json"
if [ ! -f "$PROGRESS_FILE" ]; then
  echo '{"status": "未开始", "completed_tasks": [], "current_phase": 0, "timestamp": ""}' > "$PROGRESS_FILE"
fi

# === Phase 1: 基础配置检查 ===
CONFIG_EXISTS=$(test -f "frontend/src/config/consumable-display-config.ts" && echo "✅" || echo "❌")
HOOK_EXISTS=$(test -f "frontend/src/hooks/useConsumableFieldDisplay.ts" && echo "✅" || echo "❌")
TYPES_EXISTS=$(grep -q "interface.*ConsumableItem" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")

# === Phase 2: 组件修改检查 ===
TOOLTIP_EXISTS=$(grep -q "PremiumTooltipContent\|Premium Tooltip" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
CARD_EXISTS=$(grep -q "StandardConsumableItem\|世界级设计\|Premium Card" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
FIELDS_EXISTS=$(grep -q "useConsumableFieldDisplay\|standardized" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")

# === Phase 3: 样式文件检查 ===
SCSS_EXISTS=$(test -f "frontend/src/pages/Consumables/consumables.scss" && echo "✅" || echo "❌")
TOKENS_EXISTS=$(grep -q "consumable-primary\|设计令牌" frontend/src/pages/Consumables/consumables.scss 2>/dev/null && echo "✅" || echo "❌")
RESPONSIVE_EXISTS=$(grep -q "responsive\|mobile\|tablet" frontend/src/pages/Consumables/consumables.scss 2>/dev/null && echo "✅" || echo "❌")

# === Phase 4: 多语言检查 ===
ZH_EXISTS=$(test -f "frontend/src/i18n/locales/zh/consumables.json" && echo "✅" || echo "❌")
EN_EXISTS=$(test -f "frontend/src/i18n/locales/en/consumables.json" && echo "✅" || echo "❌")

# === Phase 5: 功能验证检查 ===
UNITS_EXISTS=$(grep -q "userRegion.*metric\|imperial\|单位" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
FALLBACK_EXISTS=$(grep -q "fallback\|降级\|兼容" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")

# === 计算完成度 ===
TOTAL_CHECKS=10
COMPLETED=0
[ "$CONFIG_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$HOOK_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$TYPES_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$TOOLTIP_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$CARD_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$FIELDS_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$SCSS_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$ZH_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$EN_EXISTS" = "✅" ] && ((COMPLETED++))
[ "$UNITS_EXISTS" = "✅" ] && ((COMPLETED++))

PERCENTAGE=$((COMPLETED * 100 / TOTAL_CHECKS))

echo "📈 总体进度: $COMPLETED/$TOTAL_CHECKS ($PERCENTAGE%)"

# === 根据状态决定下一步动作 ===
if [ $PERCENTAGE -eq 100 ]; then
  echo "🎉 Consumer页面改造已完成！无需重复修改。"
  exit 0
elif [ $PERCENTAGE -ge 70 ]; then
  echo "⚠️ 改造进度较高，请检查剩余任务："
  [ "$RESPONSIVE_EXISTS" = "❌" ] && echo "- 添加响应式设计标记"
  [ "$UNITS_EXISTS" = "❌" ] && echo "- 完善单位处理逻辑"
else
  echo "📝 待完成的关键任务："
  [ "$CONFIG_EXISTS" = "❌" ] && echo "- Phase 1: 创建配置文件"
  [ "$HOOK_EXISTS" = "❌" ] && echo "- Phase 1: 创建Hook文件"
  [ "$TOOLTIP_EXISTS" = "❌" ] && echo "- Phase 2: 升级Tooltip组件"
  [ "$SCSS_EXISTS" = "❌" ] && echo "- Phase 3: 创建SCSS样式文件"
fi

# 保存状态避免重复检查
cat > "$PROGRESS_FILE" << EOF
{
  "status": "$([ $PERCENTAGE -eq 100 ] && echo "已完成" || echo "进行中")",
  "completed_tasks": $COMPLETED,
  "total_tasks": $TOTAL_CHECKS,
  "percentage": $PERCENTAGE,
  "timestamp": "$(date)",
  "next_phase": "$([ $PERCENTAGE -lt 30 ] && echo "基础配置" || [ $PERCENTAGE -lt 70 ] && echo "组件升级" || echo "细节完善")"
}
EOF

# 导出状态变量供后续使用
export CONSUMABLE_PROGRESS_PERCENTAGE=$PERCENTAGE
export CONSUMABLE_STATUS_FILE="$PROGRESS_FILE"
```

### 🎯 智能执行策略

**执行前检查规则：**
1. **100%完成**: 停止执行，避免重复修改
2. **70%-99%**: 仅执行缺失的细节任务
3. **30%-69%**: 继续核心组件改造
4. **0%-29%**: 从基础配置开始

**使用方法：**
```bash
# 1. 创建并运行状态检查脚本
chmod +x check-consumable-status.sh
./check-consumable-status.sh

# 2. 根据输出的进度百分比决定执行策略
if [ $CONSUMABLE_PROGRESS_PERCENTAGE -eq 100 ]; then
  echo "✅ 改造已完成，跳过执行"
  exit 0
fi

# 3. 继续执行改造流程...
```

## 📑 改造范围和边界