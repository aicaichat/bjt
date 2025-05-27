-- Generated SQL from Excel
-- Date: 2025-05-16 01:30:38
-- Tables: wp_bjt_product_lines, wp_bjt_shapes
-- Dialect: MYSQL

INSERT INTO `wp_bjt_product_lines` (`id`, `title_zh`, `title_en`, `description_zh`, `description_en`, `image_url`, `code`, `status`, `sort_order`) VALUES
  (5, '新产品线', 'New Product Line', '这是一个新产品线描述', 'This is a new product line description', '/images/shop/new.jpg', 'new_line', 'publish', 50),
  (6, '测试产品线', 'Test Product Line', '测试产品线描述', 'Test product line description', '/images/shop/test.jpg', 'test_line', 'publish', 60),
  (7, NULL, NULL, NULL, NULL, NULL, NULL, 'draft', 70);
INSERT INTO `wp_bjt_shapes` (`id`, `product_line_id`, `code`, `name_en`, `name_zh`, `image_url`, `status`, `sort_order`) VALUES
  (4, 1, 'square', 'square', '方形', '/images/shop/square.jpg', 'publish', 40),
  (5, 2, 'triangle', 'triangle', '三角形', '/images/shop/triangle.jpg', 'publish', 50),
  (6, 3, 'hexagon', 'hexagon', '六边形', '/images/shop/hexagon.jpg', 'draft', 60);