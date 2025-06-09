#!/bin/bash

# 快速应用 spec_pdf 数据库迁移脚本
# 单独执行数据库字段添加，无需重新部署整个系统

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 加载环境变量
if [ -f ".env.production" ]; then
    print_info "Loading environment variables..."
    export $(grep -v '^#' .env.production | xargs)
else
    print_error ".env.production file not found"
    exit 1
fi

# 检查Docker容器是否运行
if ! docker-compose -f docker/prod/docker-compose.prod.yml ps mysql | grep -q "Up"; then
    print_error "MySQL container is not running"
    print_info "Please start the containers first:"
    print_info "  docker-compose -f docker/prod/docker-compose.prod.yml up -d"
    exit 1
fi

print_info "Checking if spec_pdf field exists..."

# 检查 wp_bjt_host_models 表是否存在 spec_pdf 字段
spec_pdf_exists=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "SHOW COLUMNS FROM wp_bjt_host_models LIKE 'spec_pdf';" 2>/dev/null | grep spec_pdf || echo "")

if [ -z "$spec_pdf_exists" ]; then
    print_info "spec_pdf field not found, applying migration..."
    
    if [ -f "database/migrations/add_spec_pdf_to_models.sql" ]; then
        print_info "Executing database migration..."
        
        # 执行数据库迁移
        docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} < database/migrations/add_spec_pdf_to_models.sql
        
        if [ $? -eq 0 ]; then
            print_success "Database migration completed successfully"
        else
            print_error "Database migration failed"
            exit 1
        fi
    else
        print_error "Migration file not found: database/migrations/add_spec_pdf_to_models.sql"
        exit 1
    fi
else
    print_warning "spec_pdf field already exists, skipping migration"
fi

# 验证迁移结果
print_info "Verifying migration results..."

tables=("wp_bjt_host_models" "wp_bjt_accessory_models" "wp_bjt_spare_part_models")
all_success=true

for table in "${tables[@]}"; do
    result=$(docker-compose -f docker/prod/docker-compose.prod.yml exec -T mysql mysql -u root -p${MYSQL_ROOT_PASSWORD} ${MYSQL_DATABASE} -e "SHOW COLUMNS FROM $table LIKE 'spec_pdf';" 2>/dev/null | grep spec_pdf || echo "")
    
    if [ -n "$result" ]; then
        print_success "$table table: spec_pdf field verified ✓"
    else
        print_error "$table table: spec_pdf field missing ✗"
        all_success=false
    fi
done

# 重启WordPress容器以确保代码生效
print_info "Restarting WordPress container to apply changes..."
docker-compose -f docker/prod/docker-compose.prod.yml restart wordpress

print_info "Waiting for WordPress to start..."
sleep 10

if [ "$all_success" = true ]; then
    echo ""
    print_success "🎉 Migration completed successfully!"
    echo ""
    print_info "Next steps:"
    print_info "1. Test file upload functionality in the web interface"
    print_info "2. Verify that uploaded files are properly saved to database"
    print_info "3. Check that spec_pdf field appears in API responses"
    echo ""
    print_info "You can now try uploading a PDF file through the admin interface."
else
    print_error "Some migrations failed. Please check the errors above."
    exit 1
fi 