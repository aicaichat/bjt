#!/bin/bash

# 字段名与单位规范性检查工具
# 用法: ./check-fields.sh <页面文件>

CSV_PATH="generated_sql_imports/name统一.csv"
TARGET_FILE="$1"

if [ -z "$TARGET_FILE" ]; then
  echo "用法: $0 <页面文件>"
  exit 1
fi

if [ ! -f "$CSV_PATH" ]; then
  echo "❌ 未找到字段规范CSV: $CSV_PATH"
  exit 1
fi

if [ ! -f "$TARGET_FILE" ]; then
  echo "❌ 未找到目标文件: $TARGET_FILE"
  exit 1
fi

# 1. 解析CSV，生成字段名映射
awk -F',' 'NR>1 && $3!="" && $4!="" {gsub(/\r|\n/, "", $0); print $2":"$3":"$4":"$5}' "$CSV_PATH" > /tmp/field_map.txt

# 2. 检查页面文件字段名与单位显示
MISMATCH=0
while IFS= read -r line; do
  FIELD_KEY=$(echo "$line" | cut -d: -f1 | xargs)
  CN_NAME=$(echo "$line" | cut -d: -f2 | xargs)
  EN_NAME=$(echo "$line" | cut -d: -f3 | xargs)
  UNIT=$(echo "$line" | cut -d: -f4 | xargs)
  # 检查中文名
  if grep -q "${CN_NAME}" "$TARGET_FILE"; then
    :
  else
    echo "❌ 字段缺失或不规范: $FIELD_KEY (应为: $CN_NAME)"
    MISMATCH=1
  fi
  # 检查英文名
  if grep -q "${EN_NAME}" "$TARGET_FILE"; then
    :
  else
    echo "❌ Field missing or not standard: $FIELD_KEY (should be: $EN_NAME)"
    MISMATCH=1
  fi
  # 检查单位显示规范
  if [ -n "$UNIT" ] && [ "$UNIT" != "" ]; then
    # 检查单位是否只在字段标题出现，值不带单位
    if grep -E "${CN_NAME}\\(${UNIT}\\)" "$TARGET_FILE" >/dev/null || grep -E "${EN_NAME}\\(${UNIT}\\)" "$TARGET_FILE" >/dev/null; then
      # 检查值是否带单位
      if grep -E "[0-9]+ ?${UNIT}" "$TARGET_FILE" >/dev/null; then
        echo "❌ 单位显示不规范: $FIELD_KEY (单位应只在字段上，值不带单位)"
        MISMATCH=1
      fi
    fi
  fi
done < /tmp/field_map.txt

if [ $MISMATCH -eq 0 ]; then
  echo "✅ 字段名与单位显示全部规范！"
else
  echo "⚠️ 发现不规范字段或单位显示，请参照name统一.csv修正。"
fi 