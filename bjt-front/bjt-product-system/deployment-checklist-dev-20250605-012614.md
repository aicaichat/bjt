# 规格PDF功能本地开发环境部署检查清单

**部署时间**: Thu Jun  5 01:26:14 PDT 2025  
**Docker Compose文件**: docker/dev/docker-compose.nginx.yml  
**环境**: 本地开发环境  

## 🗃️ 数据库检查
- [x] wp_bjt_host_models 表添加 spec_pdf 字段
- [x] wp_bjt_accessory_models 表添加 spec_pdf 字段  
- [x] wp_bjt_spare_part_models 表添加 spec_pdf 字段

## 🔧 前端检查
- [x] TypeScript接口更新 (AdminHostModel, AdminAccessoryModel, AdminSparePartModel)
- [x] 主机型号页面表单添加上传组件
- [x] PdfUploader组件创建
- [x] 导出配置更新

## 🔌 后端检查
- [x] 主机型号控制器支持spec_pdf字段
- [x] 配件型号控制器支持spec_pdf字段
- [x] 备件型号控制器支持spec_pdf字段

## 🌐 服务状态
- [x] 前端开发服务: http://localhost:5173
- [x] WordPress后端: http://localhost:8080  
- [x] Nginx反向代理: http://localhost:80
- [x] MySQL数据库: localhost:3306

## 🧪 功能测试项目

### 主机型号管理测试
访问: http://localhost:80/admin/machines
- [ ] 创建主机型号时上传规格PDF
- [ ] 编辑主机型号时更新规格PDF
- [ ] 查看PDF文件链接
- [ ] 删除PDF文件
- [ ] 导出功能包含spec_pdf字段

### API接口测试
- [ ] GET http://localhost:8080/wp-json/bjt/v1/host-models - 响应包含spec_pdf字段
- [ ] POST http://localhost:8080/wp-json/bjt/v1/host-models - 创建时支持spec_pdf
- [ ] PUT http://localhost:8080/wp-json/bjt/v1/host-models/{id} - 更新时支持spec_pdf
- [ ] GET http://localhost:8080/wp-json/bjt/v1/accessory-models - 响应包含spec_pdf字段
- [ ] GET http://localhost:8080/wp-json/bjt/v1/spare-part-models - 响应包含spec_pdf字段

### 文件上传测试
- [ ] PDF文件类型验证正常
- [ ] 文件大小限制生效（10MB）
- [ ] 上传进度显示正常
- [ ] 文件URL生成正确
- [ ] 权限控制正常

## 🔧 开发工具
- 前端热重载: http://localhost:5173
- WordPress管理: http://localhost:8080/wp-admin
- API文档: http://localhost:8080/wp-json/bjt/v1
- 数据库管理: 推荐使用 MySQL Workbench 连接 localhost:3306

## 🐛 故障排除

### 常见问题
1. **服务无法启动**
   ```bash
   docker-compose -f docker/dev/docker-compose.nginx.yml down
   docker-compose -f docker/dev/docker-compose.nginx.yml up -d
   ```

2. **数据库连接失败**
   ```bash
   docker-compose -f docker/dev/docker-compose.nginx.yml logs mysql
   ```

3. **前端编译错误**
   ```bash
   docker-compose -f docker/dev/docker-compose.nginx.yml logs frontend
   ```

4. **重新执行迁移**
   ```bash
   ./scripts/deploy-spec-pdf-feature-dev.sh --verify-only
   ```

## 📝 下一步
1. 完成功能测试验证
2. 检查浏览器控制台确认无错误
3. 验证PDF文件上传和显示
4. 测试不同型号的CRUD操作
5. 验证导出功能

