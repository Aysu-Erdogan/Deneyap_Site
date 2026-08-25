-- ============================================================
-- DENEYAP SİSTEMİ - SINIF VE DERS YÖNETİMİ MİGRASYONU
-- ============================================================
-- Bu script mevcut verileri koruyarak yeni yapıyı ekler.
-- ============================================================

USE `deneyap_sistemi`;

-- Foreign key kontrollerini geçici olarak kapat
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 1. DERSLER TABLOSUNA 11 DERS EKLE
-- ============================================================
-- Mevcut: 1=İleri Robotik, 2=Havacılık ve Uzay, 3=Siber Güvenlik, 4=Yapay Zeka
-- Eklenecek: 5=Tasarım ve Üretim, 6=Robotik ve Kodlama, 7=Elektronik Programlama ve Nesnelerin İnterneti
--          8=Yazılım Teknolojileri, 9=Nanoteknoloji ve Enerji Bilimi, 10=Enerji Teknolojileri, 11=Mobil Uygulama

INSERT IGNORE INTO `dersler` (`ders_id`, `ders_adi`) VALUES
(1, 'İleri Robotik'),
(2, 'Havacılık ve Uzay Teknolojileri'),
(3, 'Siber Güvenlik'),
(4, 'Yapay Zeka'),
(5, 'Tasarım ve Üretim'),
(6, 'Robotik ve Kodlama'),
(7, 'Elektronik Programlama ve Nesnelerin İnterneti'),
(8, 'Yazılım Teknolojileri'),
(9, 'Nanoteknoloji ve Enerji Bilimi'),
(10, 'Enerji Teknolojileri'),
(11, 'Mobil Uygulama');

-- ============================================================
-- 2. SINIFLAR TABLOSUNA KONTENJAN ALANI EKLE
-- ============================================================
ALTER TABLE `siniflar` 
ADD COLUMN `kontenjan` INT NOT NULL DEFAULT 20 AFTER `sinif_adi`;

-- Mevcut sınıflar için varsayılan kontenjan güncelle
UPDATE `siniflar` SET `kontenjan` = 20 WHERE `kontenjan` IS NULL OR `kontenjan` = 0;

-- ============================================================
-- 3. SINIF-DERS JUNCTION TABLOSU OLUŞTUR
-- ============================================================
CREATE TABLE IF NOT EXISTS `sinif_dersler` (
  `sinif_ders_id` INT NOT NULL AUTO_INCREMENT,
  `sinif_id` INT NOT NULL,
  `ders_id` INT NOT NULL,
  `olusturma_tarihi` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`sinif_ders_id`),
  UNIQUE KEY `uq_sinif_ders` (`sinif_id`, `ders_id`),
  KEY `fk_sinif_ders_sinif` (`sinif_id`),
  KEY `fk_sinif_ders_ders` (`ders_id`),
  CONSTRAINT `fk_sinif_ders_sinif` FOREIGN KEY (`sinif_id`) REFERENCES `siniflar` (`sinif_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_sinif_ders_ders` FOREIGN KEY (`ders_id`) REFERENCES `dersler` (`ders_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ============================================================
-- 4. MEVCUT VERİLERİ MİGRE ET (egitimsiniflar + egitimler -> sinif_dersler)
-- ============================================================
-- Her eğitim-sınıf ilişkisi için ilgili ders_id'yi bulup sinif_dersler'a ekle
INSERT IGNORE INTO `sinif_dersler` (`sinif_id`, `ders_id`)
SELECT DISTINCT es.`sinif_id`, e.`ders_id`
FROM `egitimsiniflar` es
JOIN `egitimler` e ON e.`egitim_id` = es.`egitim_id`;

-- ============================================================
-- 5. MEVCUT EĞİTİMLERİ DE GÜNCELLE (11 ders için eğitim oluştur)
-- ============================================================
-- Eksik dersler için eğitim kaydı oluştur (varsayılan tarihler/haftalar ile)
-- Bu kısım opsiyonel - sadece devamsızlık sistemi için eğitim kaydı gerekirse

-- Mevcut eğitimleri kontrol et
-- INSERT IGNORE INTO `egitimler` (`ders_id`, `baslangic_tarihi`, `bitis_tarihi`, `hafta_sayisi`, `devamsizlik_hakki`) VALUES
-- (5, '2026-09-01', '2026-11-01', 8, 2),
-- (6, '2026-09-01', '2026-11-01', 8, 2),
-- (7, '2026-09-01', '2026-11-01', 8, 2),
-- (8, '2026-09-01', '2026-11-01', 8, 2),
-- (9, '2026-09-01', '2026-11-01', 8, 2),
-- (10, '2026-09-01', '2026-11-01', 8, 2),
-- (11, '2026-09-01', '2026-11-01', 8, 2);

-- Yeni eğitimler için egitimsiniflar kaydı da eklenebilir (tüm sınıflara)
-- INSERT IGNORE INTO `egitimsiniflar` (`egitim_id`, `sinif_id`)
-- SELECT e.`egitim_id`, s.`sinif_id`
-- FROM `egitimler` e
-- CROSS JOIN `siniflar` s
-- WHERE e.`ders_id` IN (5,6,7,8,9,10,11);

-- ============================================================
-- 6. KONTROL SORGULARI
-- ============================================================
-- Dersler kontrol
SELECT 'DERSLER' as tablo, COUNT(*) as sayi FROM `dersler`;

-- Sınıflar kontrol
SELECT 'SINIFLAR' as tablo, `sinif_id`, `sinif_adi`, `kontenjan`, `atolye_id` FROM `siniflar`;

-- Sinif-Ders ilişkisi kontrol
SELECT 'SINIF_DERSLER' as tablo, sd.*, s.`sinif_adi`, d.`ders_adi`
FROM `sinif_dersler` sd
JOIN `siniflar` s ON s.`sinif_id` = sd.`sinif_id`
JOIN `dersler` d ON d.`ders_id` = sd.`ders_id`
ORDER BY s.`sinif_adi`, d.`ders_adi`;

-- Foreign key kontrollerini tekrar aç
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- MİGRASYON TAMAMLANDI
-- ============================================================