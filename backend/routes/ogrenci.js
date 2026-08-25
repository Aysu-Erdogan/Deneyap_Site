const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { oturumKontrol, rolKontrol } = require('../middleware/auth');

// GET /api/ogrenciler - Sadece aktif öğrenciler
router.get('/api/ogrenciler', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT o.ogrenci_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no,
               s.sinif_id, s.sinif_adi, o.okul, o.sinif_seviyesi,
               v.veli_id, vk.ad AS veli_ad, vk.soyad AS veli_soyad
        FROM ogrenciler o
        JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id
        LEFT JOIN siniflar s ON s.sinif_id = o.sinif_id
        LEFT JOIN veliler v ON v.veli_id = o.veli_id
        LEFT JOIN kullanicilar vk ON vk.kullanici_id = v.kullanici_id
        WHERE k.aktif_mi = 1
    `;
    db.query(sorgu, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// GET /api/ogrenciler/bagsiz - Veli atanmamış öğrenciler
router.get('/api/ogrenciler/bagsiz', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT o.ogrenci_id, k.kullanici_id, k.ad, k.soyad
        FROM ogrenciler o
        JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id
        WHERE k.aktif_mi = 1
        ORDER BY k.ad
    `;
    db.query(sorgu, (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// POST /api/ogrenciler/ekle
router.post('/api/ogrenciler/ekle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { ad, soyad, email, telefon, tc_no, sifre, sinif_id, veli_id, okul, sinif_seviyesi } = req.body;
    
    if (!ad || !soyad || !email || !sifre || !sinif_id || !veli_id) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const kontenjanSorgu = `
        SELECT s.kontenjan, COUNT(o.ogrenci_id) AS mevcut_sayi
        FROM siniflar s
        LEFT JOIN ogrenciler o ON o.sinif_id = s.sinif_id AND o.kullanici_id IN (SELECT kullanici_id FROM kullanicilar WHERE aktif_mi = 1)
        WHERE s.sinif_id = ?
        GROUP BY s.sinif_id, s.kontenjan
    `;
    db.query(kontenjanSorgu, [sinif_id], (err, kontenjanResult) => {
        if (err) {
            console.error('Kontenjan kontrol hatası:', err);
            return res.status(500).json({ error: 'Kontenjan kontrolünde hata oluştu.' });
        }
        if (kontenjanResult.length === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı.' });
        }
        if (kontenjanResult[0].mevcut_sayi >= kontenjanResult[0].kontenjan) {
            return res.status(400).json({ 
                error: `Bu sınıf kontenjanı dolu (${kontenjanResult[0].mevcut_sayi}/${kontenjanResult[0].kontenjan}).` 
            });
        }

        const hash = crypto.createHash('sha256').update(sifre).digest('hex');
        const rol_id = 1; // 1 = Öğrenci

        const kullaniciSorgu = 'INSERT INTO kullanicilar (rol_id, ad, soyad, email, telefon, tc_no, sifre_hash, aktif_mi) VALUES (?, ?, ?, ?, ?, ?, ?, 1)';
        db.query(kullaniciSorgu, [rol_id, ad, soyad, email, telefon || null, tc_no || null, hash], (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Kullanıcı eklenirken hata oluştu.' });
            }
            
            const kullanici_id = result.insertId;
            const ogrenciSorgu = 'INSERT INTO ogrenciler (kullanici_id, veli_id, sinif_id, okul, sinif_seviyesi) VALUES (?, ?, ?, ?, ?)';
            db.query(ogrenciSorgu, [kullanici_id, veli_id, sinif_id, okul || '', sinif_seviyesi || ''], (err2, result2) => {
                if (err2) {
                    console.error(err2);
                    return res.status(500).json({ error: 'Öğrenci detayları eklenirken hata oluştu.' });
                }
                
                const ogrenci_id = result2.insertId;
                const devamsizlikAutoSorgu = `
                    SELECT 
                        d.ders_id,
                        d.ders_adi,
                        e.egitim_id,
                        e.hafta_sayisi,
                        e.baslangic_tarihi
                    FROM sinif_dersler sd
                    JOIN dersler d ON d.ders_id = sd.ders_id
                    JOIN egitimler e ON e.ders_id = d.ders_id
                    WHERE sd.sinif_id = ?
                `;
                db.query(devamsizlikAutoSorgu, [sinif_id], (err3, dersler) => {
                    if (!err3 && dersler.length > 0) {
                        dersler.forEach(ders => {
                            const baslangicTarihi = new Date(ders.baslangic_tarihi);
                            for (let hafta = 1; hafta <= ders.hafta_sayisi; hafta++) {
                                const tarih = new Date(baslangicTarihi);
                                tarih.setDate(tarih.getDate() + (hafta - 1) * 7);
                                const tarihStr = tarih.toISOString().split('T')[0];
                                const insertSorgu = `
                                    INSERT IGNORE INTO devamsizliklar (ogrenci_id, egitim_id, hafta_no, durum, tarih)
                                    VALUES (?, ?, ?, 'Geldi', ?)
                                `;
                                db.query(insertSorgu, [ogrenci_id, ders.egitim_id, hafta, tarihStr]);
                            }
                        });
                    }
                });
                
                res.json({ success: true, ogrenci_id: result2.insertId });
            });
        });
    });
});

// PUT /api/ogrenciler/guncelle
router.put('/api/ogrenciler/guncelle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { kullanici_id, ad, soyad, email, telefon, tc_no, sinif_id, veli_id, okul, sinif_seviyesi } = req.body;

    if (!kullanici_id || !ad || !soyad || !email || !sinif_id || !veli_id) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const mevcutSinifSorgu = 'SELECT sinif_id FROM ogrenciler WHERE kullanici_id = ?';
    db.query(mevcutSinifSorgu, [kullanici_id], (err, mevcutResult) => {
        if (err) {
            console.error('Mevcut sınıf kontrol hatası:', err);
            return res.status(500).json({ error: 'Kontrol sırasında hata oluştu.' });
        }

        const eskiSinifId = mevcutResult.length > 0 ? mevcutResult[0].sinif_id : null;
        const yeniSinifId = parseInt(sinif_id);

        if (eskiSinifId !== yeniSinifId) {
            const kontenjanSorgu = `
                SELECT s.kontenjan, COUNT(o.ogrenci_id) AS mevcut_sayi
                FROM siniflar s
                LEFT JOIN ogrenciler o ON o.sinif_id = s.sinif_id AND o.kullanici_id IN (SELECT kullanici_id FROM kullanicilar WHERE aktif_mi = 1)
                WHERE s.sinif_id = ?
                GROUP BY s.sinif_id, s.kontenjan
            `;
            db.query(kontenjanSorgu, [yeniSinifId], (err2, kontenjanResult) => {
                if (err2) {
                    console.error('Kontenjan kontrol hatası:', err2);
                    return res.status(500).json({ error: 'Kontenjan kontrolünde hata oluştu.' });
                }
                if (kontenjanResult.length === 0) {
                    return res.status(404).json({ error: 'Yeni sınıf bulunamadı.' });
                }
                if (kontenjanResult[0].mevcut_sayi >= kontenjanResult[0].kontenjan) {
                    return res.status(400).json({ 
                        error: `Yeni sınıf kontenjanı dolu (${kontenjanResult[0].mevcut_sayi}/${kontenjanResult[0].kontenjan}).` 
                    });
                }

                ogrenciGuncelle();
            });
        } else {
            ogrenciGuncelle();
        }

        function ogrenciGuncelle() {
            const kullaniciSorgu = 'UPDATE kullanicilar SET ad=?, soyad=?, email=?, telefon=?, tc_no=? WHERE kullanici_id=?';
            db.query(kullaniciSorgu, [ad, soyad, email, telefon || null, tc_no || null, kullanici_id], (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ error: 'Kullanıcı güncellenirken hata oluştu.' });
                }
                
                const ogrenciSorgu = 'UPDATE ogrenciler SET veli_id=?, sinif_id=?, okul=?, sinif_seviyesi=? WHERE kullanici_id=?';
                db.query(ogrenciSorgu, [veli_id, sinif_id, okul || '', sinif_seviyesi || '', kullanici_id], (err2, result2) => {
                    if (err2) {
                        console.error(err2);
                        return res.status(500).json({ error: 'Öğrenci detayları güncellenirken hata oluştu.' });
                    }
                    
                    if (eskiSinifId !== yeniSinifId) {
                        const ogrenciIdSorgu = 'SELECT ogrenci_id FROM ogrenciler WHERE kullanici_id = ?';
                        db.query(ogrenciIdSorgu, [kullanici_id], (err3, ogrenciResult) => {
                            if (!err3 && ogrenciResult.length > 0) {
                                const ogrenci_id = ogrenciResult[0].ogrenci_id;
                                const devamsizlikAutoSorgu = `
                                    SELECT 
                                        d.ders_id,
                                        d.ders_adi,
                                        e.egitim_id,
                                        e.hafta_sayisi,
                                        e.baslangic_tarihi
                                    FROM sinif_dersler sd
                                    JOIN dersler d ON d.ders_id = sd.ders_id
                                    JOIN egitimler e ON e.ders_id = d.ders_id
                                    WHERE sd.sinif_id = ?
                                `;
                                db.query(devamsizlikAutoSorgu, [yeniSinifId], (err4, dersler) => {
                                    if (!err4 && dersler.length > 0) {
                                        dersler.forEach(ders => {
                                            const baslangicTarihi = new Date(ders.baslangic_tarihi);
                                            for (let hafta = 1; hafta <= ders.hafta_sayisi; hafta++) {
                                                const tarih = new Date(baslangicTarihi);
                                                tarih.setDate(tarih.getDate() + (hafta - 1) * 7);
                                                const tarihStr = tarih.toISOString().split('T')[0];
                                                const insertSorgu = `
                                                    INSERT IGNORE INTO devamsizliklar (ogrenci_id, egitim_id, hafta_no, durum, tarih)
                                                    VALUES (?, ?, ?, 'Geldi', ?)
                                                `;
                                                db.query(insertSorgu, [ogrenci_id, ders.egitim_id, hafta, tarihStr]);
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                    
                    res.json({ success: true });
                });
            });
        }
    });
});

// PUT /api/ogrenciler/sil
router.put('/api/ogrenciler/sil', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { kullanici_id } = req.body;
    if (!kullanici_id) return res.status(400).json({ error: 'kullanici_id gerekli.' });

    db.query('UPDATE kullanicilar SET aktif_mi = 0 WHERE kullanici_id = ?', [kullanici_id], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Silme işlemi başarısız.' });
        }
        res.json({ success: true });
    });
});

// POST /api/ogrenci/:ogrenci_id/devamsizlik-auto
router.post('/api/ogrenci/:ogrenci_id/devamsizlik-auto', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { ogrenci_id } = req.params;

    const ogrenciSorgu = `
        SELECT o.ogrenci_id, o.sinif_id, o.kullanici_id
        FROM ogrenciler o
        WHERE o.ogrenci_id = ?
    `;

    db.query(ogrenciSorgu, [ogrenci_id], (err, ogrenciResult) => {
        if (err || ogrenciResult.length === 0) {
            return res.status(404).json({ error: 'Öğrenci bulunamadı.' });
        }

        const ogrenci = ogrenciResult[0];
        const sinif_id = ogrenci.sinif_id;

        const derslerSorgu = `
            SELECT 
                d.ders_id,
                d.ders_adi,
                e.egitim_id,
                e.hafta_sayisi
            FROM sinif_dersler sd
            JOIN dersler d ON d.ders_id = sd.ders_id
            JOIN egitimler e ON e.ders_id = d.ders_id
            WHERE sd.sinif_id = ?
            ORDER BY d.ders_adi
        `;

        db.query(derslerSorgu, [sinif_id], (err2, dersler) => {
            if (err2) {
                console.error('Dersler hatası:', err2);
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }

            if (dersler.length === 0) {
                return res.json({ success: true, message: 'Sınıfın dersi yok, devamsızlık oluşturulmadı.' });
            }

            let completed = 0;
            let hasError = false;

            dersler.forEach(ders => {
                const egitim_id = ders.egitim_id;
                const hafta_sayisi = ders.hafta_sayisi;

                const egitimBilgiSorgu = 'SELECT baslangic_tarihi FROM egitimler WHERE egitim_id = ?';
                db.query(egitimBilgiSorgu, [egitim_id], (err3, egitimResult) => {
                    if (err3 || egitimResult.length === 0) {
                        hasError = true;
                        completed++;
                        if (completed === dersler.length && !hasError) {
                            res.json({ success: true });
                        }
                        return;
                    }

                    const baslangicTarihi = new Date(egitimResult[0].baslangic_tarihi);
                    
                    let haftaCompleted = 0;
                    for (let hafta = 1; hafta <= hafta_sayisi; hafta++) {
                        const tarih = new Date(baslangicTarihi);
                        tarih.setDate(tarih.getDate() + (hafta - 1) * 7);
                        const tarihStr = tarih.toISOString().split('T')[0];

                        const insertSorgu = `
                            INSERT IGNORE INTO devamsizliklar (ogrenci_id, egitim_id, hafta_no, durum, tarih)
                            VALUES (?, ?, ?, 'Geldi', ?)
                        `;
                        db.query(insertSorgu, [ogrenci_id, egitim_id, hafta, tarihStr], (err4) => {
                            haftaCompleted++;
                            if (haftaCompleted === hafta_sayisi) {
                                completed++;
                                if (completed === dersler.length && !hasError) {
                                    res.json({ success: true, message: 'Devamsızlık şablonu oluşturuldu.' });
                                }
                            }
                        });
                    }
                });
            });
        });
    });
});

// GET /api/ogrenci/:ogrenci_id/dersler-devamsizlik - Yönetici paneli öğrenci detayları
router.get('/api/ogrenci/:ogrenci_id/dersler-devamsizlik', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const { ogrenci_id } = req.params;
    
    const derslerSorgu = `
        SELECT
            e.egitim_id,
            d.ders_adi
        FROM ogrenciler o
        JOIN egitimsiniflar es ON es.sinif_id = o.sinif_id
        JOIN egitimler e ON e.egitim_id = es.egitim_id
        JOIN dersler d ON d.ders_id = e.ders_id
        WHERE o.ogrenci_id = ?
        ORDER BY d.ders_adi
    `;

    db.query(derslerSorgu, [ogrenci_id], (err, dersler) => {
        if (err) {
            console.error('Dersler hatası:', err);
            return res.status(500).json({ error: 'Dersler getirilemedi' });
        }

        if (dersler.length === 0) {
            return res.json([]);
        }

        let result = [];
        let completed = 0;

        dersler.forEach(ders => {
            const devamsizlikSorgu = `
                SELECT
                    d.hafta_no,
                    d.durum,
                    d.tarih
                FROM devamsizliklar d
                WHERE d.ogrenci_id = ? AND d.egitim_id = ?
                ORDER BY d.hafta_no
            `;

            db.query(devamsizlikSorgu, [ogrenci_id, ders.egitim_id], (err, devamsizliklar) => {
                if (!err) {
                    result.push({
                        egitim_id: ders.egitim_id,
                        ders_adi: ders.ders_adi,
                        devamsizliklar: devamsizliklar
                    });
                }

                completed++;
                if (completed === dersler.length) {
                    res.json(result);
                }
            });
        });
    });
});

module.exports = router;
