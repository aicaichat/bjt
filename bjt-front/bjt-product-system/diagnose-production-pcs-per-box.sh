#!/bin/bash

# BJT Product System - 诊断生产环境单箱数量显示问题
# 分析为什么线上环境仍然显示 pcs_per_box=0 的字段

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

print_info "=== BJT Product System - 生产环境诊断 ==="

print_info "问题描述："
echo "- 开发环境：pcs_per_box=0 的产品不显示该字段 ✅ (正确)"
echo "- 生产环境：pcs_per_box=0 的产品仍显示该字段 ❌ (问题)"

print_info "1. 检查代码版本一致性..."

# 检查关键文件的最后修改时间
echo "关键文件修改时间："
echo "useConsumableFieldDisplay.ts: $(stat -f "%Sm" frontend/src/hooks/useConsumableFieldDisplay.ts)"
echo "Consumables/index.tsx: $(stat -f "%Sm" frontend/src/pages/Consumables/index.tsx)"

# 检查 shouldShowField 函数
echo ""
print_info "2. 验证本地代码逻辑..."
if grep -q "pcs_per_box.*Number.*> 0" frontend/src/hooks/useConsumableFieldDisplay.ts; then
    print_success "✅ 本地代码包含正确的 pcs_per_box 隐藏逻辑"
    echo "逻辑位置："
    grep -n -A 2 "pcs_per_box.*特殊处理" frontend/src/hooks/useConsumableFieldDisplay.ts
else
    print_error "❌ 本地代码缺少 pcs_per_box 隐藏逻辑"
fi

print_info "3. 分析可能的原因..."

echo "可能原因分析："
echo "🔍 A. 生产环境代码版本落后"
echo "   - 线上部署的代码可能是旧版本，缺少修复逻辑"
echo "   - 需要重新构建和部署最新代码"

echo ""
echo "🔍 B. 生产环境构建配置问题"
echo "   - 构建时可能使用了错误的环境变量"
echo "   - 代码压缩/优化过程中逻辑被改变"

echo ""
echo "🔍 C. 生产环境缓存问题"
echo "   - 浏览器缓存了旧版本的 JavaScript 文件"
echo "   - CDN 或服务器缓存了旧版本的静态资源"

echo ""
echo "🔍 D. 生产环境配置差异"
echo "   - 实际运行时的环境变量与配置文件不一致"
echo "   - Docker 容器中的配置被覆盖"

print_info "4. 生成诊断工具..."

# 生成线上环境检查脚本
cat > check-production-environment.js << 'EOF'
// 在生产环境浏览器控制台运行此脚本
// 用于诊断 pcs_per_box 显示问题

console.log('🔍 BJT 生产环境诊断开始...');

// 1. 检查环境变量
console.log('📋 环境变量检查:');
const envVars = {
  'VITE_USE_STANDARDIZED_FIELDS': import.meta.env.VITE_USE_STANDARDIZED_FIELDS,
  'VITE_ENABLE_STANDARD_FIELDS': import.meta.env.VITE_ENABLE_STANDARD_FIELDS,
  'NODE_ENV': import.meta.env.NODE_ENV,
  'MODE': import.meta.env.MODE
};

Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}: ${value}`);
});

// 2. 检查当前页面URL和环境
console.log('\n🌐 环境信息:');
console.log('当前URL:', window.location.href);
console.log('User Agent:', navigator.userAgent);
console.log('是否生产环境:', import.meta.env.PROD);

// 3. 检查页面中的产品显示
console.log('\n🔍 产品显示检查:');
const productCards = document.querySelectorAll('.consumable-product-card, .product-card, .spec-badge');
console.log(`找到 ${productCards.length} 个产品相关元素`);

let zeroQtyFound = false;
let totalQtyFields = 0;

// 查找所有可能包含 pcs_per_box 的元素
document.querySelectorAll('*').forEach(element => {
  const text = element.textContent || '';
  
  // 检查是否包含数量相关的文本
  if ((text.includes('Qty per Carton') || text.includes('单箱数量')) && 
      text.includes('0') && 
      !element.querySelector('*')) { // 确保是叶子节点
    
    totalQtyFields++;
    console.log('发现数量字段:', {
      element: element.tagName,
      class: element.className,
      text: text.trim(),
      parent: element.parentElement?.className
    });
    
    if (text.includes('0')) {
      zeroQtyFound = true;
    }
  }
});

// 4. 检查组件类型
console.log('\n🧩 组件类型检查:');
const hasStandardizedComponents = document.querySelector('.spec-badge') !== null;
const hasOldComponents = document.querySelector('.product-specs') !== null;

console.log('使用标准化组件:', hasStandardizedComponents);
console.log('使用旧版组件:', hasOldComponents);

// 5. 结果总结
console.log('\n📊 诊断结果:');
console.log(`总数量字段: ${totalQtyFields}`);
console.log(`发现零值显示: ${zeroQtyFound}`);

if (zeroQtyFound) {
  console.log('❌ 问题确认：生产环境仍在显示 pcs_per_box=0 的字段');
  console.log('💡 建议解决方案:');
  console.log('1. 检查代码版本是否为最新');
  console.log('2. 重新构建和部署前端应用');
  console.log('3. 清除浏览器和服务器缓存');
  console.log('4. 验证环境变量配置正确');
} else {
  console.log('✅ 未发现问题：pcs_per_box=0 的字段已正确隐藏');
}

// 6. 代码版本检查（如果可能）
console.log('\n🔍 尝试检查代码版本...');
try {
  // 查找可能的版本信息
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const viteScripts = scripts.filter(script => script.src.includes('assets/index-') || script.src.includes('.js'));
  
  if (viteScripts.length > 0) {
    console.log('找到构建文件:', viteScripts.map(s => s.src));
    console.log('💡 可以通过文件名hash判断是否为最新版本');
  }
} catch (e) {
  console.log('无法获取版本信息:', e.message);
}

console.log('\n✅ 诊断完成！请将结果发送给开发团队。');
EOF

print_success "✅ 已生成生产环境检查脚本: check-production-environment.js"

print_info "5. 生成修复建议..."

cat > PRODUCTION_FIX_GUIDE.md << 'EOF'
# 生产环境 pcs_per_box 显示问题修复指南

## 问题确认
- ✅ 开发环境：正确隐藏 pcs_per_box=0 的字段
- ❌ 生产环境：仍然显示 pcs_per_box=0 的字段

## 诊断步骤

### 1. 在生产环境运行诊断脚本
1. 访问生产环境的耗材页面
2. 打开浏览器开发者工具 (F12)
3. 切换到 Console 标签
4. 复制并运行 `check-production-environment.js` 中的代码
5. 记录输出结果

### 2. 检查代码版本
```bash
# 检查当前代码提交
git log --oneline -5

# 检查关键文件的最新修改
git log -p frontend/src/hooks/useConsumableFieldDisplay.ts | head -20
```

### 3. 验证构建配置
```bash
# 检查生产环境构建
cd frontend
npm run build

# 检查构建输出中的环境变量
grep -r "VITE_USE_STANDARDIZED_FIELDS" dist/ || echo "环境变量未找到"
```

## 修复方案

### 方案A：重新部署最新代码
```bash
# 1. 确保代码为最新版本
git pull origin main

# 2. 重新构建前端
cd frontend
npm install
npm run build

# 3. 重新部署
./deploy-production.sh
```

### 方案B：强制清除缓存
```bash
# 1. 清除服务器缓存
docker-compose -f docker/prod/docker-compose.prod.yml restart nginx

# 2. 更新静态资源版本
# 在 frontend/index.html 中添加版本参数
```

### 方案C：验证环境变量
```bash
# 检查生产环境容器中的实际环境变量
docker-compose -f docker/prod/docker-compose.prod.yml exec nginx env | grep VITE_
```

## 验证修复
1. 访问生产环境耗材页面
2. 检查 pcs_per_box=0 的产品是否隐藏了该字段
3. 在浏览器控制台运行诊断脚本确认修复

## 预防措施
1. 建立代码版本检查机制
2. 添加自动化测试验证字段显示逻辑
3. 部署前进行完整的回归测试
4. 建立生产环境监控告警
EOF

print_success "✅ 已生成修复指南: PRODUCTION_FIX_GUIDE.md"

print_info "6. 推荐的修复步骤..."

echo ""
print_warning "🚨 立即行动建议："
echo "1. 在生产环境运行诊断脚本确认问题"
echo "2. 检查生产环境代码版本是否为最新"
echo "3. 重新构建和部署前端应用"
echo "4. 清除所有缓存（浏览器、CDN、服务器）"

echo ""
print_info "📋 检查清单："
echo "□ 运行生产环境诊断脚本"
echo "□ 确认本地代码包含修复逻辑"
echo "□ 检查生产环境代码版本"
echo "□ 重新构建前端应用"
echo "□ 重新部署到生产环境"
echo "□ 清除浏览器和服务器缓存"
echo "□ 验证修复效果"

echo ""
print_success "诊断工具已准备完成！"
echo "请先在生产环境运行 check-production-environment.js 脚本获取详细信息。" 