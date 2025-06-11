#!/bin/bash

# 基于真实数据验证RelationsPage功能

set -e

API_BASE="http://wordpress-test/wp-json/bjt/v1"

echo "📊 开始真实数据验证测试..."

# 测试1: 验证主机60A01143的关系树结构
echo "🔍 测试1: 验证主机60A01143的关系树结构"
response=$(curl -s "$API_BASE/relations?product_line_id=1&host_part_number=60A01143&per_page=100")
total_relations=$(echo $response | jq '.total // 0')
echo "📊 主机60A01143总关系数: $total_relations"

if [ "$total_relations" -gt 0 ]; then
  echo "✅ 主机60A01143关系数据存在"
  
  # 检查层级分布
  level1_count=$(echo $response | jq '[.items[] | select(.level == 1)] | length')
  level2_count=$(echo $response | jq '[.items[] | select(.level == 2)] | length')  
  level3_count=$(echo $response | jq '[.items[] | select(.level == 3)] | length')
  
  echo "📊 层级分布: Level1=$level1_count, Level2=$level2_count, Level3=$level3_count"
else
  echo "❌ 主机60A01143关系数据缺失"
  exit 1
fi

# 测试2: 验证API创建关系功能
echo "🔍 测试2: 验证API创建关系功能"
create_data='{
  "product_line_id": 1,
  "host_part_number": "TEST001",
  "parent_part_number": null,
  "part_number": "TEST001",
  "child_part_number": "NEW_TEST_PART",
  "child_type": "accessory",
  "level": 1,
  "quantity": 1,
  "sort_order": 1000,
  "status": "publish"
}'

create_response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$create_data" \
  "$API_BASE/relations")

created_id=$(echo $create_response | jq -r '.id // empty')
if [ -n "$created_id" ]; then
  echo "✅ 成功创建关系，ID: $created_id"
  
  # 验证创建的关系
  get_response=$(curl -s "$API_BASE/relations/$created_id")
  retrieved_part=$(echo $get_response | jq -r '.child_part_number')
  
  if [ "$retrieved_part" == "NEW_TEST_PART" ]; then
    echo "✅ 创建的关系验证成功"
  else
    echo "❌ 创建的关系验证失败"
    exit 1
  fi
  
  # 清理测试数据
  curl -s -X DELETE "$API_BASE/relations/$created_id"
  echo "🧹 清理测试数据完成"
else
  echo "❌ 创建关系失败"
  echo "响应: $create_response"
  exit 1
fi

# 测试3: 验证层级计算逻辑
echo "🔍 测试3: 验证层级计算逻辑"
# 基于真实数据验证层级计算
# 例如: 60A01143 -> 60A04038 -> 60A04039 应该是 Level 0 -> Level 1 -> Level 2

test_relations=$(curl -s "$API_BASE/relations?host_part_number=60A01143&part_number=60A04038&per_page=10")
level1_relation=$(echo $test_relations | jq -r '.items[] | select(.child_part_number == "60A04039") | .level')

if [ "$level1_relation" == "2" ]; then
  echo "✅ 层级计算验证成功: 60A04038->60A04039 Level=$level1_relation"
else
  echo "⚠️  层级计算可能有问题: 期望Level=2, 实际Level=$level1_relation"
fi

# 测试4: 验证数据质量检查功能
echo "🔍 测试4: 验证数据质量检查功能"
all_relations=$(curl -s "$API_BASE/relations?product_line_id=1&per_page=1000")

# 检查孤儿关系
echo $all_relations | jq -r '
.items[] | 
select(.parent_part_number != null and .parent_part_number != .host_part_number) |
select(.parent_part_number as $parent | [.items[] | select(.child_part_number == $parent)] | length == 0) |
"孤儿关系: " + .host_part_number + " -> " + .part_number + " -> " + .child_part_number
' > /tmp/orphan_relations.txt

orphan_count=$(cat /tmp/orphan_relations.txt | wc -l)
echo "📊 发现孤儿关系数量: $orphan_count"

if [ "$orphan_count" -gt 0 ]; then
  echo "⚠️  存在孤儿关系:"
  cat /tmp/orphan_relations.txt | head -5
fi

# 测试5: 验证5层限制
echo "🔍 测试5: 验证5层限制"
max_level=$(echo $all_relations | jq '[.items[].level] | max')
echo "📊 当前最大层级: $max_level"

if [ "$max_level" -le 5 ]; then
  echo "✅ 层级限制验证成功，最大层级: $max_level"
else
  echo "❌ 层级限制验证失败，超过5层: $max_level"
  exit 1
fi

# 测试6: 验证特定主机的复杂关系
echo "🔍 测试6: 验证主机60A01143的复杂关系结构"

# 检查主机直接子级
direct_children=$(curl -s "$API_BASE/relations?host_part_number=60A01143&parent_part_number=null&per_page=50")
direct_count=$(echo $direct_children | jq '.items | length')
echo "📊 主机60A01143直接子级数量: $direct_count"

# 检查特定路径: 60A01143 -> 60A10001 -> 60A04004 -> 子级
path_test=$(curl -s "$API_BASE/relations?host_part_number=60A01143&part_number=60A04004&parent_part_number=60A10001&per_page=10")
path_children=$(echo $path_test | jq '.items | length')
echo "📊 路径 60A01143->60A10001->60A04004 的子级数量: $path_children"

if [ "$path_children" -gt 0 ]; then
  echo "✅ 复杂路径验证成功"
  echo $path_test | jq -r '.items[] | "  - " + .child_part_number + " (Level " + (.level | tostring) + ")"'
else
  echo "⚠️  复杂路径可能存在问题"
fi

echo "✅ 真实数据验证测试完成！" 