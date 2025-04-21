#!/bin/bash
# BJT项目状态更新脚本
# 用于快速更新项目状态文件的简单脚本
# 使用方法: chmod +x update-status.sh 然后运行 ./update-status.sh [操作描述]

# 设置颜色变量
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # 恢复默认颜色

# 获取当前日期
DATE=$(date +"%Y-%m-%d")

# 检查参数
if [ "$#" -eq 0 ]; then
  echo -e "${YELLOW}警告: 未提供操作描述参数${NC}"
  echo "用法: ./update-status.sh [操作描述]"
  echo "示例: ./update-status.sh \"修复购物车页面样式问题\""
  
  # 如果没有提供参数，提示用户输入
  echo -e "${YELLOW}请输入操作描述:${NC}"
  read -r OPERATION
  
  if [ -z "$OPERATION" ]; then
    echo "操作已取消，未提供描述。"
    exit 1
  fi
else
  OPERATION="$1"
fi

# 检查状态
echo -e "状态 (✅ 已完成 / ⚠️ 部分完成 / ❌ 失败): "
read -r STATUS

case "$STATUS" in
  "完成" | "done" | "success" | "ok" | "yes")
    STATUS="✅"
    ;;
  "部分" | "半" | "in progress" | "partial")
    STATUS="⚠️"
    ;;
  "失败" | "fail" | "error" | "no")
    STATUS="❌"
    ;;
  *)
    if [ -z "$STATUS" ]; then
      STATUS="✅"
    fi
    ;;
esac

# 请求备注
echo -e "备注 (可选): "
read -r NOTES

if [ -z "$NOTES" ]; then
  NOTES="无"
fi

# 检查项目状态文件是否存在
if [ ! -f "PROJECT-STATUS.md" ]; then
  echo "错误: PROJECT-STATUS.md 文件不存在!"
  exit 1
fi

# 更新执行日志
echo -e "${GREEN}更新PROJECT-STATUS.md执行日志...${NC}"
# 使用sed在"执行日志"表格下添加新行
sed -i '' "/^## 执行日志/,/^#/{/^| 日期 | 操作 | 状态 | 备注 |/!{/^|---/!{/^$/!{/^#/!{/^| /!{s/^/| $DATE | $OPERATION | $STATUS | $NOTES |\n/;:a;n;ba}}}}}}' PROJECT-STATUS.md

echo -e "${GREEN}状态已更新!${NC}"
echo "已添加以下记录到执行日志:"
echo "| $DATE | $OPERATION | $STATUS | $NOTES |"
echo ""
echo -e "${YELLOW}是否要查看更新后的PROJECT-STATUS.md? (y/n)${NC}"
read -r VIEW

if [[ "$VIEW" =~ ^[Yy]$ ]]; then
  # 使用可用的分页查看器查看文件
  if command -v less &> /dev/null; then
    less PROJECT-STATUS.md
  elif command -v more &> /dev/null; then
    more PROJECT-STATUS.md
  else
    cat PROJECT-STATUS.md
  fi
fi 