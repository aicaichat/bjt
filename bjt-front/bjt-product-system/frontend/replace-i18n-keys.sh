#!/bin/bash

# 递归查找所有相关文件
echo "🔍 Searching for files..."
find ./src/pages -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.jsx" \) | while read file; do
  echo "Processing $file"
  # 用正则替换 t('machines.xxx') 为 t('xxx')
  sed -i '' "s/t('machines\.\([a-zA-Z0-9_\.]*\)')/t('\1')/g" "$file"
done

echo "✅ All i18n keys replaced!" 