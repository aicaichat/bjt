INSERT INTO `wp_bjt_users` (`id`, `username`, `email`, `password`, `role`, `status`, `created_at`, `updated_at`, `preferred_unit`)
VALUES
  (1, 'admin', 'admin@example.com', 'hashed_password_here', 'admin', 'active', NOW(), NOW(), 'metric'),
  (2, 'sales_user', 'sales@example.com', 'hashed_password_here', 'sales', 'active', NOW(), NOW(), 'metric'),
  (3, 'euvip_customer', 'euvip@example.com', 'hashed_password_here', 'customer', 'active', NOW(), NOW(), 'imperial'),
  (4, 'au_customer', 'au@example.com', 'hashed_password_here', 'customer', 'active', NOW(), NOW(), 'metric'),
  (5, 'na_customer', 'na@example.com', 'hashed_password_here', 'customer', 'active', NOW(), NOW(), 'imperial');

INSERT INTO `wp_bjt_orders` (`id`, `user_id`, `order_number`, `total_amount`, `status`, `created_at`, `updated_at`)
VALUES
  (1, 2, 'ORD-2023-001', 5000.00, 'completed', NOW(), NOW()),
  (2, 3, 'ORD-2023-002', 200.00, 'pending', NOW(), NOW());

INSERT INTO `wp_bjt_order_items` (`id`, `order_id`, `product_line_id`, `target_type`, `target_id`, `quantity`, `price`, `created_at`, `updated_at`)
VALUES
  (1, 1, 1, 'host', 1, 1, 5000.00, NOW(), NOW()),
  (2, 2, 1, 'accessory', 1, 1, 200.00, NOW(), NOW());

INSERT INTO `wp_bjt_logs` (`id`, `user_id`, `action`, `details`, `created_at`)
VALUES
  (1, 1, 'login', 'User logged in', NOW()),
  (2, 2, 'order_created', 'Order ORD-2023-001 created', NOW()),
  (3, 3, 'order_created', 'Order ORD-2023-002 created', NOW());