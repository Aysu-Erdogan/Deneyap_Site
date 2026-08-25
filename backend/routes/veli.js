const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { oturumKontrol, rolKontrol } = require('../middleware/auth');

// GET /api/veliler - Veli listesi + bağlı öğrenciler
router.get('/api/veliler', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT v.veli_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no,
               GROUP_CONCAT(
                   CONCAT(ok.ad, ' ', ok.soyad) 
                   ORDER BY ok.ad SEPARATOR '||'
               ) AS ogrenci_adlari,
               GROUP_CONCAT(o.ogrenci_id ORDER BY ok.ad SEPARATOR ',') AS ogrenci_id_list,
               COUNT(o.ogrenci_id) AS ogrenci_sayisi
        FROM veliler v
        JOIN kullanicilar k ON k.kullanici_id = v.kullanici_id
        LEFT JOIN ogrenciler o ON o.veli_id = v.veli_id
        LEFT JOIN kullanicilar ok ON ok.kullanici_id = o.kullanici_id
        WHERE k.aktif_mi = 1
        GROUP BY v.veli_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no
    `;
    db.query(sorgu, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// GET /api/veliler/tum - Tüm veliler (aktif) - dropdown için
router.get('/api/veliler/tum', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT v.veli_id, k.ad, k.soyad, k.email
        FROM veliler v
        JOIN kullanicilar k ON k.kullanici_id = v.kullanici_id
        WHERE k.aktif_mi = 1
        ORDER BY k.ad
    `;
    db.query(sorgu, (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// GET /api/veliler/dropdown - Öğrenci formu için kısa veli listesi
router.get('/api/veliler/dropdown', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT v.veli_id, k.ad, k.soyad, k.email
        FROM veliler v
        JOIN kullanicilar k ON k.kullanici_id = v.kullanici_id
        WHERE k.aktif_mi = 1
    `;
    db.query(sorgu, (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// POST /api/veliler/ekle
router.post('/api/veliler/ekle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { ad, soyad, email, telefon, tc_no, sifre, ogrenci_idler } = req.body;

    if (!ad || !soyad || !email || !sifre) {
        return res.status(400).json({ error: 'Ad, Soyad, Email ve Şifre zorunludur.' });
    }

    const hash = crypto.createHash('sha256').update(sifre).digest('hex');
    const rol_id = 2; // 2 = Veli

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Transaction başlatılamadı.' });

        const kullaniciSorgu = 'INSERT INTO kullanicilar (rol_id, ad, soyad, email, telefon, tc_no, sifre_hash, aktif_mi) VALUES (?, ?, ?, ?, ?, ?, ?, 1)';
        db.query(kullaniciSorgu, [rol_id, ad, soyad, email, telefon || null, tc_no || null, hash], (err1, res1) => {
            if (err1) {
                return db.rollback(() => {
                    console.error('Kullanıcı ekleme hatası:', err1);
                    res.status(500).json({ error: 'Kullanıcı oluşturulurken hata oluştu.' });
                });
            }

            const kullanici_id = res1.insertId;
            db.query('INSERT INTO veliler (kullanici_id) VALUES (?)', [kullanici_id], (err2, res2) => {
                if (err2) {
                    return db.rollback(() => {
                        console.error('Veli ekleme hatası:', err2);
                        res.status(500).json({ error: 'Veli kaydı oluşturulurken hata oluştu.' });
                    });
                }

                const veli_id = res2.insertId;
                const ogrenciArr = Array.isArray(ogrenci_idler) ? ogrenci_idler : (ogrenci_idler ? [ogrenci_idler] : []);

                if (ogrenciArr.length > 0) {
                    const ogrSorgu = 'UPDATE ogrenciler SET veli_id = ? WHERE ogrenci_id IN (?)';
                    db.query(ogrSorgu, [veli_id, ogrenciArr], (err3) => {
                        if (err3) {
                            return db.rollback(() => {
                                console.error('Öğrenci-veli bağlantı hatası:', err3);
                                res.status(500).json({ error: 'Öğrenciler veliye bağlanırken hata oluştu.' });
                            });
                        }
                        db.commit(err4 => {
                            if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                            res.json({ success: true, veli_id });
                        });
                    });
                } else {
                    db.commit(err4 => {
                        if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                        res.json({ success: true, veli_id });
                    });
                }
            });
        });
    });
});

// PUT /api/veliler/guncelle
router.put('/api/veliler/guncelle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { veli_id, kullanici_id, ad, soyad, email, telefon, tc_no, ogrenci_idler } = req.body;

    if (!veli_id || !kullanici_id || !ad || !soyad || !email) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const ogrenciArr = Array.isArray(ogrenci_idler) ? ogrenci_idler.map(Number) : (ogrenci_idler ? [Number(ogrenci_idler)] : []);

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Transaction başlatılamadı.' });

        const kullaniciSorgu = 'UPDATE kullanicilar SET ad=?, soyad=?, email=?, telefon=?, tc_no=? WHERE kullanici_id=?';
        db.query(kullaniciSorgu, [ad, soyad, email, telefon || null, tc_no || null, kullanici_id], (err1) => {
            if (err1) {
                return db.rollback(() => {
                    console.error('Kullanıcı güncelleme hatası:', err1);
                    res.status(500).json({ error: 'Kullanıcı güncellenirken hata oluştu.' });
                });
            }

            db.query('UPDATE ogrenciler SET veli_id = NULL WHERE veli_id = ?', [veli_id], (err2) => {
                if (err2) {
                    return db.rollback(() => {
                        console.error('Öğrenci bağlantı kaldırma hatası:', err2);
                        res.status(500).json({ error: 'Öğrenci bağlantıları kaldırılırken hata oluştu.' });
                    });
                }

                if (ogrenciArr.length > 0) {
                    db.query('UPDATE ogrenciler SET veli_id = ? WHERE ogrenci_id IN (?)', [veli_id, ogrenciArr], (err3) => {
                        if (err3) {
                            return db.rollback(() => {
                                console.error('Öğrenci bağlama hatası:', err3);
                                res.status(500).json({ error: 'Öğrenciler veliye bağlanırken hata oluştu.' });
                            });
                        }
                        db.commit(err4 => {
                            if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                            res.json({ success: true });
                        });
                    });
                } else {
                    db.commit(err3 => {
                        if (err3) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                        res.json({ success: true });
                    });
                }
            });
        });
    });
});

// PUT /api/veliler/pasif-yap
router.put('/api/veliler/pasif-yap', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { kullanici_id } = req.body;
    if (!kullanici_id) return res.status(400).json({ error: 'kullanici_id gerekli.' });

    db.query('UPDATE kullanicilar SET aktif_mi = 0 WHERE kullanici_id = ?', [kullanici_id], (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Pasifleştirme işlemi başarısız.' });
        }
        res.json({ success: true });
    });
});

module.exports = router;
