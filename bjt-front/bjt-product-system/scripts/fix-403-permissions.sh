#!/bin/bash

echo "=== BJT 403权限问题修复脚本 ==="
echo "=== BJT 403 Permission Issues Fix Script ==="
echo

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 检查当前目录
if [ ! -f "frontend/src/config.ts" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

echo -e "${BLUE}🔍 诊断403权限问题...${NC}"

# 1. 检查前端环境配置
echo -e "${YELLOW}1. 检查前端环境配置${NC}"
cd frontend

if [ -f ".env" ]; then
    echo "当前.env配置:"
    cat .env
    echo ""
else
    echo -e "${RED}❌ 未找到.env文件${NC}"
fi

# 检查API配置
echo -e "${BLUE}API配置检查:${NC}"
if grep -q "VITE_API_BASE_URL" .env 2>/dev/null; then
    API_URL=$(grep "VITE_API_BASE_URL" .env | cut -d'=' -f2)
    echo "API基础URL: $API_URL"
else
    echo -e "${YELLOW}⚠️  未设置VITE_API_BASE_URL${NC}"
fi

cd ..

# 2. 检查后端API控制器权限配置
echo -e "${YELLOW}2. 检查后端API权限配置${NC}"

# 检查Machine Part Controller
if [ -f "plugins/bjt-core-entities/controllers/class-machine-part-controller.php" ]; then
    echo -e "${GREEN}✓ Machine Part Controller存在${NC}"
    # 检查权限角色配置
    if grep -q "admin.*sales.*partner.*customer" plugins/bjt-core-entities/controllers/class-machine-part-controller.php; then
        echo -e "${GREEN}✓ Machine Parts权限角色配置正确${NC}"
    else
        echo -e "${RED}❌ Machine Parts权限角色配置异常${NC}"
    fi
else
    echo -e "${RED}❌ Machine Part Controller文件缺失${NC}"
fi

# 检查Relation Controller
if [ -f "plugins/bjt-core-entities/controllers/class-relation-controller.php" ]; then
    echo -e "${GREEN}✓ Relation Controller存在${NC}"
else
    echo -e "${RED}❌ Relation Controller文件缺失${NC}"
fi

# 检查Auth Controller
if [ -f "plugins/bjt-core-entities/controllers/class-auth-controller.php" ]; then
    echo -e "${GREEN}✓ Auth Controller存在${NC}"
else
    echo -e "${RED}❌ Auth Controller文件缺失${NC}"
fi

# 3. 测试API端点
echo -e "${YELLOW}3. 测试API端点可用性${NC}"

# 获取API基础URL
if [ -f "frontend/.env" ]; then
    API_BASE_URL=$(grep "VITE_API_BASE_URL\|VITE_API_URL" frontend/.env | head -1 | cut -d'=' -f2)
    if [ -z "$API_BASE_URL" ]; then
        API_BASE_URL="http://localhost:8080/wp-json/bjt/v1"
    fi
else
    API_BASE_URL="http://localhost:8080/wp-json/bjt/v1"
fi

echo "使用API基础URL: $API_BASE_URL"

# 测试认证端点
echo -e "${BLUE}测试认证端点...${NC}"
AUTH_RESPONSE=$(curl -s -w "%{http_code}" -X POST "$API_BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"username":"admin","password":"password123"}' -o /tmp/auth_response 2>/dev/null)

if [ "$AUTH_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓ 认证端点可访问${NC}"
    # 尝试提取token
    if [ -f "/tmp/auth_response" ]; then
        TOKEN=$(cat /tmp/auth_response | jq -r '.data.access_token // empty' 2>/dev/null)
        if [ -n "$TOKEN" ]; then
            echo -e "${GREEN}✓ 成功获取认证token${NC}"
        else
            echo -e "${YELLOW}⚠️  认证响应格式异常${NC}"
            cat /tmp/auth_response
        fi
    fi
else
    echo -e "${RED}❌ 认证端点访问失败 (HTTP $AUTH_RESPONSE)${NC}"
    if [ -f "/tmp/auth_response" ]; then
        cat /tmp/auth_response
    fi
fi

# 测试Machine Parts端点
echo -e "${BLUE}测试Machine Parts端点...${NC}"
if [ -n "$TOKEN" ]; then
    PARTS_RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
        "$API_BASE_URL/machineparts?page=1&per_page=1" -o /tmp/parts_response 2>/dev/null)
    
    if [ "$PARTS_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Machine Parts API可正常访问${NC}"
    else
        echo -e "${RED}❌ Machine Parts API访问失败 (HTTP $PARTS_RESPONSE)${NC}"
        if [ -f "/tmp/parts_response" ]; then
            echo "错误详情:"
            cat /tmp/parts_response
        fi
    fi
else
    echo -e "${YELLOW}⚠️  跳过Machine Parts测试（无有效token）${NC}"
fi

# 测试Relations端点
echo -e "${BLUE}测试Relations端点...${NC}"
if [ -n "$TOKEN" ]; then
    RELATIONS_RESPONSE=$(curl -s -w "%{http_code}" -H "Authorization: Bearer $TOKEN" \
        "$API_BASE_URL/relations?page=1&per_page=1" -o /tmp/relations_response 2>/dev/null)
    
    if [ "$RELATIONS_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ Relations API可正常访问${NC}"
    else
        echo -e "${RED}❌ Relations API访问失败 (HTTP $RELATIONS_RESPONSE)${NC}"
        if [ -f "/tmp/relations_response" ]; then
            echo "错误详情:"
            cat /tmp/relations_response
        fi
    fi
else
    echo -e "${YELLOW}⚠️  跳过Relations测试（无有效token）${NC}"
fi

# 4. 提供修复建议
echo ""
echo -e "${YELLOW}=== 修复建议 ===${NC}"

echo -e "${BLUE}1. 环境配置修复:${NC}"
echo "   如果API端点访问失败，请检查以下配置："
echo "   - 确保Docker服务正在运行"
echo "   - 确保WordPress后端服务可访问"
echo "   - 检查frontend/.env中的API_BASE_URL配置"

echo -e "${BLUE}2. 认证问题修复:${NC}"
echo "   如果认证失败，请："
echo "   - 检查默认用户credentials (admin/password123)"
echo "   - 确保BJT_Auth_Controller正确加载"
echo "   - 检查数据库中用户表和权限配置"

echo -e "${BLUE}3. 权限问题修复:${NC}"
echo "   如果出现403权限错误，请："
echo "   - 确保用户角色为 admin, sales, partner, 或 customer"
echo "   - 确保用户状态为 active"
echo "   - 检查\$GLOBALS['bjt_current_user']是否正确设置"

echo -e "${BLUE}4. 快速修复命令:${NC}"
echo "   运行以下命令进行自动修复："
echo "   ./scripts/fix-403-permissions.sh --fix"

# 5. 自动修复选项
if [ "$1" = "--fix" ]; then
    echo ""
    echo -e "${YELLOW}=== 执行自动修复 ===${NC}"
    
    # 修复前端环境配置
    echo -e "${BLUE}修复前端环境配置...${NC}"
    cd frontend
    
    # 备份现有配置
    if [ -f ".env" ]; then
        cp .env .env.backup.$(date +%s)
        echo -e "${GREEN}✓ 已备份现有.env配置${NC}"
    fi
    
    # 创建新的环境配置
    cat > .env << EOF
# 修复后的环境配置
VITE_USE_MOCK_DATA=false
VITE_API_BASE_URL=http://localhost:8080/wp-json/bjt/v1
VITE_API_URL=http://localhost:8080/wp-json/bjt/v1
VITE_USE_MOCK_CART=false
VITE_DEBUG=true
VITE_ENABLE_AUTH_RETRY=true
EOF
    
    echo -e "${GREEN}✓ 已更新前端环境配置${NC}"
    cd ..
    
    # 重启前端开发服务器提示
    echo -e "${YELLOW}⚠️  请重启前端开发服务器以应用新配置${NC}"
    echo "   cd frontend && npm run dev"
fi

# 清理临时文件
rm -f /tmp/auth_response /tmp/parts_response /tmp/relations_response

echo ""
echo -e "${GREEN}=== 诊断完成 ===${NC}"
echo "如需详细帮助，请查看修复指南或联系技术支持" 