#!/bin/bash
# Figma API 客户端 - 带缓存和 Rate Limit 处理

FIGMA_TOKEN="${FIGMA_TOKEN:-}"
FILE_KEY="QluTLuKXbauHIiCN8AZUGJ"
CACHE_FILE="$(dirname "$0")/figma-cache.json"
CACHE_TTL=3600  # 缓存有效期 1小时

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查 token
if [ -z "$FIGMA_TOKEN" ]; then
    echo -e "${RED}错误: 未设置 FIGMA_TOKEN 环境变量${NC}"
    echo "使用方法: FIGMA_TOKEN=figd_xxxx $0 <command>"
    exit 1
fi

# 缓存检查函数
check_cache() {
    local node_id=$1
    if [ -f "$CACHE_FILE" ]; then
        # 检查缓存是否过期
        local cache_age=$(($(date +%s) - $(stat -f%m "$CACHE_FILE" 2>/dev/null || stat -c%Y "$CACHE_FILE" 2>/dev/null || echo 0)))
        if [ $cache_age -lt $CACHE_TTL ]; then
            echo -e "${GREEN}使用缓存数据 (缓存年龄: ${cache_age}s)${NC}"
            return 0
        fi
    fi
    return 1
}

# API 请求函数 (带重试和延迟)
api_request() {
    local endpoint=$1
    local retry_count=0
    local max_retries=3
    local delay=2

    while [ $retry_count -lt $max_retries ]; do
        response=$(curl -s -H "X-Figma-Token: $FIGMA_TOKEN" \
            "https://api.figma.com/v1/$endpoint" 2>&1)

        # 检查是否 rate limited
        if echo "$response" | grep -q "429"; then
            retry_count=$((retry_count + 1))
            echo -e "${YELLOW}Rate limited, 等待 ${delay}s 后重试... (尝试 $retry_count/$max_retries)${NC}"
            sleep $delay
            delay=$((delay * 2))  # 指数退避
        else
            echo "$response"
            return 0
        fi
    done

    echo -e "${RED}错误: 达到最大重试次数${NC}"
    return 1
}

# 命令处理
case "$1" in
    "me")
        # 测试认证
        api_request "me" | jq '.'
        ;;
    "file")
        # 获取文件结构
        api_request "files/$FILE_KEY?depth=1" | jq '.'
        ;;
    "node")
        # 获取指定节点 (带缓存)
        node_id=$2
        if [ -z "$node_id" ]; then
            echo "用法: $0 node <node_id>"
            echo "示例: $0 node 2679:22612"
            exit 1
        fi

        # 转换 : 为 - 用于 URL
        url_node_id=$(echo "$node_id" | tr ':' '-')

        if check_cache "$node_id"; then
            echo "从缓存读取节点 $node_id 数据:"
            cat "$CACHE_FILE" | jq --arg id "$node_id" '.pages[$id] // {}'
        else
            echo -e "${YELLOW}从 API 获取节点 $node_id...${NC}"
            api_request "files/$FILE_KEY/nodes?ids=$url_node_id&depth=2" | jq '.'
        fi
        ;;
    "cache")
        # 显示缓存信息
        if [ -f "$CACHE_FILE" ]; then
            echo "缓存文件: $CACHE_FILE"
            echo "缓存内容:"
            cat "$CACHE_FILE" | jq '.'
        else
            echo "缓存文件不存在"
        fi
        ;;
    "export")
        # 导出设计令牌到 CSS
        echo "/* Figma Design Tokens - Auto Generated */"
        echo ":root {"
        cat "$CACHE_FILE" | jq -r '.tokens.colors | to_entries[] | "  \(.key): \(.value);"'
        echo "}"
        ;;
    *)
        echo "Figma API 客户端"
        echo ""
        echo "用法: FIGMA_TOKEN=figd_xxxx $0 <command>"
        echo ""
        echo "命令:"
        echo "  me       - 测试认证并显示用户信息"
        echo "  file     - 获取文件结构"
        echo "  node <id>- 获取指定节点数据 (带缓存)"
        echo "  cache    - 显示缓存信息"
        echo "  export   - 导出设计令牌为 CSS"
        echo ""
        echo "示例:"
        echo "  FIGMA_TOKEN=figd_xxx $0 me"
        echo "  FIGMA_TOKEN=figd_xxx $0 node 2679:22612"
        ;;
esac
