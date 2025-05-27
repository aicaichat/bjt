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
-- Table structure for table `wp_bjt_accessories`
--

DROP TABLE IF EXISTS `wp_bjt_accessories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_accessories` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`,`part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='配件料号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_accessories`
--

LOCK TABLES `wp_bjt_accessories` WRITE;
/*!40000 ALTER TABLE `wp_bjt_accessories` DISABLE KEYS */;
INSERT INTO `wp_bjt_accessories` VALUES (1,1,'E4S-FAN','BJT','A10001','E4S风扇组件','E4S Fan Assembly','12x8x6cm','4.7x3.1x2.4in','220V','50Hz','15x10x8cm','5.9x3.9x3.1in',0.35,0.77,0.45,0.99,20,'120x100x110cm','47.2x39.4x43.3in',500,110.00,43.30,240.00,529.20,'/images/shop/LA-E4S.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(2,1,'E4S-FAN','BJT','A10002','E4S风扇组件-美规','E4S Fan Assembly-US','12x8x6cm','4.7x3.1x2.4in','110V','60Hz','15x10x8cm','5.9x3.9x3.1in',0.35,0.77,0.45,0.99,20,'120x100x110cm','47.2x39.4x43.3in',500,110.00,43.30,240.00,529.20,'/images/shop/LA-E5P.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(3,1,'E4S-CTRL','BJT','A20001','E4S控制板组件','E4S Controller Assembly','10x8x3cm','3.9x3.1x1.2in','220V','50Hz','12x10x5cm','4.7x3.9x2.0in',0.25,0.55,0.30,0.66,30,'120x100x110cm','47.2x39.4x43.3in',800,110.00,43.30,260.00,573.20,'/images/shop/LA-E5P.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(4,1,'E4S-HEATER','BJT','A30001','E4S加热器组件','E4S Heater Assembly','15x10x8cm','5.9x3.9x3.1in','220V','50Hz','18x12x10cm','7.1x4.7x3.9in',0.45,0.99,0.55,1.21,15,'120x100x110cm','47.2x39.4x43.3in',400,110.00,43.30,235.00,518.10,'/images/shop/LA-E4C.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(5,1,'E4S-FAN-CHILD','BJT','A40001','E4S风扇子件组件','E4S Fan Child Assembly','8x6x3cm','3.1x2.4x1.2in','220V','50Hz','10x8x5cm','3.9x3.1x2.0in',0.15,0.33,0.20,0.44,50,'120x100x110cm','47.2x39.4x43.3in',1000,110.00,43.30,220.00,485.00,'/images/shop/MPV.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(6,2,'PM100-CUTTER','BJT','B10001','PM100切刀组件','PM100 Cutter Assembly','20x5x2cm','7.9x2.0x0.8in','220V','50Hz','22x8x4cm','8.7x3.1x1.6in',0.55,1.21,0.65,1.43,20,'120x100x110cm','47.2x39.4x43.3in',500,110.00,43.30,345.00,760.60,'/images/shop/ET2002.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(7,2,'PM100-ROLLER','BJT','B20001','PM100滚轮组件','PM100 Roller Assembly','10x4x4cm','3.9x1.6x1.6in','220V','50Hz','12x6x6cm','4.7x2.4x2.4in',0.40,0.88,0.50,1.10,30,'120x100x110cm','47.2x39.4x43.3in',700,110.00,43.30,375.00,826.70,'/images/shop/ET1003.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(8,3,'TM200-BLADE','BJT','C10001','TM200刀片组件','TM200 Blade Assembly','5x2x0.5cm','2.0x0.8x0.2in','220V','50Hz','8x4x2cm','3.1x1.6x0.8in',0.05,0.11,0.10,0.22,100,'120x100x110cm','47.2x39.4x43.3in',2000,110.00,43.30,220.00,485.00,'/images/shop/FR8003.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(9,3,'TM200-SPRING','BJT','C20001','TM200弹簧组件','TM200 Spring Assembly','3x1x1cm','1.2x0.4x0.4in','220V','50Hz','5x3x3cm','2.0x1.2x1.2in',0.03,0.07,0.06,0.13,200,'120x100x110cm','47.2x39.4x43.3in',4000,110.00,43.30,270.00,595.20,'/images/shop/EC2005.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(10,4,'ACB100-VALVE','BJT','D10001','ACB100气阀组件','ACB100 Valve Assembly','6x3x3cm','2.4x1.2x1.2in','220V','50Hz','8x5x5cm','3.1x2.0x2.0in',0.10,0.22,0.15,0.33,60,'120x100x110cm','47.2x39.4x43.3in',1200,110.00,43.30,200.00,440.90,'/images/shop/MPV.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(11,1,'E4S-SENSOR','BJT','A50001','E4S温度传感器','E4S Temperature Sensor','5x3x2cm','2.0x1.2x0.8in','220V','50Hz','7x5x4cm','2.8x2.0x1.6in',0.08,0.18,0.12,0.26,100,'120x100x110cm','47.2x39.4x43.3in',2000,110.00,43.30,260.00,573.20,'/images/shop/LA-E4S.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(12,1,'E4S-CASE','BJT','A60001','E4S外壳组件','E4S Case Assembly','30x20x15cm','11.8x7.9x5.9in','220V','50Hz','35x25x20cm','13.8x9.8x7.9in',1.20,2.65,1.50,3.31,5,'120x100x110cm','47.2x39.4x43.3in',100,110.00,43.30,170.00,374.80,'/images/shop/LA-E5P.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(13,2,'PM100-MOTOR','BJT','B30001','PM100电机组件','PM100 Motor Assembly','15x12x10cm','5.9x4.7x3.9in','220V','50Hz','18x15x12cm','7.1x5.9x4.7in',0.85,1.87,1.00,2.20,10,'120x100x110cm','47.2x39.4x43.3in',200,110.00,43.30,220.00,485.00,'/images/shop/ET2002.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(14,3,'TM200-MOTOR','BJT','C30001','TM200电机组件','TM200 Motor Assembly','12x10x8cm','4.7x3.9x3.1in','220V','50Hz','15x12x10cm','5.9x4.7x3.9in',0.65,1.43,0.80,1.76,12,'120x100x110cm','47.2x39.4x43.3in',240,110.00,43.30,208.00,458.60,'/images/shop/FR8003.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(15,4,'ACB100-SEAL','BJT','D20001','ACB100密封件','ACB100 Seal Assembly','4x4x1cm','1.6x1.6x0.4in','220V','50Hz','6x6x3cm','2.4x2.4x1.2in',0.04,0.09,0.08,0.18,150,'120x100x110cm','47.2x39.4x43.3in',3000,110.00,43.30,265.00,584.20,'/images/shop/MPV.jpg','publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs');
/*!40000 ALTER TABLE `wp_bjt_accessories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_accessory_models`
--

DROP TABLE IF EXISTS `wp_bjt_accessory_models`;
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
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`,`model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='配件型号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_accessory_models`
--

LOCK TABLES `wp_bjt_accessory_models` WRITE;
/*!40000 ALTER TABLE `wp_bjt_accessory_models` DISABLE KEYS */;
INSERT INTO `wp_bjt_accessory_models` VALUES (1,1,'E4S-FAN','E4S风扇','E4S Fan','E4S主机专用风扇','Fan for E4S host','风扇','/images/shop/LA-E4S.jpg','/images/shop/LA-E5P.jpg','/pdfs/accessories/E4S-FAN.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,1,'E4S-CTRL','E4S控制板','E4S Controller','E4S主机智能控制板','Smart controller for E4S','控制板','/images/shop/LA-E5P.jpg','/images/shop/LA-E4C.jpg','/pdfs/accessories/E4S-CTRL.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(3,1,'E4S-HEATER','E4S加热器','E4S Heater','E4S主机加热组件','Heater for E4S','加热器','/images/shop/LA-E4C.jpg','/images/shop/MPV.jpg','/pdfs/accessories/E4S-HEATER.pdf','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(4,1,'E4S-SENSOR','E4S传感器','E4S Sensor','E4S主机温度传感器','Temperature sensor for E4S','传感器','/images/shop/MPV.jpg','/images/shop/LA-E4S.jpg','/pdfs/accessories/E4S-SENSOR.pdf','publish',40,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(5,1,'E4S-CASE','E4S外壳','E4S Case','E4S主机外壳','Case for E4S','外壳','/images/shop/LA-E4S.jpg','/images/shop/LA-E5P.jpg','/pdfs/accessories/E4S-CASE.pdf','publish',50,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(6,1,'E4S-FAN-CHILD','E4S风扇子件','E4S Fan Child','E4S风扇下属子配件','Child part of E4S fan','风扇子件','/images/shop/LA-E5P.jpg','/images/shop/LA-E4C.jpg','/pdfs/accessories/E4S-FAN-CHILD.pdf','publish',60,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(7,1,'E4S-FAN-CHILD2','E4S风扇子件2','E4S Fan Child 2','E4S风扇下属子配件2','Second child part of E4S fan','风扇子件','/images/shop/LA-E4C.jpg','/images/shop/MPV.jpg','/pdfs/accessories/E4S-FAN-CHILD2.pdf','publish',70,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(8,1,'E4S-FAN-CHILD2-CHILD','E4S风扇子件2-子件','E4S Fan Child 2-Child','E4S风扇子件2下属三级配件','Third level part under E4S fan child 2','风扇三级件','/images/shop/MPV.jpg','/images/shop/LA-E4S.jpg','/pdfs/accessories/E4S-FAN-CHILD2-CHILD.pdf','publish',80,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(9,2,'PM100-CUTTER','PM100切刀','PM100 Cutter','PM100主机专用切刀','Cutter for PM100','切刀','/images/shop/ET2002.jpg','/images/shop/ET1003.jpg','/pdfs/accessories/PM100-CUTTER.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(10,2,'PM100-ROLLER','PM100滚轮','PM100 Roller','PM100主机滚轮','Roller for PM100','滚轮','/images/shop/ET1003.jpg','/images/shop/LA-E5P.jpg','/pdfs/accessories/PM100-ROLLER.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(11,2,'PM100-ROLLER-CHILD','PM100滚轮子件','PM100 Roller Child','PM100滚轮下属子配件','Child part of PM100 roller','滚轮子件','/images/shop/LA-F2.jpg','/images/shop/ET2002.jpg','/pdfs/accessories/PM100-ROLLER-CHILD.pdf','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(12,3,'TM200-BLADE','TM200刀片','TM200 Blade','TM200主机专用刀片','Blade for TM200','刀片','/images/shop/FR8003.jpg','/images/shop/EC2005.jpg','/pdfs/accessories/TM200-BLADE.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(13,3,'TM200-SPRING','TM200弹簧','TM200 Spring','TM200主机弹簧','Spring for TM200','弹簧','/images/shop/EC2005.jpg','/images/shop/FR8003.jpg','/pdfs/accessories/TM200-SPRING.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(14,4,'ACB100-VALVE','ACB100气阀','ACB100 Valve','ACB100主机气阀','Valve for ACB100','气阀','/images/shop/MPV.jpg','/images/shop/LA-E4S.jpg','/pdfs/accessories/ACB100-VALVE.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(15,4,'ACB100-VALVE-CHILD','ACB100气阀子件','ACB100 Valve Child','ACB100气阀下属子配件','Child part of ACB100 valve','气阀子件','/images/shop/LA-E4S.jpg','/images/shop/MPV.jpg','/pdfs/accessories/ACB100-VALVE-CHILD.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_accessory_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_cart_items`
--

DROP TABLE IF EXISTS `wp_bjt_cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_cart_items` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL COMMENT 'WordPress User ID',
  `product_type` varchar(50) NOT NULL COMMENT 'Type: host, accessory, consumable, spare_part',
  `product_id` bigint NOT NULL COMMENT 'ID from the corresponding product table (e.g., wp_bjt_parts, wp_bjt_accessories etc.)',
  `part_number` varchar(100) NOT NULL COMMENT 'Specific part number added',
  `quantity` int unsigned NOT NULL DEFAULT '1',
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`,`part_number`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='BJT User Cart Items';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_cart_items`
--

LOCK TABLES `wp_bjt_cart_items` WRITE;
/*!40000 ALTER TABLE `wp_bjt_cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_bjt_cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_consumable_compatibility`
--

DROP TABLE IF EXISTS `wp_bjt_consumable_compatibility`;
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
-- Dumping data for table `wp_bjt_consumable_compatibility`
--

LOCK TABLES `wp_bjt_consumable_compatibility` WRITE;
/*!40000 ALTER TABLE `wp_bjt_consumable_compatibility` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_bjt_consumable_compatibility` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_consumables`
--

DROP TABLE IF EXISTS `wp_bjt_consumables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_consumables` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `model` varchar(100) NOT NULL COMMENT '型号',
  `model_imperial` varchar(100) DEFAULT NULL COMMENT '型号(英制)',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`,`part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_model` (`product_line_id`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_consumables`
--

LOCK TABLES `wp_bjt_consumables` WRITE;
/*!40000 ALTER TABLE `wp_bjt_consumables` DISABLE KEYS */;
INSERT INTO `wp_bjt_consumables` VALUES (1,1,'ACF-200','ACF-200','15F00001','20um x 20cm x 200cm','0.79mil x 7.9in x 78.7in','BJT','LA-E4S,LA-E5P','pillow','HDPE',20.00,0.79,20.00,7.90,200.00,78.70,1.00,0.40,200.00,656.20,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/MFB25.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(2,1,'ACF-300','ACF-300','15F00002','30um x 30cm x 150cm','1.18mil x 11.8in x 59.1in','BJT','LA-E5P,LA-E6L','bubble','LDPE',30.00,1.18,30.00,11.80,150.00,59.10,2.00,0.80,150.00,492.10,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/MEX.JPG','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(3,1,'ACF-400','ACF-400','15F00003','40um x 40cm x 100cm','1.57mil x 15.7in x 39.4in','BJT','LA-E6L,LA-E7X','tube','Nylon',40.00,1.57,40.00,15.70,100.00,39.40,3.00,1.20,100.00,328.10,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/MFC.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(4,2,'PPR-100','PPR-100','25P00001','120gsm x 10cm x 500cm','4.7oz/yd² x 3.9in x 196.9in','BJT','PM-100','pillow','PAPER+PE',120.00,4.70,10.00,3.90,500.00,196.90,NULL,NULL,500.00,1640.40,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/MFA.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(5,2,'PPR-200','PPR-200','25P00002','150gsm x 20cm x 400cm','5.9oz/yd² x 7.9in x 157.5in','BJT','PM-200','bubble','HDPE',150.00,5.90,20.00,7.90,400.00,157.50,NULL,NULL,400.00,1312.30,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/HDPE.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(6,2,'PPR-300','PPR-300','25P00003','180gsm x 30cm x 300cm','7.1oz/yd² x 11.8in x 118.1in','BJT','PM-300','tube','LDPE',180.00,7.10,30.00,11.80,300.00,118.10,NULL,NULL,300.00,984.30,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/LDPE.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(7,3,'TPE-100','TPE-100','35T00001','45um x 4.8cm x 60cm','1.8mil x 1.9in x 23.6in','BJT','TM-200','pillow','HDPE',45.00,1.80,4.80,1.90,60.00,23.60,NULL,NULL,60.00,196.90,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/HDPE.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(8,3,'TPE-200','TPE-200','35T00002','50um x 6.0cm x 80cm','2.0mil x 2.4in x 31.5in','BJT','TM-300','bubble','LDPE',50.00,2.00,6.00,2.40,80.00,31.50,NULL,NULL,80.00,262.50,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/LDPE.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(9,3,'TPE-300','TPE-300','35T00003','55um x 7.2cm x 100cm','2.2mil x 2.8in x 39.4in','BJT','TM-400','tube','Nylon',55.00,2.20,7.20,2.80,100.00,39.40,NULL,NULL,100.00,328.10,'Roll','40x40x50','15.7x15.7x19.7',10.00,22.05,10.50,23.15,1,'/images/shop/MPR.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','roll'),(10,4,'ACB-100','ACB-100','45B00001','60um x 15cm x 20cm','2.4mil x 5.9in x 7.9in','BJT','ACB-100','pillow','HDPE',60.00,2.40,15.00,5.90,20.00,7.90,NULL,NULL,NULL,NULL,'Piece','20x15x10','7.9x5.9x3.9',2.00,4.41,2.20,4.85,10,'/images/shop/MPV.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(11,4,'ACB-200','ACB-200','45B00002','70um x 25cm x 30cm','2.8mil x 9.8in x 11.8in','BJT','ACB-200','bubble','LDPE',70.00,2.80,25.00,9.80,30.00,11.80,NULL,NULL,NULL,NULL,'Piece','25x20x15','9.8x7.9x5.9',2.50,5.51,2.70,5.95,10,'/images/shop/LA-E4S.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(12,4,'ACB-300','ACB-300','45B00003','80um x 35cm x 40cm','3.1mil x 13.8in x 15.7in','BJT','ACB-300','tube','Nylon',80.00,3.10,35.00,13.80,40.00,15.70,NULL,NULL,NULL,NULL,'Piece','35x30x20','13.8x11.8x7.9',3.00,6.61,3.30,7.28,10,'/images/shop/LA-E5P.jpg','/images/shop/MFA.jpg',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs');
/*!40000 ALTER TABLE `wp_bjt_consumables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_host_models`
--

DROP TABLE IF EXISTS `wp_bjt_host_models`;
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
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`,`model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主机型号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_host_models`
--

LOCK TABLES `wp_bjt_host_models` WRITE;
/*!40000 ALTER TABLE `wp_bjt_host_models` DISABLE KEYS */;
INSERT INTO `wp_bjt_host_models` VALUES (1,1,'LA-E4S','气垫机E4S','Air Cushion E4S','高效率小型气垫机，适合小规模包装工作。','High-efficiency small air cushion machine suitable for small-scale packaging work.','小型','/images/shop/LA-E4S.jpg','/images/shop/LA-E5P.jpg','/pdfs/models/LA-E4S.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,1,'LA-E5P','气垫机E5P','Air Cushion E5P','中等规模气垫机，高速运行。','Medium-scale air cushion machine with high-speed operation.','中型','/images/shop/LA-E5P.jpg','/images/shop/LA-E4C.jpg','/pdfs/models/LA-E5P.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(3,1,'LA-E6L','气垫机E6L','Air Cushion E6L','大型工业级气垫机，高产能。','Large industrial air cushion machine with high productivity.','大型','/images/shop/LA-E4C.jpg','/images/shop/MPV.jpg','/pdfs/models/LA-E6L.pdf','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(4,2,'PM-100','纸机100','Paper Machine 100','基础型纸包装机。','Basic paper packaging machine.','基础型','/images/shop/ET2002.jpg','/images/shop/ET1003.jpg','/pdfs/models/PM-100.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(5,2,'PM-200','纸机200','Paper Machine 200','标准型纸包装机。','Standard paper packaging machine.','标准型','/images/shop/ET1003.jpg','/images/shop/LA-E5P.jpg','/pdfs/models/PM-200.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(6,2,'PM-300','纸机300','Paper Machine 300','高级型纸包装机。','Advanced paper packaging machine.','高级型','/images/shop/LA-F2.jpg','/images/shop/ET2002.jpg','/pdfs/models/PM-300.pdf','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(7,3,'TM-200','胶带机200','Tape Machine 200','标准型胶带封箱机。','Standard tape sealing machine.','标准型','/images/shop/FR8003.jpg','/images/shop/EC2005.jpg','/pdfs/models/TM-200.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(8,3,'TM-300','胶带机300','Tape Machine 300','高速型胶带封箱机。','High-speed tape sealing machine.','高速型','/images/shop/EC2005.jpg','/images/shop/FR8003.jpg','/pdfs/models/TM-300.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(9,3,'TM-400','胶带机400','Tape Machine 400','全自动胶带封箱机。','Fully automatic tape sealing machine.','自动型','/images/shop/MPV.jpg','/images/shop/LA-E4S.jpg','/pdfs/models/TM-400.pdf','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(10,4,'ACB-100','气柱袋100','Air Column Bag 100','小型气柱袋机。','Small air column bag machine.','小型','/images/shop/MPV.jpg','/images/shop/LA-E4S.jpg','/pdfs/models/ACB-100.pdf','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(11,4,'ACB-200','气柱袋200','Air Column Bag 200','中型气柱袋机。','Medium air column bag machine.','中型','/images/shop/LA-E4S.jpg','/images/shop/MPV.jpg','/pdfs/models/ACB-200.pdf','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(12,4,'ACB-300','气柱袋300','Air Column Bag 300','大型气柱袋机。','Large air column bag machine.','大型','/images/shop/LA-E5P.jpg','/images/shop/LA-E4C.jpg','/pdfs/models/ACB-300.pdf','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_host_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_inventory`
--

DROP TABLE IF EXISTS `wp_bjt_inventory`;
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
-- Dumping data for table `wp_bjt_inventory`
--

LOCK TABLES `wp_bjt_inventory` WRITE;
/*!40000 ALTER TABLE `wp_bjt_inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_bjt_inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_logs`
--

DROP TABLE IF EXISTS `wp_bjt_logs`;
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
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_logs`
--

LOCK TABLES `wp_bjt_logs` WRITE;
/*!40000 ALTER TABLE `wp_bjt_logs` DISABLE KEYS */;
INSERT INTO `wp_bjt_logs` VALUES (1,1,'login','User logged in','2025-05-21 05:01:05'),(2,2,'order_created','Order ORD-2023-001 created','2025-05-21 05:01:05'),(3,3,'order_created','Order ORD-2023-002 created','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_materials`
--

DROP TABLE IF EXISTS `wp_bjt_materials`;
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
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材材料表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_materials`
--

LOCK TABLES `wp_bjt_materials` WRITE;
/*!40000 ALTER TABLE `wp_bjt_materials` DISABLE KEYS */;
INSERT INTO `wp_bjt_materials` VALUES (1,1,'HDPE','高密度聚乙烯','High-Density Polyethylene',NULL,'publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,1,'LDPE','低密度聚乙烯','Low-Density Polyethylene',NULL,'publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(3,1,'Nylon','尼龙','Nylon',NULL,'publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(4,1,'PAPER+PE','纸+聚乙烯','Paper+Polyethylene',NULL,'publish',40,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_order_items`
--

DROP TABLE IF EXISTS `wp_bjt_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_line_id` int NOT NULL,
  `target_type` varchar(50) NOT NULL,
  `target_id` int NOT NULL,
  `quantity` int NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_order_items`
--

LOCK TABLES `wp_bjt_order_items` WRITE;
/*!40000 ALTER TABLE `wp_bjt_order_items` DISABLE KEYS */;
INSERT INTO `wp_bjt_order_items` VALUES (1,1,1,'host',1,1,5000.00,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,2,1,'accessory',1,1,200.00,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_orders`
--

DROP TABLE IF EXISTS `wp_bjt_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `wp_bjt_orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `wp_bjt_users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_orders`
--

LOCK TABLES `wp_bjt_orders` WRITE;
/*!40000 ALTER TABLE `wp_bjt_orders` DISABLE KEYS */;
INSERT INTO `wp_bjt_orders` VALUES (1,2,'ORD-2023-001',5000.00,'completed','2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,3,'ORD-2023-002',200.00,'pending','2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_parts`
--

DROP TABLE IF EXISTS `wp_bjt_parts`;
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
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='主机料号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_parts`
--

LOCK TABLES `wp_bjt_parts` WRITE;
/*!40000 ALTER TABLE `wp_bjt_parts` DISABLE KEYS */;
INSERT INTO `wp_bjt_parts` VALUES (1,1,'LA-E4S','220V','/images/shop/LA-E4S.jpg','13A00001','E4S主机-标准版','E4S Host-Standard','BJT','30x20x15cm','11.8x7.9x5.9in','35x25x20cm','13.8x9.8x7.9in',5.20,11.46,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(2,1,'LA-E4S','110V','/images/shop/LA-E5P.jpg','13A00002','E4S主机-美标版','E4S Host-US Version','BJT','30x20x15cm','11.8x7.9x5.9in','35x25x20cm','13.8x9.8x7.9in',5.20,11.46,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(3,1,'LA-E5P','220V','/images/shop/LA-E5P.jpg','13A00003','E5P主机-标准版','E5P Host-Standard','BJT','40x25x20cm','15.7x9.8x7.9in','45x30x25cm','17.7x11.8x9.8in',7.50,16.53,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(4,1,'LA-E5P','110V','/images/shop/LA-E4C.jpg','13A00004','E5P主机-美标版','E5P Host-US Version','BJT','40x25x20cm','15.7x9.8x7.9in','45x30x25cm','17.7x11.8x9.8in',7.50,16.53,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(5,1,'LA-E6L','220V','/images/shop/LA-E4C.jpg','13A00005','E6L主机-标准版','E6L Host-Standard','BJT','50x30x25cm','19.7x11.8x9.8in','55x35x30cm','21.7x13.8x11.8in',12.80,28.22,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(6,1,'LA-E6L','110V','/images/shop/MPV.jpg','13A00006','E6L主机-美标版','E6L Host-US Version','BJT','50x30x25cm','19.7x11.8x9.8in','55x35x30cm','21.7x13.8x11.8in',12.80,28.22,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(7,2,'PM-100','220V','/images/shop/ET2002.jpg','23P00001','PM100主机-标准版','PM100 Host-Standard','BJT','70x45x50cm','27.6x17.7x19.7in','75x50x55cm','29.5x19.7x21.7in',35.00,77.16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(8,2,'PM-100','110V','/images/shop/ET1003.jpg','23P00002','PM100主机-美标版','PM100 Host-US Version','BJT','70x45x50cm','27.6x17.7x19.7in','75x50x55cm','29.5x19.7x21.7in',35.00,77.16,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(9,2,'PM-200','220V','/images/shop/ET1003.jpg','23P00003','PM200主机-标准版','PM200 Host-Standard','BJT','80x50x55cm','31.5x19.7x21.7in','85x55x60cm','33.5x21.7x23.6in',42.00,92.59,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(10,2,'PM-200','110V','/images/shop/LA-E5P.jpg','23P00004','PM200主机-美标版','PM200 Host-US Version','BJT','80x50x55cm','31.5x19.7x21.7in','85x55x60cm','33.5x21.7x23.6in',42.00,92.59,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(11,3,'TM-200','220V','/images/shop/FR8003.jpg','33T00001','TM200主机-标准版','TM200 Host-Standard','BJT','60x40x30cm','23.6x15.7x11.8in','65x45x35cm','25.6x17.7x13.8in',18.20,40.12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(12,3,'TM-200','110V','/images/shop/EC2005.jpg','33T00002','TM200主机-美标版','TM200 Host-US Version','BJT','60x40x30cm','23.6x15.7x11.8in','65x45x35cm','25.6x17.7x13.8in',18.20,40.12,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(13,4,'ACB-100','220V','/images/shop/MPV.jpg','43B00001','ACB100主机-标准版','ACB100 Host-Standard','BJT','40x20x15cm','15.7x7.9x5.9in','45x25x20cm','17.7x9.8x7.9in',8.50,18.74,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(14,4,'ACB-100','110V','/images/shop/LA-E4S.jpg','43B00002','ACB100主机-美标版','ACB100 Host-US Version','BJT','40x20x15cm','15.7x7.9x5.9in','45x25x20cm','17.7x9.8x7.9in',8.50,18.74,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs');
/*!40000 ALTER TABLE `wp_bjt_parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_prices`
--

DROP TABLE IF EXISTS `wp_bjt_prices`;
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
-- Dumping data for table `wp_bjt_prices`
--

LOCK TABLES `wp_bjt_prices` WRITE;
/*!40000 ALTER TABLE `wp_bjt_prices` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_bjt_prices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_product_lines`
--

DROP TABLE IF EXISTS `wp_bjt_product_lines`;
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
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='产品线表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_product_lines`
--

LOCK TABLES `wp_bjt_product_lines` WRITE;
/*!40000 ALTER TABLE `wp_bjt_product_lines` DISABLE KEYS */;
INSERT INTO `wp_bjt_product_lines` VALUES (1,'气垫机','Air Cushion Machine','高效防震气垫包装解决方案','Efficient air cushion packaging solution',NULL,NULL,NULL,NULL,NULL,NULL,'/images/shop/LA-E4S.jpg','air_cushion','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,'纸机','Paper Machine','高质量纸包装系统','High-quality paper packaging system',NULL,NULL,NULL,NULL,NULL,NULL,'/images/shop/ET2002.jpg','paper_machine','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(3,'胶带机','Tape Machine','专业封箱设备','Professional tape sealing equipment',NULL,NULL,NULL,NULL,NULL,NULL,'/images/shop/FR8003.jpg','tape_machine','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(4,'气柱袋','Air Column Bag','优质气柱袋产品','Premium air column bag products',NULL,NULL,NULL,NULL,NULL,NULL,'/images/shop/MPV.jpg','air_column','publish',40,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_product_lines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_relations`
--

DROP TABLE IF EXISTS `wp_bjt_relations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_relations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `part_number` varchar(100) NOT NULL COMMENT '自身料号',
  `parent_part_number` varchar(100) NOT NULL COMMENT '父项料号',
  `child_part_number` varchar(100) NOT NULL COMMENT '子项料号',
  `child_type` enum('accessory','spare_part') NOT NULL COMMENT '子项类型：配件/备件',
  `level` int NOT NULL DEFAULT '1' COMMENT '层级(1-5)，备件固定为1',
  `quantity` int DEFAULT '1' COMMENT '数量',
  `required_parts` varchar(100) DEFAULT NULL COMMENT '必选备件料号，多个用逗号分隔',
  `required_quantity` int DEFAULT '1' COMMENT '必选备件数量',
  `sort_order` int DEFAULT '0' COMMENT '同级排序',
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_relation` (`product_line_id`,`parent_part_number`,`child_part_number`),
  KEY `idx_product_line_id` (`product_line_id`),
  KEY `idx_parent_part_number` (`parent_part_number`),
  KEY `idx_child_part_number` (`child_part_number`),
  KEY `idx_required_parts` (`required_parts`),
  KEY `idx_child_type` (`child_type`),
  KEY `idx_level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='关联关系表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_relations`
--

LOCK TABLES `wp_bjt_relations` WRITE;
/*!40000 ALTER TABLE `wp_bjt_relations` DISABLE KEYS */;
/*!40000 ALTER TABLE `wp_bjt_relations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_shapes`
--

DROP TABLE IF EXISTS `wp_bjt_shapes`;
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材形状表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_shapes`
--

LOCK TABLES `wp_bjt_shapes` WRITE;
/*!40000 ALTER TABLE `wp_bjt_shapes` DISABLE KEYS */;
INSERT INTO `wp_bjt_shapes` VALUES (1,1,'pillow','平袋','pillow','/images/shop/MFB25.jpg','/images/shop/MFB25_demo.jpg','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,1,'bubble','气泡袋','bubble','/images/shop/MEX.JPG','/images/shop/MEX_demo.JPG','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(3,1,'tube','筒状袋','tube','/images/shop/MFC.jpg','/images/shop/MFC_demo.jpg','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(4,2,'square','方袋','square','/images/shop/ET2002.jpg','/images/shop/ET2002_demo.jpg','publish',40,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(5,3,'tape','胶带型','tape','/images/shop/FR8003.jpg','/images/shop/FR8003_demo.jpg','publish',50,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_shapes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_spare_part_models`
--

DROP TABLE IF EXISTS `wp_bjt_spare_part_models`;
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
  `status` varchar(20) NOT NULL DEFAULT 'publish',
  `sort_order` int DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_model` (`product_line_id`,`model`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='备件型号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_spare_part_models`
--

LOCK TABLES `wp_bjt_spare_part_models` WRITE;
/*!40000 ALTER TABLE `wp_bjt_spare_part_models` DISABLE KEYS */;
INSERT INTO `wp_bjt_spare_part_models` VALUES (1,1,'SPR-100','气泵皮膜','Pump Membrane','气垫机专用气泵皮膜','Pump membrane for air cushion machine',NULL,'/images/shop/MPV.jpg',NULL,NULL,'publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,1,'SPR-200','加热丝','Heating Wire','气垫机专用加热丝','Heating wire for air cushion machine',NULL,'/images/shop/LA-F2.jpg',NULL,NULL,'publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(3,2,'SPR-300','切纸刀片','Cutting Blade','纸机专用切纸刀片','Cutting blade for paper machine',NULL,'/images/shop/ET2002.jpg',NULL,NULL,'publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(4,3,'SPR-400','胶带机刀片','Tape Cutter','胶带机专用刀片','Cutter for tape machine',NULL,'/images/shop/FR8003.jpg',NULL,NULL,'publish',40,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(5,2,'SPR-500','新备件','New Spare','新备件描述','New spare part description',NULL,'/images/shop/new.jpg',NULL,NULL,'publish',50,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_spare_part_models` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_spare_parts`
--

DROP TABLE IF EXISTS `wp_bjt_spare_parts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_spare_parts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `app_model` varchar(255) DEFAULT NULL COMMENT '适配机型',
  `model` varchar(100) NOT NULL COMMENT '配件型号',
  `is_consumable` tinyint(1) DEFAULT '0' COMMENT '是否易损',
  `image_url` varchar(255) DEFAULT NULL COMMENT '产品图片',
  `part_number` varchar(100) NOT NULL COMMENT '料号',
  `name_zh` varchar(255) NOT NULL COMMENT '中文名称',
  `name_en` varchar(255) NOT NULL COMMENT '英文名称',
  `spec` varchar(255) DEFAULT NULL COMMENT '规格参数(公制)',
  `spec_imperial` varchar(255) DEFAULT NULL COMMENT '规格参数(英制)',
  `app_sn` varchar(255) DEFAULT NULL COMMENT '适配序列号',
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
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_part_number` (`product_line_id`,`part_number`),
  KEY `idx_product_line_id` (`product_line_id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='备件料号表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_spare_parts`
--

LOCK TABLES `wp_bjt_spare_parts` WRITE;
/*!40000 ALTER TABLE `wp_bjt_spare_parts` DISABLE KEYS */;
INSERT INTO `wp_bjt_spare_parts` VALUES (1,1,'LA-E4S','SPR-100',0,'/images/shop/MPV.jpg','16P00001','E4S气泵皮膜','E4S Pump Membrane','8x8x0.2cm','3.1x3.1x0.08in','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(2,1,'LA-E4S,LA-E5P','SPR-200',0,'/images/shop/LA-F2.jpg','16P00002','E4S加热丝','E4S Heating Wire','15cm长','5.9in length','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(3,1,'LA-E5P','SPR-100',0,'/images/shop/MPV.jpg','16P00003','E5P气泵皮膜','E5P Pump Membrane','10x10x0.3cm','3.9x3.9x0.12in','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(4,1,'LA-E5P','SPR-200',0,'/images/shop/LA-F2.jpg','16P00004','E5P加热丝','E5P Heating Wire','20cm长','7.9in length','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(5,2,'PM-100','SPR-300',0,'/images/shop/ET2002.jpg','26P00001','PM100切纸刀片','PM100 Cutting Blade','30cm长','11.8in length','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(6,2,'PM-200','SPR-300',0,'/images/shop/ET1003.jpg','26P00002','PM200切纸刀片','PM200 Cutting Blade','35cm长','13.8in length','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(7,3,'TM-200','SPR-400',0,'/images/shop/FR8003.jpg','36P00001','TM200切刀','TM200 Cutter','8cm长','3.1in length','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(8,3,'TM-300','SPR-400',0,'/images/shop/EC2005.jpg','36P00002','TM300切刀','TM300 Cutter','10cm长','3.9in length','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(9,4,'ACB-100','SPR-100',0,'/images/shop/MPV.jpg','46B00001','ACB100气阀皮膜','ACB100 Valve Membrane','5x5x0.2cm','2.0x2.0x0.08in','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs'),(10,4,'ACB-200','SPR-100',0,'/images/shop/LA-E4S.jpg','46B00002','ACB200气阀皮膜','ACB200 Valve Membrane','6x6x0.2cm','2.4x2.4x0.08in','All',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'publish','2025-05-21 05:01:05','2025-05-21 05:01:05','pcs');
/*!40000 ALTER TABLE `wp_bjt_spare_parts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_specifications`
--

DROP TABLE IF EXISTS `wp_bjt_specifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_specifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_line_id` bigint NOT NULL COMMENT '产品线ID',
  `spec_type` enum('thickness','weight','width','length') NOT NULL COMMENT '规格类型',
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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='耗材规格尺寸表';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_specifications`
--

LOCK TABLES `wp_bjt_specifications` WRITE;
/*!40000 ALTER TABLE `wp_bjt_specifications` DISABLE KEYS */;
INSERT INTO `wp_bjt_specifications` VALUES (1,1,'thickness',25.00,'um',1.00,'mil','publish',10,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(2,1,'thickness',50.00,'um',2.00,'mil','publish',20,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(3,1,'width',20.00,'cm',7.90,'in','publish',30,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(4,1,'width',40.00,'cm',15.70,'in','publish',40,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(5,1,'length',100.00,'m',328.10,'ft','publish',50,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(6,1,'length',200.00,'m',656.20,'ft','publish',60,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(7,2,'weight',120.00,'gsm',3.50,'oz/yd²','publish',70,'2025-05-21 05:01:05','2025-05-21 05:01:05'),(8,2,'weight',180.00,'gsm',5.30,'oz/yd²','publish',80,'2025-05-21 05:01:05','2025-05-21 05:01:05');
/*!40000 ALTER TABLE `wp_bjt_specifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wp_bjt_users`
--

DROP TABLE IF EXISTS `wp_bjt_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wp_bjt_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL,
  `status` varchar(20) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `preferred_unit` varchar(20) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wp_bjt_users`
--

LOCK TABLES `wp_bjt_users` WRITE;
/*!40000 ALTER TABLE `wp_bjt_users` DISABLE KEYS */;
INSERT INTO `wp_bjt_users` VALUES (1,'admin','admin@example.com','hashed_password_here','admin','active','2025-05-21 05:01:05','2025-05-21 05:01:05','metric'),(2,'sales_user','sales@example.com','hashed_password_here','sales','active','2025-05-21 05:01:05','2025-05-21 05:01:05','metric'),(3,'euvip_customer','euvip@example.com','hashed_password_here','customer','active','2025-05-21 05:01:05','2025-05-21 05:01:05','imperial'),(4,'au_customer','au@example.com','hashed_password_here','customer','active','2025-05-21 05:01:05','2025-05-21 05:01:05','metric'),(5,'na_customer','na@example.com','hashed_password_here','customer','active','2025-05-21 05:01:05','2025-05-21 05:01:05','imperial');
/*!40000 ALTER TABLE `wp_bjt_users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-21  5:02:06
