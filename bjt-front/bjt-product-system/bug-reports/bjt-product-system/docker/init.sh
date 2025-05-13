#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}BJT Product System 插件初始化${NC}"
echo "=================================="

# 等待数据库准备就绪
echo "等待数据库连接..."
until wp db check --allow-root &>/dev/null; do
  echo "数据库未就绪，等待 2 秒..."
  sleep 2
done

echo -e "${GREEN}✓${NC} 数据库连接成功"

# 检查WordPress是否已安装
if ! wp core is-installed --allow-root; then
  echo -e "${YELLOW}WordPress 尚未安装，无法继续初始化插件${NC}"
  exit 1
fi

echo "检查插件状态..."

# 检查插件是否存在
if ! wp plugin is-installed bjt-product-system --allow-root; then
  echo -e "${RED}错误: BJT Product System 插件未安装${NC}"
  exit 1
fi

# 检查冲突插件
if wp plugin is-installed bjt-product-admin --allow-root; then
  echo -e "${YELLOW}发现可能冲突的插件: bjt-product-admin${NC}"
  
  # 检查冲突插件是否已激活
  if wp plugin is-active bjt-product-admin --allow-root; then
    echo "bjt-product-admin 插件当前处于激活状态"
    echo -e "${YELLOW}停用 bjt-product-admin 插件以避免数据库冲突...${NC}"
    wp plugin deactivate bjt-product-admin --allow-root
    echo -e "${GREEN}✓${NC} bjt-product-admin 已停用"
  else
    echo "bjt-product-admin 插件已存在但未激活"
  fi
fi

# 激活我们的插件
echo "激活 BJT Product System 插件..."
wp plugin activate bjt-product-system --allow-root

# 验证激活状态
if wp plugin is-active bjt-product-system --allow-root; then
  echo -e "${GREEN}✓${NC} BJT Product System 插件已成功激活"
else
  echo -e "${RED}✗${NC} BJT Product System 插件激活失败"
  exit 1
fi

# 标记数据库表为本插件所有
echo "正在标记数据库表..."
wp eval 'if(class_exists("BJT_Table_Conflict_Manager")){BJT_Table_Conflict_Manager::mark_tables_as_ours(); echo "数据库表已成功标记为 BJT Product System 所有\n";}' --allow-root

# 检查数据库表
echo "检查数据库表结构..."
TABLES=(
  "wp_bjt_product_lines"
  "wp_bjt_host_models"
  "wp_bjt_accessory_models"
  "wp_bjt_parts"
  "wp_bjt_accessories"
  "wp_bjt_consumables"
  "wp_bjt_spare_parts"
  "wp_bjt_relations"
  "wp_bjt_prices"
  "wp_bjt_inventory"
)

TABLE_ERRORS=0
for TABLE in "${TABLES[@]}"; do
  if wp db query "SHOW TABLES LIKE '${TABLE}'" --allow-root | grep -q "${TABLE}"; then
    echo -e "${GREEN}✓${NC} 表 ${TABLE} 已存在"
  else
    echo -e "${RED}✗${NC} 表 ${TABLE} 不存在"
    TABLE_ERRORS=$((TABLE_ERRORS+1))
  fi
done

if [ $TABLE_ERRORS -gt 0 ]; then
  echo -e "${YELLOW}警告: ${TABLE_ERRORS} 个数据库表未找到，可能需要手动修复数据库${NC}"
else
  echo -e "${GREEN}✓${NC} 所有数据库表结构正常"
fi

# 生成API文档
echo "生成API文档..."
wp eval 'if(method_exists("BJT_Product_System", "generate_api_docs")){global $bjt_product_system; $bjt_product_system->generate_api_docs(); echo "API文档已成功生成\n";}' --allow-root

# 测试数据库连接
echo "测试数据库连接..."
if mysql -h mysql -u wordpress -pwordpress -e "SELECT 1" bjt_product > /dev/null 2>&1; then
    echo "数据库连接成功"
else
    echo "数据库连接失败，请检查配置"
    exit 1
fi

# 检查已有插件冲突
if wp plugin is-active bjt-product-admin --allow-root; then
    echo "警告: bjt-product-admin 插件已激活，可能与当前插件产生数据库冲突"
    echo "正在停用 bjt-product-admin 插件以避免冲突..."
    wp plugin deactivate bjt-product-admin --allow-root
fi

# 确保REST API工作正常
echo "配置WordPress REST API..."
cat > /var/www/html/.htaccess << 'EOL'
# BEGIN WordPress
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteBase /
RewriteRule ^index\.php$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.php [L]
</IfModule>
# END WordPress
EOL

# 设置固定链接
echo "设置WordPress固定链接..."
wp option update permalink_structure '/%postname%/' --allow-root

# 重启Apache以应用更改
echo "重启Apache服务..."
service apache2 reload

echo -e "${GREEN}BJT Product System 初始化完成${NC}"
echo "==================================" 