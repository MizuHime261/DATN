-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: localhost    Database: qlth
-- ------------------------------------------------------
-- Server version	8.0.41

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `class_enrollments`
--

DROP TABLE IF EXISTS `class_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int NOT NULL,
  `class_id` int NOT NULL,
  `term_id` int DEFAULT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_active_enrollment` (`student_user_id`,`active`),
  UNIQUE KEY `uq_enrollment_once` (`student_user_id`,`class_id`,`term_id`),
  KEY `fk_enr_class` (`class_id`),
  CONSTRAINT `fk_enr_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_enr_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `class_enrollments`
--

LOCK TABLES `class_enrollments` WRITE;
/*!40000 ALTER TABLE `class_enrollments` DISABLE KEYS */;
INSERT INTO `class_enrollments` VALUES (1,22,1,NULL,'2025-10-01 06:18:08',1);
/*!40000 ALTER TABLE `class_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `grade_id` int NOT NULL,
  `name` varchar(64) NOT NULL,
  `homeroom_teacher_id` int DEFAULT NULL,
  `room_name` varchar(255) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_room_one_class` (`room_name`),
  KEY `fk_classes_grade` (`grade_id`),
  KEY `fk_classes_teacher` (`homeroom_teacher_id`),
  CONSTRAINT `fk_classes_grade` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_classes_teacher` FOREIGN KEY (`homeroom_teacher_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classes`
--

LOCK TABLES `classes` WRITE;
/*!40000 ALTER TABLE `classes` DISABLE KEYS */;
INSERT INTO `classes` VALUES (1,1,'1A1',21,'Tòa A - P101',1),(2,3,'3A1',18,'Tòa A - P301',1),(3,2,'2A1',15,'Tòa A - P201',1),(4,4,'4A1',2,'Tòa A - P401',1),(5,5,'5A1',12,'Tòa A - P501',1),(6,6,'6A1',20,'Tòa B - P101',1),(7,7,'7A1',17,'Tòa B - P201',1),(8,8,'8A1',14,'Tòa B - P301',1),(9,9,'9A1',3,'Tòa B - P401',1),(10,10,'10A1',3,'Tòa C - P101',1),(11,11,'11A1',19,'Tòa C - P201',1),(12,12,'12A1',16,'Tòa C - P301',1);
/*!40000 ALTER TABLE `classes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conduct_reviews`
--

DROP TABLE IF EXISTS `conduct_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conduct_reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int NOT NULL,
  `term_id` int NOT NULL,
  `rating` enum('Tốt','Khá','Trung bình','Yếu') NOT NULL,
  `note` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_conduct` (`student_user_id`,`term_id`),
  KEY `term_id` (`term_id`),
  CONSTRAINT `conduct_reviews_ibfk_1` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conduct_reviews_ibfk_2` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conduct_reviews`
--

LOCK TABLES `conduct_reviews` WRITE;
/*!40000 ALTER TABLE `conduct_reviews` DISABLE KEYS */;
INSERT INTO `conduct_reviews` VALUES (1,22,1,'Tốt',NULL,'2025-10-01 06:56:14','2025-10-01 06:58:33');
/*!40000 ALTER TABLE `conduct_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `education_levels`
--

DROP TABLE IF EXISTS `education_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `education_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(32) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sort_order` smallint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `education_levels`
--

LOCK TABLES `education_levels` WRITE;
/*!40000 ALTER TABLE `education_levels` DISABLE KEYS */;
INSERT INTO `education_levels` VALUES (1,'PRIMARY','Tiểu học',1),(2,'THCS','Trung học cơ sở',2),(3,'THPT','Trung học phổ thông',3);
/*!40000 ALTER TABLE `education_levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grades`
--

DROP TABLE IF EXISTS `grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grades` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_id` int NOT NULL,
  `grade_number` smallint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_grade` (`level_id`,`grade_number`),
  CONSTRAINT `fk_grades_level` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grades`
--

LOCK TABLES `grades` WRITE;
/*!40000 ALTER TABLE `grades` DISABLE KEYS */;
INSERT INTO `grades` VALUES (1,1,1),(2,1,2),(3,1,3),(4,1,4),(5,1,5),(6,2,6),(7,2,7),(8,2,8),(9,2,9),(10,3,10),(11,3,11),(12,3,12);
/*!40000 ALTER TABLE `grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoice_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `item_type` enum('TUITION','MEAL','FEE','DISCOUNT','OTHER') NOT NULL,
  `description` varchar(512) NOT NULL,
  `quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
  `unit_price_cents` int NOT NULL DEFAULT '0',
  `total_cents` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_invoice_items_invoice` (`invoice_id`),
  CONSTRAINT `fk_invoice_items_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invoices` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_user_id` int NOT NULL,
  `level_id` int NOT NULL,
  `billing_period_start` date DEFAULT NULL,
  `billing_period_end` date DEFAULT NULL,
  `status` enum('DRAFT','ISSUED','PARTIALLY_PAID','PAID','VOID') NOT NULL DEFAULT 'DRAFT',
  `total_cents` int NOT NULL DEFAULT '0',
  `currency` varchar(3) NOT NULL DEFAULT 'VND',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `issued_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_invoice_student` (`student_user_id`,`status`),
  KEY `fk_inv_level` (`level_id`),
  CONSTRAINT `fk_inv_level` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_inv_student` FOREIGN KEY (`student_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meal_plans`
--

DROP TABLE IF EXISTS `meal_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meal_plans` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_id` int NOT NULL,
  `plan_date` date NOT NULL,
  `meal_type` enum('LUNCH') NOT NULL,
  `title` varchar(255) NOT NULL,
  `price_cents` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_meal_plan` (`level_id`,`plan_date`,`meal_type`),
  CONSTRAINT `fk_meal_plans_level` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meal_plans`
--

LOCK TABLES `meal_plans` WRITE;
/*!40000 ALTER TABLE `meal_plans` DISABLE KEYS */;
INSERT INTO `meal_plans` VALUES 
(1,1,'2024-10-15','BREAKFAST','Bánh mì + Sữa',5000),
(2,1,'2024-10-15','LUNCH','Cơm + Thịt kho + Canh chua',25000),
(3,1,'2024-10-15','DINNER','Cơm + Cá chiên + Rau muống',20000),
(4,1,'2024-10-16','BREAKFAST','Phở bò',30000),
(5,1,'2024-10-16','LUNCH','Cơm + Gà nướng + Canh khổ qua',30000),
(6,1,'2024-10-16','DINNER','Cơm + Tôm rang me + Rau cải',25000),
(7,1,'2024-10-17','BREAKFAST','Bánh cuốn',20000),
(8,1,'2024-10-17','LUNCH','Cơm + Thịt bò xào + Canh bí đỏ',35000),
(9,1,'2024-10-17','DINNER','Cơm + Cá hấp + Rau lang',22000),
(10,1,'2024-10-18','BREAKFAST','Bánh mì + Trứng',8000),
(11,1,'2024-10-18','LUNCH','Cơm + Thịt heo quay + Canh chua cá',28000),
(12,1,'2024-10-18','DINNER','Cơm + Gà luộc + Rau muống',25000);
/*!40000 ALTER TABLE `meal_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parent_student`
--

DROP TABLE IF EXISTS `parent_student`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parent_student` (
  `parent_id` int NOT NULL,
  `student_id` int NOT NULL,
  `relationship` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`parent_id`,`student_id`),
  KEY `fk_ps_student` (`student_id`),
  CONSTRAINT `fk_ps_parent` FOREIGN KEY (`parent_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ps_student` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parent_student`
--

LOCK TABLES `parent_student` WRITE;
/*!40000 ALTER TABLE `parent_student` DISABLE KEYS */;
INSERT INTO `parent_student` VALUES (32,22,'Mẹ');
/*!40000 ALTER TABLE `parent_student` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `invoice_id` int NOT NULL,
  `amount_cents` int NOT NULL,
  `method` enum('CASH','CARD','TRANSFER','WALLET') NOT NULL,
  `status` enum('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paid_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_invoice` (`invoice_id`,`status`),
  CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `periods`
--

DROP TABLE IF EXISTS `periods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `periods` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL,
  `period_index` smallint NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_period` (`level_id`,`day_of_week`,`period_index`),
  CONSTRAINT `fk_periods_level` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_period_time` CHECK ((`start_time` < `end_time`)),
  CONSTRAINT `periods_chk_1` CHECK ((`day_of_week` between 1 and 7))
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `periods`
--

LOCK TABLES `periods` WRITE;
/*!40000 ALTER TABLE `periods` DISABLE KEYS */;
INSERT INTO `periods` VALUES (1,1,2,1,'07:30:00','08:15:00'),(2,1,2,2,'08:25:00','09:10:00'),(3,1,2,3,'09:20:00','10:05:00'),(4,1,2,4,'10:15:00','11:00:00'),(5,1,2,5,'11:10:00','11:55:00'),(6,1,3,1,'07:30:00','08:15:00'),(7,1,3,2,'08:25:00','09:10:00'),(8,1,3,3,'09:20:00','10:05:00'),(9,1,3,4,'10:15:00','11:00:00'),(10,1,3,5,'11:10:00','11:55:00'),(11,1,4,1,'07:30:00','08:15:00'),(12,1,4,2,'08:25:00','09:10:00'),(13,1,4,3,'09:20:00','10:05:00'),(14,1,4,4,'10:15:00','11:00:00'),(15,1,4,5,'11:10:00','11:55:00'),(16,1,5,1,'07:30:00','08:15:00'),(17,1,5,2,'08:25:00','09:10:00'),(18,1,5,3,'09:20:00','10:05:00'),(19,1,5,4,'10:15:00','11:00:00'),(20,1,5,5,'11:10:00','11:55:00'),(21,1,6,1,'07:30:00','08:15:00'),(22,1,6,2,'08:25:00','09:10:00'),(23,1,6,3,'09:20:00','10:05:00'),(24,1,6,4,'10:15:00','11:00:00'),(25,2,2,1,'07:00:00','07:45:00'),(26,2,2,2,'07:50:00','08:35:00'),(27,2,2,3,'08:40:00','09:25:00'),(28,2,2,4,'09:30:00','10:15:00'),(29,2,2,5,'10:20:00','11:05:00'),(30,2,2,6,'11:10:00','11:55:00'),(31,3,2,1,'07:00:00','07:45:00'),(32,3,2,2,'07:50:00','08:35:00'),(33,3,2,3,'08:40:00','09:25:00'),(34,3,2,4,'09:30:00','10:15:00'),(35,3,2,5,'10:20:00','11:05:00'),(36,3,2,6,'11:10:00','11:55:00'),(37,3,2,7,'13:00:00','13:45:00'),(38,3,2,8,'13:50:00','14:35:00'),(39,3,2,9,'14:40:00','15:25:00');
/*!40000 ALTER TABLE `periods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `school_years`
--

DROP TABLE IF EXISTS `school_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_id` int NOT NULL,
  `name` varchar(32) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_school_year` (`level_id`,`name`),
  CONSTRAINT `fk_school_years_level` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `school_years`
--

LOCK TABLES `school_years` WRITE;
/*!40000 ALTER TABLE `school_years` DISABLE KEYS */;
INSERT INTO `school_years` VALUES (1,1,'2025-2026','2025-08-21','2026-04-27');
/*!40000 ALTER TABLE `school_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_class_history`
--

DROP TABLE IF EXISTS `student_class_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_class_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int DEFAULT NULL,
  `class_id` int DEFAULT NULL,
  `level_id` int DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reason` enum('PROMOTION','TRANSFER','REPEAT','GRADUATION') DEFAULT 'PROMOTION',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `class_id` (`class_id`),
  KEY `level_id` (`level_id`),
  CONSTRAINT `student_class_history_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `users` (`id`),
  CONSTRAINT `student_class_history_ibfk_2` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`),
  CONSTRAINT `student_class_history_ibfk_3` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_class_history`
--

LOCK TABLES `student_class_history` WRITE;
/*!40000 ALTER TABLE `student_class_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_class_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_grades`
--

DROP TABLE IF EXISTS `student_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_grades` (
  `id` char(36) NOT NULL DEFAULT (uuid()),
  `student_user_id` int NOT NULL,
  `subject_id` char(36) NOT NULL,
  `term_id` char(36) NOT NULL,
  `oral` decimal(4,2) DEFAULT NULL,
  `test` decimal(4,2) DEFAULT NULL,
  `exam` decimal(4,2) DEFAULT NULL,
  `average` decimal(4,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_grade` (`student_user_id`,`subject_id`,`term_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_grades`
--

LOCK TABLES `student_grades` WRITE;
/*!40000 ALTER TABLE `student_grades` DISABLE KEYS */;
INSERT INTO `student_grades` VALUES ('db360026-9e90-11f0-9645-e460172cf4f6',22,'30','1',10.00,NULL,NULL,10.00);
/*!40000 ALTER TABLE `student_grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_info`
--

DROP TABLE IF EXISTS `student_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `status` enum('ACTIVE','GRADUATED','TRANSFERRED','DROPPED') DEFAULT 'ACTIVE',
  `enrollment_date` date DEFAULT NULL,
  `graduation_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `student_info_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_info`
--

LOCK TABLES `student_info` WRITE;
/*!40000 ALTER TABLE `student_info` DISABLE KEYS */;
INSERT INTO `student_info` VALUES (1,22,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(2,23,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(3,24,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(4,25,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(5,26,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(6,27,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(7,28,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(8,29,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(9,30,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08'),(10,31,'ACTIVE','2025-09-27',NULL,'2025-09-27 04:24:08');
/*!40000 ALTER TABLE `student_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subject_grades`
--

DROP TABLE IF EXISTS `subject_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subject_grades` (
  `subject_id` int NOT NULL,
  `grade_id` int NOT NULL,
  UNIQUE KEY `uq_subject_grade` (`subject_id`),
  KEY `fk_sg_grade` (`grade_id`),
  CONSTRAINT `fk_sg_grade` FOREIGN KEY (`grade_id`) REFERENCES `grades` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sg_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subject_grades`
--

LOCK TABLES `subject_grades` WRITE;
/*!40000 ALTER TABLE `subject_grades` DISABLE KEYS */;
INSERT INTO `subject_grades` VALUES (4,1),(5,1),(6,1),(30,1);
/*!40000 ALTER TABLE `subject_grades` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `level_id` int NOT NULL,
  `code` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_subject` (`level_id`,`code`),
  CONSTRAINT `fk_subjects_level` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,1,'TOAN','Toán'),(2,1,'TV','Tiếng Việt'),(3,1,'TNXH','Tự nhiên và Xã hội'),(4,1,'AN','Âm nhạc'),(5,1,'MT','Mỹ thuật'),(6,1,'TD','Thể dục'),(7,2,'TOAN','Toán'),(8,2,'VAN','Ngữ văn'),(9,2,'ANH','Tiếng Anh'),(10,2,'LY','Vật lý'),(11,2,'HOA','Hóa học'),(12,2,'SINH','Sinh học'),(13,2,'SU','Lịch sử'),(14,2,'DIA','Địa lý'),(15,2,'GDCD','Giáo dục công dân'),(16,2,'CN','Công nghệ'),(17,2,'TD','Thể dục'),(18,3,'TOAN','Toán'),(19,3,'VAN','Ngữ văn'),(20,3,'ANH','Tiếng Anh'),(21,3,'LY','Vật lý'),(22,3,'HOA','Hóa học'),(23,3,'SINH','Sinh học'),(24,3,'SU','Lịch sử'),(25,3,'DIA','Địa lý'),(26,3,'GDCD','Giáo dục công dân'),(27,3,'TD','Thể dục'),(28,3,'QPAN','Quốc phòng - An ninh'),(30,1,'T1','Toán 1');
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_level`
--

DROP TABLE IF EXISTS `teacher_level`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_level` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `level_id` int NOT NULL,
  `position` varchar(100) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_level` (`teacher_id`,`level_id`),
  KEY `fk_tl_level` (`level_id`),
  CONSTRAINT `fk_tl_level` FOREIGN KEY (`level_id`) REFERENCES `education_levels` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tl_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_level`
--

LOCK TABLES `teacher_level` WRITE;
/*!40000 ALTER TABLE `teacher_level` DISABLE KEYS */;
INSERT INTO `teacher_level` VALUES (1,21,1,NULL,'2025-09-08',NULL),(2,20,2,NULL,NULL,NULL),(3,19,3,NULL,NULL,NULL),(4,18,1,NULL,NULL,NULL),(5,17,2,NULL,NULL,NULL),(6,16,3,NULL,NULL,NULL),(7,15,1,NULL,NULL,NULL),(8,14,2,NULL,NULL,NULL),(9,13,3,NULL,NULL,NULL),(10,12,1,NULL,NULL,NULL),(11,2,1,NULL,NULL,NULL),(12,3,2,NULL,NULL,NULL);
/*!40000 ALTER TABLE `teacher_level` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_subjects`
--

DROP TABLE IF EXISTS `teacher_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_user_id` int NOT NULL,
  `subject_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_teacher_subject` (`teacher_user_id`,`subject_id`),
  KEY `fk_teacher_subjects_subject` (`subject_id`),
  CONSTRAINT `fk_teacher_subjects_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_teacher_subjects_user` FOREIGN KEY (`teacher_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_subjects`
--

LOCK TABLES `teacher_subjects` WRITE;
/*!40000 ALTER TABLE `teacher_subjects` DISABLE KEYS */;
INSERT INTO `teacher_subjects` VALUES (1,15,4),(2,18,5),(3,21,30);
/*!40000 ALTER TABLE `teacher_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `terms`
--

DROP TABLE IF EXISTS `terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `terms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `school_year_id` int NOT NULL,
  `name` varchar(64) NOT NULL,
  `term_order` smallint NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_term_order` (`school_year_id`,`term_order`),
  CONSTRAINT `fk_terms_school_year` FOREIGN KEY (`school_year_id`) REFERENCES `school_years` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `terms`
--

LOCK TABLES `terms` WRITE;
/*!40000 ALTER TABLE `terms` DISABLE KEYS */;
INSERT INTO `terms` VALUES (1,1,'Học kỳ 1',1,'2025-08-21','2025-12-24');
/*!40000 ALTER TABLE `terms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timetable_entries`
--

DROP TABLE IF EXISTS `timetable_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetable_entries` (
  `id` int NOT NULL AUTO_INCREMENT,
  `term_id` int NOT NULL,
  `class_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `teacher_user_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL,
  `period_index` smallint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tt_class_slot` (`term_id`,`class_id`,`day_of_week`,`period_index`),
  UNIQUE KEY `uq_tt_teacher_slot` (`term_id`,`teacher_user_id`,`day_of_week`,`period_index`),
  KEY `fk_tt_class` (`class_id`),
  KEY `fk_tt_subject` (`subject_id`),
  KEY `fk_tt_teacher` (`teacher_user_id`),
  CONSTRAINT `fk_tt_class` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tt_subject` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tt_teacher` FOREIGN KEY (`teacher_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_tt_term` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `timetable_entries_chk_1` CHECK ((`day_of_week` between 1 and 7))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timetable_entries`
--

LOCK TABLES `timetable_entries` WRITE;
/*!40000 ALTER TABLE `timetable_entries` DISABLE KEYS */;
INSERT INTO `timetable_entries` VALUES (3,1,2,4,15,1,3),(5,1,1,30,21,1,3),(6,1,1,4,15,1,2);
/*!40000 ALTER TABLE `timetable_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(255) DEFAULT NULL,
  `reset_token` varchar(255) DEFAULT NULL,
  `reset_token_expiry` bigint DEFAULT NULL,
  `role` enum('ADMIN','TEACHER','STAFF','PARENT','STUDENT') NOT NULL DEFAULT 'STUDENT',
  `google_id` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `gender` enum('Nam','Nữ') DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `phone` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=45 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'trangmeo2k3tb@gmail.com','3349b39b65621a96dd59dfbc9314e82e651cab9771fbaecdd2081839ad5fbe27','Vũ Hà Trang',NULL,NULL,'ADMIN',NULL,'2025-09-27 04:23:38','2025-09-27 07:31:51','Nữ','2003-12-26','0388264291'),(2,'linhchi.nguyen.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Nguyễn Linh Chi',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 14:48:52','Nữ','1990-10-09','0901000001'),(3,'minhquan.tran.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Trần Minh Quân',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 15:52:47','Nam','1990-09-12','0901000002'),(4,'thanhha.le.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Lê Thanh Hà',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000003'),(5,'phuonganh.pham.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Phạm Phương Anh',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000004'),(6,'anhthu.vo.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Võ Anh Thư',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000005'),(7,'quynhmai.hoang.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Hoàng Quỳnh Mai',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000006'),(8,'ducmanh.ngo.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Ngô Đức Mạnh',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000007'),(9,'baoloc.dang.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đặng Bảo Lộc',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000008'),(10,'kimanh.do.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đỗ Kim Anh',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000009'),(11,'huuphuoc.bui.staff@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Bùi Hữu Phước',NULL,NULL,'STAFF',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0901000010'),(12,'thanhson.nguyen.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Nguyễn Thành Sơn',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000001'),(13,'thuyduong.tran.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Trần Thùy Dương',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000002'),(14,'ngocanh.le.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Lê Ngọc Ánh',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000003'),(15,'nhatnam.pham.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Phạm Nhật Nam',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000004'),(16,'khaihoang.vo.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Võ Khải Hoàng',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000005'),(17,'haianh.hoang.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Hoàng Hải Anh',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000006'),(18,'thienan.ngo.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Ngô Thiên Ân',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000007'),(19,'baoan.dang.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đặng Bảo An',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000008'),(20,'kimngan.do.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đỗ Kim Ngân',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000009'),(21,'huonggiang.bui.teacher@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Bùi Hương Giang',NULL,NULL,'TEACHER',NULL,'2025-09-27 04:23:38','2025-09-27 04:23:38',NULL,NULL,'0902000010'),(22,'anhkhoa.nguyen.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Nguyễn Anh Khoa',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 07:32:40','Nam','2019-01-01','0913000001'),(23,'thanhtruc.tran.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Trần Thanh Trúc',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 07:39:09','Nữ','2017-04-13','0913000002'),(24,'hoangnam.le.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Lê Hoàng Nam',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 07:54:40','Nam','2018-05-26','0913000003'),(25,'minhthu.pham.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Phạm Minh Thư',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 07:49:34','Nữ','2019-05-18','0913000004'),(26,'giahan.vo.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Võ Gia Hân',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:08:03','Nữ','2016-02-01','0913000005'),(27,'baochau.hoang.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Hoàng Bảo Châu',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:08:10','Nữ','2015-03-02','0913000006'),(28,'duchuy.ngo.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Ngô Đức Huy',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:08:28','Nam','2014-04-03','0913000007'),(29,'nhatlinh.dang.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đặng Nhật Linh',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:08:48','Nữ','2013-05-04','0913000008'),(30,'kimanh.do.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đỗ Kim Anh',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:09:03','Nữ','2012-06-05','0913000009'),(31,'thanhphong.bui.student@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Bùi Thanh Phong',NULL,NULL,'STUDENT',NULL,'2025-09-27 04:23:38','2025-09-27 07:35:59','Nam','2018-03-12','0913000010'),(32,'minhchau.nguyen.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Nguyễn Minh Châu',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:09:38','Nữ','1988-08-12','0924000001'),(33,'quanghuy.tran.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Trần Quang Huy',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:10:03','Nam','1988-09-13','0924000002'),(34,'thuhien.le.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Lê Thu Hiền',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:10:28','Nữ','1988-09-19','0924000003'),(35,'ngocanh.pham.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Phạm Ngọc Anh',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:39:09','Nữ','1990-09-21','0924000004'),(36,'thuanvo.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Võ Minh Thuận',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:40:00','Nam','1990-12-22','0924000005'),(37,'phuonghoang.hoang.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Hoàng Phương Hoàng',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:39:52','Nữ','1980-12-22','0924000006'),(38,'thanhthanh.ngo.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Ngô Thanh Thanh',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:40:32','Nữ','1990-11-22','0924000007'),(39,'thienphuc.dang.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đặng Thiên Phúc',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:40:48','Nam','1988-09-10','0924000008'),(40,'kimngoc.do.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Đỗ Kim Ngọc',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:41:19','Nữ','1989-05-10','0924000009'),(41,'kimphung.bui.parent@gmail.com','8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92','Bùi Kim Phụng',NULL,NULL,'PARENT',NULL,'2025-09-27 04:23:38','2025-09-27 08:41:40','Nữ','1989-05-10','0924000010'),(42,'thuvu190726@gmail.com','e4d1a229ee666b25375520a11e54ac16ff5d615a5da1e6ef8fb469dd651cfcf0','Vũ Minh Thư',NULL,NULL,'ADMIN',NULL,'2025-09-27 07:31:06','2025-09-27 07:31:06','Nữ','2006-07-19','0982364342'),(43,'vunguyen260798@gmail.com','c854f3b770cb307a1d78fdf2f8ccd20c23c1212a4ccbfc0a424d38eb55660a6d','Vũ Nguyên',NULL,NULL,'STUDENT',NULL,'2025-09-27 07:34:55','2025-09-27 07:34:55','Nam','2019-08-23',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-02 12:32:08
