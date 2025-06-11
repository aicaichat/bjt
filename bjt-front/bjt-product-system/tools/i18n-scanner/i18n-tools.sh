#!/bin/bash

# 多语言工具集 - 统一入口
# 版本: v1.0
# 使用方法: ./tools/i18n-scanner/i18n-tools.sh [命令] [参数]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMAND=${1:-"help"}

case $COMMAND in
    "scan-all")
        echo "🔍 执行全量扫描..."
        shift
        bash "$SCRIPT_DIR/scan-all.sh" "$@"
        ;;
    
    "scan-file")
        echo "📄 执行单文件扫描..."
        shift
        bash "$SCRIPT_DIR/scan-file.sh" "$@"
        ;;
        
    "quick")
        echo "⚡ 执行快速扫描..."
        shift  
        bash "$SCRIPT_DIR/quick-scan.sh" "$@"
        ;;
        
    "setup")
        echo "⚙️ 设置工具环境..."
        chmod +x "$SCRIPT_DIR"/*.sh
        echo "✅ 工具权限设置完成"
        ;;
        
    "version")
        echo "📦 多语言工具集 v1.0"
        echo "📁 工具目录: $SCRIPT_DIR"
        echo "📋 可用工具:"
        ls -la "$SCRIPT_DIR"/*.sh | grep -v i18n-tools.sh
        ;;
        
    "check-fields")
        echo "📝 检查字段名和单位规范性..."
        shift
        bash "$SCRIPT_DIR/check-fields.sh" "$@"
        ;;
        
    "help"|*)
        echo ""
        echo "🛠️  多语言工具集 - 统一入口"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "📋 用法: $0 <命令> [参数]"
        echo ""
        echo "🔍 扫描命令:"
        echo "  scan-all [目录]     - 全量扫描指定目录的多语言问题"
        echo "  scan-file <文件>    - 扫描单个文件的多语言问题"  
        echo "  quick <子命令>      - 快速扫描工具集"
        echo "  check-fields <文件>  - 检查字段名和单位规范性（对齐name统一.csv，单位显示规则：单位在字段上，值不带单位）"
        echo ""
        echo "⚙️ 管理命令:"
        echo "  setup              - 初始化工具环境(设置执行权限)"
        echo "  version            - 显示工具版本和信息"
        echo "  help               - 显示此帮助信息"
        echo ""
        echo "💡 使用示例:"
        echo "  $0 setup"
        echo "  $0 scan-all frontend/src/pages"
        echo "  $0 scan-file frontend/src/pages/Machines/index.tsx"
        echo "  $0 quick top-issues"
        echo "  $0 quick count frontend/src/pages/Profile/index.tsx"
        echo ""
        echo "📖 详细文档: docs/i18n-guides/README.md"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
esac 