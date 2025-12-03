-- MySQL dump 10.13  Distrib 8.0.44, for Linux (x86_64)
--
-- Host: localhost    Database: BetON
-- ------------------------------------------------------
-- Server version	8.0.44-0ubuntu0.22.04.1

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
-- Table structure for table `kupony`
--

DROP TABLE IF EXISTS `kupony`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kupony` (
  `id` int NOT NULL AUTO_INCREMENT,
  `data_utworzenia` datetime NOT NULL,
  `stawka` decimal(10,2) NOT NULL,
  `potencjalna_wygrana` decimal(10,2) NOT NULL,
  `status` enum('Oczekujacy','Wygrany','Przegrany') NOT NULL DEFAULT 'Oczekujacy',
  `uzytkownik_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `uzytkownik_id` (`uzytkownik_id`),
  CONSTRAINT `kupony_ibfk_1` FOREIGN KEY (`uzytkownik_id`) REFERENCES `uzytkownicy` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kupony`
--

LOCK TABLES `kupony` WRITE;
/*!40000 ALTER TABLE `kupony` DISABLE KEYS */;
/*!40000 ALTER TABLE `kupony` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mecze`
--

DROP TABLE IF EXISTS `mecze`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mecze` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nazwa_gospodarza` varchar(100) NOT NULL,
  `nazwa_goscia` varchar(100) NOT NULL,
  `data_spotkania` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mecze`
--

LOCK TABLES `mecze` WRITE;
/*!40000 ALTER TABLE `mecze` DISABLE KEYS */;
/*!40000 ALTER TABLE `mecze` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `typy`
--

DROP TABLE IF EXISTS `typy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `typy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nazwa` varchar(255) NOT NULL,
  `kurs` decimal(6,3) NOT NULL,
  `kupon_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `kupon_id` (`kupon_id`),
  CONSTRAINT `typy_ibfk_1` FOREIGN KEY (`kupon_id`) REFERENCES `kupony` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `typy`
--

LOCK TABLES `typy` WRITE;
/*!40000 ALTER TABLE `typy` DISABLE KEYS */;
/*!40000 ALTER TABLE `typy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `typy_przedmeczowe`
--

DROP TABLE IF EXISTS `typy_przedmeczowe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `typy_przedmeczowe` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nazwa` varchar(150) NOT NULL,
  `kurs` decimal(6,3) NOT NULL,
  `mecz_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mecz_id` (`mecz_id`),
  CONSTRAINT `typy_przedmeczowe_ibfk_1` FOREIGN KEY (`mecz_id`) REFERENCES `mecze` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `typy_przedmeczowe`
--

LOCK TABLES `typy_przedmeczowe` WRITE;
/*!40000 ALTER TABLE `typy_przedmeczowe` DISABLE KEYS */;
/*!40000 ALTER TABLE `typy_przedmeczowe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `uzytkownicy`
--

DROP TABLE IF EXISTS `uzytkownicy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uzytkownicy` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nazwa` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `haslo` varchar(255) NOT NULL,
  `saldo` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nazwa` (`nazwa`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `uzytkownicy`
--

LOCK TABLES `uzytkownicy` WRITE;
/*!40000 ALTER TABLE `uzytkownicy` DISABLE KEYS */;
INSERT INTO `uzytkownicy` VALUES (1,'nowy_gracz','','hashed_super_tajne_haslo_dlugi_ciag_znakow',15.50);
/*!40000 ALTER TABLE `uzytkownicy` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-03 21:28:41
