-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: deneyap_sistemi
-- ------------------------------------------------------
-- Server version	8.0.30

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
-- Table structure for table `atolyeler`
--

DROP TABLE IF EXISTS `atolyeler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atolyeler` (
  `atolye_id` int NOT NULL AUTO_INCREMENT,
  `atolye_adi` varchar(150) NOT NULL,
  `il` varchar(100) NOT NULL,
  `aktif_mi` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`atolye_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atolyeler`
--

LOCK TABLES `atolyeler` WRITE;
/*!40000 ALTER TABLE `atolyeler` DISABLE KEYS */;
INSERT INTO `atolyeler` VALUES (1,'Ardahan Atölyesi','Ardahan',1),(2,'İstanbul Atölyesi','İstanbul',1);
/*!40000 ALTER TABLE `atolyeler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bildirimalicilari`
--

DROP TABLE IF EXISTS `bildirimalicilari`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bildirimalicilari` (
  `bildirim_id` int NOT NULL,
  `kullanici_id` int NOT NULL,
  `okundu_mu` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`bildirim_id`,`kullanici_id`),
  KEY `fk_bildirim_alici_kullanici` (`kullanici_id`),
  CONSTRAINT `fk_bildirim_alici_bildirim` FOREIGN KEY (`bildirim_id`) REFERENCES `bildirimler` (`bildirim_id`),
  CONSTRAINT `fk_bildirim_alici_kullanici` FOREIGN KEY (`kullanici_id`) REFERENCES `kullanicilar` (`kullanici_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bildirimalicilari`
--

LOCK TABLES `bildirimalicilari` WRITE;
/*!40000 ALTER TABLE `bildirimalicilari` DISABLE KEYS */;
/*!40000 ALTER TABLE `bildirimalicilari` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bildirimler`
--

DROP TABLE IF EXISTS `bildirimler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bildirimler` (
  `bildirim_id` int NOT NULL AUTO_INCREMENT,
  `gonderen_id` int NOT NULL,
  `alici_id` int NOT NULL,
  `baslik` varchar(200) NOT NULL,
  `mesaj` text NOT NULL,
  `bildirim_turu` varchar(50) NOT NULL,
  `okundu_mu` tinyint(1) NOT NULL DEFAULT '0',
  `olusturma_tarihi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`bildirim_id`),
  KEY `fk_bildirim_gonderen` (`gonderen_id`),
  KEY `fk_bildirim_alici` (`alici_id`),
  CONSTRAINT `fk_bildirim_alici` FOREIGN KEY (`alici_id`) REFERENCES `kullanicilar` (`kullanici_id`),
  CONSTRAINT `fk_bildirim_gonderen` FOREIGN KEY (`gonderen_id`) REFERENCES `kullanicilar` (`kullanici_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bildirimler`
--

LOCK TABLES `bildirimler` WRITE;
/*!40000 ALTER TABLE `bildirimler` DISABLE KEYS */;
INSERT INTO `bildirimler` VALUES (1,10,1,'Eğitim Başlangıcı','İleri Robotik eğitiminiz 5 Eylül 2026 tarihinde başlayacaktır.','Eğitim',0,'2026-08-14 16:00:25'),(2,10,2,'Yeni Ders İçeriği','İleri Robotik eğitiminizin yeni ders içeriği sisteme eklenmiştir.','Ders',0,'2026-08-14 16:00:25'),(3,10,3,'Sertifikanız Hazır','Tamamladığınız eğitim için sertifikanız oluşturulmuştur.','Sertifika',1,'2026-08-14 16:00:25');
/*!40000 ALTER TABLE `bildirimler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dersicerikleri`
--

DROP TABLE IF EXISTS `dersicerikleri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dersicerikleri` (
  `icerik_id` int NOT NULL AUTO_INCREMENT,
  `egitim_id` int NOT NULL,
  `egitmen_id` int NOT NULL,
  `baslik` varchar(200) NOT NULL,
  `aciklama` text,
  `icerik_turu` varchar(50) NOT NULL,
  `hafta_no` int NOT NULL,
  `dosya_url` varchar(500) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `son_teslim_tarihi` date DEFAULT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `aktif_mi` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`icerik_id`),
  KEY `fk_icerik_egitim` (`egitim_id`),
  KEY `fk_icerik_egitmen` (`egitmen_id`),
  CONSTRAINT `fk_icerik_egitim` FOREIGN KEY (`egitim_id`) REFERENCES `egitimler` (`egitim_id`),
  CONSTRAINT `fk_icerik_egitmen` FOREIGN KEY (`egitmen_id`) REFERENCES `egitmenler` (`egitmen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dersicerikleri`
--

LOCK TABLES `dersicerikleri` WRITE;
/*!40000 ALTER TABLE `dersicerikleri` DISABLE KEYS */;
INSERT INTO `dersicerikleri` VALUES (1,1,1,'Robotik Sistemlere Giriş','Robotik sistemlerin temel bileşenleri ve çalışma prensipleri.','Ders Notu',1,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,NULL,'2026-08-14 13:42:22',1),(2,1,1,'Robotik Sistemlere Giriş Videosu','İlk hafta dersinde kullanılacak tanıtım videosu.','Video',1,NULL,'https://www.youtube.com/watch?v=KRx9JuOwyZo&list=PLN3GyjLz1QFXP3fcD7YuTyCJl5jg6B1L-',NULL,'2026-08-14 13:42:22',1),(3,1,1,'Arduino ve Temel Kodlama','Arduino üzerinde temel programlama yapısının anlatıldığı içerik.','Ders Notu',2,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,NULL,'2026-08-14 13:42:22',1),(4,1,1,'İlk Robotik Uygulama','Öğrencilerin ilk robotik uygulamasını gerçekleştirmesi için hazırlanmış çalışma.','Ödev',2,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,'2026-09-19','2026-08-14 13:42:22',1),(5,1,1,'Sensörler ve Kullanım Alanları','Robotik sistemlerde kullanılan temel sensörler hakkında ders içeriği.','Ders Notu',3,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,NULL,'2026-08-14 13:42:22',1),(6,1,1,'Sensör Kullanımı','Sensörlerin Arduino ile kullanımını gösteren uygulama videosu.','Video',3,NULL,'https://www.youtube.com/watch?v=cmCx4vvnRns&list=PLN3GyjLz1QFXP3fcD7YuTyCJl5jg6B1L-&index=3',NULL,'2026-08-14 13:42:22',1),(7,1,1,'Motor Kontrolü','DC motor ve servo motorların kontrol edilmesi.','Ders Notu',4,'https://www.youtube.com/watch?v=cmCx4vvnRns&list=PLN3GyjLz1QFXP3fcD7YuTyCJl5jg6B1L-&index=3',NULL,NULL,'2026-08-14 13:42:22',1),(8,1,1,'Motor Kontrol Uygulaması','Motor kontrolü üzerine öğrencilerin tamamlayacağı uygulama.','Ödev',4,NULL,NULL,'2026-10-03','2026-08-14 13:42:22',1),(9,1,1,'Robotun Birleştirilmesi','Öğrencilerin önceki haftalarda öğrendikleri parçaları birleştirmesi.','Ders Notu',5,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,NULL,'2026-08-14 13:42:22',1),(10,1,1,'Final Robotik Uygulaması','Eğitim boyunca öğrenilen konuların kullanıldığı son uygulama.','Ödev',6,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,'2026-10-10','2026-08-14 13:42:22',1),(11,1,2,'Robotik Sistemlere Giriş','Robotik sistemlerin temel bileşenleri ve çalışma prensipleri.','Ders Notu',1,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,NULL,'2026-08-14 13:45:08',1),(12,2,2,'Robotik Sistemlere Giriş Videosu','İlk hafta dersinde kullanılacak tanıtım videosu.','Video',1,NULL,'https://www.youtube.com/watch?v=KRx9JuOwyZo&list=PLN3GyjLz1QFXP3fcD7YuTyCJl5jg6B1L-',NULL,'2026-08-14 13:45:08',1),(13,3,2,'Arduino ve Temel Kodlama','Arduino üzerinde temel programlama yapısının anlatıldığı içerik.','Ders Notu',2,'https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,NULL,'2026-08-14 13:45:08',1);
/*!40000 ALTER TABLE `dersicerikleri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dersler`
--

DROP TABLE IF EXISTS `dersler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dersler` (
  `ders_id` int NOT NULL AUTO_INCREMENT,
  `ders_adi` varchar(100) NOT NULL,
  PRIMARY KEY (`ders_id`),
  UNIQUE KEY `ders_adi` (`ders_adi`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dersler`
--

LOCK TABLES `dersler` WRITE;
/*!40000 ALTER TABLE `dersler` DISABLE KEYS */;
INSERT INTO `dersler` VALUES (2,'Havacılık ve Uzay Teknolojileri'),(1,'İleri Robotik'),(3,'Siber Güvenlik'),(4,'Yapay Zeka');
/*!40000 ALTER TABLE `dersler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devamsizliklar`
--

DROP TABLE IF EXISTS `devamsizliklar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devamsizliklar` (
  `devamsizlik_id` int NOT NULL AUTO_INCREMENT,
  `ogrenci_id` int NOT NULL,
  `egitim_id` int NOT NULL,
  `hafta_no` int NOT NULL,
  `durum` varchar(20) NOT NULL,
  `aciklama` text,
  `tarih` date NOT NULL,
  PRIMARY KEY (`devamsizlik_id`),
  UNIQUE KEY `uq_ogrenci_egitim_hafta` (`ogrenci_id`,`egitim_id`,`hafta_no`),
  KEY `fk_devamsizlik_egitim` (`egitim_id`),
  CONSTRAINT `fk_devamsizlik_egitim` FOREIGN KEY (`egitim_id`) REFERENCES `egitimler` (`egitim_id`),
  CONSTRAINT `fk_devamsizlik_ogrenci` FOREIGN KEY (`ogrenci_id`) REFERENCES `ogrenciler` (`ogrenci_id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devamsizliklar`
--

LOCK TABLES `devamsizliklar` WRITE;
/*!40000 ALTER TABLE `devamsizliklar` DISABLE KEYS */;
INSERT INTO `devamsizliklar` VALUES (1,1,1,1,'Geldi',NULL,'2026-09-05'),(2,1,1,2,'Geldi',NULL,'2026-09-12'),(3,1,1,3,'Gelmedi','Herhangi bir mazeret bildirilmedi.','2026-09-19'),(4,1,1,4,'Geldi',NULL,'2026-09-26'),(5,1,1,5,'İzinli','Ailevi sebepler nedeniyle izinli.','2026-10-03'),(6,1,1,6,'Geldi',NULL,'2026-10-10'),(7,2,1,1,'Geldi',NULL,'2026-09-05'),(8,2,1,2,'Gelmedi','Mazeret bildirilmedi.','2026-09-12'),(9,2,1,3,'Geldi',NULL,'2026-09-19'),(10,3,1,1,'Geldi',NULL,'2026-09-05'),(11,3,1,2,'Geldi',NULL,'2026-09-12'),(12,3,1,3,'Geldi',NULL,'2026-09-19'),(13,2,1,4,'Geldi',NULL,'2026-09-26'),(14,2,1,5,'Geldi',NULL,'2026-10-03'),(15,2,1,6,'Geldi',NULL,'2026-10-10'),(16,3,1,4,'Geldi',NULL,'2026-09-26'),(17,3,1,5,'Geldi',NULL,'2026-10-03'),(18,3,1,6,'Geldi',NULL,'2026-10-10');
/*!40000 ALTER TABLE `devamsizliklar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `egitimler`
--

DROP TABLE IF EXISTS `egitimler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `egitimler` (
  `egitim_id` int NOT NULL AUTO_INCREMENT,
  `ders_id` int NOT NULL,
  `baslangic_tarihi` date NOT NULL,
  `bitis_tarihi` date NOT NULL,
  `hafta_sayisi` int NOT NULL,
  `devamsizlik_hakki` int NOT NULL,
  PRIMARY KEY (`egitim_id`),
  KEY `fk_egitim_ders` (`ders_id`),
  CONSTRAINT `fk_egitim_ders` FOREIGN KEY (`ders_id`) REFERENCES `dersler` (`ders_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `egitimler`
--

LOCK TABLES `egitimler` WRITE;
/*!40000 ALTER TABLE `egitimler` DISABLE KEYS */;
INSERT INTO `egitimler` VALUES (1,1,'2026-09-05','2026-10-10',6,2),(2,2,'2026-10-17','2026-12-19',10,3),(3,3,'2026-12-26','2027-01-30',6,2),(4,4,'2027-02-06','2027-04-10',10,3);
/*!40000 ALTER TABLE `egitimler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `egitimsiniflar`
--

DROP TABLE IF EXISTS `egitimsiniflar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `egitimsiniflar` (
  `egitim_sinif_id` int NOT NULL AUTO_INCREMENT,
  `egitim_id` int NOT NULL,
  `sinif_id` int NOT NULL,
  PRIMARY KEY (`egitim_sinif_id`),
  UNIQUE KEY `uq_egitim_sinif` (`egitim_id`,`sinif_id`),
  KEY `fk_egitimsinif_sinif` (`sinif_id`),
  CONSTRAINT `fk_egitimsinif_egitim` FOREIGN KEY (`egitim_id`) REFERENCES `egitimler` (`egitim_id`),
  CONSTRAINT `fk_egitimsinif_sinif` FOREIGN KEY (`sinif_id`) REFERENCES `siniflar` (`sinif_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `egitimsiniflar`
--

LOCK TABLES `egitimsiniflar` WRITE;
/*!40000 ALTER TABLE `egitimsiniflar` DISABLE KEYS */;
INSERT INTO `egitimsiniflar` VALUES (4,1,1),(8,1,2),(12,1,3),(16,1,4),(3,2,1),(7,2,2),(11,2,3),(15,2,4),(2,3,1),(6,3,2),(10,3,3),(14,3,4),(1,4,1),(5,4,2),(9,4,3),(13,4,4);
/*!40000 ALTER TABLE `egitimsiniflar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `egitmenler`
--

DROP TABLE IF EXISTS `egitmenler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `egitmenler` (
  `egitmen_id` int NOT NULL AUTO_INCREMENT,
  `kullanici_id` int NOT NULL,
  PRIMARY KEY (`egitmen_id`),
  UNIQUE KEY `kullanici_id` (`kullanici_id`),
  CONSTRAINT `fk_egitmen_kullanici` FOREIGN KEY (`kullanici_id`) REFERENCES `kullanicilar` (`kullanici_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `egitmenler`
--

LOCK TABLES `egitmenler` WRITE;
/*!40000 ALTER TABLE `egitmenler` DISABLE KEYS */;
INSERT INTO `egitmenler` VALUES (1,7),(2,8),(3,9);
/*!40000 ALTER TABLE `egitmenler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `egitmenpaylasimlari`
--

DROP TABLE IF EXISTS `egitmenpaylasimlari`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `egitmenpaylasimlari` (
  `paylasim_id` int NOT NULL AUTO_INCREMENT,
  `egitmen_id` int NOT NULL,
  `ders_id` int NOT NULL,
  `baslik` varchar(200) NOT NULL,
  `aciklama` text NOT NULL,
  `konu` varchar(150) NOT NULL,
  `icerik_turu` varchar(50) NOT NULL,
  `dosya_url` varchar(500) DEFAULT NULL,
  `video_url` varchar(500) DEFAULT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `aktif_mi` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`paylasim_id`),
  KEY `fk_paylasim_egitmen` (`egitmen_id`),
  KEY `fk_paylasim_ders` (`ders_id`),
  CONSTRAINT `fk_paylasim_ders` FOREIGN KEY (`ders_id`) REFERENCES `dersler` (`ders_id`),
  CONSTRAINT `fk_paylasim_egitmen` FOREIGN KEY (`egitmen_id`) REFERENCES `egitmenler` (`egitmen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `egitmenpaylasimlari`
--

LOCK TABLES `egitmenpaylasimlari` WRITE;
/*!40000 ALTER TABLE `egitmenpaylasimlari` DISABLE KEYS */;
INSERT INTO `egitmenpaylasimlari` VALUES (1,1,1,'Arduino Temel Programlama','Arduino üzerinde temel programlama yapısının anlatıldığı ek kaynak.','Arduino','Ders Notu','https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf',NULL,'2026-08-17 08:51:52',1),(2,1,1,'Sensör Kullanımı','Robotik projelerde kullanılabilecek sensörlerin kullanımına yönelik ek kaynak.','Sensörler','Ders Notu','https://cdn.deneyap.org/ornek/sensorler.pdf',NULL,'2026-08-17 08:51:52',1),(3,2,2,'Havacılık ve Uzay Ek Kaynak','Havacılık ve uzay teknolojileri hakkında öğrencilerin inceleyebileceği ek kaynak.','Havacılık ve Uzay','Video',NULL,'https://www.youtube.com/watch?v=ornek','2026-08-17 08:51:52',1),(4,1,3,'Siber Güvenlik Temelleri','Siber güvenliğin temel kavramlarını anlatan ek ders kaynağı.','Siber Güvenlik','Ders Notu','https://cdn.deneyap.org/ornek/siber-guvenlik.pdf',NULL,'2026-08-17 08:51:52',1);
/*!40000 ALTER TABLE `egitmenpaylasimlari` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `favoriler`
--

DROP TABLE IF EXISTS `favoriler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `favoriler` (
  `paylasim_id` int NOT NULL,
  `egitmen_id` int NOT NULL,
  PRIMARY KEY (`paylasim_id`,`egitmen_id`),
  KEY `fk_favori_egitmen` (`egitmen_id`),
  CONSTRAINT `fk_favori_egitmen` FOREIGN KEY (`egitmen_id`) REFERENCES `egitmenler` (`egitmen_id`),
  CONSTRAINT `fk_favori_paylasim` FOREIGN KEY (`paylasim_id`) REFERENCES `egitmenpaylasimlari` (`paylasim_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `favoriler`
--

LOCK TABLES `favoriler` WRITE;
/*!40000 ALTER TABLE `favoriler` DISABLE KEYS */;
INSERT INTO `favoriler` VALUES (1,1),(3,1),(2,2),(4,3);
/*!40000 ALTER TABLE `favoriler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kullanicilar`
--

DROP TABLE IF EXISTS `kullanicilar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kullanicilar` (
  `kullanici_id` int NOT NULL AUTO_INCREMENT,
  `rol_id` int NOT NULL,
  `ad` varchar(50) NOT NULL,
  `soyad` varchar(50) NOT NULL,
  `email` varchar(150) NOT NULL,
  `telefon` varchar(20) DEFAULT NULL,
  `tc_no` char(11) DEFAULT NULL,
  `sifre_hash` varchar(255) NOT NULL,
  `profil_foto` varchar(500) DEFAULT NULL,
  `aktif_mi` tinyint(1) NOT NULL DEFAULT '1',
  `olusturma_tarihi` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`kullanici_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `tc_no` (`tc_no`),
  KEY `fk_kullanici_rol` (`rol_id`),
  CONSTRAINT `fk_kullanici_rol` FOREIGN KEY (`rol_id`) REFERENCES `roller` (`rol_id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kullanicilar`
--

LOCK TABLES `kullanicilar` WRITE;
/*!40000 ALTER TABLE `kullanicilar` DISABLE KEYS */;
INSERT INTO `kullanicilar` VALUES (1,1,'Haydar Kerem','Kızılateş','haydar@gmail.com','05111111111','11111111111','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,1,'2026-08-14 06:09:54'),(2,1,'Duru','Koçak','duru@gmail.com','05222222222','22222222222','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,1,'2026-08-14 06:18:55'),(3,1,'Engin Can','Uygur','engin@gmail.com','05333333333','33333333333','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,0,'2026-08-14 06:18:55'),(4,2,'Emine','Candan','emine@gmail.com','05444444444','44444444444','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,1,'2026-08-14 06:25:17'),(5,2,'Mehmet','Çolak','mehmet@gmail.com','05555555555','55555555555','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,0,'2026-08-14 06:25:17'),(6,2,'Kahraman','Bayram','kahraman@gmail.com','05666666666','66666666666','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,1,'2026-08-14 06:25:17'),(7,3,'Aysu','Erdoğan','aysu@gmail.com','05777777777','77777777777','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,1,'2026-08-14 06:29:40'),(8,3,'Ahmet','Kaya','ahmet@gmail.com','05888888888','88888888888','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,1,'2026-08-14 06:29:40'),(9,3,'Eyüp','Yılmaz','eyüp@gmail.com','05999999999','99999999999','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,0,'2026-08-14 06:29:40'),(10,4,'Işılay','Deniz','ışılay@gmail.com','05077777777','17777777777','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,1,'2026-08-14 06:32:11'),(11,4,'Tolgay','Gökdemir','tolgay@gmail.com','05088888888','18888888888','cd7cc7b8c88679f706ba919d85e9b8f09209ecaeca9f49cc21506f7310bf3bc9',NULL,0,'2026-08-14 06:32:11');
/*!40000 ALTER TABLE `kullanicilar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `mesajlar`
--

DROP TABLE IF EXISTS `mesajlar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mesajlar` (
  `mesaj_id` int NOT NULL AUTO_INCREMENT,
  `gonderen_id` int NOT NULL,
  `alici_id` int NOT NULL,
  `baslik` varchar(200) NOT NULL,
  `mesaj_icerigi` text NOT NULL,
  `okundu_mu` tinyint(1) NOT NULL DEFAULT '0',
  `gonderim_tarihi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ogrenci_id` int NOT NULL,
  PRIMARY KEY (`mesaj_id`),
  KEY `fk_mesaj_gonderen` (`gonderen_id`),
  KEY `fk_mesaj_alici` (`alici_id`),
  KEY `fk_mesaj_ogrenci` (`ogrenci_id`),
  CONSTRAINT `fk_mesaj_alici` FOREIGN KEY (`alici_id`) REFERENCES `kullanicilar` (`kullanici_id`),
  CONSTRAINT `fk_mesaj_gonderen` FOREIGN KEY (`gonderen_id`) REFERENCES `kullanicilar` (`kullanici_id`),
  CONSTRAINT `fk_mesaj_ogrenci` FOREIGN KEY (`ogrenci_id`) REFERENCES `ogrenciler` (`ogrenci_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `mesajlar`
--

LOCK TABLES `mesajlar` WRITE;
/*!40000 ALTER TABLE `mesajlar` DISABLE KEYS */;
INSERT INTO `mesajlar` VALUES (1,7,1,'Ders Hakkında','Merhaba Haydar, bu haftaki robotik uygulamasına hazırlıklı gelmeni rica ederim.',1,'2026-08-17 08:36:03',1),(2,1,7,'Re: Ders Hakkında','Merhaba hocam, tabii ki. Gerekli hazırlıkları yapacağım.',1,'2026-08-17 08:36:03',1),(3,8,2,'Yeni Ders İçeriği','Duru, yeni ders içeriğini sisteme ekledim. Dersten önce inceleyebilirsin.',0,'2026-08-17 08:36:03',2),(4,3,8,'Ders Sorusu','Hocam, bu haftaki uygulamada kullanacağımız malzemeleri tekrar paylaşabilir misiniz?',0,'2026-08-17 08:36:03',3);
/*!40000 ALTER TABLE `mesajlar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `odevler`
--

DROP TABLE IF EXISTS `odevler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `odevler` (
  `odev_id` int NOT NULL AUTO_INCREMENT,
  `egitim_id` int NOT NULL,
  `egitmen_id` int NOT NULL,
  PRIMARY KEY (`odev_id`),
  KEY `fk_odev_egitim` (`egitim_id`),
  KEY `fk_odev_egitmen` (`egitmen_id`),
  CONSTRAINT `fk_odev_egitim` FOREIGN KEY (`egitim_id`) REFERENCES `egitimler` (`egitim_id`),
  CONSTRAINT `fk_odev_egitmen` FOREIGN KEY (`egitmen_id`) REFERENCES `egitmenler` (`egitmen_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `odevler`
--

LOCK TABLES `odevler` WRITE;
/*!40000 ALTER TABLE `odevler` DISABLE KEYS */;
INSERT INTO `odevler` VALUES (1,1,1),(2,2,2),(3,3,1),(4,4,2);
/*!40000 ALTER TABLE `odevler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ogrenciler`
--

DROP TABLE IF EXISTS `ogrenciler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ogrenciler` (
  `ogrenci_id` int NOT NULL AUTO_INCREMENT,
  `kullanici_id` int NOT NULL,
  `veli_id` int NOT NULL,
  `sinif_id` int NOT NULL,
  `ogrenci_no` varchar(30) DEFAULT NULL,
  `okul` varchar(150) NOT NULL,
  `sinif_seviyesi` varchar(30) NOT NULL,
  PRIMARY KEY (`ogrenci_id`),
  UNIQUE KEY `kullanici_id` (`kullanici_id`),
  UNIQUE KEY `ogrenci_no` (`ogrenci_no`),
  KEY `fk_ogrenci_veli` (`veli_id`),
  KEY `fk_ogrenci_sinif` (`sinif_id`),
  CONSTRAINT `fk_ogrenci_kullanici` FOREIGN KEY (`kullanici_id`) REFERENCES `kullanicilar` (`kullanici_id`),
  CONSTRAINT `fk_ogrenci_sinif` FOREIGN KEY (`sinif_id`) REFERENCES `siniflar` (`sinif_id`),
  CONSTRAINT `fk_ogrenci_veli` FOREIGN KEY (`veli_id`) REFERENCES `veliler` (`veli_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ogrenciler`
--

LOCK TABLES `ogrenciler` WRITE;
/*!40000 ALTER TABLE `ogrenciler` DISABLE KEYS */;
INSERT INTO `ogrenciler` VALUES (1,1,1,1,'DNY12','TOBB Ortaokul','7. Sınıf'),(2,2,2,2,'DNY13','Ardahan Anadolu Lisesi','10. Sınıf'),(3,3,3,1,'DNY14','Ardahan Lisesi','9. Sınıf');
/*!40000 ALTER TABLE `ogrenciler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `paylasimbegenileri`
--

DROP TABLE IF EXISTS `paylasimbegenileri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paylasimbegenileri` (
  `paylasim_id` int NOT NULL,
  `egitmen_id` int NOT NULL,
  PRIMARY KEY (`paylasim_id`,`egitmen_id`),
  KEY `fk_begeni_egitmen` (`egitmen_id`),
  CONSTRAINT `fk_begeni_egitmen` FOREIGN KEY (`egitmen_id`) REFERENCES `egitmenler` (`egitmen_id`),
  CONSTRAINT `fk_begeni_paylasim` FOREIGN KEY (`paylasim_id`) REFERENCES `egitmenpaylasimlari` (`paylasim_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `paylasimbegenileri`
--

LOCK TABLES `paylasimbegenileri` WRITE;
/*!40000 ALTER TABLE `paylasimbegenileri` DISABLE KEYS */;
INSERT INTO `paylasimbegenileri` VALUES (2,1),(3,1),(1,2),(4,2),(1,3),(2,3);
/*!40000 ALTER TABLE `paylasimbegenileri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roller`
--

DROP TABLE IF EXISTS `roller`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roller` (
  `rol_id` int NOT NULL AUTO_INCREMENT,
  `rol_adi` varchar(50) NOT NULL,
  PRIMARY KEY (`rol_id`),
  UNIQUE KEY `rol_adi` (`rol_adi`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roller`
--

LOCK TABLES `roller` WRITE;
/*!40000 ALTER TABLE `roller` DISABLE KEYS */;
INSERT INTO `roller` VALUES (3,'Eğitmen'),(1,'Öğrenci'),(2,'Veli'),(4,'Yönetici');
/*!40000 ALTER TABLE `roller` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sertifikalar`
--

DROP TABLE IF EXISTS `sertifikalar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sertifikalar` (
  `sertifika_id` int NOT NULL AUTO_INCREMENT,
  `ogrenci_id` int NOT NULL,
  `yonetici_id` int NOT NULL,
  `egitim_id` int NOT NULL,
  `sertifika_adi` varchar(200) NOT NULL,
  `sertifika_no` varchar(50) NOT NULL,
  `verilis_tarihi` date NOT NULL,
  `dosya_url` varchar(500) NOT NULL,
  `aciklama` text,
  PRIMARY KEY (`sertifika_id`),
  UNIQUE KEY `sertifika_no` (`sertifika_no`),
  KEY `fk_sertifika_ogrenci` (`ogrenci_id`),
  KEY `fk_sertifika_yonetici` (`yonetici_id`),
  KEY `fk_sertifika_egitim` (`egitim_id`),
  CONSTRAINT `fk_sertifika_egitim` FOREIGN KEY (`egitim_id`) REFERENCES `egitimler` (`egitim_id`),
  CONSTRAINT `fk_sertifika_ogrenci` FOREIGN KEY (`ogrenci_id`) REFERENCES `ogrenciler` (`ogrenci_id`),
  CONSTRAINT `fk_sertifika_yonetici` FOREIGN KEY (`yonetici_id`) REFERENCES `kullanicilar` (`kullanici_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sertifikalar`
--

LOCK TABLES `sertifikalar` WRITE;
/*!40000 ALTER TABLE `sertifikalar` DISABLE KEYS */;
INSERT INTO `sertifikalar` VALUES (1,1,10,1,'İleri Robotik Eğitimi Sertifikası','DNY-2026-00001','2026-10-10','https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf','İleri Robotik eğitimini başarıyla tamamlamıştır.'),(2,2,10,2,'Havacılık ve Uzay Eğitimi Sertifikası','DNY-2026-00002','2026-12-19','https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf','Havacılık ve Uzay eğitimini başarıyla tamamlamıştır.'),(3,3,10,3,'Siber Güvenlik Eğitimi Sertifikası','DNY-2026-00003','2027-01-30','https://cdn.deneyap.org/media/upload/userFormUpload/OYqTVpwsFhJO7omcl3zxJzjaNaamR5HZ.pdf','Siber Güvenlik eğitimini başarıyla tamamlamıştır.');
/*!40000 ALTER TABLE `sertifikalar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sinifegitmenleri`
--

DROP TABLE IF EXISTS `sinifegitmenleri`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sinifegitmenleri` (
  `sinif_id` int NOT NULL,
  `egitmen_id` int NOT NULL,
  PRIMARY KEY (`sinif_id`,`egitmen_id`),
  KEY `fk_sinif_egitmen_egitmen` (`egitmen_id`),
  CONSTRAINT `fk_sinif_egitmen_egitmen` FOREIGN KEY (`egitmen_id`) REFERENCES `egitmenler` (`egitmen_id`),
  CONSTRAINT `fk_sinif_egitmen_sinif` FOREIGN KEY (`sinif_id`) REFERENCES `siniflar` (`sinif_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sinifegitmenleri`
--

LOCK TABLES `sinifegitmenleri` WRITE;
/*!40000 ALTER TABLE `sinifegitmenleri` DISABLE KEYS */;
INSERT INTO `sinifegitmenleri` VALUES (1,1),(3,1),(2,2),(4,2);
/*!40000 ALTER TABLE `sinifegitmenleri` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `siniflar`
--

DROP TABLE IF EXISTS `siniflar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `siniflar` (
  `sinif_id` int NOT NULL AUTO_INCREMENT,
  `sinif_adi` varchar(100) NOT NULL,
  `aktif_mi` tinyint(1) NOT NULL DEFAULT '1',
  `atolye_id` int NOT NULL,
  PRIMARY KEY (`sinif_id`),
  KEY `fk_sinif_atolye` (`atolye_id`),
  CONSTRAINT `fk_sinif_atolye` FOREIGN KEY (`atolye_id`) REFERENCES `atolyeler` (`atolye_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `siniflar`
--

LOCK TABLES `siniflar` WRITE;
/*!40000 ALTER TABLE `siniflar` DISABLE KEYS */;
INSERT INTO `siniflar` VALUES (1,'Sınıf U',1,1),(2,'Sınıf F',1,1),(3,'Sınıf K',1,1),(4,'Sınıf A',1,2);
/*!40000 ALTER TABLE `siniflar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `veliler`
--

DROP TABLE IF EXISTS `veliler`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veliler` (
  `veli_id` int NOT NULL AUTO_INCREMENT,
  `kullanici_id` int NOT NULL,
  PRIMARY KEY (`veli_id`),
  UNIQUE KEY `kullanici_id` (`kullanici_id`),
  CONSTRAINT `fk_veli_kullanici` FOREIGN KEY (`kullanici_id`) REFERENCES `kullanicilar` (`kullanici_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `veliler`
--

LOCK TABLES `veliler` WRITE;
/*!40000 ALTER TABLE `veliler` DISABLE KEYS */;
INSERT INTO `veliler` VALUES (1,4),(2,5),(3,6);
/*!40000 ALTER TABLE `veliler` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `yorumlar`
--

DROP TABLE IF EXISTS `yorumlar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `yorumlar` (
  `yorum_id` int NOT NULL AUTO_INCREMENT,
  `paylasim_id` int NOT NULL,
  `egitmen_id` int NOT NULL,
  `yorum` text NOT NULL,
  `olusturma_tarihi` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`yorum_id`),
  KEY `fk_yorum_paylasim` (`paylasim_id`),
  KEY `fk_yorum_egitmen` (`egitmen_id`),
  CONSTRAINT `fk_yorum_egitmen` FOREIGN KEY (`egitmen_id`) REFERENCES `egitmenler` (`egitmen_id`),
  CONSTRAINT `fk_yorum_paylasim` FOREIGN KEY (`paylasim_id`) REFERENCES `egitmenpaylasimlari` (`paylasim_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `yorumlar`
--

LOCK TABLES `yorumlar` WRITE;
/*!40000 ALTER TABLE `yorumlar` DISABLE KEYS */;
INSERT INTO `yorumlar` VALUES (1,1,2,'Arduino konusunda temel seviyede güzel bir kaynak olmuş.','2026-08-17 08:54:15'),(2,1,1,'Öğrencilerin uygulama öncesinde bu kaynağı incelemesini tavsiye ediyorum.','2026-08-17 08:54:15'),(3,2,2,'Sensörlerin bağlantı şemalarının da incelenmesi faydalı olacaktır.','2026-08-17 08:54:15'),(4,3,1,'Bu kaynak Havacılık ve Uzay konusuna giriş için kullanılabilir.','2026-08-17 08:54:15'),(5,4,3,'Siber güvenlik dersinde temel kavramları pekiştirmek için kullanılabilir.','2026-08-17 08:54:15');
/*!40000 ALTER TABLE `yorumlar` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-17  9:17:56
