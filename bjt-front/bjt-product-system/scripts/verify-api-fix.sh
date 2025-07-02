#!/bin/bash

echo "=== BJT API修复验证脚本 ==="
echo "=== BJT API Fix Verification Script ==="
echo

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查前端服务是否运行
echo -e "${BLUE}1. 检查前端开发服务器状态...${NC}"
if lsof -i :5173 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 前端服务器正在端口5173运行${NC}"
else
    echo -e "${RED}❌ 前端服务器未运行，请先启动：cd frontend && npm run dev${NC}"
    exit 1
fi

# 检查后端服务是否运行
echo -e "${BLUE}2. 检查后端WordPress服务状态...${NC}"
if curl -s http://localhost:8080/wp-json/wp/v2/ >/dev/null 2>&1; then
    echo -e "${GREEN}✓ 后端WordPress服务正在端口8080运行${NC}"
else
    echo -e "${RED}❌ 后端WordPress服务未运行或不可访问${NC}"
    echo "请检查："
    echo "  - Docker服务是否启动：docker-compose ps"
    echo "  - 端口8080是否被占用：lsof -i :8080"
    exit 1
fi

# 测试API代理
echo -e "${BLUE}3. 测试API代理功能...${NC}"

# 测试认证端点
echo "测试认证端点..."
auth_response=$(curl -s -X POST http://localhost:5173/wp-json/bjt/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password123"}' 2>/dev/null)

if echo "$auth_response" | grep -q "token"; then
    echo -e "${GREEN}✓ 认证代理正常工作${NC}"
else
    echo -e "${YELLOW}⚠️  认证代理可能有问题${NC}"
    echo "响应: $auth_response"
fi

# 测试产品线端点
echo "测试产品线端点..."
product_lines_response=$(curl -s http://localhost:5173/wp-json/bjt/v1/product-lines/ 2>/dev/null)

if [ $? -eq 0 ] && [ -n "$product_lines_response" ]; then
    echo -e "${GREEN}✓ 产品线API代理正常工作${NC}"
else
    echo -e "${YELLOW}⚠️  产品线API代理可能有问题${NC}"
fi

# 检查环境配置
echo -e "${BLUE}4. 检查环境配置...${NC}"
cd frontend

if [ -f ".env" ]; then
    echo "当前.env配置:"
    cat .env | head -10
    echo ""
    
    # 检查是否使用了相对路径
    if grep -q "VITE_API_BASE_URL=/wp-json" .env; then
        echo -e "${GREEN}✓ API配置使用相对路径（正确）${NC}"
    else
        echo -e "${YELLOW}⚠️  API配置可能仍使用绝对路径${NC}"
    fi
else
    echo -e "${RED}❌ 未找到.env文件${NC}"
fi

cd ..

# 提供下一步建议
echo ""
echo -e "${BLUE}=== 验证完成 ===${NC}"
echo ""
echo "🔍 现在请在浏览器中："
echo "1. 打开开发者工具 (F12)"
echo "2. 访问前端页面 (http://localhost:5173)"
echo "3. 查看Console标签页，应该看到代理日志："
echo "   📤 Proxying: GET /wp-json/bjt/v1/... → http://localhost:8080"
echo "4. 查看Network标签页，API请求应该返回200状态码"
echo ""
echo "如果仍有问题，请："
echo "- 检查浏览器控制台错误"
echo "- 重启前端服务器：cd frontend && npm run dev" 
echo "- 查看修复指南：docs/API_PROXY_FIX_GUIDE.md" 