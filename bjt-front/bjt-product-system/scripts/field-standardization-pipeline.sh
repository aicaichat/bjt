#!/bin/bash

# 字段标准化完整执行管道
# 一键完成从分析到修复到验证的全流程

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎯 字段标准化完整执行管道${NC}"
echo "================================================"
echo ""

# 步骤1：分析现状
echo -e "${YELLOW}📊 步骤1：分析当前字段使用情况...${NC}"
node scripts/analyze-frontend-fields.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 字段分析失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 字段分析完成${NC}"
echo ""

# 步骤2：预览修复
echo -e "${YELLOW}🔍 步骤2：预览修复效果...${NC}"
node scripts/quick-field-standardization.js --dry-run
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 预览修复失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 预览修复完成${NC}"
echo ""

# 确认执行
echo -e "${YELLOW}⚠️ 即将执行实际修复，是否继续？ (y/N)${NC}"
read -r confirmation
if [[ ! "$confirmation" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}⏹️ 用户取消操作${NC}"
    exit 0
fi

# 步骤3：执行修复
echo -e "${YELLOW}🔧 步骤3：执行字段标准化修复...${NC}"
node scripts/quick-field-standardization.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 字段修复失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 字段修复完成${NC}"
echo ""

# 步骤4：重启前端服务
echo -e "${YELLOW}🚀 步骤4：重启前端服务...${NC}"
./scripts/docker-dev.sh restart-frontend
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 前端服务重启失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 前端服务重启成功${NC}"
echo ""

# 步骤5：再次分析验证改进
echo -e "${YELLOW}📈 步骤5：验证修复效果...${NC}"
# 备份原分析结果
if [ -f "output/frontend-field-analysis.json" ]; then
    cp output/frontend-field-analysis.json output/frontend-field-analysis.json.before-fix
fi

# 重新分析
node scripts/analyze-frontend-fields.js
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 修复后分析失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 修复后分析完成${NC}"
echo ""

# 步骤6：生成对比报告
echo -e "${YELLOW}📋 步骤6：生成修复对比报告...${NC}"

# 创建对比报告
cat > output/field-standardization-result.md << EOF
# 字段标准化执行结果报告

执行时间: $(date)

## 📊 修复统计

### 修复前状态
EOF

if [ -f "output/frontend-field-analysis.json.before-fix" ]; then
    echo "- 详细数据请查看: output/frontend-field-analysis.json.before-fix" >> output/field-standardization-result.md
fi

cat >> output/field-standardization-result.md << EOF

### 修复后状态
- 详细数据请查看: output/frontend-field-analysis.json

## 🎯 主要改进

- ✅ 重量单位标准化: lbs → lb
- ✅ 包装尺寸标准化: Package Size → Packaging Dim.
- ✅ 数量字段标准化: Pieces per Box → Qty per Carton
- ✅ 形状字段标准化: Shape → Film Type

## 📋 验证清单

请手动验证以下项目：

- [ ] 访问 http://localhost:5173 确认前端服务正常
- [ ] 检查耗材页面字段显示正确
- [ ] 检查配件页面字段显示正确  
- [ ] 测试多语言切换功能
- [ ] 验证筛选排序功能正常
- [ ] 检查Tooltip显示正确

## 📁 相关文件

- 修复报告: output/field-standardization-fix-report.md
- 字段分析: output/frontend-field-comparison-report.md
- 备份文件: frontend/src/i18n/locales/*/*.backup

## 🔄 回滚方法

如需回滚修改：
\`\`\`bash
# 恢复备份文件
find frontend/src/i18n/locales -name "*.backup" -exec sh -c 'mv "\$1" "\${1%.backup}"' _ {} \;
./scripts/docker-dev.sh restart-frontend
\`\`\`
EOF

echo -e "${GREEN}📋 对比报告已生成: output/field-standardization-result.md${NC}"
echo ""

# 最终总结
echo -e "${GREEN}🎉 字段标准化执行管道完成！${NC}"
echo ""
echo -e "${BLUE}📊 执行结果：${NC}"
echo "  ✅ 字段分析完成"
echo "  ✅ 字段修复完成"  
echo "  ✅ 前端服务重启成功"
echo "  ✅ 修复效果验证完成"
echo ""
echo -e "${BLUE}📁 重要文件：${NC}"
echo "  📋 修复报告: output/field-standardization-fix-report.md"
echo "  📊 分析报告: output/frontend-field-comparison-report.md"
echo "  📈 结果报告: output/field-standardization-result.md"
echo ""
echo -e "${BLUE}🌐 验证地址：${NC}"
echo "  前端服务: http://localhost:5173"
echo "  后端服务: http://localhost:8080"
echo ""
echo -e "${YELLOW}⚠️ 请手动验证页面显示和功能是否正常${NC}" 