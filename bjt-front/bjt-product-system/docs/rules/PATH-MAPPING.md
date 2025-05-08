# BJT产品管理系统 - 路径映射规范

## 路径命名重要性

在BJT产品管理系统的UI重构过程中，**正确的文件路径和目录结构至关重要**。不遵循指定路径会导致：

- 页面无法正常加载
- 样式与设计稿不一致
- 功能失效或错误
- 与现有功能冲突
- 代码重复维护困难

## 命名规则详解

### 1. 目录命名约定

- **使用连字符分隔词语**：采用kebab-case命名法，如`host-models`
- **禁止使用驼峰命名法**：不使用`hostModels`
- **禁止使用下划线命名法**：不使用`host_models`
- **使用复数形式**：表示类别的目录使用复数形式，如`accessories`而非`accessory`
- **功能准确性**：目录名称必须精确描述功能，如`host-models`而非简单的`hosts`
- **路径层次**：保持`templates/admin/{功能目录}/{文件类型}.php`的结构

### 2. 文件命名约定

- **主列表页**：使用`list.php`（如`host-models/list.php`）
- **编辑页面**：使用`edit.php`（如`host-models/edit.php`）
- **新增页面**：使用`add.php`（如`host-models/add.php`）
- **详情页面**：使用`detail.php`（如`host-models/detail.php`）
- **关联页面**：子功能使用连字符连接，如`part-edit.php`表示料号编辑页面
- **首页/默认页**：可以使用`index.php`作为目录默认页面

## 路径映射详表

以下是系统中所有页面的路径映射关系，开发时**必须使用"新路径"**：

| 功能 | 旧路径 | 新路径（必须使用） | 状态 |
|------|--------|-------------------|------|
| **仪表盘** |
| 仪表盘首页 | `templates/admin/dashboard.php` | `templates/admin/dashboard/index.php` | ⚠️ 需迁移 |
| **产品线管理** |
| 产品线列表 | `templates/admin/product-lines.php` | `templates/admin/product-lines/list.php` | ⚠️ 需迁移 |
| 产品线编辑 | `templates/admin/product-line-edit.php` | `templates/admin/product-lines/edit.php` | ⚠️ 需迁移 |
| 产品线添加 | `templates/admin/product-line.php` | `templates/admin/product-lines/add.php` | ⚠️ 需迁移 |
| **主机管理** |
| 主机型号列表 | `templates/admin/hosts/list.php` | `templates/admin/host-models/list.php` | ⚠️ 需迁移 |
| 主机型号编辑 | `templates/admin/hosts/edit.php` | `templates/admin/host-models/edit.php` | ⚠️ 需迁移 |
| 主机型号添加 | `templates/admin/hosts/new.php` | `templates/admin/host-models/add.php` | ⚠️ 需迁移 |
| 料号编辑 | `templates/admin/hosts/part-edit.php` | `templates/admin/host-models/part-edit.php` | ⚠️ 需迁移 |
| 料号添加 | `templates/admin/hosts/part-new.php` | `templates/admin/host-models/part-add.php` | ⚠️ 需迁移 |
| **关联关系管理** |
| 关联关系列表 | 不存在 | `templates/admin/relations/list.php` | 🆕 新建 |
| 关联关系添加 | 不存在 | `templates/admin/relations/add.php` | 🆕 新建 |
| **配件管理** |
| 配件列表 | `templates/admin/parts/list.php` | `templates/admin/accessories/list.php` | ⚠️ 需迁移 |
| 配件型号编辑 | `templates/admin/parts/edit.php` | `templates/admin/accessories/edit.php` | ⚠️ 需迁移 |
| 配件型号添加 | `templates/admin/parts/new.php` | `templates/admin/accessories/add.php` | ⚠️ 需迁移 |
| 配件料号编辑 | `templates/admin/parts/item-edit.php` | `templates/admin/accessories/part-edit.php` | ⚠️ 需迁移 |
| 配件料号添加 | `templates/admin/parts/item-new.php` | `templates/admin/accessories/part-add.php` | ⚠️ 需迁移 |
| **耗材管理** |
| 耗材列表 | 不存在 | `templates/admin/consumables/list.php` | 🆕 新建 |
| 耗材编辑 | 不存在 | `templates/admin/consumables/edit.php` | 🆕 新建 |
| 形状编辑 | 不存在 | `templates/admin/consumables/shape-edit.php` | 🆕 新建 |
| 材料编辑 | 不存在 | `templates/admin/consumables/material-edit.php` | 🆕 新建 |
| **备件管理** |
| 备件列表 | `templates/admin/spares/list.php` | `templates/admin/spare-parts/list.php` | ⚠️ 需迁移 |
| 备件编辑 | `templates/admin/spares/edit.php` | `templates/admin/spare-parts/edit.php` | ⚠️ 需迁移 |
| **用户管理** |
| 用户列表 | `templates/admin/user/list.php` | `templates/admin/users/list.php` | ⚠️ 需迁移 |
| 用户编辑 | `templates/admin/user/edit.php` | `templates/admin/users/edit.php` | ⚠️ 需迁移 |
| **系统设置** |
| 系统设置 | 不存在 | `templates/admin/settings/index.php` | 🆕 新建 |
| **售后管理** |
| 售后申请列表 | 不存在 | `templates/admin/after-sales/list.php` | 🆕 新建 |
| 售后申请详情 | 不存在 | `templates/admin/after-sales/detail.php` | 🆕 新建 |
| **数据导出** |
| 数据导出 | 不存在 | `templates/admin/export/index.php` | 🆕 新建 |

## 实施指南

1. **检查现有目录结构**：在实现新页面前，确认目标目录是否已存在
2. **避免冲突**：如果发现旧目录结构与新规范冲突，请通知项目管理员
3. **提交代码前验证**：在提交代码前，确认所有文件路径符合此映射规范
4. **报告问题**：如果无法遵循规范，及时向团队报告并寻求解决方案

## 路径验证工具

推荐使用以下命令验证您实现的页面是否位于正确路径：

```bash
# 检查您的页面实现是否符合规范路径
find plugins/bjt-product-admin/templates/admin -type f -name "*.php" | grep -v -e "sidebar.php" -e "custom-header.php" | sort
```

与路径映射表中的"新路径"列对比，确保所有实现的页面都位于正确位置。

## 页面访问URL

遵循此路径规范后，页面的访问URL格式将为：
- `admin.php?page=bjt-{主功能}[&action={操作}][&id={记录ID}]`

例如：
- 主机型号列表：`admin.php?page=bjt-host-models`
- 编辑主机型号：`admin.php?page=bjt-host-models&action=edit&id=123`
- 添加新配件：`admin.php?page=bjt-accessories&action=add` 