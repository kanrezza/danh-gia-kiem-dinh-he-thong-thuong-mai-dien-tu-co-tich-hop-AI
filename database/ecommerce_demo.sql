-- MySQL dump 10.13  Distrib 8.0.46, for Linux (aarch64)
--
-- Host: localhost    Database: ecommerce
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `ai_chat_messages`
--

DROP TABLE IF EXISTS `ai_chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `session_id` int NOT NULL,
  `role` enum('USER','AI') NOT NULL,
  `message` text NOT NULL,
  `voucher` varchar(50) DEFAULT NULL COMMENT 'Ma voucher neu AI phat ra',
  `metadata` json DEFAULT NULL COMMENT 'Context bo sung: intent, voucher, v.v.',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ai_messages_session` (`session_id`,`created_at`),
  CONSTRAINT `ai_chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `ai_chat_sessions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_chat_messages`
--

LOCK TABLES `ai_chat_messages` WRITE;
/*!40000 ALTER TABLE `ai_chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_chat_sessions`
--

DROP TABLE IF EXISTS `ai_chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_chat_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ai_session_user` (`user_id`),
  CONSTRAINT `ai_chat_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_chat_sessions`
--

LOCK TABLES `ai_chat_sessions` WRITE;
/*!40000 ALTER TABLE `ai_chat_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `ai_chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance_sessions`
--

DROP TABLE IF EXISTS `attendance_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `attendance_sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `check_in_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `check_out_at` datetime DEFAULT NULL,
  `worked_seconds` int NOT NULL DEFAULT '0',
  `wage_rate` decimal(10,2) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'open',
  `note` varchar(255) DEFAULT NULL,
  `corrected_by_manager_id` int DEFAULT NULL,
  `corrected_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `corrected_by_manager_id` (`corrected_by_manager_id`),
  KEY `idx_attendance_staff_status` (`staff_id`,`status`),
  KEY `idx_attendance_checkin` (`check_in_at`),
  CONSTRAINT `attendance_sessions_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `attendance_sessions_ibfk_2` FOREIGN KEY (`corrected_by_manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance_sessions`
--

LOCK TABLES `attendance_sessions` WRITE;
/*!40000 ALTER TABLE `attendance_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `attendance_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `display_type` varchar(50) NOT NULL DEFAULT 'general',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Ao thun','general','2026-09-26 08:29:51'),(2,'Ao khoac','general','2026-09-26 08:29:51'),(3,'Quan','general','2026-09-26 08:29:51'),(4,'Phu kien','general','2026-09-26 08:29:51');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `thread_id` int NOT NULL,
  `sender_role` varchar(20) NOT NULL,
  `sender_id` int DEFAULT NULL,
  `receiver_id` int DEFAULT NULL,
  `message` text NOT NULL,
  `order_id` int DEFAULT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'text',
  `sentiment` varchar(20) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `idx_chat_thread_time` (`thread_id`,`created_at`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`thread_id`) REFERENCES `threads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_logs`
--

DROP TABLE IF EXISTS `inventory_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `manager_id` int NOT NULL,
  `quantity_added` int NOT NULL,
  `old_stock` int NOT NULL,
  `new_stock` int NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_inventory_logs_manager` (`manager_id`),
  KEY `idx_inventory_logs_product` (`product_id`),
  CONSTRAINT `inventory_logs_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `inventory_logs_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_logs`
--

LOCK TABLES `inventory_logs` WRITE;
/*!40000 ALTER TABLE `inventory_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) NOT NULL,
  `is_read` tinyint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_notifications_user_read` (`user_id`,`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int DEFAULT NULL,
  `variant_id` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '1',
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `product_name` varchar(255) DEFAULT NULL,
  `product_image` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  KEY `variant_id` (`variant_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `order_items_ibfk_3` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,NULL,2,120000.00,'San pham kiem thu 1','uploads/sample-1.jpg'),(2,2,2,NULL,2,140000.00,'San pham kiem thu 2','uploads/sample-2.jpg'),(3,3,3,NULL,2,160000.00,'San pham kiem thu 3','uploads/sample-3.jpg'),(4,4,4,NULL,2,180000.00,'San pham kiem thu 4','uploads/sample-4.jpg'),(5,5,5,NULL,2,200000.00,'San pham kiem thu 5','uploads/sample-5.jpg');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_logs`
--

DROP TABLE IF EXISTS `order_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `user_id` int DEFAULT NULL,
  `action` varchar(50) NOT NULL,
  `old_value` varchar(255) DEFAULT NULL,
  `new_value` varchar(255) DEFAULT NULL,
  `note` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `order_id` (`order_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `order_logs_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `order_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_logs`
--

LOCK TABLES `order_logs` WRITE;
/*!40000 ALTER TABLE `order_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `total` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(50) NOT NULL DEFAULT 'pending',
  `receiver_name` varchar(100) DEFAULT NULL,
  `receiver_phone` varchar(20) DEFAULT NULL,
  `shipping_address` varchar(255) DEFAULT NULL,
  `expected_delivery` date DEFAULT NULL,
  `payment_method` varchar(20) NOT NULL DEFAULT 'cod',
  `cancel_reason` varchar(255) DEFAULT NULL,
  `processed_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `processed_by` (`processed_by`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_user` (`user_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,6,240000.00,'pending','Khach hang mot','0900000000','123 Nguyen Trai, Ha Noi','2026-09-29','cod',NULL,NULL,'2026-09-26 08:29:51'),(2,6,280000.00,'processing','Khach hang mot','0900000000','123 Nguyen Trai, Ha Noi','2026-09-29','cod',NULL,NULL,'2026-09-26 08:29:51'),(3,6,320000.00,'shipping','Khach hang mot','0900000000','123 Nguyen Trai, Ha Noi','2026-09-29','cod',NULL,NULL,'2026-09-26 08:29:51'),(4,6,360000.00,'completed','Khach hang mot','0900000000','123 Nguyen Trai, Ha Noi','2026-09-29','cod',NULL,NULL,'2026-09-26 08:29:51'),(5,6,400000.00,'cancelled','Khach hang mot','0900000000','123 Nguyen Trai, Ha Noi','2026-09-29','cod',NULL,NULL,'2026-09-26 08:29:51');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `user_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_product_user_review` (`product_id`,`user_id`),
  KEY `user_id` (`user_id`),
  KEY `idx_product_reviews_product` (`product_id`),
  CONSTRAINT `product_reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `product_reviews_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `variant_name` varchar(255) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_variants_product` (`product_id`),
  CONSTRAINT `product_variants_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'SKU-1-SizeS','Size S',120000.00,10,'2026-09-26 08:29:51'),(2,1,'SKU-1-SizeM','Size M',130000.00,15,'2026-09-26 08:29:51'),(3,1,'SKU-1-SizeL','Size L',140000.00,8,'2026-09-26 08:29:51'),(4,2,'SKU-2-SizeS','Size S',140000.00,10,'2026-09-26 08:29:51'),(5,2,'SKU-2-SizeM','Size M',150000.00,15,'2026-09-26 08:29:51'),(6,2,'SKU-2-SizeL','Size L',160000.00,8,'2026-09-26 08:29:51'),(7,3,'SKU-3-SizeS','Size S',160000.00,10,'2026-09-26 08:29:51'),(8,3,'SKU-3-SizeM','Size M',170000.00,15,'2026-09-26 08:29:51'),(9,3,'SKU-3-SizeL','Size L',180000.00,8,'2026-09-26 08:29:51');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` decimal(12,2) NOT NULL DEFAULT '0.00',
  `original_price` decimal(12,2) DEFAULT NULL,
  `description` text,
  `stock` int NOT NULL DEFAULT '0',
  `image` varchar(255) DEFAULT NULL,
  `category_id` int DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `display_type` varchar(50) NOT NULL DEFAULT 'general',
  `specifications` json DEFAULT NULL,
  `embedding` longtext,
  `rejection_reason` varchar(255) DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `category_id` (`category_id`),
  KEY `manager_id` (`manager_id`),
  KEY `idx_products_status` (`status`),
  KEY `idx_products_deleted` (`deleted_at`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `products_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'San pham kiem thu 1',120000.00,170000.00,'Mo ta cua san pham kiem thu so 1',50,'uploads/sample-1.jpg',1,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(2,'San pham kiem thu 2',140000.00,190000.00,'Mo ta cua san pham kiem thu so 2',50,'uploads/sample-2.jpg',2,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(3,'San pham kiem thu 3',160000.00,210000.00,'Mo ta cua san pham kiem thu so 3',50,'uploads/sample-3.jpg',3,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(4,'San pham kiem thu 4',180000.00,230000.00,'Mo ta cua san pham kiem thu so 4',50,'uploads/sample-4.jpg',4,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(5,'San pham kiem thu 5',200000.00,250000.00,'Mo ta cua san pham kiem thu so 5',50,'uploads/sample-5.jpg',1,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(6,'San pham kiem thu 6',220000.00,270000.00,'Mo ta cua san pham kiem thu so 6',50,'uploads/sample-6.jpg',2,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(7,'San pham kiem thu 7',240000.00,290000.00,'Mo ta cua san pham kiem thu so 7',50,'uploads/sample-7.jpg',3,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(8,'San pham kiem thu 8',260000.00,310000.00,'Mo ta cua san pham kiem thu so 8',50,'uploads/sample-8.jpg',4,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(9,'San pham kiem thu 9',280000.00,330000.00,'Mo ta cua san pham kiem thu so 9',50,'uploads/sample-9.jpg',1,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(10,'San pham kiem thu 10',300000.00,350000.00,'Mo ta cua san pham kiem thu so 10',50,'uploads/sample-10.jpg',2,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(11,'San pham kiem thu 11',320000.00,370000.00,'Mo ta cua san pham kiem thu so 11',50,'uploads/sample-11.jpg',3,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(12,'San pham kiem thu 12',340000.00,390000.00,'Mo ta cua san pham kiem thu so 12',50,'uploads/sample-12.jpg',4,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(13,'San pham kiem thu 13',360000.00,410000.00,'Mo ta cua san pham kiem thu so 13',50,'uploads/sample-13.jpg',1,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(14,'San pham kiem thu 14',380000.00,430000.00,'Mo ta cua san pham kiem thu so 14',50,'uploads/sample-14.jpg',2,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(15,'San pham kiem thu 15',400000.00,450000.00,'Mo ta cua san pham kiem thu so 15',50,'uploads/sample-15.jpg',3,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(16,'San pham cho duyet 1',300000.00,NULL,'Cho quan tri vien phe duyet',20,NULL,3,2,'pending','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(17,'San pham cho duyet 2',300000.00,NULL,'Cho quan tri vien phe duyet',20,NULL,3,2,'pending','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(18,'San pham cho duyet 3',300000.00,NULL,'Cho quan tri vien phe duyet',20,NULL,3,2,'pending','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(19,'San pham ton kho thap A',250000.00,NULL,'Ton kho duoi nguong canh bao',3,NULL,4,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(20,'San pham ton kho thap B',180000.00,NULL,'Ton kho duoi nguong canh bao',2,NULL,4,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51'),(21,'San pham chi con mot cai',500000.00,NULL,'Dung cho kiem thu tranh chap dat hang',1,NULL,2,2,'active','general',NULL,NULL,NULL,NULL,'2026-09-26 08:29:51');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `return_requests`
--

DROP TABLE IF EXISTS `return_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `return_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `order_id` int NOT NULL,
  `reason` text NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `order_id` (`order_id`),
  CONSTRAINT `return_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `return_requests_ibfk_2` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `return_requests`
--

LOCK TABLES `return_requests` WRITE;
/*!40000 ALTER TABLE `return_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `return_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'ADMIN'),(5,'CUSTOMER'),(2,'MANAGER'),(3,'STAFF'),(4,'WAREHOUSE');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_registrations`
--

DROP TABLE IF EXISTS `shift_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shift_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `manager_id` int DEFAULT NULL,
  `shift_date` date NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `staff_id` (`staff_id`),
  KEY `manager_id` (`manager_id`),
  KEY `idx_shift_registrations_status` (`status`,`shift_date`),
  CONSTRAINT `shift_registrations_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shift_registrations_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_registrations`
--

LOCK TABLES `shift_registrations` WRITE;
/*!40000 ALTER TABLE `shift_registrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `shift_registrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_requests`
--

DROP TABLE IF EXISTS `staff_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `manager_id` int DEFAULT NULL,
  `request_type` varchar(20) NOT NULL COMMENT 'late | leave',
  `order_id` int DEFAULT NULL,
  `request_date` date NOT NULL,
  `minutes_late` int DEFAULT NULL,
  `reason` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `manager_note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `staff_id` (`staff_id`),
  KEY `manager_id` (`manager_id`),
  KEY `idx_staff_requests_status` (`status`,`request_date`),
  KEY `fk_sr_order` (`order_id`),
  CONSTRAINT `fk_sr_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `staff_requests_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `staff_requests_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_requests`
--

LOCK TABLES `staff_requests` WRITE;
/*!40000 ALTER TABLE `staff_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_work_logs`
--

DROP TABLE IF EXISTS `staff_work_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_work_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `manager_id` int NOT NULL,
  `work_date` date NOT NULL,
  `hours_worked` decimal(5,2) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `manager_id` (`manager_id`),
  KEY `idx_staff_work_logs_staff_date` (`staff_id`,`work_date`),
  CONSTRAINT `staff_work_logs_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `staff_work_logs_ibfk_2` FOREIGN KEY (`manager_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_work_logs`
--

LOCK TABLES `staff_work_logs` WRITE;
/*!40000 ALTER TABLE `staff_work_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_work_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `threads`
--

DROP TABLE IF EXISTS `threads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `threads` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'open',
  `is_ai_muted` tinyint(1) NOT NULL DEFAULT '0',
  `is_human_needed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_thread_user` (`user_id`),
  CONSTRAINT `threads_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `threads`
--

LOCK TABLES `threads` WRITE;
/*!40000 ALTER TABLE `threads` DISABLE KEYS */;
/*!40000 ALTER TABLE `threads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_activity_logs`
--

DROP TABLE IF EXISTS `user_activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_activity_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `target_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_activity_time` (`created_at`),
  CONSTRAINT `user_activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_activity_logs`
--

LOCK TABLES `user_activity_logs` WRITE;
/*!40000 ALTER TABLE `user_activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_vouchers`
--

DROP TABLE IF EXISTS `user_vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_vouchers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `voucher_id` int NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `received_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_voucher` (`user_id`,`voucher_id`),
  KEY `voucher_id` (`voucher_id`),
  CONSTRAINT `user_vouchers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_vouchers_ibfk_2` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`voucher_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_vouchers`
--

LOCK TABLES `user_vouchers` WRITE;
/*!40000 ALTER TABLE `user_vouchers` DISABLE KEYS */;
INSERT INTO `user_vouchers` VALUES (1,6,1,0,'2026-09-26 08:29:51'),(2,6,2,0,'2026-09-26 08:29:51');
/*!40000 ALTER TABLE `user_vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `role_id` int DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'pending',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_by` int DEFAULT NULL,
  `hourly_rate` decimal(10,2) NOT NULL DEFAULT '30000.00',
  `employment_status` varchar(20) NOT NULL DEFAULT 'official',
  `probation_start_at` datetime DEFAULT NULL,
  `official_at` datetime DEFAULT NULL,
  `probation_hourly_rate` decimal(10,2) NOT NULL DEFAULT '20000.00',
  `official_hourly_rate` decimal(10,2) NOT NULL DEFAULT '25000.00',
  `deleted_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_created_by` (`created_by`),
  KEY `idx_users_role` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`),
  CONSTRAINT `users_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Quan tri vien','admin@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',1,'active',1,NULL,30000.00,'official',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51'),(2,'Quan ly kho','manager@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',2,'active',1,NULL,30000.00,'official',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51'),(3,'Nhan vien chinh thuc','staff@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',3,'active',1,NULL,30000.00,'official',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51'),(4,'Nhan vien thu viec','staff.probation@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',3,'active',1,NULL,30000.00,'probation',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51'),(5,'Nhan vien cho duyet','staff.pending@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',3,'pending',1,NULL,30000.00,'probation',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51'),(6,'Khach hang mot','customer1@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',5,'active',1,NULL,30000.00,'official',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51'),(7,'Khach hang hai','customer2@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',5,'active',1,NULL,30000.00,'official',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51'),(8,'Khach hang bi khoa','customer.locked@tigershop.test','$2b$10$BL9uDDN0/c48.Hp144zkM.PPsAdfwo1yj66u/FPRW0k8fu96jH8we','0900000000',NULL,'2000-01-15',5,'active',0,NULL,30000.00,'official',NULL,NULL,20000.00,25000.00,NULL,'2026-09-26 08:29:51');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `voucher_id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'percent',
  `value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `min_order_value` decimal(12,2) NOT NULL DEFAULT '0.00',
  `max_discount` decimal(12,2) DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `used` int NOT NULL DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `source` varchar(30) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`voucher_id`),
  UNIQUE KEY `code` (`code`),
  KEY `idx_vouchers_status` (`status`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES (1,'SALE20','percent',20.00,200000.00,50000.00,100,0,'2026-09-19','2026-10-26','active','SEED','2026-09-26 08:29:51'),(2,'GIAM50K','fixed',50000.00,300000.00,NULL,50,0,'2026-09-19','2026-10-26','active','SEED','2026-09-26 08:29:51'),(3,'HETLUOT','percent',10.00,0.00,20000.00,5,5,'2026-09-19','2026-10-26','active','SEED','2026-09-26 08:29:51'),(4,'HETHAN','percent',15.00,0.00,30000.00,100,0,'2026-07-28','2026-09-25','active','SEED','2026-09-26 08:29:51');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-25 16:44:17
