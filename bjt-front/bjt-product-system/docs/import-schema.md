# BJT Product System – Import Schema Reference

该文档基于 `docker/dev/mysql/init.sql` **2025-06-26** 版本生成，列出了当前所有 `wp_bjt_…` 业务数据表的字段清单、必填列、唯一键以及默认值。前后端批量 **导出 → 编辑 → 导入** 功能需严格按照本表执行。

> ⚠️ WordPress 核心表（`wp_posts`、`wp_users` …）未列出；仅包含业务表。若后续数据库结构有变，请运行 `./scripts/update-init-sql.sh` 并同步更新本文档。

---

## 目录

| Entity 字符串 | 数据表 | 说明 |
|---------------|--------|------|
| `machine-model` | `wp_bjt_host_models` | 主机型号 |
| `accessory-model` | `wp_bjt_accessory_models` | 配件型号 |
| `spare-part-model` | `wp_bjt_spare_part_models` | 备件型号 |
| `part` | `wp_bjt_parts` | 主机料号 |
| `consumable` | `wp_bjt_consumables` | 耗材 |
| `product-line` | `wp_bjt_product_lines` | 产品线（仅管理员批量导入时使用） |
| `material` | `wp_bjt_materials` | 耗材材料 |
| `shape` | `wp_bjt_shapes` | 耗材形状 |
| `specification` | `wp_bjt_specifications` | 耗材规格尺寸 |
| `relation` | `wp_bjt_relations` | 关联层级 |
| `price` | `wp_bjt_prices` | 区域价格 |
| `inventory` | `wp_bjt_inventory` | 区域库存 |
| `accessory` | `wp_bjt_accessories` | 配件料号 |
| `spare-part` | `wp_bjt_spare_parts` | 备件料号 |
| `compatibility` | `wp_bjt_consumable_compatibility` | 耗材-主机适配 |

---

下文每节结构：

* **Headers** – 允许列（**导出顺序** = CSV 表头顺序）
* **Must** – 必填列（缺失将导致 Preview 报错）
* **Unique** – 组合唯一键，用于判断 INSERT / UPDATE
* **Defaults** – 后端自动填充默认值（若上传为空）

---

### 1. machine-model (`wp_bjt_host_models`)

- **Headers**
  `product_line_id, model, title_zh, title_en, description_zh, description_en, type, image1_url, image2_url, explosion_diagram_pdf, spec_pdf, status, sort_order`
- **Must**
  `model, title_zh`
- **Unique**
  `model`
- **Defaults**
  `status = publish`

---

### 2. accessory-model (`wp_bjt_accessory_models`)

- **Headers**
  `product_line_id, model, title_zh, title_en, description_zh, description_en, type, image1_url, image2_url, explosion_diagram_pdf, spec_pdf, status, sort_order`
- **Must**
  `product_line_id, model, title_zh`
- **Unique**
  `(product_line_id, model)`
- **Defaults**
  `status = publish`

---

### 3. spare-part-model (`wp_bjt_spare_part_models`)

- **Headers**
  `product_line_id, model, title_zh, title_en, description_zh, description_en, type, image1_url, image2_url, explosion_diagram_pdf, spec_pdf, status, sort_order`
- **Must**
  `product_line_id, model, title_zh`
- **Unique**
  `(product_line_id, model)`
- **Defaults**
  `status = publish`

---

### 4. part (`wp_bjt_parts`)

- **Headers**
  `product_line_id, model, voltage, image_url, part_number, name_zh, name_en, brand, spec, spec_imperial, package_size_cm, package_size_inch, net_weight_kg, net_weight_lbs, gross_weight_kg, gross_weight_lbs, pcs_per_box, pallet_size_cm, pallet_size_inch, pcs_per_pallet, pallet_height_cm, pallet_height_inch, pallet_gross_weight_kg, pallet_gross_weight_lbs, status, unit`
- **Must**
  `product_line_id, part_number, name_zh`
- **Unique**
  `(product_line_id, part_number)`
- **Defaults**
  `status=publish, unit=pcs`

---

### 5. consumable (`wp_bjt_consumables`)

- **Headers**
  `product_line_id, model, model_imperial, part_number, name_zh, name_en, spec, spec_imperial, brand, app_model, bag_type, material, thickness_met, thickness_imp, width_met, width_imp, length_met, length_imp, status, unit`
- **Must**
  `product_line_id, part_number, name_zh`
- **Unique**
  `(product_line_id, part_number)`
- **Defaults**
  `status=publish, unit=roll`

---

### 6. product-line (`wp_bjt_product_lines`)

- **Headers**
  `code, title_zh, title_en, description_zh, description_en, subitem1_zh, subitem1_en, subitem2_zh, subitem2_en, subitem3_zh, subitem3_en, image_url, status, sort_order`
- **Must**
  `code, title_zh`
- **Unique**
  `code`
- **Defaults**
  `status=publish, sort_order=0`

---

### 7. material (`wp_bjt_materials`)

- **Headers**
  `product_line_id, code, name_zh, name_en, base_material, status, sort_order`
- **Must**
  `product_line_id, code, name_zh`
- **Unique**
  `(product_line_id, code)`
- **Defaults**
  `status=publish`

---

### 8. shape (`wp_bjt_shapes`)

- **Headers**
  `product_line_id, code, name_zh, name_en, image_url, image_url2, status, sort_order`
- **Must**
  `product_line_id, code, name_zh`
- **Unique**
  `(product_line_id, code)`
- **Defaults**
  `status=publish`

---

### 9. specification (`wp_bjt_specifications`)

- **Headers**
  `product_line_id, spec_type, metric_value, metric_unit, imperial_value, imperial_unit, status, sort_order`
- **Must**
  `product_line_id, spec_type, metric_value, metric_unit`
- **Unique**
  `(product_line_id, spec_type, metric_value, metric_unit)`
- **Defaults**
  `status=publish`

---

### 10. relation (`wp_bjt_relations`)

- **Headers**
  `product_line_id, host_part_number, part_number, parent_part_number, child_part_number, child_type, level, quantity, required_parts, required_quantity, sort_order, status`
- **Must**
  `product_line_id, host_part_number, part_number, level, quantity`
- **Unique**
  `无`（允许多行同键组合）
- **Defaults**
  `child_type=accessory, level=1, quantity=1, status=publish`

---

### 11. price (`wp_bjt_prices`)

- **Headers**
  `product_line_id, target_type, target_id, region, currency, base_price, min_quantity, max_quantity, discount_rate, status`
- **Must**
  `product_line_id, target_type, target_id, region, currency, base_price, min_quantity`
- **Unique**
  `(product_line_id, target_type, target_id, region, min_quantity)`
- **Defaults**
  `status=active`

---

### 12. inventory (`wp_bjt_inventory`)

- **Headers**
  `product_line_id, target_type, target_id, region, warehouse, quantity, reserved, status`
- **Must**
  `product_line_id, target_type, target_id, region, warehouse`
- **Unique**
  `(product_line_id, target_type, target_id, region, warehouse)`
- **Defaults**
  `quantity=0, reserved=0, status=active`

---

### 13. accessory (`wp_bjt_accessories`)

- **Headers**
  `product_line_id, model, brand, part_number, name_zh, name_en, spec, spec_imperial, voltage, frequency, package_size_cm, package_size_inch, net_weight_kg, net_weight_lbs, gross_weight_kg, gross_weight_lbs, pcs_per_box, pallet_size_cm, pallet_size_inch, pcs_per_pallet, pallet_height_cm, pallet_height_inch, pallet_gross_weight_kg, pallet_gross_weight_lbs, image_url, status, unit, title_zh, title_en, description_zh, description_en, code, machine_id, parent_id, level, is_required, price_cny, price_usd, price_eur`
- **Must**
  `product_line_id, part_number, name_zh`
- **Unique**
  `(product_line_id, part_number)`
- **Defaults**
  `status=publish, unit=pcs, level=1, is_required=0`

---

### 14. spare-part (`wp_bjt_spare_parts`)

- **Headers**
  `product_line_id, app_model, model, is_consumable, image_url, part_number, name_zh, name_en, spec, spec_imperial, app_sn, package_size_cm, package_size_inch, net_weight_kg, net_weight_lbs, gross_weight_kg, gross_weight_lbs, pcs_per_box, required_parts, required_quantity, status, unit, title_zh, title_en, description_zh, description_en, code, machine_codes, price_cny, price_usd, price_eur`
- **Must**
  `product_line_id, part_number, name_zh`
- **Unique**
  `(product_line_id, part_number)`
- **Defaults**
  `status=publish, unit=pcs, is_consumable=0`

---

### 15. compatibility (`wp_bjt_consumable_compatibility`)

- **Headers**
  `product_line_id, consumable_part_number, host_model, status`
- **Must**
  `product_line_id, consumable_part_number, host_model`
- **Unique**
  `(product_line_id, consumable_part_number, host_model)`
- **Defaults**
  `status=publish`

---

## 更新流程

1. **数据库列变更** → ➜ 运行 `./scripts/update-init-sql.sh`
2. 比对 `docs/import-schema.md`，更新相应表的字段 / 必填 / 默认。
3. 调整 `$schema` 数组以保持同步。
4. 提交 PR，通知前端更新 `requiredFields`。 