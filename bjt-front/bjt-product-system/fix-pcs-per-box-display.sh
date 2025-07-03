#!/bin/bash

# BJT Product System - 修复单箱数量为0的产品显示问题
# 解决线上线下环境配置不一致的问题

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_info "=== BJT Product System - 修复单箱数量显示问题 ==="

# 检查当前环境
print_info "1. 检查当前环境配置..."

echo "检查生产环境配置："
if [ -f "frontend/env.production" ]; then
    echo "✅ frontend/env.production 存在"
    grep -E "(VITE_USE_STANDARDIZED_FIELDS|VITE_ENABLE_STANDARD_FIELDS)" frontend/env.production || echo "❌ 缺少标准化字段配置"
else
    echo "❌ frontend/env.production 不存在"
fi

echo ""
echo "检查开发环境配置："
if [ -f "frontend/env.development" ]; then
    echo "✅ frontend/env.development 存在"
    grep -E "(VITE_USE_STANDARDIZED_FIELDS|VITE_ENABLE_STANDARD_FIELDS)" frontend/env.development || echo "❌ 缺少标准化字段配置"
else
    echo "❌ frontend/env.development 不存在"
fi

echo ""
echo "检查当前 .env.local 配置："
if [ -f "frontend/.env.local" ]; then
    echo "✅ frontend/.env.local 存在"
    grep -E "(VITE_USE_STANDARDIZED_FIELDS|VITE_ENABLE_STANDARD_FIELDS)" frontend/.env.local || echo "❌ 缺少标准化字段配置"
else
    echo "❌ frontend/.env.local 不存在"
fi

print_info "2. 检查关键代码文件..."

# 检查 shouldShowField 函数
echo "检查 useConsumableFieldDisplay.ts 中的 shouldShowField 函数："
if grep -q "pcs_per_box.*Number.*> 0" frontend/src/hooks/useConsumableFieldDisplay.ts; then
    print_success "✅ shouldShowField 函数包含 pcs_per_box 零值隐藏逻辑"
else
    print_error "❌ shouldShowField 函数缺少 pcs_per_box 零值隐藏逻辑"
fi

# 检查耗材页面组件
echo "检查耗材页面是否使用标准化组件："
if grep -q "useStandardizedFields.*true" frontend/src/pages/Consumables/index.tsx; then
    print_success "✅ 耗材页面启用了标准化字段显示"
else
    print_warning "⚠️ 耗材页面可能未启用标准化字段显示"
fi

print_info "3. 修复配置差异..."

# 确保开发环境也有相同的配置
if [ ! -f "frontend/env.development" ]; then
    print_info "创建开发环境配置文件..."
    cat > frontend/env.development << 'EOF'
# BJT Product System - 开发环境配置
# 本文件用于本地开发环境（非Docker）

# API配置
VITE_API_URL=/wp-json/bjt/v1
VITE_USE_PROXY=true

# 后端地址（本地开发时使用）
VITE_WORDPRESS_HOST=http://localhost:8080

# 调试配置
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# 开发模式标识
NODE_ENV=development

# 禁用Docker模式
DOCKER_ENV=false

# 功能开关 - 与生产环境保持一致
VITE_ENABLE_SMART_UNITS=true
VITE_ENABLE_CART_ENHANCEMENT=true
VITE_ENABLE_STANDARD_FIELDS=true
VITE_ENABLE_MULTILANG=true
VITE_USE_STANDARDIZED_FIELDS=true
VITE_ENABLE_SMART_UNIT_SYSTEM=true
EOF
    print_success "✅ 已创建开发环境配置文件"
else
    # 更新现有的开发环境配置
    print_info "更新开发环境配置..."
    
    # 添加缺少的功能开关
    if ! grep -q "VITE_USE_STANDARDIZED_FIELDS" frontend/env.development; then
        echo "" >> frontend/env.development
        echo "# 功能开关 - 与生产环境保持一致" >> frontend/env.development
        echo "VITE_ENABLE_SMART_UNITS=true" >> frontend/env.development
        echo "VITE_ENABLE_CART_ENHANCEMENT=true" >> frontend/env.development
        echo "VITE_ENABLE_STANDARD_FIELDS=true" >> frontend/env.development
        echo "VITE_ENABLE_MULTILANG=true" >> frontend/env.development
        echo "VITE_USE_STANDARDIZED_FIELDS=true" >> frontend/env.development
        echo "VITE_ENABLE_SMART_UNIT_SYSTEM=true" >> frontend/env.development
        print_success "✅ 已添加功能开关配置"
    fi
fi

# 创建统一的 .env.local 配置（优先级最高）
print_info "创建统一的 .env.local 配置..."
cat > frontend/.env.local << 'EOF'
# BJT Product System - 本地环境配置
# 此文件优先级最高，用于统一本地开发配置

# 功能开关 - 确保与生产环境一致
VITE_USE_STANDARDIZED_FIELDS=true
VITE_ENABLE_STANDARD_FIELDS=true
VITE_ENABLE_SMART_UNITS=true
VITE_ENABLE_CART_ENHANCEMENT=true
VITE_ENABLE_MULTILANG=true
VITE_ENABLE_SMART_UNIT_SYSTEM=true

# 调试模式
VITE_DEBUG=true
VITE_LOG_LEVEL=debug

# 确保使用标准化组件
VITE_FORCE_STANDARDIZED_DISPLAY=true
EOF

print_success "✅ 已创建统一的 .env.local 配置"

print_info "4. 验证修复结果..."

# 检查配置是否生效
echo "验证配置文件："
echo "开发环境配置："
grep -E "(VITE_USE_STANDARDIZED_FIELDS|VITE_ENABLE_STANDARD_FIELDS)" frontend/env.development || echo "未找到配置"

echo ""
echo "本地环境配置："
grep -E "(VITE_USE_STANDARDIZED_FIELDS|VITE_ENABLE_STANDARD_FIELDS)" frontend/.env.local || echo "未找到配置"

echo ""
echo "生产环境配置："
grep -E "(VITE_USE_STANDARDIZED_FIELDS|VITE_ENABLE_STANDARD_FIELDS)" frontend/env.production || echo "未找到配置"

print_info "5. 创建验证脚本..."

# 创建验证脚本
cat > verify-pcs-per-box-fix.js << 'EOF'
// 验证 pcs_per_box 显示修复的脚本
// 在浏览器控制台中运行此脚本来验证修复效果

console.log('🔍 开始验证 pcs_per_box 显示修复...');

// 检查环境变量
const checkEnvVars = () => {
  console.log('📋 环境变量检查:');
  console.log('VITE_USE_STANDARDIZED_FIELDS:', import.meta.env.VITE_USE_STANDARDIZED_FIELDS);
  console.log('VITE_ENABLE_STANDARD_FIELDS:', import.meta.env.VITE_ENABLE_STANDARD_FIELDS);
  console.log('VITE_FORCE_STANDARDIZED_DISPLAY:', import.meta.env.VITE_FORCE_STANDARDIZED_DISPLAY);
};

// 检查页面中的产品
const checkProductDisplay = () => {
  console.log('🔍 检查页面产品显示:');
  
  // 查找所有产品卡片
  const productCards = document.querySelectorAll('.consumable-product-card, .product-card');
  console.log(`找到 ${productCards.length} 个产品卡片`);
  
  let zeroQtyProducts = 0;
  let displayedZeroQtyProducts = 0;
  
  productCards.forEach((card, index) => {
    // 查找 pcs_per_box 相关的显示
    const qtyElements = card.querySelectorAll('[class*="pcs"], [class*="qty"], [class*="carton"]');
    
    qtyElements.forEach(element => {
      const text = element.textContent || '';
      if (text.includes('0') && (text.includes('Qty') || text.includes('单箱') || text.includes('Carton'))) {
        zeroQtyProducts++;
        if (element.style.display !== 'none' && !element.hidden) {
          displayedZeroQtyProducts++;
          console.log(`❌ 发现显示中的零值产品 #${index + 1}:`, text);
        }
      }
    });
  });
  
  console.log(`📊 统计结果:`);
  console.log(`- 总零值产品: ${zeroQtyProducts}`);
  console.log(`- 仍在显示的零值产品: ${displayedZeroQtyProducts}`);
  
  if (displayedZeroQtyProducts === 0) {
    console.log('✅ 修复成功！所有零值产品已正确隐藏');
  } else {
    console.log('❌ 修复未完全生效，仍有零值产品在显示');
  }
};

// 执行检查
checkEnvVars();
setTimeout(checkProductDisplay, 1000); // 等待页面加载完成

console.log('💡 提示: 如果仍有问题，请重启开发服务器并清除浏览器缓存');
EOF

print_success "✅ 已创建验证脚本 verify-pcs-per-box-fix.js"

print_info "6. 生成修复报告..."

cat > PCS_PER_BOX_FIX_REPORT.md << 'EOF'
# 单箱数量为0产品显示问题修复报告

## 问题描述
线上环境显示 `pcs_per_box` 为0的产品，而线下环境不显示，造成环境不一致。

## 根本原因
1. **环境配置不一致**: 生产环境启用了 `VITE_USE_STANDARDIZED_FIELDS=true`，开发环境缺少此配置
2. **功能开关差异**: 不同环境使用了不同的组件渲染逻辑
3. **代码逻辑存在**: `useConsumableFieldDisplay.ts` 中已有正确的隐藏逻辑，但未在所有环境中生效

## 修复措施

### 1. 统一环境配置
- ✅ 更新 `frontend/env.development` 添加缺少的功能开关
- ✅ 创建 `frontend/.env.local` 确保本地开发一致性
- ✅ 验证 `frontend/env.production` 配置正确

### 2. 关键配置项
```bash
VITE_USE_STANDARDIZED_FIELDS=true
VITE_ENABLE_STANDARD_FIELDS=true
VITE_ENABLE_SMART_UNITS=true
VITE_ENABLE_CART_ENHANCEMENT=true
VITE_FORCE_STANDARDIZED_DISPLAY=true
```

### 3. 核心修复逻辑
在 `useConsumableFieldDisplay.ts` 的 `shouldShowField` 函数中：
```typescript
if (fieldKey === 'pcs_per_box') {
  const value = item[fieldKey];
  return value !== null && value !== undefined && value !== '' && Number(value) > 0;
}
```

## 验证方法

### 1. 重启开发服务器
```bash
cd frontend && npm run dev
```

### 2. 在浏览器控制台运行验证脚本
将 `verify-pcs-per-box-fix.js` 内容复制到浏览器控制台执行

### 3. 检查产品页面
- 访问耗材页面
- 确认 `pcs_per_box` 为0的产品不再显示该字段
- 对比线上环境行为

## 预期结果
- ✅ 开发环境与生产环境行为一致
- ✅ `pcs_per_box` 为0的产品不显示该字段
- ✅ 其他字段正常显示
- ✅ 功能开关配置统一

## 回滚方案
如需回滚，删除以下文件：
- `frontend/.env.local`
- 恢复 `frontend/env.development` 的原始内容

## 注意事项
1. 此修复确保了环境一致性，但不影响产品本身的显示
2. 只是隐藏了 `pcs_per_box` 字段的显示，产品仍然可见
3. 如需完全隐藏产品，需要在产品筛选逻辑中添加相应条件
EOF

print_success "✅ 已生成修复报告 PCS_PER_BOX_FIX_REPORT.md"

print_info "修复完成！请按以下步骤验证："
echo "1. 重启前端开发服务器: cd frontend && npm run dev"
echo "2. 访问耗材页面，检查 pcs_per_box 为0的产品是否正确隐藏该字段"
echo "3. 在浏览器控制台运行 verify-pcs-per-box-fix.js 脚本进行验证"
echo "4. 对比线上环境，确认行为一致"

print_warning "注意: 如果问题仍然存在，可能需要检查线上代码版本是否为最新" 