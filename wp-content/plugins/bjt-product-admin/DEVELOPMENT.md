# BJT产品管理系统插件 - 开发说明

本文档介绍BJT产品管理系统插件的开发和发布流程，供开发人员参考。

## 目录结构

```
bjt-product-admin/
├── assets/             # CSS、JavaScript和图片资源
├── docs/               # 数据库设计和API文档
├── includes/           # PHP类和函数
│   ├── admin/          # 管理页面相关类
│   └── frontend/       # 前端展示相关类
├── languages/          # 翻译文件
├── templates/          # 模板文件
│   ├── admin/          # 后台管理模板
│   └── frontend/       # 前端展示模板
├── bjt-product-admin.php # 主插件文件
├── uninstall.php       # 卸载插件时执行的代码
├── package-plugin.sh   # 打包脚本
├── update-version.sh   # 版本更新脚本
└── README.md           # 项目说明文档
```

## 开发工作流程

1. 在本地开发环境中进行开发和测试
2. 使用Git进行版本控制
3. 完成功能开发后，更新版本号
4. 打包插件，准备部署

## 版本号管理

插件使用 `X.Y.Z` 格式的版本号：
- X: 主版本号，重大更新时增加
- Y: 次版本号，添加新功能时增加
- Z: 修订版本号，修复Bug或小改动时增加

### 更新版本号

使用 `update-version.sh` 脚本更新版本号：

```bash
./update-version.sh 1.0.1
```

此脚本会自动更新以下文件中的版本号：
- bjt-product-admin.php
- README.md (如果包含版本号)

## 打包发布

### 使用打包脚本

使用 `package-plugin.sh` 脚本创建发布版本：

```bash
./package-plugin.sh
```

此脚本会：
1. 提取当前版本号
2. 复制所有必要文件到临时目录
3. 创建ZIP压缩包
4. 将ZIP文件保存到 `packages/` 目录

生成的ZIP文件格式为：`bjt-product-admin-X.Y.Z.zip`，可以直接用于WordPress插件安装。

### 手动打包

如果需要手动打包，请确保包含以下文件和目录：
- assets/
- docs/
- includes/
- languages/
- templates/
- bjt-product-admin.php
- uninstall.php
- README.md
- LICENSE (如果有)

## 发布流程

1. 完成功能开发和测试
2. 更新版本号：`./update-version.sh X.Y.Z`
3. 更新 README.md 和文档
4. 创建打包文件：`./package-plugin.sh`
5. 部署 ZIP 文件到生产环境或提交到WordPress插件仓库

## 开发注意事项

1. 遵循WordPress编码标准
2. 所有代码应该有适当的注释
3. 保持代码模块化，便于维护
4. 确保所有功能都经过测试
5. 确保在目标版本的WordPress和PHP环境下正常工作 