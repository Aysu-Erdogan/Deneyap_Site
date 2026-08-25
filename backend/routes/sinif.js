const express = require('express');
const router = express.Router();
const db = require('../db');
const { oturumKontrol, rolKontrol } = require('../middleware/auth');

// GET /api/dersler - Tüm dersleri listele
router.get('/api/dersler', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    db.query('SELECT ders_id, ders_adi FROM dersler ORDER BY ders_adi', (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// GET /api/atolyeler - Atölye listesi
router.get('/api/atolyeler', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    db.query('SELECT atolye_id, atolye_adi FROM atolyeler WHERE aktif_mi = 1 ORDER BY atolye_adi', (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// GET /api/siniflar - Tüm sınıfları listele (kontenjan, öğrenci sayısı dahil)
router.get('/api/siniflar', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT 
            s.sinif_id,
            s.sinif_adi,
            s.kontenjan,
            s.aktif_mi,
            s.atolye_id,
            a.atolye_adi,
            COUNT(o.ogrenci_id) AS ogrenci_sayisi,
            (s.kontenjan - COUNT(o.ogrenci_id)) AS bos_kontenjan
        FROM siniflar s
        LEFT JOIN atolyeler a ON a.atolye_id = s.atolye_id
        LEFT JOIN ogrenciler o ON o.sinif_id = s.sinif_id AND o.kullanici_id IN (SELECT kullanici_id FROM kullanicilar WHERE aktif_mi = 1)
        WHERE s.aktif_mi = 1
        GROUP BY s.sinif_id, s.sinif_adi, s.kontenjan, s.aktif_mi, s.atolye_id, a.atolye_adi
        ORDER BY s.sinif_adi
    `;
    db.query(sorgu, (err, results) => {
        if (err) {
            console.error('Sınıflar listesi hatası:', err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// GET /api/siniflar/tum - Tüm sınıflar (dropdown için)
router.get('/api/siniflar/tum', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT sinif_id, sinif_adi, kontenjan, atolye_id
        FROM siniflar
        WHERE aktif_mi = 1
        ORDER BY sinif_adi
    `;
    db.query(sorgu, (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// POST /api/siniflar/ekle - Yeni sınıf oluştur
router.post('/api/siniflar/ekle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { sinif_adi, kontenjan, atolye_id } = req.body;

    if (!sinif_adi || !kontenjan || !atolye_id) {
        return res.status(400).json({ error: 'Sınıf adı, kontenjan ve atölye zorunludur.' });
    }

    const sorgu = 'INSERT INTO siniflar (sinif_adi, kontenjan, atolye_id, aktif_mi) VALUES (?, ?, ?, 1)';
    db.query(sorgu, [sinif_adi, kontenjan, atolye_id], (err, result) => {
        if (err) {
            console.error('Sınıf ekleme hatası:', err);
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({ error: 'Bu isimde bir sınıf zaten var.' });
            }
            return res.status(500).json({ error: 'Sınıf eklenirken hata oluştu.' });
        }
        res.json({ success: true, sinif_id: result.insertId });
    });
});

// PUT /api/siniflar/guncelle - Sınıf güncelle
router.put('/api/siniflar/guncelle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { sinif_id, sinif_adi, kontenjan, atolye_id } = req.body;

    if (!sinif_id || !sinif_adi || !kontenjan || !atolye_id) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const ogrenciKontrolSorgu = 'SELECT COUNT(*) as sayi FROM ogrenciler o JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id WHERE o.sinif_id = ? AND k.aktif_mi = 1';
    db.query(ogrenciKontrolSorgu, [sinif_id], (err, result) => {
        if (err) {
            console.error('Öğrenci sayısı kontrol hatası:', err);
            return res.status(500).json({ error: 'Kontenjan kontrolünde hata oluştu.' });
        }

        const mevcutOgrenci = result[0].sayi;
        if (kontenjan < mevcutOgrenci) {
            return res.status(400).json({ 
                error: `Kontenjan (${kontenjan}), mevcut öğrenci sayısından (${mevcutOgrenci}) az olamaz.` 
            });
        }

        const sorgu = 'UPDATE siniflar SET sinif_adi = ?, kontenjan = ?, atolye_id = ? WHERE sinif_id = ?';
        db.query(sorgu, [sinif_adi, kontenjan, atolye_id, sinif_id], (err2, result2) => {
            if (err2) {
                console.error('Sınıf güncelleme hatası:', err2);
                if (err2.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ error: 'Bu isimde bir sınıf zaten var.' });
                }
                return res.status(500).json({ error: 'Sınıf güncellenirken hata oluştu.' });
            }
            res.json({ success: true });
        });
    });
});

// DELETE /api/siniflar/sil - Sınıf sil
router.delete('/api/siniflar/sil', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { sinif_id } = req.body;
    if (!sinif_id) return res.status(400).json({ error: 'sinif_id gerekli.' });

    const ogrenciKontrolSorgu = 'SELECT COUNT(*) as sayi FROM ogrenciler o JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id WHERE o.sinif_id = ? AND k.aktif_mi = 1';
    db.query(ogrenciKontrolSorgu, [sinif_id], (err, result) => {
        if (err) {
            console.error('Öğrenci kontrol hatası:', err);
            return res.status(500).json({ error: 'Kontrol sırasında hata oluştu.' });
        }

        if (result[0].sayi > 0) {
            return res.status(400).json({ 
                error: 'Bu sınıfta aktif öğrenci bulunduğu için silinemez. Önce öğrencileri başka sınıfa taşıyın veya pasif yapın.' 
            });
        }

        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: 'Transaction başlatılamadı.' });

            db.query('DELETE FROM sinif_dersler WHERE sinif_id = ?', [sinif_id], (err1) => {
                if (err1) {
                    return db.rollback(() => {
                        console.error('Sınıf-ders silme hatası:', err1);
                        res.status(500).json({ error: 'Sınıf-ders ilişkileri silinirken hata oluştu.' });
                    });
                }

                db.query('DELETE FROM egitimsiniflar WHERE sinif_id = ?', [sinif_id], (err2) => {
                    if (err2) {
                        return db.rollback(() => {
                            console.error('Eğitim-sınıf silme hatası:', err2);
                            res.status(500).json({ error: 'Eğitim-sınıf ilişkileri silinirken hata oluştu.' });
                        });
                    }

                    db.query('DELETE FROM siniflar WHERE sinif_id = ?', [sinif_id], (err3) => {
                        if (err3) {
                            return db.rollback(() => {
                                console.error('Sınıf silme hatası:', err3);
                                res.status(500).json({ error: 'Sınıf silinirken hata oluştu.' });
                            });
                        }

                        db.commit(err4 => {
                            if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                            res.json({ success: true });
                        });
                    });
                });
            });
        });
    });
});

// GET /api/siniflar/:id/dersler - Sınıfın derslerini listele
router.get('/api/siniflar/:id/dersler', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const { id } = req.params;
    const sorgu = `
        SELECT 
            sd.sinif_ders_id,
            sd.sinif_id,
            sd.ders_id,
            d.ders_adi
        FROM sinif_dersler sd
        JOIN dersler d ON d.ders_id = sd.ders_id
        WHERE sd.sinif_id = ?
        ORDER BY d.ders_adi
    `;
    db.query(sorgu, [id], (err, results) => {
        if (err) {
            console.error('Sınıf dersleri hatası:', err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// POST /api/siniflar/:id/dersler - Sınıfa ders ekle
router.post('/api/siniflar/:id/dersler', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { id } = req.params;
    const { ders_id } = req.body;

    if (!ders_id) {
        return res.status(400).json({ error: 'ders_id gerekli.' });
    }

    db.query('SELECT sinif_id FROM siniflar WHERE sinif_id = ?', [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı.' });
        }

        db.query('SELECT ders_id FROM dersler WHERE ders_id = ?', [ders_id], (err2, result2) => {
            if (err2 || result2.length === 0) {
                return res.status(404).json({ error: 'Ders bulunamadı.' });
            }

            db.query('SELECT * FROM sinif_dersler WHERE sinif_id = ? AND ders_id = ?', [id, ders_id], (err3, result3) => {
                if (err3) {
                    console.error('Kontrol hatası:', err3);
                    return res.status(500).json({ error: 'Kontrol sırasında hata oluştu.' });
                }
                if (result3.length > 0) {
                    return res.status(400).json({ error: 'Bu ders bu sınıfa zaten atanmış.' });
                }

                db.query('INSERT INTO sinif_dersler (sinif_id, ders_id) VALUES (?, ?)', [id, ders_id], (err4, result4) => {
                    if (err4) {
                        console.error('Ders ekleme hatası:', err4);
                        return res.status(500).json({ error: 'Ders eklenirken hata oluştu.' });
                    }
                    res.json({ success: true, sinif_ders_id: result4.insertId });
                });
            });
        });
    });
});

// DELETE /api/siniflar/:id/dersler/:ders_id - Sınıftan ders çıkar
router.delete('/api/siniflar/:id/dersler/:ders_id', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { id, ders_id } = req.params;

    db.query('DELETE FROM sinif_dersler WHERE sinif_id = ? AND ders_id = ?', [id, ders_id], (err, result) => {
        if (err) {
            console.error('Ders çıkarma hatası:', err);
            return res.status(500).json({ error: 'Ders çıkarılırken hata oluştu.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'İlişki bulunamadı.' });
        }
        res.json({ success: true });
    });
});

// GET /api/siniflar/:id/ogrenciler - Sınıf öğrencilerini listele
router.get('/api/siniflar/:id/ogrenciler', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const { id } = req.params;
    const sorgu = `
        SELECT 
            o.ogrenci_id,
            k.kullanici_id,
            k.ad,
            k.soyad,
            k.email,
            k.telefon,
            o.okul,
            o.sinif_seviyesi,
            v.veli_id,
            vk.ad AS veli_ad,
            vk.soyad AS veli_soyad
        FROM ogrenciler o
        JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id
        LEFT JOIN veliler v ON v.veli_id = o.veli_id
        LEFT JOIN kullanicilar vk ON vk.kullanici_id = v.kullanici_id
        WHERE o.sinif_id = ? AND k.aktif_mi = 1
        ORDER BY k.ad, k.soyad
    `;
    db.query(sorgu, [id], (err, results) => {
        if (err) {
            console.error('Sınıf öğrencileri hatası:', err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// GET /api/siniflar/:id/detay - Sınıf detayı
router.get('/api/siniflar/:id/detay', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const { id } = req.params;

    const sinifSorgu = `
        SELECT 
            s.sinif_id,
            s.sinif_adi,
            s.kontenjan,
            s.atolye_id,
            a.atolye_adi,
            COUNT(o.ogrenci_id) AS ogrenci_sayisi,
            (s.kontenjan - COUNT(o.ogrenci_id)) AS bos_kontenjan
        FROM siniflar s
        LEFT JOIN atolyeler a ON a.atolye_id = s.atolye_id
        LEFT JOIN ogrenciler o ON o.sinif_id = s.sinif_id AND o.kullanici_id IN (SELECT kullanici_id FROM kullanicilar WHERE aktif_mi = 1)
        WHERE s.sinif_id = ?
        GROUP BY s.sinif_id, s.sinif_adi, s.kontenjan, s.atolye_id, a.atolye_adi
    `;

    db.query(sinifSorgu, [id], (err, sinifResult) => {
        if (err || sinifResult.length === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı.' });
        }

        const sinif = sinifResult[0];

        const derslerSorgu = `
            SELECT 
                sd.sinif_ders_id,
                sd.ders_id,
                d.ders_adi
            FROM sinif_dersler sd
            JOIN dersler d ON d.ders_id = sd.ders_id
            WHERE sd.sinif_id = ?
            ORDER BY d.ders_adi
        `;

        db.query(derslerSorgu, [id], (err2, dersler) => {
            if (err2) {
                console.error('Dersler hatası:', err2);
                return res.status(500).json({ error: 'Veritabanı hatası' });
            }

            const ogrencilerSorgu = `
                SELECT 
                    o.ogrenci_id,
                    k.kullanici_id,
                    k.ad,
                    k.soyad,
                    k.email,
                    o.okul,
                    o.sinif_seviyesi
                FROM ogrenciler o
                JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id
                WHERE o.sinif_id = ? AND k.aktif_mi = 1
                ORDER BY k.ad, k.soyad
            `;

            db.query(ogrencilerSorgu, [id], (err3, ogrenciler) => {
                if (err3) {
                    console.error('Öğrenciler hatası:', err3);
                    return res.status(500).json({ error: 'Veritabanı hatası' });
                }

                res.json({
                    sinif,
                    dersler,
                    ogrenciler
                });
            });
        });
    });
});

module.exports = router;
