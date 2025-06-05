#!/bin/bash

# 部署规格PDF功能脚本
# 执行日期：2024-01-XX
# 作者：开发团队

echo "=========================================="
echo "开始部署规格PDF功能..."
echo "=========================================="

# 检查当前目录
if [ ! -f "docker-compose.yml" ]; then
    echo "错误：请在项目根目录下执行此脚本"
    exit 1
fi

# 第一步：执行数据库迁移
echo "步骤1：执行数据库迁移..."
docker-compose exec mysql mysql -u wordpress -pwordpress bjt_product < database/migrations/add_spec_pdf_to_models.sql

if [ $? -eq 0 ]; then
    echo "✅ 数据库迁移完成"
else
    echo "❌ 数据库迁移失败"
    exit 1
fi

# 第二步：重启前端开发服务器以重新编译TypeScript
echo "步骤2：重启前端服务..."
docker-compose restart frontend

if [ $? -eq 0 ]; then
    echo "✅ 前端服务重启完成"
else
    echo "❌ 前端服务重启失败"
    exit 1
fi

# 第三步：重启后端服务以加载新的API变更
echo "步骤3：重启后端服务..."
docker-compose restart backend

if [ $? -eq 0 ]; then
    echo "✅ 后端服务重启完成"
else
    echo "❌ 后端服务重启失败"
    exit 1
fi

# 第四步：验证部署
echo "步骤4：验证部署..."

# 检查数据库表结构
echo "检查数据库表结构..."
RESULT=$(docker-compose exec mysql mysql -u wordpress -pwordpress bjt_product -e "SHOW COLUMNS FROM wp_bjt_host_models LIKE 'spec_pdf';" | grep spec_pdf)

if [ -n "$RESULT" ]; then
    echo "✅ wp_bjt_host_models 表 spec_pdf 字段已添加"
else
    echo "❌ wp_bjt_host_models 表 spec_pdf 字段未找到"
    exit 1
fi

RESULT=$(docker-compose exec mysql mysql -u wordpress -pwordpress bjt_product -e "SHOW COLUMNS FROM wp_bjt_accessory_models LIKE 'spec_pdf';" | grep spec_pdf)

if [ -n "$RESULT" ]; then
    echo "✅ wp_bjt_accessory_models 表 spec_pdf 字段已添加"
else
    echo "❌ wp_bjt_accessory_models 表 spec_pdf 字段未找到"
    exit 1
fi

RESULT=$(docker-compose exec mysql mysql -u wordpress -pwordpress bjt_product -e "SHOW COLUMNS FROM wp_bjt_spare_part_models LIKE 'spec_pdf';" | grep spec_pdf)

if [ -n "$RESULT" ]; then
    echo "✅ wp_bjt_spare_part_models 表 spec_pdf 字段已添加"
else
    echo "❌ wp_bjt_spare_part_models 表 spec_pdf 字段未找到"
    exit 1
fi

# 检查前端编译状态
echo "检查前端编译状态..."
sleep 10  # 等待服务完全启动

HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)

if [ "$HTTP_STATUS" = "200" ]; then
    echo "✅ 前端服务正常运行"
else
    echo "⚠️  前端服务状态码: $HTTP_STATUS，请检查服务状态"
fi

# 第五步：生成测试报告
echo "步骤5：生成功能测试清单..."

cat << EOF > deployment-checklist.md
# 规格PDF功能部署检查清单

## 数据库检查
- [x] wp_bjt_host_models 表添加 spec_pdf 字段
- [x] wp_bjt_accessory_models 表添加 spec_pdf 字段  
- [x] wp_bjt_spare_part_models 表添加 spec_pdf 字段

## 前端检查
- [x] TypeScript接口更新
- [x] 主机型号页面表单添加上传组件
- [x] PdfUploader组件创建
- [x] 导出配置更新

## 后端检查
- [x] 主机型号控制器支持spec_pdf字段
- [x] 配件型号控制器支持spec_pdf字段
- [x] 备件型号控制器支持spec_pdf字段

## 功能测试项目
- [ ] 主机型号创建时上传规格PDF
- [ ] 主机型号编辑时上传/更新规格PDF
- [ ] 配件型号创建时上传规格PDF
- [ ] 配件型号编辑时上传/更新规格PDF
- [ ] 备件型号创建时上传规格PDF
- [ ] 备件型号编辑时上传/更新规格PDF
- [ ] PDF文件查看功能
- [ ] PDF文件删除功能
- [ ] 导出功能包含spec_pdf字段
- [ ] API响应包含spec_pdf字段

## 访问地址
- 前端管理页面: http://localhost:3000/admin/machines
- API文档: http://localhost:8000/wp-json/bjt/v1/
- 数据库管理: http://localhost:8080/ (phpMyAdmin)

## 部署时间
$(date)

## 备注
1. 请确保上传目录有写权限
2. 检查文件大小限制配置
3. 验证PDF文件类型验证
4. 测试文件URL生成正确性
EOF

echo "✅ 部署检查清单已生成: deployment-checklist.md"

echo "=========================================="
echo "规格PDF功能部署完成！"
echo "请参考 deployment-checklist.md 进行功能测试"
echo "==========================================" 