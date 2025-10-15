-- MySQL dump 10.13  Distrib 8.0.42, for Linux (aarch64)
--
-- Host: localhost    Database: bjt_product
-- ------------------------------------------------------
-- Server version	8.0.42

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `bjt_product`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `bjt_product` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;

USE `bjt_product`;

--
-- Table structure for table `wp_bjt_accessories`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_accessories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) DEFAULT NULL COMMENT '型号',
  `brand` varchar(100) DEFAULT NULL COMMENT '品牌',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `spec` varchar(255) DEFAULT NULL COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) DEFAULT NULL COMMENT '规格参数(英制)',
  `voltage` varchar(50) DEFAULT NULL COMMENT '电压',
  `frequency` varchar(50) DEFAULT NULL COMMENT '频率',
  `package_size_cm` varchar(100) DEFAULT NULL COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) DEFAULT NULL COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(lbs)',
  `pcs_per_box` int DEFAULT NULL COMMENT '单箱数量',
  `pallet_size_cm` varchar(100) DEFAULT NULL COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) DEFAULT NULL COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet` int DEFAULT NULL COMMENT '一托数量',
  `pallet_height_cm` decimal(10,2) DEFAULT NULL COMMENT '打托高度(cm)',
  `pallet_height_inch` decimal(10,2) DEFAULT NULL COMMENT '打托高度(inch)',
  `pallet_gross_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '整托毛重(kg)',
  `pallet_gross_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '整托毛重(lbs)',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs' COMMENT '单位：pcs/roll/box',
  `title_zh` varchar(255) NOT NULL DEFAULT '',
  `title_en` varchar(255) NOT NULL DEFAULT '',
  `description_zh` text,
  `description_en` text,
  `code` varchar(50) NOT NULL DEFAULT '',
  `machine_id` varchar(50) DEFAULT NULL,
  `parent_id` bigint DEFAULT '0',
  `level` int DEFAULT '1',
  `is_required` tinyint(1) DEFAULT '0',
  `price_cny` decimal(10,2) DEFAULT '0.00',
  `price_usd` decimal(10,2) DEFAULT '0.00',
  `price_eur` decimal(10,2) DEFAULT '0.00',
  `specs_json` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`,`part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`,`model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='配件料号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_accessory_models`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_accessory_models` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '配件型号编码',
  `title_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` varchar(100) DEFAULT NULL COMMENT '配件类型',
  `image1_url` varchar(255) DEFAULT NULL COMMENT '主图URL',
  `image2_url` varchar(255) DEFAULT NULL COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) DEFAULT NULL COMMENT '爆炸图PDF文件URL',
  `spec_pdf` varchar(255) DEFAULT NULL COMMENT '规格PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`,`model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='配件型号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_cart_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL COMMENT 'WordPress User ID',
  `product_type` varchar(50) NOT NULL COMMENT 'Type: host, accessory, consumable, spare_part',
  `product_id` bigint NOT NULL COMMENT 'ID from the corresponding product table (e.g., wp_bjt_parts, wp_bjt_accessories etc.)',
  `part_number` varchar(100) NOT NULL COMMENT 'Specific part number added',
  `quantity` int DEFAULT '1',
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `cart_id` bigint NOT NULL,
  `item_type` varchar(20) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `price` decimal(10,2) DEFAULT '0.00',
  `currency` varchar(3) DEFAULT 'CNY',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`,`part_number`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='BJT User Cart Items';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_carts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_carts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `region` varchar(10) COLLATE utf8mb4_unicode_520_ci DEFAULT 'CN',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_consumable_compatibility`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_consumable_compatibility` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `consumable_part_number` varchar(100) NOT NULL COMMENT '耗材料号',
  `host_model` varchar(100) NOT NULL COMMENT '适用主机型号',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_compatibility` (`product_line_id`,`consumable_part_number`,`host_model`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_consumable_part_number` (`consumable_part_number`),
  KEY `idx_host_model` (`host_model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材主机适配表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_consumables`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_consumables` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `model_imperial` varchar(100) DEFAULT NULL COMMENT '型号(英制)',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL DEFAULT '' COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL DEFAULT '' COMMENT '英文名称',
  `spec` varchar(255) DEFAULT NULL COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) DEFAULT NULL COMMENT '规格参数(英制)',
  `brand` varchar(100) DEFAULT NULL COMMENT '品牌',
  `app_model` varchar(255) DEFAULT NULL COMMENT '适用机型',
  `bag_type` varchar(100) DEFAULT NULL COMMENT '袋型',
  `material` varchar(100) DEFAULT NULL COMMENT '材质',
  `thickness_met` decimal(10,2) DEFAULT NULL COMMENT '厚度/克重(um/gsm)',
  `thickness_imp` decimal(10,2) DEFAULT NULL COMMENT '厚度/克重(mil/#)',
  `width_met` decimal(10,2) DEFAULT NULL COMMENT '膜宽(cm)',
  `width_imp` decimal(10,2) DEFAULT NULL COMMENT '膜宽(inch)',
  `length_met` decimal(10,2) DEFAULT NULL COMMENT '袋长(cm)',
  `length_imp` decimal(10,2) DEFAULT NULL COMMENT '袋长(inch)',
  `bubble_diameter_met` decimal(10,2) DEFAULT NULL COMMENT '泡径(cm)',
  `bubble_diameter_imp` decimal(10,2) DEFAULT NULL COMMENT '泡径(inch)',
  `total_length_met` decimal(10,2) DEFAULT NULL COMMENT '总长(m)',
  `total_length_imp` decimal(10,2) DEFAULT NULL COMMENT '总长(ft)',
  `package_type` varchar(100) DEFAULT NULL COMMENT '包装方式',
  `package_size_cm` varchar(100) DEFAULT NULL COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) DEFAULT NULL COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(lbs)',
  `pcs_per_box` int DEFAULT NULL COMMENT '单箱数量',
  `image_url` varchar(255) DEFAULT NULL COMMENT '产品图片(袋型实物)',
  `package_image_url` varchar(255) DEFAULT NULL COMMENT '包装实物图片',
  `pallet_size_cm` varchar(100) DEFAULT NULL COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) DEFAULT NULL COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet_a` int DEFAULT NULL COMMENT '一托卷数A',
  `pallet_gross_weight_a_kg` decimal(10,2) DEFAULT NULL COMMENT '整托毛重A(kg)',
  `pallet_gross_weight_a_lbs` decimal(10,2) DEFAULT NULL COMMENT '整托毛重A(lbs)',
  `pallet_height_a_cm` decimal(10,2) DEFAULT NULL COMMENT '打托高度A(cm)',
  `pallet_height_a_inch` decimal(10,2) DEFAULT NULL COMMENT '打托高度A(inch)',
  `pcs_per_pallet_b` int DEFAULT NULL COMMENT '一托卷数B',
  `pallet_gross_weight_b_kg` decimal(10,2) DEFAULT NULL COMMENT '整托毛重B(kg)',
  `pallet_gross_weight_b_lbs` decimal(10,2) DEFAULT NULL COMMENT '整托毛重B(lbs)',
  `pallet_height_b_cm` decimal(10,2) DEFAULT NULL COMMENT '打托高度B(cm)',
  `pallet_height_b_inch` decimal(10,2) DEFAULT NULL COMMENT '打托高度B(inch)',
  `pcs_per_pallet_c` int DEFAULT NULL COMMENT '一托卷数C',
  `pallet_gross_weight_c_kg` decimal(10,2) DEFAULT NULL COMMENT '整托毛重C(kg)',
  `pallet_gross_weight_c_lbs` decimal(10,2) DEFAULT NULL COMMENT '整托毛重C(lbs)',
  `pallet_height_c_cm` decimal(10,2) DEFAULT NULL COMMENT '打托高度C(cm)',
  `pallet_height_c_inch` decimal(10,2) DEFAULT NULL COMMENT '打托高度C(inch)',
  `tube_inner_diameter_cm` decimal(10,2) DEFAULT NULL COMMENT '纸筒内径(cm)',
  `tube_inner_diameter_inch` decimal(10,2) DEFAULT NULL COMMENT '纸筒内径(inch)',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'roll' COMMENT '单位：pcs/roll/box',
  `title_zh` varchar(255) NOT NULL DEFAULT '',
  `title_en` varchar(255) NOT NULL DEFAULT '',
  `description_zh` text,
  `description_en` text,
  `code` varchar(50) NOT NULL DEFAULT '',
  `price_cny` decimal(10,2) DEFAULT '0.00',
  `price_usd` decimal(10,2) DEFAULT '0.00',
  `price_eur` decimal(10,2) DEFAULT '0.00',
  `inventory_cn` int DEFAULT '0',
  `inventory_eu` int DEFAULT '0',
  `inventory_na` int DEFAULT '0',
  `inventory_au` int DEFAULT '0',
  `specs_json` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`,`part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`,`model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_host_models`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_host_models` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '主机型号编码',
  `title_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` varchar(100) DEFAULT NULL COMMENT '主机类型',
  `image1_url` varchar(255) DEFAULT NULL COMMENT '主图URL',
  `image2_url` varchar(255) DEFAULT NULL COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) DEFAULT NULL COMMENT '爆炸图PDF文件URL',
  `spec_pdf` varchar(255) DEFAULT NULL COMMENT '规格PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`,`model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主机型号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_host_part_numbers`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_host_part_numbers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `host_id` bigint NOT NULL COMMENT '主机ID',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `spec_pdf` varchar(255) DEFAULT NULL COMMENT '规格书PDF文件URL',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_host_part_number` (`host_id`,`part_number`),
  KEY `idx_host_id` (`host_id`),
  CONSTRAINT `fk_host_part_numbers_host_id` FOREIGN KEY (`host_id`) REFERENCES `wp_bjt_host_models` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主机料号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_inventory`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_inventory` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `target_type` varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
  `target_id` bigint NOT NULL COMMENT '目标ID',
  `region` varchar(10) NOT NULL COMMENT '区域代码',
  `warehouse` varchar(50) NOT NULL COMMENT '仓库代码',
  `quantity` int NOT NULL DEFAULT '0' COMMENT '库存数量',
  `reserved` int NOT NULL DEFAULT '0' COMMENT '预留数量',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_target_region_warehouse` (`product_line_id`,`target_type`,`target_id`,`region`,`warehouse`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='库存表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_logs`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `action` varchar(50) NOT NULL,
  `details` text,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_machines`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_machines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title_zh` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `title_en` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `description_zh` text COLLATE utf8mb4_unicode_520_ci,
  `description_en` text COLLATE utf8mb4_unicode_520_ci,
  `code` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `product_line_id` bigint DEFAULT NULL,
  `price_cny` decimal(10,2) DEFAULT '0.00',
  `price_usd` decimal(10,2) DEFAULT '0.00',
  `price_eur` decimal(10,2) DEFAULT '0.00',
  `image_url` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `specs_json` longtext COLLATE utf8mb4_unicode_520_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_520_ci DEFAULT 'publish',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_materials`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_materials` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `code` varchar(50) NOT NULL COMMENT '材料缩写代码',
  `name_zh` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `base_material` varchar(100) DEFAULT NULL COMMENT '基材',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_code` (`product_line_id`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材材料表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_order_items`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_order_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `product_line_id` int NOT NULL,
  `target_type` varchar(50) NOT NULL,
  `target_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `item_type` varchar(20) NOT NULL,
  `item_id` varchar(50) NOT NULL,
  `item_name` varchar(255) NOT NULL,
  `currency` varchar(3) DEFAULT 'CNY',
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_orders`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_orders` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `currency` varchar(3) DEFAULT 'CNY',
  `region` varchar(10) DEFAULT 'CN',
  `shipping_address` text,
  `billing_address` text,
  `payment_method` varchar(50) DEFAULT NULL,
  `payment_status` varchar(20) DEFAULT 'unpaid',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wp_bjt_orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `wp_bjt_users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_parts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_parts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `voltage` varchar(50) DEFAULT NULL COMMENT '电压',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `brand` varchar(100) DEFAULT NULL COMMENT '品牌',
  `spec` varchar(255) DEFAULT NULL COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) DEFAULT NULL COMMENT '规格参数(英制)',
  `package_size_cm` varchar(100) DEFAULT NULL COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) DEFAULT NULL COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(lbs)',
  `pcs_per_box` int DEFAULT NULL COMMENT '单箱数量',
  `pallet_size_cm` varchar(100) DEFAULT NULL COMMENT '托盘尺寸(cm)',
  `pallet_size_inch` varchar(100) DEFAULT NULL COMMENT '托盘尺寸(inch)',
  `pcs_per_pallet` int DEFAULT NULL COMMENT '一托数量',
  `pallet_height_cm` decimal(10,2) DEFAULT NULL COMMENT '打托高度(cm)',
  `pallet_height_inch` decimal(10,2) DEFAULT NULL COMMENT '打托高度(inch)',
  `pallet_gross_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '整托毛重(kg)',
  `pallet_gross_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '整托毛重(lbs)',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs' COMMENT '单位：pcs/roll/box',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`,`part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`,`model`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主机料号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_prices`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_prices` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `target_type` varchar(50) NOT NULL COMMENT '目标类型(host/accessory/consumable)',
  `target_id` bigint NOT NULL COMMENT '目标ID',
  `region` varchar(10) NOT NULL COMMENT '区域代码',
  `currency` varchar(10) NOT NULL COMMENT '货币代码',
  `base_price` decimal(10,2) NOT NULL COMMENT '基础价格',
  `min_quantity` int NOT NULL DEFAULT '1' COMMENT '最小数量',
  `max_quantity` int DEFAULT NULL COMMENT '最大数量',
  `discount_rate` decimal(5,4) DEFAULT NULL COMMENT '折扣率',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_target_region_quantity` (`product_line_id`,`target_type`,`target_id`,`region`,`min_quantity`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='价格表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_product_lines`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_product_lines` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title_zh` varchar(255) NOT NULL COMMENT '中文标题',
  `title_en` varchar(255) NOT NULL COMMENT '英文标题',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `subitem1_zh` varchar(255) DEFAULT NULL COMMENT '子项1中文',
  `subitem1_en` varchar(255) DEFAULT NULL COMMENT '子项1英文',
  `subitem2_zh` varchar(255) DEFAULT NULL COMMENT '子项2中文',
  `subitem2_en` varchar(255) DEFAULT NULL COMMENT '子项2英文',
  `subitem3_zh` varchar(255) DEFAULT NULL COMMENT '子项3中文',
  `subitem3_en` varchar(255) DEFAULT NULL COMMENT '子项3英文',
  `image_url` varchar(255) DEFAULT NULL COMMENT '图片URL',
  `code` varchar(50) NOT NULL COMMENT '产品线代码',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='产品线表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_relations`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_relations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `host_part_number` varchar(100) NOT NULL COMMENT '主机料号-0级',
  `part_number` varchar(100) NOT NULL COMMENT '自身料号',
  `parent_part_number` varchar(100) DEFAULT NULL COMMENT '父项料号',
  `child_part_number` varchar(100) DEFAULT NULL COMMENT '子项料号',
  `child_type` enum('accessory','spare_part') DEFAULT 'accessory' COMMENT '子项类型：配件/备件',
  `level` int NOT NULL DEFAULT '1' COMMENT '层级(1-5)，备件固定为1',
  `quantity` int NOT NULL DEFAULT '1' COMMENT '子项在父项中的数量',
  `required_parts` varchar(255) DEFAULT NULL COMMENT '依赖关联料号 (多个用逗号分隔, 例如螺丝依赖螺母和垫片)',
  `required_quantity` varchar(100) DEFAULT NULL COMMENT '依赖关联料号对应的数量 (多个用逗号分隔, 与required_parts一一对应)',
  `sort_order` int DEFAULT '0' COMMENT '同级排序',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_part_number` (`part_number`),
  KEY `idx_parent_part_number` (`parent_part_number`),
  KEY `idx_child_part_number` (`child_part_number`),
  KEY `idx_required_parts` (`required_parts`),
  KEY `idx_child_type` (`child_type`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='关联关系表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_shapes`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_shapes` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `code` varchar(50) NOT NULL COMMENT '形状缩写代码',
  `name_zh` varchar(100) NOT NULL COMMENT '中文名称',
  `name_en` varchar(100) NOT NULL COMMENT '英文名称',
  `image_url` varchar(255) DEFAULT NULL COMMENT '形状图片URL',
  `image_url2` varchar(255) DEFAULT NULL COMMENT '形状图片示意url',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_code` (`product_line_id`,`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材形状表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_spare_part_models`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_spare_part_models` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '配件型号编码',
  `title_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `title_en` varchar(255) NOT NULL COMMENT '英文名称',
  `description_zh` text COMMENT '中文描述',
  `description_en` text COMMENT '英文描述',
  `type` varchar(100) DEFAULT NULL COMMENT '配件类型',
  `image1_url` varchar(255) DEFAULT NULL COMMENT '主图URL',
  `image2_url` varchar(255) DEFAULT NULL COMMENT '副图URL',
  `explosion_diagram_pdf` varchar(255) DEFAULT NULL COMMENT '爆炸图PDF文件URL',
  `spec_pdf` varchar(255) DEFAULT NULL COMMENT '规格PDF文件URL',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`,`model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='备件型号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_spare_parts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_spare_parts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `app_model` varchar(255) DEFAULT NULL COMMENT '适配机型',
  `model` varchar(100) DEFAULT NULL COMMENT '配件型号',
  `is_consumable` tinyint(1) DEFAULT '0' COMMENT '是否易损',
  `image_url` varchar(255) DEFAULT NULL COMMENT '产品图片',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `spec` varchar(255) DEFAULT NULL COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) DEFAULT NULL COMMENT '规格参数(英制)',
  `app_sn` varchar(1000) DEFAULT NULL COMMENT '适配序列号',
  `package_size_cm` varchar(100) DEFAULT NULL COMMENT '包装尺寸(cm)',
  `package_size_inch` varchar(100) DEFAULT NULL COMMENT '包装尺寸(inch)',
  `net_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '单件净重(kg)',
  `net_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '单件净重(lbs)',
  `gross_weight_kg` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(kg)',
  `gross_weight_lbs` decimal(10,2) DEFAULT NULL COMMENT '包装毛重(lbs)',
  `pcs_per_box` int DEFAULT NULL COMMENT '单箱数量',
  `required_parts` text COMMENT '必选备件料号，多个用逗号分隔',
  `required_quantity` text COMMENT '必选备件数量，多个用逗号分隔，与必选备件料号一一对应',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `unit` varchar(20) NOT NULL DEFAULT 'pcs' COMMENT '单位：pcs/roll/box',
  `title_zh` varchar(255) NOT NULL DEFAULT '',
  `title_en` varchar(255) NOT NULL DEFAULT '',
  `description_zh` text,
  `description_en` text,
  `code` varchar(50) NOT NULL DEFAULT '',
  `machine_codes` text,
  `price_cny` decimal(10,2) DEFAULT '0.00',
  `price_usd` decimal(10,2) DEFAULT '0.00',
  `price_eur` decimal(10,2) DEFAULT '0.00',
  `inventory_cn` int DEFAULT '0',
  `inventory_eu` int DEFAULT '0',
  `inventory_na` int DEFAULT '0',
  `inventory_au` int DEFAULT '0',
  `specs_json` longtext,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`,`part_number`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='备件料号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_specifications`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_specifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `spec_type` enum('thickness','weight','width','length') NOT NULL,
  `metric_value` decimal(10,2) NOT NULL COMMENT '公制数值',
  `metric_unit` varchar(20) NOT NULL COMMENT '公制单位',
  `imperial_value` decimal(10,2) NOT NULL COMMENT '英制数值',
  `imperial_unit` varchar(20) NOT NULL COMMENT '英制单位',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_line_spec` (`product_line_id`,`spec_type`,`metric_value`,`metric_unit`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材规格尺寸表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_bjt_users`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `customer_code` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL,
  `country` varchar(255) DEFAULT NULL,
  `region` varchar(255) DEFAULT NULL,
  `company_logo` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `preferred_unit` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_commentmeta`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_commentmeta` (
  `meta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comment_id` bigint unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `meta_value` longtext COLLATE utf8mb4_unicode_520_ci,
  PRIMARY KEY (`meta_id`),
  KEY `comment_id` (`comment_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_comments`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_comments` (
  `comment_ID` bigint unsigned NOT NULL AUTO_INCREMENT,
  `comment_post_ID` bigint unsigned NOT NULL DEFAULT '0',
  `comment_author` tinytext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `comment_author_email` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `comment_author_url` varchar(200) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `comment_author_IP` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `comment_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `comment_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `comment_content` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `comment_karma` int NOT NULL DEFAULT '0',
  `comment_approved` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '1',
  `comment_agent` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `comment_type` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'comment',
  `comment_parent` bigint unsigned NOT NULL DEFAULT '0',
  `user_id` bigint unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`comment_ID`),
  KEY `comment_post_ID` (`comment_post_ID`),
  KEY `comment_approved_date_gmt` (`comment_approved`,`comment_date_gmt`),
  KEY `comment_date_gmt` (`comment_date_gmt`),
  KEY `comment_parent` (`comment_parent`),
  KEY `comment_author_email` (`comment_author_email`(10))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_links`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_links` (
  `link_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `link_url` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `link_name` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `link_image` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `link_target` varchar(25) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `link_description` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `link_visible` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'Y',
  `link_owner` bigint unsigned NOT NULL DEFAULT '1',
  `link_rating` int NOT NULL DEFAULT '0',
  `link_updated` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `link_rel` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `link_notes` mediumtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `link_rss` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`link_id`),
  KEY `link_visible` (`link_visible`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_options`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_options` (
  `option_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `option_name` varchar(191) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `option_value` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `autoload` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'yes',
  PRIMARY KEY (`option_id`),
  UNIQUE KEY `option_name` (`option_name`),
  KEY `autoload` (`autoload`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_postmeta`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_postmeta` (
  `meta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_id` bigint unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `meta_value` longtext COLLATE utf8mb4_unicode_520_ci,
  PRIMARY KEY (`meta_id`),
  KEY `post_id` (`post_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_posts`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_posts` (
  `ID` bigint unsigned NOT NULL AUTO_INCREMENT,
  `post_author` bigint unsigned NOT NULL DEFAULT '0',
  `post_date` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_date_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `post_title` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `post_excerpt` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `post_status` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'publish',
  `comment_status` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'open',
  `ping_status` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'open',
  `post_password` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `post_name` varchar(200) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `to_ping` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `pinged` text COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `post_modified` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_modified_gmt` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `post_content_filtered` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `post_parent` bigint unsigned NOT NULL DEFAULT '0',
  `guid` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `menu_order` int NOT NULL DEFAULT '0',
  `post_type` varchar(20) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT 'post',
  `post_mime_type` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `comment_count` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`ID`),
  KEY `post_name` (`post_name`(191)),
  KEY `type_status_date` (`post_type`,`post_status`,`post_date`,`ID`),
  KEY `post_parent` (`post_parent`),
  KEY `post_author` (`post_author`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_term_relationships`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_term_relationships` (
  `object_id` bigint unsigned NOT NULL DEFAULT '0',
  `term_taxonomy_id` bigint unsigned NOT NULL DEFAULT '0',
  `term_order` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`object_id`,`term_taxonomy_id`),
  KEY `term_taxonomy_id` (`term_taxonomy_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_term_taxonomy`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_term_taxonomy` (
  `term_taxonomy_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `term_id` bigint unsigned NOT NULL DEFAULT '0',
  `taxonomy` varchar(32) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `description` longtext COLLATE utf8mb4_unicode_520_ci NOT NULL,
  `parent` bigint unsigned NOT NULL DEFAULT '0',
  `count` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`term_taxonomy_id`),
  UNIQUE KEY `term_id_taxonomy` (`term_id`,`taxonomy`),
  KEY `taxonomy` (`taxonomy`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_termmeta`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_termmeta` (
  `meta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `term_id` bigint unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `meta_value` longtext COLLATE utf8mb4_unicode_520_ci,
  PRIMARY KEY (`meta_id`),
  KEY `term_id` (`term_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_terms`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_terms` (
  `term_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `slug` varchar(200) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `term_group` bigint NOT NULL DEFAULT '0',
  PRIMARY KEY (`term_id`),
  KEY `slug` (`slug`(191)),
  KEY `name` (`name`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_usermeta`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_usermeta` (
  `umeta_id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL DEFAULT '0',
  `meta_key` varchar(255) COLLATE utf8mb4_unicode_520_ci DEFAULT NULL,
  `meta_value` longtext COLLATE utf8mb4_unicode_520_ci,
  PRIMARY KEY (`umeta_id`),
  KEY `user_id` (`user_id`),
  KEY `meta_key` (`meta_key`(191))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `wp_users`
--

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_users` (
  `ID` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_login` varchar(60) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `user_pass` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `user_nicename` varchar(50) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `user_email` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `user_url` varchar(100) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `user_registered` datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
  `user_activation_key` varchar(255) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  `user_status` int NOT NULL DEFAULT '0',
  `display_name` varchar(250) COLLATE utf8mb4_unicode_520_ci NOT NULL DEFAULT '',
  PRIMARY KEY (`ID`),
  KEY `user_login_key` (`user_login`),
  KEY `user_nicename` (`user_nicename`),
  KEY `user_email` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-26  8:12:10
