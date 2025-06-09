#!/bin/bash
# Consumer页面改造状态检查脚本

echo "🔍 Consumer页面改造状态检查"
echo "=================================="

# 创建状态文件
PROGRESS_FILE="frontend/.consumable-progress.json"
if [ ! -f "$PROGRESS_FILE" ]; then
  echo '{"status": "未开始", "completed_tasks": [], "current_phase": 0, "timestamp": ""}' > "$PROGRESS_FILE"
fi

# 检查各阶段完成状态
echo "📊 检查改造进度..."

# Phase 1: 基础配置检查
echo "=== Phase 1: 基础配置状态 ==="
CONFIG_EXISTS=$(test -f "frontend/src/config/consumable-display-config.ts" && echo "✅" || echo "❌")
echo "配置文件: $CONFIG_EXISTS frontend/src/config/consumable-display-config.ts"

HOOK_EXISTS=$(test -f "frontend/src/hooks/useConsumableFieldDisplay.ts" && echo "✅" || echo "❌")
echo "Hook文件: $HOOK_EXISTS frontend/src/hooks/useConsumableFieldDisplay.ts"

TYPES_EXISTS=$(grep -q "interface.*ConsumableItem" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
echo "类型定义: $TYPES_EXISTS ConsumableItem接口"

# Phase 2: 组件修改检查
echo ""
echo "=== Phase 2: 组件修改状态 ==="
TOOLTIP_EXISTS=$(grep -q "PremiumTooltipContent\|Premium Tooltip" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
echo "Tooltip组件: $TOOLTIP_EXISTS Premium设计已应用"

CARD_EXISTS=$(grep -q "StandardConsumableItem\|世界级设计\|Premium Card" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
echo "商品卡片: $CARD_EXISTS 世界级设计已应用"

FIELDS_EXISTS=$(grep -q "useConsumableFieldDisplay\|standardized" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
echo "标准字段: $FIELDS_EXISTS 标准字段显示已集成"

# Phase 3: 样式文件检查
echo ""
echo "=== Phase 3: 样式文件状态 ==="
SCSS_EXISTS=$(test -f "frontend/src/pages/Consumables/consumables.scss" && echo "✅" || echo "❌")
echo "样式文件: $SCSS_EXISTS consumables.scss"

TOKENS_EXISTS=$(grep -q "consumable-primary\|设计令牌" frontend/src/pages/Consumables/consumables.scss 2>/dev/null && echo "✅" || echo "❌")
echo "设计令牌: $TOKENS_EXISTS CSS设计令牌已定义"

RESPONSIVE_EXISTS=$(grep -q "responsive\|mobile\|tablet" frontend/src/pages/Consumables/consumables.scss 2>/dev/null && echo "✅" || echo "❌")
echo "响应式设计: $RESPONSIVE_EXISTS 移动端适配已完成"

# Phase 4: 多语言检查 (修正路径)
echo ""
echo "=== Phase 4: 多语言状态 ==="
ZH_EXISTS=$(test -f "frontend/src/i18n/locales/zh/consumables.json" && echo "✅" || echo "❌")
echo "中文资源: $ZH_EXISTS zh/consumables.json"

EN_EXISTS=$(test -f "frontend/src/i18n/locales/en/consumables.json" && echo "✅" || echo "❌")
echo "英文资源: $EN_EXISTS en/consumables.json"

# Phase 5: 功能验证检查
echo ""
echo "=== Phase 5: 功能验证状态 ==="
UNITS_EXISTS=$(grep -q "userRegion.*metric\|imperial\|单位" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
echo "单位处理: $UNITS_EXISTS 智能单位制处理"

FALLBACK_EXISTS=$(grep -q "fallback\|降级\|兼容" frontend/src/pages/Consumables/index.tsx 2>/dev/null && echo "✅" || echo "❌")
echo "降级逻辑: $FALLBACK_EXISTS Fallback机制"

# 计算总体进度
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

echo ""
echo "📈 总体进度: $COMPLETED/$TOTAL_CHECKS ($PERCENTAGE%)"

if [ $COMPLETED -lt $TOTAL_CHECKS ]; then
  echo ""
  echo "📝 待完成任务:"
  [ "$CONFIG_EXISTS" = "❌" ] && echo "- 创建配置文件"
  [ "$HOOK_EXISTS" = "❌" ] && echo "- 创建Hook文件"
  [ "$TYPES_EXISTS" = "❌" ] && echo "- 定义类型接口"
  [ "$TOOLTIP_EXISTS" = "❌" ] && echo "- 升级Tooltip组件"
  [ "$CARD_EXISTS" = "❌" ] && echo "- 升级商品卡片为世界级设计"
  [ "$FIELDS_EXISTS" = "❌" ] && echo "- 集成标准字段显示"
  [ "$SCSS_EXISTS" = "❌" ] && echo "- 创建SCSS样式文件"
  [ "$ZH_EXISTS" = "❌" ] && echo "- 创建中文多语言资源"
  [ "$EN_EXISTS" = "❌" ] && echo "- 创建英文多语言资源"
  [ "$UNITS_EXISTS" = "❌" ] && echo "- 实现单位处理逻辑"
  
  REMAINING=$((TOTAL_CHECKS - COMPLETED))
  echo ""
  echo "⚠️ 还有 $REMAINING 个任务待完成"
else
  echo ""
  echo "🎉 Consumer页面改造已完成！"
fi

# 保存进度到文件
cat > "$PROGRESS_FILE" << EOF
{
  "status": "进行中",
  "completed_tasks": $COMPLETED,
  "total_tasks": $TOTAL_CHECKS,
  "current_phase": 3,
  "percentage": $PERCENTAGE,
  "timestamp": "$(date)"
}
EOF 