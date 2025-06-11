#!/bin/bash

# 快速问题查找工具集合
# 使用方法: ./scripts/quick-find-issues.sh [命令] [文件路径]

COMMAND=${1:-"help"}
TARGET_FILE=${2:-""}

case $COMMAND in
    "hardcoded")
        echo "🔍 查找硬编码中文文本..."
        if [ -z "$TARGET_FILE" ]; then
            echo "用法: $0 hardcoded <文件路径>"
            exit 1
        fi
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        grep -n "型号:\|电压(V):\|包装尺寸:\|单件净重:\|价格:\|库存:\|加载.*失败\|处理.*失败" "$TARGET_FILE" | head -20
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
    
    "units")
        echo "⚠️ 查找单位重复显示..."
        if [ -z "$TARGET_FILE" ]; then
            echo "用法: $0 units <文件路径>"
            exit 1
        fi
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        grep -n "\${.*kg} kg\|\${.*lbs} lbs\|\${.*cm} cm\|\${.*inch} inch" "$TARGET_FILE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
    
    "count")
        echo "📊 统计当前文件问题数量..."
        if [ -z "$TARGET_FILE" ]; then
            echo "用法: $0 count <文件路径>"
            exit 1
        fi
        
        hardcoded_count=$(grep -c "型号:\|电压(V):\|包装尺寸:\|单件净重:\|价格:\|库存:\|加载.*失败" "$TARGET_FILE" 2>/dev/null || echo "0")
        unit_count=$(grep -c "\${.*kg} kg\|\${.*lbs} lbs\|\${.*cm} cm\|\${.*inch} inch" "$TARGET_FILE" 2>/dev/null || echo "0")
        t_function_count=$(grep -c "t('.*')" "$TARGET_FILE" 2>/dev/null || echo "0")
        
        echo "📄 文件: $TARGET_FILE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "🔥 硬编码中文: $hardcoded_count 处"
        echo "⚠️ 单位重复: $unit_count 处"  
        echo "🌐 翻译函数: $t_function_count 处"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
    
    "check-page")
        echo "📋 检查页面多语言状态..."
        if [ -z "$TARGET_FILE" ]; then
            echo "用法: $0 check-page <页面文件路径>"
            exit 1
        fi
        
        page_name=$(basename $(dirname "$TARGET_FILE"))
        zh_file="frontend/src/i18n/locales/zh/${page_name,,}.json"
        en_file="frontend/src/i18n/locales/en/${page_name,,}.json"
        
        echo "📄 页面: $page_name"
        echo "📁 源文件: $TARGET_FILE"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # 检查翻译文件
        if [ -f "$zh_file" ]; then
            echo "✅ 中文翻译: $zh_file"
        else
            echo "❌ 中文翻译: 缺失 $zh_file"
        fi
        
        if [ -f "$en_file" ]; then
            echo "✅ 英文翻译: $en_file"
        else
            echo "❌ 英文翻译: 缺失 $en_file"  
        fi
        
        # 检查useTranslation使用
        if grep -q "useTranslation\|t(" "$TARGET_FILE"; then
            echo "✅ 翻译函数: 已使用"
        else
            echo "❌ 翻译函数: 未使用"
        fi
        
        # 统计问题
        hardcoded=$(grep -c "型号:\|电压(V):\|包装尺寸:\|价格:\|库存:" "$TARGET_FILE" 2>/dev/null || echo "0")
        echo "📊 硬编码问题: $hardcoded 处"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
        
    "top-issues")
        echo "🔥 查找最需要修复的文件..."
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        for file in $(find frontend/src/pages -name "*.tsx" -o -name "*.ts"); do
            count=$(grep -c "型号:\|电压(V):\|包装尺寸:\|价格:\|库存:\|加载.*失败" "$file" 2>/dev/null || echo "0")
            if [ "$count" -gt 0 ]; then
                echo "📄 $file: $count 处硬编码"
            fi
        done | sort -k2 -nr | head -10
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
        
    "pattern")
        echo "🔍 查找特定模式..."
        if [ -z "$TARGET_FILE" ]; then
            echo "用法: $0 pattern <搜索模式> [目录]"
            echo "示例: $0 pattern '型号:' frontend/src/pages"
            exit 1
        fi
        
        PATTERN="$TARGET_FILE"
        SEARCH_DIR=${3:-"frontend/src/pages"}
        
        echo "🎯 搜索模式: $PATTERN"
        echo "📁 搜索目录: $SEARCH_DIR"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        grep -rn "$PATTERN" "$SEARCH_DIR" --include="*.tsx" --include="*.ts" | head -20
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
        
    "help"|*)
        echo "🛠️ 快速问题查找工具"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "用法: $0 <命令> [参数]"
        echo ""
        echo "📋 可用命令:"
        echo "  hardcoded <文件>     - 查找硬编码中文文本"
        echo "  units <文件>         - 查找单位重复显示"
        echo "  count <文件>         - 统计文件问题数量"
        echo "  check-page <文件>    - 检查页面多语言状态"
        echo "  top-issues          - 查找最需要修复的文件"
        echo "  pattern <模式> [目录] - 查找特定模式"
        echo "  help                - 显示帮助"
        echo ""
        echo "💡 示例:"
        echo "  $0 hardcoded frontend/src/pages/Machines/index.tsx"
        echo "  $0 count frontend/src/pages/Machines/index.tsx"
        echo "  $0 top-issues"
        echo "  $0 pattern '型号:' frontend/src/pages"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        ;;
esac 