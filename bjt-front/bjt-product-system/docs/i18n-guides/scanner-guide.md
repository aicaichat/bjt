# 前端页面多语言和单位显示问题全量发现方法

## 🎯 核心策略：分层扫描法

```
第1层：静态代码模式扫描 → 第2层：语义分析 → 第3层：交叉验证 → 第4层：优先级分级
```

## 📋 通用问题发现命令集

### 🔍 1. 硬编码中文文本扫描

```bash
# 基础扫描命令
grep -rn "型号:\|电压(V):\|包装尺寸:\|单件净重:\|价格:\|库存:\|加载.*失败\|处理.*失败\|添加.*成功" [目标目录] --include="*.tsx" --include="*.ts"

# 完整模式扫描
grep -rn "型号:\|电压\(V\):\|电压:\|包装尺寸:\|单件净重:\|单件毛重:\|打托高度:\|整托毛重:\|单箱数量:\|托盘尺寸:\|一托数量:\|频率\(Hz\):\|价格:\|库存:\|加载.*失败\|处理.*失败\|添加.*成功\|删除.*成功\|更新.*成功\|保存.*成功\|操作.*失败\|请.*选择\|确认.*删除\|暂无.*数据\|正在.*加载\|加载.*中\.\.\." [目标目录] --include="*.tsx" --include="*.ts"

# 单文件快速检查
grep -n "型号:\|价格:\|库存:" [文件路径]
```

### ⚠️ 2. 单位重复显示扫描

```bash
# 检查单位重复模式
grep -rn "\${.*kg} kg\|\${.*lbs} lbs\|\${.*cm} cm\|\${.*inch} inch\|\${.*V} V\|\${.*Hz} Hz" [目标目录] --include="*.tsx"

# 扩展检查（包含空格变体）
grep -rn "\${.*}.*kg\|\${.*}.*lbs\|\${.*}.*cm\|\${.*}.*inch" [目标目录] --include="*.tsx"

# 模板字面量检查
grep -rn "\`.*kg.*kg\|\`.*lbs.*lbs\|\`.*cm.*cm" [目标目录] --include="*.tsx"
```

### 🌐 3. 翻译函数使用检查

```bash
# 检查未使用翻译函数的文件
for file in $(find [目标目录] -name "*.tsx" -o -name "*.ts"); do
  if ! grep -q "useTranslation\|t(" "$file" 2>/dev/null; then
    if grep -q "[\u4e00-\u9fff]" "$file" 2>/dev/null; then
      echo "❌ $file: 包含中文但未使用翻译函数"
    fi
  fi
done

# 检查翻译函数使用率
echo "翻译函数使用统计:"
grep -c "t('.*')" [文件路径]
```

### 📁 4. 翻译文件完整性检查

```bash
# 检查缺失的翻译文件
for page_file in $(find [目标目录] -name "*.tsx" | grep -E "(Page|index)"); do
  page_name=$(basename $(dirname "$page_file"))
  zh_file="frontend/src/i18n/locales/zh/${page_name,,}.json"
  en_file="frontend/src/i18n/locales/en/${page_name,,}.json"
  
  echo "页面: $page_name"
  test -f "$zh_file" && echo "✅ 中文" || echo "❌ 缺少中文翻译"
  test -f "$en_file" && echo "✅ 英文" || echo "❌ 缺少英文翻译"
done
```

### 🔀 5. 中英文混合字符串检查

```bash
# 检查中英文混合字符串
grep -rn "[a-zA-Z].*[\u4e00-\u9fff]\|[\u4e00-\u9fff].*[a-zA-Z]" [目标目录] --include="*.tsx" --include="*.ts"

# 检查特殊混合模式
grep -rn "\".*[a-zA-Z].*[\u4e00-\u9fff].*\"\|'.*[a-zA-Z].*[\u4e00-\u9fff].*'" [目标目录] --include="*.tsx"
```

## 🎯 问题分类和优先级

### 🔴 高优先级（立即修复）
- **硬编码中文文本** - 影响多语言切换
- **单位重复显示** - 影响用户体验

```bash
# 高优先级问题一键扫描
grep -rn "型号:\|价格:\|库存:\|\${.*kg} kg" [目标目录] --include="*.tsx"
```

### 🟡 中优先级（计划修复）
- **缺失翻译文件** - 影响国际化完整性
- **未使用翻译函数** - 技术债务

```bash
# 中优先级问题检查
find [目标目录] -name "*.tsx" -exec sh -c 'if ! grep -q "useTranslation\|t(" "$1" && grep -q "[\u4e00-\u9fff]" "$1"; then echo "❌ $1"; fi' _ {} \;
```

### 🔵 低优先级（优化改进）
- **中英文混合字符串** - 代码规范问题
- **翻译key命名不规范** - 维护性问题

## 📊 一键全量扫描脚本

```bash
#!/bin/bash
# 全量问题发现脚本模板

TARGET_DIR=${1:-"frontend/src/pages"}
echo "🔍 扫描目录: $TARGET_DIR"

# 1. 硬编码中文统计
hardcoded_count=$(grep -r "型号:\|价格:\|库存:\|加载.*失败" $TARGET_DIR --include="*.tsx" | wc -l)
echo "🔥 硬编码中文: $hardcoded_count 处"

# 2. 单位重复统计
unit_duplicate_count=$(grep -r "\${.*kg} kg\|\${.*cm} cm" $TARGET_DIR --include="*.tsx" | wc -l)
echo "⚠️ 单位重复: $unit_duplicate_count 处"

# 3. 缺失翻译文件统计
missing_files=0
for file in $(find $TARGET_DIR -name "*.tsx" | head -10); do
    page=$(basename $(dirname "$file"))
    if [ ! -f "frontend/src/i18n/locales/zh/${page,,}.json" ]; then
        ((missing_files++))
    fi
done
echo "📁 缺失翻译文件: $missing_files 个"

# 4. 问题总计
total=$((hardcoded_count + unit_duplicate_count + missing_files))
echo "📋 总计问题: $total 个"

# 5. 修复建议
if [ $hardcoded_count -gt 0 ]; then
    echo "🔧 优先修复硬编码中文文本"
fi
if [ $unit_duplicate_count -gt 0 ]; then
    echo "🔧 修复单位重复显示问题"
fi
```

## 🛠️ 实用命令速查表

### 快速检查单个文件
```bash
# 基础检查
grep -n "型号:\|价格:\|库存:" [文件路径]

# 详细检查
grep -n "型号:\|价格:\|库存:\|\${.*kg} kg\|useTranslation\|t(" [文件路径]

# 统计信息
echo "硬编码: $(grep -c "型号:\|价格:" [文件路径])"
echo "翻译函数: $(grep -c "t('.*')" [文件路径])"
```

### 快速检查目录
```bash
# 找出问题最多的文件
for file in $(find [目录] -name "*.tsx"); do
  count=$(grep -c "型号:\|价格:\|库存:" "$file" 2>/dev/null)
  if [ "$count" -gt 0 ]; then
    echo "$file: $count 处问题"
  fi
done | sort -k2 -nr

# 检查特定模式
grep -r "包装尺寸:" [目录] --include="*.tsx" -l | head -5
```

### 验证修复结果
```bash
# 修复前后对比
echo "修复前:"
grep -c "型号:\|价格:" [文件路径]

# 进行修复...

echo "修复后:"
grep -c "型号:\|价格:" [文件路径]

# 检查翻译函数增加
echo "翻译函数使用:"
grep -c "t('.*')" [文件路径]
```

## 🎯 使用指南

### Step 1: 全局扫描
```bash
# 使用全量扫描脚本
./scripts/find-all-i18n-issues.sh [目标目录]
```

### Step 2: 重点文件分析
```bash
# 检查问题最多的文件
./scripts/quick-find-issues.sh top-issues

# 详细分析特定文件
./scripts/scan-file.sh [文件路径]
```

### Step 3: 模式化查找
```bash
# 查找特定问题模式
grep -rn "价格:" [目录] --include="*.tsx"

# 验证修复效果
grep -c "t('.*')" [文件路径]
```

### Step 4: 批量验证
```bash
# 批量检查多个文件
for file in [文件列表]; do
  echo "检查 $file..."
  ./scripts/scan-file.sh "$file"
done
```

## 🎉 总结

**这套方法可以系统性地发现前端页面的所有多语言和单位显示问题：**

1. **全量扫描** - 发现所有类型的问题
2. **精确定位** - 准确找到问题位置  
3. **优先级分级** - 合理安排修复顺序
4. **批量处理** - 提高修复效率
5. **验证测试** - 确保修复质量

**使用这套工具，可以快速完成任何前端页面的多语言标准化改造！** 