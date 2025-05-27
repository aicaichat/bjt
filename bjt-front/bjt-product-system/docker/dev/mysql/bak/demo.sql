- Insert sample product line data
INSERT INTO `wp_bjt_product_lines` (`title_zh`, `title_en`, `description_zh`, `description_en`, `subitem1_zh`, `subitem1_en`, `subitem2_zh`, `subitem2_en`, `subitem3_zh`, `subitem3_en`, `image_url`, `code`, `status`, `sort_order`)
VALUES 
  ('气垫机', 'Air Cushion Machine', '专业气垫包装解决方案，提供高效防震保护。', 'Professional air cushion packaging solutions offering efficient shock protection.', '缓冲包装', 'Buffer Packaging', '防震保护', 'Shock Protection', '物流包装', 'Logistics Packaging', '/uploads/product_lines/air_cushion.jpg', 'air_cushion', 'publish', 10),
  ('纸机', 'Paper Machine', '高质量纸包装系统，适用于各种包装需求。', 'High-quality paper packaging systems suitable for various packaging needs.', '包装纸', 'Packing Paper', '纸箱生产', 'Carton Production', '环保包装', 'Eco-friendly Packaging', '/uploads/product_lines/paper_machine.jpg', 'paper_machine', 'publish', 20),
  ('胶带机', 'Tape Machine', '专业封箱设备，提高包装效率和安全性。', 'Professional box sealing equipment to improve packaging efficiency and security.', '封箱胶带', 'Sealing Tape', '自动封箱', 'Automatic Sealing', '安全封装', 'Secure Packaging', '/uploads/product_lines/tape_machine.jpg', 'tape_machine', 'publish', 30),
  ('气柱袋', 'Air Column Bag', '优质气柱袋产品，提供卓越的物品保护。', 'Premium air column bag products providing excellent item protection.', '缓冲气柱', 'Buffer Air Column', '易碎品保护', 'Fragile Protection', '快递专用', 'Express Delivery', '/uploads/product_lines/air_column.jpg', 'air_column', 'publish', 40);

-- Insert sample host model data
INSERT INTO `wp_bjt_host_models` (`product_line_id`, `model`, `model_name`, `name_en`, `description_zh`, `description_en`, `type`, `image1_url`, `image2_url`, `explosion_diagram_pdf`, `status`, `sort_order`)
VALUES
  (1, 'LA-E4S', '气垫机E4S', 'Air Cushion E4S', '高效率小型气垫机，适合小规模包装工作。', 'High-efficiency small air cushion machine suitable for small-scale packaging work.', '小型', '/uploads/host_models/la-e4s-main.jpg', '/uploads/host_models/la-e4s-alt.jpg', '/uploads/host_models/la-e4s-diagram.pdf', 'publish', 10),
  (1, 'LA-E5P', '气垫机E5P', 'Air Cushion E5P', '中等规模气垫机，高速运行，适合中等规模包装工作。', 'Medium-scale air cushion machine with high-speed operation suitable for medium-scale packaging work.', '中型', '/uploads/host_models/la-e5p-main.jpg', '/uploads/host_models/la-e5p-alt.jpg', '/uploads/host_models/la-e5p-diagram.pdf', 'publish', 20),
  (1, 'LA-E6L', '气垫机E6L', 'Air Cushion E6L', '大型工业级气垫机，高产能，适合大规模包装生产线。', 'Large industrial air cushion machine with high productivity suitable for large-scale packaging production lines.', '大型', '/uploads/host_models/la-e6l-main.jpg', '/uploads/host_models/la-e6l-alt.jpg', '/uploads/host_models/la-e6l-diagram.pdf', 'publish', 30),
  (1, 'LA-E7X', '气垫机E7X专业版', 'Air Cushion E7X Pro', '专业级气垫机，配备智能控制系统，适合高精度包装需求。', 'Professional air cushion machine equipped with smart control system suitable for high-precision packaging requirements.', '专业型', '/uploads/host_models/la-e7x-main.jpg', '/uploads/host_models/la-e7x-alt.jpg', '/uploads/host_models/la-e7x-diagram.pdf', 'publish', 40),
  (2, 'PM-100', '纸机100基础版', 'Paper Machine 100 Basic', '基础型纸包装机，适合小型企业使用。', 'Basic paper packaging machine suitable for small businesses.', '基础型', '/uploads/host_models/pm-100-main.jpg', '/uploads/host_models/pm-100-alt.jpg', '/uploads/host_models/pm-100-diagram.pdf', 'publish', 10),
  (2, 'PM-200', '纸机200标准版', 'Paper Machine 200 Standard', '标准型纸包装机，适合中型企业使用。', 'Standard paper packaging machine suitable for medium-sized businesses.', '标准型', '/uploads/host_models/pm-200-main.jpg', '/uploads/host_models/pm-200-alt.jpg', '/uploads/host_models/pm-200-diagram.pdf', 'publish', 20),
  (2, 'PM-300', '纸机300高级版', 'Paper Machine 300 Advanced', '高级型纸包装机，配备自动切割系统，适合大型企业使用。', 'Advanced paper packaging machine with automatic cutting system suitable for large businesses.', '高级型', '/uploads/host_models/pm-300-main.jpg', '/uploads/host_models/pm-300-alt.jpg', '/uploads/host_models/pm-300-diagram.pdf', 'publish', 30),
  (3, 'TM-200', '胶带机200标准版', 'Tape Machine 200 Standard', '标准型胶带封箱机，适合各类包装作业。', 'Standard tape sealing machine suitable for various packaging operations.', '标准型', '/uploads/host_models/tm-200-main.jpg', '/uploads/host_models/tm-200-alt.jpg', '/uploads/host_models/tm-200-diagram.pdf', 'publish', 10),
  (3, 'TM-300', '胶带机300高速版', 'Tape Machine 300 High-Speed', '高速型胶带封箱机，适合高产量包装作业。', 'High-speed tape sealing machine suitable for high-volume packaging operations.', '高速型', '/uploads/host_models/tm-300-main.jpg', '/uploads/host_models/tm-300-alt.jpg', '/uploads/host_models/tm-300-diagram.pdf', 'publish', 20),
  (3, 'TM-400', '胶带机400自动版', 'Tape Machine 400 Automatic', '全自动胶带封箱机，配备智能识别系统，适合自动化生产线。', 'Fully automatic tape sealing machine with intelligent recognition system suitable for automated production lines.', '自动型', '/uploads/host_models/tm-400-main.jpg', '/uploads/host_models/tm-400-alt.jpg', '/uploads/host_models/tm-400-diagram.pdf', 'publish', 30);

-- Insert sample accessory models data
INSERT INTO `wp_bjt_accessory_models` (`product_line_id`, `model`, `title_zh`, `title_en`, `description_zh`, `description_en`, `type`, `image1_url`, `image2_url`, `status`, `sort_order`)
VALUES
  (1, 'AC-E4-FP1', '气垫机E4系列充气泵', 'Air Pump for E4 Series', 'E4系列专用充气泵，提供稳定气流。', 'Dedicated air pump for E4 series, providing stable airflow.', '充气泵', '/uploads/accessory_models/ac-e4-fp1-main.jpg', '/uploads/accessory_models/ac-e4-fp1-alt.jpg', 'publish', 10),
  (1, 'AC-E5-FP2', '气垫机E5系列充气泵', 'Air Pump for E5 Series', 'E5系列专用高效充气泵，适合长时间工作。', 'High-efficiency air pump for E5 series, suitable for long-time operation.', '充气泵', '/uploads/accessory_models/ac-e5-fp2-main.jpg', '/uploads/accessory_models/ac-e5-fp2-alt.jpg', 'publish', 20),
  (1, 'AC-E6-FP3', '气垫机E6系列充气泵', 'Air Pump for E6 Series', 'E6系列专用工业级充气泵，适合高强度工作。', 'Industrial-grade air pump for E6 series, suitable for high-intensity work.', '充气泵', '/uploads/accessory_models/ac-e6-fp3-main.jpg', '/uploads/accessory_models/ac-e6-fp3-alt.jpg', 'publish', 30),
  (1, 'AC-E4-CTR', '气垫机E4系列控制器', 'Controller for E4 Series', 'E4系列专用控制器，简易操作界面。', 'Dedicated controller for E4 series with simple operation interface.', '控制器', '/uploads/accessory_models/ac-e4-ctr-main.jpg', '/uploads/accessory_models/ac-e4-ctr-alt.jpg', 'publish', 15),
  (1, 'AC-E5-CTR', '气垫机E5系列控制器', 'Controller for E5 Series', 'E5系列专用控制器，带LCD显示屏。', 'Dedicated controller for E5 series with LCD screen.', '控制器', '/uploads/accessory_models/ac-e5-ctr-main.jpg', '/uploads/accessory_models/ac-e5-ctr-alt.jpg', 'publish', 25),
  (1, 'AC-E6-CTR', '气垫机E6系列控制器', 'Controller for E6 Series', 'E6系列专用智能控制器，带触摸屏和多种工作模式。', 'Smart controller for E6 series with touch screen and multiple working modes.', '控制器', '/uploads/accessory_models/ac-e6-ctr-main.jpg', '/uploads/accessory_models/ac-e6-ctr-alt.jpg', 'publish', 35),
  (2, 'PM-CT-100', '纸机100切纸器', 'Paper Cutter for PM-100', '纸机100系列专用切纸器，手动调节。', 'Dedicated paper cutter for PM-100 series with manual adjustment.', '切纸器', '/uploads/accessory_models/pm-ct-100-main.jpg', '/uploads/accessory_models/pm-ct-100-alt.jpg', 'publish', 10),
  (2, 'PM-CT-200', '纸机200切纸器', 'Paper Cutter for PM-200', '纸机200系列专用切纸器，半自动调节。', 'Dedicated paper cutter for PM-200 series with semi-automatic adjustment.', '切纸器', '/uploads/accessory_models/pm-ct-200-main.jpg', '/uploads/accessory_models/pm-ct-200-alt.jpg', 'publish', 20),
  (2, 'PM-FD-200', '纸机200折叠器', 'Paper Folder for PM-200', '纸机200系列专用折叠器，可调节折叠角度。', 'Dedicated paper folder for PM-200 series with adjustable folding angle.', '折叠器', '/uploads/accessory_models/pm-fd-200-main.jpg', '/uploads/accessory_models/pm-fd-200-alt.jpg', 'publish', 25),
  (3, 'TM-DR-200', '胶带机200驱动电机', 'Drive Motor for TM-200', '胶带机200系列专用驱动电机，稳定可靠。', 'Dedicated drive motor for TM-200 series, stable and reliable.', '驱动电机', '/uploads/accessory_models/tm-dr-200-main.jpg', '/uploads/accessory_models/tm-dr-200-alt.jpg', 'publish', 10),
  (3, 'TM-CT-300', '胶带机300切割装置', 'Cutting Device for TM-300', '胶带机300系列专用高速切割装置，精准切割。', 'High-speed cutting device for TM-300 series with precise cutting.', '切割装置', '/uploads/accessory_models/tm-ct-300-main.jpg', '/uploads/accessory_models/tm-ct-300-alt.jpg', 'publish', 20),
  (3, 'TM-TS-400', '胶带机400张力系统', 'Tension System for TM-400', '胶带机400系列专用智能张力控制系统，确保胶带平整。', 'Intelligent tension control system for TM-400 series ensuring flat tape application.', '张力系统', '/uploads/accessory_models/tm-ts-400-main.jpg', '/uploads/accessory_models/tm-ts-400-alt.jpg', 'publish', 30);

-- Insert sample parts data
INSERT INTO `wp_bjt_parts` (`product_line_id`, `model`, `voltage`, `image_url`, `part_number`, `name_zh`, `name_en`, `brand`, `spec`, `spec_imperial`, `package_size_cm`, `package_size_inch`, `net_weight_kg`, `net_weight_lbs`, `status`)
VALUES
  (1, 'LA-E4S', '220V', '/uploads/parts/13a00001.jpg', '13A00001', 'E4S主机-标准版', 'E4S Host-Standard', 'BJT', '30x20x15cm', '11.8x7.9x5.9in', '35x25x20cm', '13.8x9.8x7.9in', 5.2, 11.46, 'publish'),
  (1, 'LA-E4S', '110V', '/uploads/parts/13a00002.jpg', '13A00002', 'E4S主机-美标版', 'E4S Host-US Version', 'BJT', '30x20x15cm', '11.8x7.9x5.9in', '35x25x20cm', '13.8x9.8x7.9in', 5.2, 11.46, 'publish'),
  (1, 'LA-E5P', '220V', '/uploads/parts/13a00003.jpg', '13A00003', 'E5P主机-标准版', 'E5P Host-Standard', 'BJT', '40x25x20cm', '15.7x9.8x7.9in', '45x30x25cm', '17.7x11.8x9.8in', 7.5, 16.53, 'publish'),
  (1, 'LA-E5P', '110V', '/uploads/parts/13a00004.jpg', '13A00004', 'E5P主机-美标版', 'E5P Host-US Version', 'BJT', '40x25x20cm', '15.7x9.8x7.9in', '45x30x25cm', '17.7x11.8x9.8in', 7.5, 16.53, 'publish'),
  (1, 'LA-E6L', '220V', '/uploads/parts/13a00005.jpg', '13A00005', 'E6L主机-标准版', 'E6L Host-Standard', 'BJT', '50x30x25cm', '19.7x11.8x9.8in', '55x35x30cm', '21.7x13.8x11.8in', 12.8, 28.22, 'publish'),
  (1, 'LA-E6L', '110V', '/uploads/parts/13a00006.jpg', '13A00006', 'E6L主机-美标版', 'E6L Host-US Version', 'BJT', '50x30x25cm', '19.7x11.8x9.8in', '55x35x30cm', '21.7x13.8x11.8in', 12.8, 28.22, 'publish'),
  (1, 'LA-E7X', '220V', '/uploads/parts/13a00007.jpg', '13A00007', 'E7X主机-标准版', 'E7X Host-Standard', 'BJT', '55x35x28cm', '21.7x13.8x11.0in', '60x40x35cm', '23.6x15.7x13.8in', 15.6, 34.39, 'publish'),
  (1, 'LA-E7X', '110V', '/uploads/parts/13a00008.jpg', '13A00008', 'E7X主机-美标版', 'E7X Host-US Version', 'BJT', '55x35x28cm', '21.7x13.8x11.0in', '60x40x35cm', '23.6x15.7x13.8in', 15.6, 34.39, 'publish'),
  (2, 'PM-100', '220V', '/uploads/parts/23p00001.jpg', '23P00001', 'PM100主机-标准版', 'PM100 Host-Standard', 'BJT', '70x45x50cm', '27.6x17.7x19.7in', '75x50x55cm', '29.5x19.7x21.7in', 35.0, 77.16, 'publish'),
  (2, 'PM-200', '220V', '/uploads/parts/23p00002.jpg', '23P00002', 'PM200主机-标准版', 'PM200 Host-Standard', 'BJT', '80x50x55cm', '31.5x19.7x21.7in', '85x55x60cm', '33.5x21.7x23.6in', 42.0, 92.59, 'publish'),
  (2, 'PM-300', '220V', '/uploads/parts/23p00003.jpg', '23P00003', 'PM300主机-标准版', 'PM300 Host-Standard', 'BJT', '90x60x65cm', '35.4x23.6x25.6in', '95x65x70cm', '37.4x25.6x27.6in', 58.5, 128.97, 'publish'),
  (3, 'TM-200', '220V', '/uploads/parts/33t00001.jpg', '33T00001', 'TM200主机-标准版', 'TM200 Host-Standard', 'BJT', '60x40x30cm', '23.6x15.7x11.8in', '65x45x35cm', '25.6x17.7x13.8in', 18.2, 40.12, 'publish'),
  (3, 'TM-300', '220V', '/uploads/parts/33t00002.jpg', '33T00002', 'TM300主机-标准版', 'TM300 Host-Standard', 'BJT', '65x45x35cm', '25.6x17.7x13.8in', '70x50x40cm', '27.6x19.7x15.7in', 22.6, 49.82, 'publish'),
  (3, 'TM-400', '220V', '/uploads/parts/33t00003.jpg', '33T00003', 'TM400主机-标准版', 'TM400 Host-Standard', 'BJT', '75x50x40cm', '29.5x19.7x15.7in', '80x55x45cm', '31.5x21.7x17.7in', 28.4, 62.61, 'publish'),
  
  -- 添加新的料号数据，对应截图中的主机型号
  (1, 'AC-2000', '220V', '/uploads/parts/11a20001.jpg', '11A20001', 'AC-2000主机-标准版', 'AC-2000 Host-Standard', 'BJT', '52x32x25cm', '20.5x12.6x9.8in', '58x38x30cm', '22.8x15.0x11.8in', 13.5, 29.76, 'publish'),
  (1, 'AC-2000', '110V', '/uploads/parts/11a20002.jpg', '11A20002', 'AC-2000主机-美标版', 'AC-2000 Host-US Version', 'BJT', '52x32x25cm', '20.5x12.6x9.8in', '58x38x30cm', '22.8x15.0x11.8in', 13.5, 29.76, 'publish'),
  (1, 'AC-1500', '220V', '/uploads/parts/11a15001.jpg', '11A15001', 'AC-1500主机-标准版', 'AC-1500 Host-Standard', 'BJT', '45x28x20cm', '17.7x11.0x7.9in', '50x33x25cm', '19.7x13.0x9.8in', 10.2, 22.49, 'publish'),
  (1, 'AC-1500', '110V', '/uploads/parts/11a15002.jpg', '11A15002', 'AC-1500主机-美标版', 'AC-1500 Host-US Version', 'BJT', '45x28x20cm', '17.7x11.0x7.9in', '50x33x25cm', '19.7x13.0x9.8in', 10.2, 22.49, 'publish'),
  (2, 'PM-100', '110V', '/uploads/parts/21p10001.jpg', '21P10001', 'PM100主机-美标版', 'PM100 Host-US Version', 'BJT', '70x45x50cm', '27.6x17.7x19.7in', '75x50x55cm', '29.5x19.7x21.7in', 35.0, 77.16, 'publish'),
  (2, 'PM-200', '110V', '/uploads/parts/21p20001.jpg', '21P20001', 'PM200主机-美标版', 'PM200 Host-US Version', 'BJT', '80x50x55cm', '31.5x19.7x21.7in', '85x55x60cm', '33.5x21.7x23.6in', 42.0, 92.59, 'publish'),
  (3, 'TM-50', '220V', '/uploads/parts/31t50001.jpg', '31T50001', 'TM50主机-标准版', 'TM50 Host-Standard', 'BJT', '55x35x25cm', '21.7x13.8x9.8in', '60x40x30cm', '23.6x15.7x11.8in', 15.8, 34.83, 'publish'),
  (3, 'TM-50', '110V', '/uploads/parts/31t50002.jpg', '31T50002', 'TM50主机-美标版', 'TM50 Host-US Version', 'BJT', '55x35x25cm', '21.7x13.8x9.8in', '60x40x30cm', '23.6x15.7x11.8in', 15.8, 34.83, 'publish'),
  
  -- 为每个主机型号添加配件料号
  (1, 'AC-2000', '220V', '/uploads/parts/11a20101.jpg', '11A20101', 'AC-2000控制板', 'AC-2000 Control Board', 'BJT', '15x10x2cm', '5.9x3.9x0.8in', '20x15x5cm', '7.9x5.9x2.0in', 0.35, 0.77, 'publish'),
  (1, 'AC-2000', '220V', '/uploads/parts/11a20102.jpg', '11A20102', 'AC-2000电源', 'AC-2000 Power Supply', 'BJT', '12x8x5cm', '4.7x3.1x2.0in', '15x10x8cm', '5.9x3.9x3.1in', 0.95, 2.09, 'publish'),
  (1, 'AC-1500', '220V', '/uploads/parts/11a15101.jpg', '11A15101', 'AC-1500控制板', 'AC-1500 Control Board', 'BJT', '12x8x2cm', '4.7x3.1x0.8in', '18x12x5cm', '7.1x4.7x2.0in', 0.28, 0.62, 'publish'),
  (1, 'AC-1500', '220V', '/uploads/parts/11a15102.jpg', '11A15102', 'AC-1500电源', 'AC-1500 Power Supply', 'BJT', '10x7x4cm', '3.9x2.8x1.6in', '15x10x7cm', '5.9x3.9x2.8in', 0.75, 1.65, 'publish'),
  (2, 'PM-100', '220V', '/uploads/parts/21p10101.jpg', '21P10101', 'PM-100切纸模块', 'PM-100 Cutting Module', 'BJT', '25x15x8cm', '9.8x5.9x3.1in', '30x20x12cm', '11.8x7.9x4.7in', 2.3, 5.07, 'publish'),
  (2, 'PM-200', '220V', '/uploads/parts/21p20101.jpg', '21P20101', 'PM-200切纸模块', 'PM-200 Cutting Module', 'BJT', '30x18x10cm', '11.8x7.1x3.9in', '35x25x15cm', '13.8x9.8x5.9in', 3.2, 7.05, 'publish'),
  (3, 'TM-50', '220V', '/uploads/parts/31t50101.jpg', '31T50101', 'TM-50胶带机构', 'TM-50 Tape Mechanism', 'BJT', '18x12x8cm', '7.1x4.7x3.1in', '22x16x10cm', '8.7x6.3x3.9in', 1.8, 3.97, 'publish');

-- Insert sample accessories data
INSERT INTO `wp_bjt_accessories` (`product_line_id`, `model`, `brand`, `part_number`, `name_zh`, `name_en`, `spec`, `spec_imperial`, `voltage`, `frequency`, `image_url`, `status`)
VALUES
  (1, 'AC-E4-FP1', 'BJT', '14B00001', 'E4充气泵组件', 'E4 Air Pump Assembly', '12x8x6cm', '4.7x3.1x2.4in', '220V', '50Hz', '/uploads/accessories/14b00001.jpg', 'publish'),
  (1, 'AC-E4-FP1', 'BJT', '14B00002', 'E4充气泵组件-美规', 'E4 Air Pump Assembly-US', '12x8x6cm', '4.7x3.1x2.4in', '110V', '60Hz', '/uploads/accessories/14b00002.jpg', 'publish'),
  (1, 'AC-E5-FP2', 'BJT', '14B00003', 'E5充气泵组件', 'E5 Air Pump Assembly', '15x10x8cm', '5.9x3.9x3.1in', '220V', '50Hz', '/uploads/accessories/14b00003.jpg', 'publish'),
  (1, 'AC-E5-FP2', 'BJT', '14B00004', 'E5充气泵组件-美规', 'E5 Air Pump Assembly-US', '15x10x8cm', '5.9x3.9x3.1in', '110V', '60Hz', '/uploads/accessories/14b00004.jpg', 'publish'),
  (1, 'AC-E6-FP3', 'BJT', '14B00005', 'E6充气泵组件', 'E6 Air Pump Assembly', '18x12x10cm', '7.1x4.7x3.9in', '220V', '50Hz', '/uploads/accessories/14b00005.jpg', 'publish'),
  (1, 'AC-E6-FP3', 'BJT', '14B00006', 'E6充气泵组件-美规', 'E6 Air Pump Assembly-US', '18x12x10cm', '7.1x4.7x3.9in', '110V', '60Hz', '/uploads/accessories/14b00006.jpg', 'publish'),
  (1, 'AC-E4-CTR', 'BJT', '14C00001', 'E4控制器', 'E4 Controller', '10x8x3cm', '3.9x3.1x1.2in', '220V', '50Hz', '/uploads/accessories/14c00001.jpg', 'publish'),
  (1, 'AC-E4-CTR', 'BJT', '14C00002', 'E4控制器-美规', 'E4 Controller-US', '10x8x3cm', '3.9x3.1x1.2in', '110V', '60Hz', '/uploads/accessories/14c00002.jpg', 'publish'),
  (1, 'AC-E5-CTR', 'BJT', '14C00003', 'E5控制器', 'E5 Controller', '12x10x4cm', '4.7x3.9x1.6in', '220V', '50Hz', '/uploads/accessories/14c00003.jpg', 'publish'),
  (1, 'AC-E5-CTR', 'BJT', '14C00004', 'E5控制器-美规', 'E5 Controller-US', '12x10x4cm', '4.7x3.9x1.6in', '110V', '60Hz', '/uploads/accessories/14c00004.jpg', 'publish'),
  (1, 'AC-E6-CTR', 'BJT', '14C00005', 'E6控制器', 'E6 Controller', '15x12x5cm', '5.9x4.7x2.0in', '220V', '50Hz', '/uploads/accessories/14c00005.jpg', 'publish'),
  (1, 'AC-E6-CTR', 'BJT', '14C00006', 'E6控制器-美规', 'E6 Controller-US', '15x12x5cm', '5.9x4.7x2.0in', '110V', '60Hz', '/uploads/accessories/14c00006.jpg', 'publish'),
  (2, 'PM-CT-100', 'BJT', '24C00001', 'PM100切纸器', 'PM100 Paper Cutter', '30x10x5cm', '11.8x3.9x2.0in', 'N/A', 'N/A', '/uploads/accessories/24c00001.jpg', 'publish'),
  (2, 'PM-CT-200', 'BJT', '24C00002', 'PM200切纸器', 'PM200 Paper Cutter', '35x12x6cm', '13.8x4.7x2.4in', '220V', '50Hz', '/uploads/accessories/24c00002.jpg', 'publish'),
  (2, 'PM-FD-200', 'BJT', '24F00001', 'PM200折叠器', 'PM200 Paper Folder', '25x15x8cm', '9.8x5.9x3.1in', '220V', '50Hz', '/uploads/accessories/24f00001.jpg', 'publish'),
  (3, 'TM-DR-200', 'BJT', '34D00001', 'TM200驱动电机', 'TM200 Drive Motor', '15x12x10cm', '5.9x4.7x3.9in', '220V', '50Hz', '/uploads/accessories/34d00001.jpg', 'publish'),
  (3, 'TM-CT-300', 'BJT', '34C00001', 'TM300切割装置', 'TM300 Cutting Device', '20x15x8cm', '7.9x5.9x3.1in', 'N/A', 'N/A', '/uploads/accessories/34c00001.jpg', 'publish'),
  (3, 'TM-TS-400', 'BJT', '34T00001', 'TM400张力系统', 'TM400 Tension System', '25x18x12cm', '9.8x7.1x4.7in', '220V', '50Hz', '/uploads/accessories/34t00001.jpg', 'publish');

-- Insert sample consumables data
INSERT INTO `wp_bjt_consumables` (`product_line_id`, `model`, `model_imperial`, `part_number`, `spec`, `spec_imperial`, `brand`, `app_model`, `bag_type`, `material`, `thickness_met`, `thickness_imp`, `width_met`, `width_imp`, `length_met`, `length_imp`, `bubble_diameter_met`, `bubble_diameter_imp`, `total_length_met`, `total_length_imp`, `package_type`, `image_url`, `status`)
VALUES
  (1, 'ACF-200', 'ACF-200', '15F00001', '20cm宽x200m长', '7.9in x 656ft', 'BJT', 'LA-E4S,LA-E5P', '标准气垫膜', 'LDPE', 25.0, 1.0, 20.0, 7.9, 200.0, 656.2, 1.0, 0.4, 200.0, 656.2, '卷装', '/uploads/consumables/15f00001.jpg', 'publish'),
  (1, 'ACF-300', 'ACF-300', '15F00002', '30cm宽x200m长', '11.8in x 656ft', 'BJT', 'LA-E5P,LA-E6L', '大气垫膜', 'LDPE', 30.0, 1.2, 30.0, 11.8, 200.0, 656.2, 2.0, 0.8, 200.0, 656.2, '卷装', '/uploads/consumables/15f00002.jpg', 'publish'),
  (1, 'ACF-400', 'ACF-400', '15F00003', '40cm宽x150m长', '15.7in x 492ft', 'BJT', 'LA-E6L,LA-E7X', '特大气垫膜', 'LDPE', 35.0, 1.4, 40.0, 15.7, 150.0, 492.1, 3.0, 1.2, 150.0, 492.1, '卷装', '/uploads/consumables/15f00003.jpg', 'publish'),
  (2, 'PPR-100', 'PPR-100', '25P00001', '10cm宽x500m长', '3.9in x 1640ft', 'BJT', 'PM-100', '标准包装纸', '牛皮纸', 120.0, 4.7, 10.0, 3.9, 500.0, 1640.4, NULL, NULL, 500.0, 1640.4, '卷装', '/uploads/consumables/25p00001.jpg', 'publish'),
  (2, 'PPR-200', 'PPR-200', '25P00002', '20cm宽x500m长', '7.9in x 1640ft', 'BJT', 'PM-200', '中号包装纸', '牛皮纸', 150.0, 5.9, 20.0, 7.9, 500.0, 1640.4, NULL, NULL, 500.0, 1640.4, '卷装', '/uploads/consumables/25p00002.jpg', 'publish'),
  (2, 'PPR-300', 'PPR-300', '25P00003', '30cm宽x400m长', '11.8in x 1312ft', 'BJT', 'PM-300', '大号包装纸', '牛皮纸', 180.0, 7.1, 30.0, 11.8, 400.0, 1312.3, NULL, NULL, 400.0, 1312.3, '卷装', '/uploads/consumables/25p00003.jpg', 'publish'),
  (3, 'TPE-100', 'TPE-100', '35T00001', '4.8cm宽x60m长', '1.9in x 197ft', 'BJT', 'TM-200', '标准封箱胶带', 'OPP', 45.0, 1.8, 4.8, 1.9, 60.0, 196.9, NULL, NULL, 60.0, 196.9, '卷装', '/uploads/consumables/35t00001.jpg', 'publish'),
  (3, 'TPE-200', 'TPE-200', '35T00002', '6.0cm宽x80m长', '2.4in x 262ft', 'BJT', 'TM-300', '重型封箱胶带', 'OPP', 50.0, 2.0, 6.0, 2.4, 80.0, 262.5, NULL, NULL, 80.0, 262.5, '卷装', '/uploads/consumables/35t00002.jpg', 'publish'),
  (3, 'TPE-300', 'TPE-300', '35T00003', '7.2cm宽x100m长', '2.8in x 328ft', 'BJT', 'TM-400', '超重型封箱胶带', 'OPP', 55.0, 2.2, 7.2, 2.8, 100.0, 328.1, NULL, NULL, 100.0, 328.1, '卷装', '/uploads/consumables/35t00003.jpg', 'publish'),
  (4, 'ACB-100', 'ACB-100', '45B00001', '15x20x4cm', '5.9x7.9x1.6in', 'BJT', 'N/A', '小型气柱袋', 'LDPE', 60.0, 2.4, 15.0, 5.9, 20.0, 7.9, NULL, NULL, NULL, NULL, '单片', '/uploads/consumables/45b00001.jpg', 'publish'),
  (4, 'ACB-200', 'ACB-200', '45B00002', '25x30x5cm', '9.8x11.8x2.0in', 'BJT', 'N/A', '中型气柱袋', 'LDPE', 70.0, 2.8, 25.0, 9.8, 30.0, 11.8, NULL, NULL, NULL, NULL, '单片', '/uploads/consumables/45b00002.jpg', 'publish'),
  (4, 'ACB-300', 'ACB-300', '45B00003', '35x40x6cm', '13.8x15.7x2.4in', 'BJT', 'N/A', '大型气柱袋', 'LDPE', 80.0, 3.1, 35.0, 13.8, 40.0, 15.7, NULL, NULL, NULL, NULL, '单片', '/uploads/consumables/45b00003.jpg', 'publish');

-- Insert sample spare parts data
INSERT INTO `wp_bjt_spare_parts` (`product_line_id`, `app_model`, `is_consumable`, `image_url`, `part_number`, `name_zh`, `name_en`, `spec`, `spec_imperial`, `app_sn`, `required_parts`, `required_quantity`, `status`)
VALUES
  (1, 'LA-E4S', 0, '/uploads/spare_parts/16p00001.jpg', '16P00001', 'E4S气泵皮膜', 'E4S Pump Membrane', '8x8x0.2cm', '3.1x3.1x0.08in', 'All', NULL, NULL, 'publish'),
  (1, 'LA-E4S', 0, '/uploads/spare_parts/16p00002.jpg', '16P00002', 'E4S加热丝', 'E4S Heating Wire', '15cm长', '5.9in length', 'All', '16P00010,16P00011', '1,2', 'publish'),
  (1, 'LA-E5P', 0, '/uploads/spare_parts/16p00003.jpg', '16P00003', 'E5P气泵皮膜', 'E5P Pump Membrane', '10x10x0.3cm', '3.9x3.9x0.12in', 'All', NULL, NULL, 'publish'),
  (1, 'LA-E5P', 0, '/uploads/spare_parts/16p00004.jpg', '16P00004', 'E5P加热丝', 'E5P Heating Wire', '20cm长', '7.9in length', 'All', '16P00010,16P00011', '1,3', 'publish'),
  (1, 'LA-E6L', 0, '/uploads/spare_parts/16p00005.jpg', '16P00005', 'E6L气泵皮膜', 'E6L Pump Membrane', '12x12x0.4cm', '4.7x4.7x0.16in', 'All', NULL, NULL, 'publish'),
  (1, 'LA-E6L', 0, '/uploads/spare_parts/16p00006.jpg', '16P00006', 'E6L加热丝', 'E6L Heating Wire', '25cm长', '9.8in length', 'All', '16P00011,16P00012', '4,1', 'publish'),
  (1, 'LA-E7X', 0, '/uploads/spare_parts/16p00007.jpg', '16P00007', 'E7X气泵皮膜', 'E7X Pump Membrane', '15x15x0.5cm', '5.9x5.9x0.2in', 'All', NULL, NULL, 'publish'),
  (1, 'LA-E7X', 0, '/uploads/spare_parts/16p00008.jpg', '16P00008', 'E7X加热丝', 'E7X Heating Wire', '30cm长', '11.8in length', 'All', '16P00011,16P00012', '5,2', 'publish'),
  (1, 'LA-E4S,LA-E5P,LA-E6L,LA-E7X', 1, '/uploads/spare_parts/16p00009.jpg', '16P00009', '气垫机通用刀片', 'Universal Cutter Blade', '5cm长', '2.0in length', 'All', NULL, NULL, 'publish'),
  (1, 'LA-E4S,LA-E5P,LA-E6L,LA-E7X', 0, '/uploads/spare_parts/16p00010.jpg', '16P00010', '气垫机绝缘垫片', 'Insulation Gasket', '2cm直径', '0.8in diameter', 'All', NULL, NULL, 'publish'),
  (1, 'LA-E4S,LA-E5P,LA-E6L,LA-E7X', 0, '/uploads/spare_parts/16p00011.jpg', '16P00011', '气垫机密封圈', 'Sealing Ring', '3cm直径', '1.2in diameter', 'All', NULL, NULL, 'publish'),
  (1, 'LA-E6L,LA-E7X', 0, '/uploads/spare_parts/16p00012.jpg', '16P00012', '高温绝缘垫', 'High-Temp Insulation Pad', '5cm直径', '2.0in diameter', 'All', NULL, NULL, 'publish'),
  (2, 'PM-100', 0, '/uploads/spare_parts/26p00001.jpg', '26P00001', 'PM100切纸刀片', 'PM100 Cutting Blade', '30cm长', '11.8in length', 'All', '26P00005', '2', 'publish'),
  (2, 'PM-200', 0, '/uploads/spare_parts/26p00002.jpg', '26P00002', 'PM200切纸刀片', 'PM200 Cutting Blade', '35cm长', '13.8in length', 'All', '26P00005,26P00006', '2,1', 'publish'),
  (2, 'PM-300', 0, '/uploads/spare_parts/26p00003.jpg', '26P00003', 'PM300切纸刀片', 'PM300 Cutting Blade', '40cm长', '15.7in length', 'All', '26P00005,26P00006', '3,2', 'publish'),
  (2, 'PM-200,PM-300', 1, '/uploads/spare_parts/26p00004.jpg', '26P00004', '纸机皮带', 'Paper Machine Belt', '60cm长x3cm宽', '23.6in x 1.2in', 'All', NULL, NULL, 'publish'),
  (2, 'PM-100,PM-200,PM-300', 0, '/uploads/spare_parts/26p00005.jpg', '26P00005', '纸机刀片固定螺丝', 'Blade Fixing Screw', '1cm长', '0.4in length', 'All', NULL, NULL, 'publish'),
  (2, 'PM-200,PM-300', 0, '/uploads/spare_parts/26p00006.jpg', '26P00006', '纸机导向轮', 'Guide Wheel', '4cm直径', '1.6in diameter', 'All', NULL, NULL, 'publish'),
  (3, 'TM-200', 0, '/uploads/spare_parts/36p00001.jpg', '36P00001', 'TM200切刀', 'TM200 Cutter', '8cm长', '3.1in length', 'All', '36P00005', '2', 'publish'),
  (3, 'TM-300', 0, '/uploads/spare_parts/36p00002.jpg', '36P00002', 'TM300切刀', 'TM300 Cutter', '10cm长', '3.9in length', 'All', '36P00005,36P00006', '3,1', 'publish'),
  (3, 'TM-400', 0, '/uploads/spare_parts/36p00003.jpg', '36P00003', 'TM400切刀', 'TM400 Cutter', '12cm长', '4.7in length', 'All', '36P00005,36P00006', '4,2', 'publish'),
  (3, 'TM-200,TM-300,TM-400', 1, '/uploads/spare_parts/36p00004.jpg', '36P00004', '胶带机压轮', 'Tape Machine Pressure Wheel', '5cm直径', '2.0in diameter', 'All', NULL, NULL, 'publish'),
  (3, 'TM-200,TM-300,TM-400', 0, '/uploads/spare_parts/36p00005.jpg', '36P00005', '胶带机刀片垫片', 'Cutter Gasket', '1cm直径', '0.4in diameter', 'All', NULL, NULL, 'publish'),
  (3, 'TM-300,TM-400', 0, '/uploads/spare_parts/36p00006.jpg', '36P00006', '胶带机张力弹簧', 'Tension Spring', '3cm长', '1.2in length', 'All', NULL, NULL, 'publish');

-- Insert sample relations data
INSERT INTO `wp_bjt_relations` (`product_line_id`, `parent_part_number`, `child_part_number`, `child_type`, `level`, `quantity`, `status`, `sort_order`)
VALUES
  -- 气垫机E4S与配件关系
  (1, '13A00001', '14B00001', 'accessory', 1, 1, 'publish', 10),
  (1, '13A00001', '14C00001', 'accessory', 1, 1, 'publish', 20),
  (1, '13A00002', '14B00002', 'accessory', 1, 1, 'publish', 10),
  (1, '13A00002', '14C00002', 'accessory', 1, 1, 'publish', 20),
  
  -- 气垫机E5P与配件关系
  (1, '13A00003', '14B00003', 'accessory', 1, 1, 'publish', 10),
  (1, '13A00003', '14C00003', 'accessory', 1, 1, 'publish', 20),
  (1, '13A00004', '14B00004', 'accessory', 1, 1, 'publish', 10),
  (1, '13A00004', '14C00004', 'accessory', 1, 1, 'publish', 20),
  
  -- 气垫机E6L与配件关系
  (1, '13A00005', '14B00005', 'accessory', 1, 1, 'publish', 10),
  (1, '13A00005', '14C00005', 'accessory', 1, 1, 'publish', 20),
  (1, '13A00006', '14B00006', 'accessory', 1, 1, 'publish', 10),
  (1, '13A00006', '14C00006', 'accessory', 1, 1, 'publish', 20),
  
  -- 主机与备件关系
  (1, '13A00001', '16P00001', 'spare_part', 1, 1, 'publish', 10),
  (1, '13A00001', '16P00002', 'spare_part', 1, 1, 'publish', 20),
  (1, '13A00001', '16P00009', 'spare_part', 1, 2, 'publish', 30),
  
  (1, '13A00003', '16P00003', 'spare_part', 1, 1, 'publish', 10),
  (1, '13A00003', '16P00004', 'spare_part', 1, 1, 'publish', 20),
  (1, '13A00003', '16P00009', 'spare_part', 1, 2, 'publish', 30),
  
  (1, '13A00005', '16P00005', 'spare_part', 1, 1, 'publish', 10),
  (1, '13A00005', '16P00006', 'spare_part', 1, 1, 'publish', 20),
  (1, '13A00005', '16P00009', 'spare_part', 1, 2, 'publish', 30),
  
  -- 纸机与配件关系
  (2, '23P00001', '24C00001', 'accessory', 1, 1, 'publish', 10),
  (2, '23P00002', '24C00002', 'accessory', 1, 1, 'publish', 10),
  (2, '23P00002', '24F00001', 'accessory', 1, 1, 'publish', 20),
  
  -- 纸机与备件关系
  (2, '23P00001', '26P00001', 'spare_part', 1, 1, 'publish', 10),
  (2, '23P00002', '26P00002', 'spare_part', 1, 1, 'publish', 10),
  (2, '23P00002', '26P00004', 'spare_part', 1, 1, 'publish', 20),
  (2, '23P00003', '26P00003', 'spare_part', 1, 1, 'publish', 10),
  (2, '23P00003', '26P00004', 'spare_part', 1, 1, 'publish', 20),
  
  -- 胶带机与配件关系
  (3, '33T00001', '34D00001', 'accessory', 1, 1, 'publish', 10),
  (3, '33T00002', '34C00001', 'accessory', 1, 1, 'publish', 10),
  (3, '33T00003', '34T00001', 'accessory', 1, 1, 'publish', 10),
  
  -- 胶带机与备件关系
  (3, '33T00001', '36P00001', 'spare_part', 1, 1, 'publish', 10),
  (3, '33T00001', '36P00004', 'spare_part', 1, 2, 'publish', 20),
  (3, '33T00002', '36P00002', 'spare_part', 1, 1, 'publish', 10),
  (3, '33T00002', '36P00004', 'spare_part', 1, 2, 'publish', 20),
  (3, '33T00003', '36P00003', 'spare_part', 1, 1, 'publish', 10),
  (3, '33T00003', '36P00004', 'spare_part', 1, 2, 'publish', 20); 

-- Insert sample specifications data
INSERT INTO `wp_bjt_specifications` (`product_line_id`, `spec_type`, `metric_value`, `metric_unit`, `imperial_value`, `imperial_unit`, `status`, `sort_order`)
VALUES
  -- 厚度规格
  (1, 'thickness', 25.0, 'um', 1.0, 'mil', 'publish', 10),
  (1, 'thickness', 30.0, 'um', 1.2, 'mil', 'publish', 20),
  (1, 'thickness', 35.0, 'um', 1.4, 'mil', 'publish', 30),
  (1, 'thickness', 40.0, 'um', 1.6, 'mil', 'publish', 40),
  
  -- 宽度规格
  (1, 'width', 20.0, 'cm', 7.9, 'in', 'publish', 10),
  (1, 'width', 30.0, 'cm', 11.8, 'in', 'publish', 20),
  (1, 'width', 40.0, 'cm', 15.7, 'in', 'publish', 30),
  (1, 'width', 50.0, 'cm', 19.7, 'in', 'publish', 40),
  
  -- 长度规格
  (1, 'length', 150.0, 'm', 492.1, 'ft', 'publish', 10),
  (1, 'length', 200.0, 'm', 656.2, 'ft', 'publish', 20),
  (1, 'length', 250.0, 'm', 820.2, 'ft', 'publish', 30),
  (1, 'length', 300.0, 'm', 984.3, 'ft', 'publish', 40),
  
  -- 纸张重量规格
  (2, 'weight', 120.0, 'gsm', 3.5, 'oz/yd²', 'publish', 10),
  (2, 'weight', 150.0, 'gsm', 4.4, 'oz/yd²', 'publish', 20),
  (2, 'weight', 180.0, 'gsm', 5.3, 'oz/yd²', 'publish', 30);

-- Insert sample consumable compatibility data
INSERT INTO `wp_bjt_consumable_compatibility` (`product_line_id`, `consumable_part_number`, `host_model`, `status`)
VALUES
  -- 气垫膜兼容性
  (1, '15F00001', 'LA-E4S', 'publish'),
  (1, '15F00001', 'LA-E5P', 'publish'),
  (1, '15F00002', 'LA-E5P', 'publish'),
  (1, '15F00002', 'LA-E6L', 'publish'),
  (1, '15F00003', 'LA-E6L', 'publish'),
  (1, '15F00003', 'LA-E7X', 'publish'),
  
  -- 包装纸兼容性
  (2, '25P00001', 'PM-100', 'publish'),
  (2, '25P00002', 'PM-200', 'publish'),
  (2, '25P00003', 'PM-300', 'publish'),
  
  -- 胶带兼容性
  (3, '35T00001', 'TM-200', 'publish'),
  (3, '35T00002', 'TM-300', 'publish'),
  (3, '35T00003', 'TM-400', 'publish');

-- -------------------------------------
-- 数据库维护和一致性说明
-- -------------------------------------
/*
以上脚本创建了BJT产品管理系统所需的所有表结构和示例数据。请注意以下事项：

1. 外键关系
   此脚本未显式定义外键约束，但使用了索引和命名约定来确保数据完整性。
   在实际使用中，请确保关联字段的值正确（例如 product_line_id 必须是有效的产品线ID）。

2. 数据更新
   更新数据时，请使用适当的WHERE条件以避免意外修改多行数据。
   建议先使用SELECT语句测试WHERE条件，然后再执行UPDATE或DELETE操作。

3. 数据备份
   定期备份数据库是保护数据安全的重要措施。可以使用以下命令：
   
   备份：
   mysqldump -u [username] -p bjt_product > bjt_product_backup.sql
   
   恢复：
   mysql -u [username] -p bjt_product < bjt_product_backup.sql

4. 性能优化
   - 对于大批量插入数据，建议使用LOAD DATA INFILE或INSERT批量语句
   - 使用EXPLAIN分析查询性能
   - 定期运行OPTIMIZE TABLE优化表结构

5. 字段说明
   - 所有ID字段为自增长主键
   - status字段用于软删除和状态管理，值通常为'publish'、'draft'或'trash'
   - created_at和updated_at自动记录创建和更新时间
   - sort_order字段用于自定义排序
*/

-- Test Data for Host Model ID 1 Accessories

-- Accessory Models (assuming product_line_id 1 exists)
-- Use higher IDs (e.g., 501, 502, 503) to avoid conflict with existing sample data
INSERT INTO `wp_bjt_accessory_models` (`id`, `product_line_id`, `model`, `title_zh`, `title_en`, `level`, `status`, `image1_url`) VALUES
(501, 1, 'ACC-L1-001-TEST', '测试配件1级-001', 'Test Accessory L1-001', 1, 'publish', '/uploads/accessories/acc-l1-001.jpg'),
(502, 1, 'ACC-L1-002-TEST', '测试配件1级-002', 'Test Accessory L1-002', 1, 'publish', '/uploads/accessories/acc-l1-002.jpg'),
(503, 1, 'ACC-L2-001-TEST', '测试配件2级-001', 'Test Accessory L2-001', 2, 'publish', '/uploads/accessories/acc-l2-001.jpg');

-- Create Part Numbers for the new Test Accessory Models in wp_bjt_accessories
INSERT INTO `wp_bjt_accessories` (`product_line_id`, `model`, `brand`, `part_number`, `name_zh`, `name_en`, `image_url`, `status`) VALUES
(1, 'ACC-L1-001-TEST', 'TEST_BRAND', 'PN-ACC-TEST-501', '测试配件1级-001 (料号ID 501)', 'Test Accessory L1-001 (PN ID 501)', '/uploads/accessories/acc-l1-001.jpg', 'publish'),
(1, 'ACC-L1-002-TEST', 'TEST_BRAND', 'PN-ACC-TEST-502', '测试配件1级-002 (料号ID 502)', 'Test Accessory L1-002 (PN ID 502)', '/uploads/accessories/acc-l1-002.jpg', 'publish'),
(1, 'ACC-L2-001-TEST', 'TEST_BRAND', 'PN-ACC-TEST-503', '测试配件2级-001 (料号ID 503)', 'Test Accessory L2-001 (PN ID 503)', '/uploads/accessories/acc-l2-001.jpg', 'publish');

-- Link Accessories to Host Model ID 1 (LA-E4S, part_number 13A00001) using wp_bjt_relations
-- Host LA-E4S (Part Number 13A00001) is parent. Accessories are children.
INSERT INTO `wp_bjt_relations` (`product_line_id`, `parent_part_number`, `child_part_number`, `child_type`, `level`, `quantity`, `status`, `sort_order`) VALUES
(1, '13A00001', 'PN-ACC-TEST-501', 'accessory', 1, 1, 'publish', 100), -- LA-E4S links to ACC-L1-001-TEST (ID 501)
(1, '13A00001', 'PN-ACC-TEST-502', 'accessory', 1, 1, 'publish', 110), -- LA-E4S links to ACC-L1-002-TEST (ID 502)
(1, '13A00001', 'PN-ACC-TEST-503', 'accessory', 2, 1, 'publish', 120); -- LA-E4S links to ACC-L2-001-TEST (ID 503)

-- Parts for Accessories (these are spare parts for the accessories created above)
-- (assuming product_line_id 1 exists for these parts)
-- Use higher IDs (e.g., 601, 602, 603)
INSERT INTO `wp_bjt_parts` (`id`, `product_line_id`, `model`, `part_number`, `name_zh`, `name_en`, `status`, `spec`) VALUES
(601, 1, 'ACC-L1-001-TEST', 'PART-A1-001-T', '配件(ID501)零件1', 'Part 1 for Acc (ID501)', 'publish', 'M5x10'),
(602, 1, 'ACC-L1-001-TEST', 'PART-A1-002-T', '配件(ID501)零件2', 'Part 2 for Acc (ID501)', 'publish', 'M6x12'),
(603, 1, 'ACC-L1-002-TEST', 'PART-A2-001-T', '配件(ID502)零件1', 'Part 1 for Acc (ID502)', 'publish', 'M4x8');

-- Link Parts to Accessories using wp_bjt_relations
-- Accessories (e.g., PN-ACC-TEST-501) are parents. Spare Parts (e.g., PART-A1-001-T) are children.
INSERT INTO `wp_bjt_relations` (`product_line_id`, `parent_part_number`, `child_part_number`, `child_type`, `level`, `quantity`, `status`, `sort_order`) VALUES
(1, 'PN-ACC-TEST-501', 'PART-A1-001-T', 'spare_part', 1, 1, 'publish', 10), -- ACC (ID 501) links to Spare Part (ID 601)
(1, 'PN-ACC-TEST-501', 'PART-A1-002-T', 'spare_part', 1, 1, 'publish', 20), -- ACC (ID 501) links to Spare Part (ID 602)
(1, 'PN-ACC-TEST-502', 'PART-A2-001-T', 'spare_part', 1, 1, 'publish', 10); -- ACC (ID 502) links to Spare Part (ID 603)
-- Accessory ID 503 (PN-ACC-TEST-503) will have no spare parts for testing that scenario.

-- Prices for Accessories and Parts
-- Target IDs for accessories (501, 502, 503) refer to IDs in wp_bjt_accessory_models.
-- Target IDs for parts (601, 602, 603) refer to IDs in wp_bjt_parts.
INSERT INTO `wp_bjt_prices` (`product_line_id`, `target_type`, `target_id`, `region`, `currency`, `base_price`, `min_quantity`, `max_quantity`, `discount_rate`, `status`) VALUES
(1, 'accessory', 501, 'CN', 'CNY', 50.00, 1, 10, 0.05, 'active'), -- Price for Acc ID 501
(1, 'accessory', 501, 'US', 'USD', 7.50, 1, 10, 0.05, 'active'), -- Price for Acc ID 501
(1, 'accessory', 502, 'CN', 'CNY', 30.00, 1, 5, 0.0, 'active'), -- Price for Acc ID 502
-- Accessory ID 503: No price (to test that scenario)
(1, 'part', 601, 'CN', 'CNY', 5.00, 10, 100, 0.1, 'active'), -- Price for Part ID 601
(1, 'part', 603, 'US', 'USD', 0.80, 1, NULL, 0.0, 'active'); -- Price for Part ID 603


-- Inventory for Accessories and Parts
-- Target IDs for accessories (501, 502, 503) refer to IDs in wp_bjt_accessory_models.
-- Target IDs for parts (601, 602, 603) refer to IDs in wp_bjt_parts.
INSERT INTO `wp_bjt_inventory` (`product_line_id`, `target_type`, `target_id`, `region`, `warehouse`, `quantity`, `reserved`, `status`) VALUES
(1, 'accessory', 501, 'CN', 'WH-CN-01', 100, 10, 'active'), -- Inv for Acc ID 501
(1, 'accessory', 501, 'US', 'WH-US-01', 50, 5, 'active'), -- Inv for Acc ID 501
(1, 'accessory', 502, 'CN', 'WH-CN-01', 200, 25, 'active'), -- Inv for Acc ID 502
-- Accessory ID 503: No inventory (to test that scenario)
(1, 'part', 601, 'CN', 'WH-CN-01', 500, 50, 'active'), -- Inv for Part ID 601
(1, 'part', 603, 'US', 'WH-US-01', 300, 0, 'active'); -- Inv for Part ID 603