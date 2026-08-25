const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { oturumKontrol, rolKontrol } = require('../middleware/auth');

// GET /api/egitmenler - Sadece aktif eğitmenler
router.get('/api/egitmenler', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const sorgu = `
        SELECT e.egitmen_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no,
               GROUP_CONCAT(se.sinif_id) as sinif_id_list,
               GROUP_CONCAT(s.sinif_adi SEPARATOR ', ') as siniflar
        FROM egitmenler e
        JOIN kullanicilar k ON k.kullanici_id = e.kullanici_id
        LEFT JOIN sinifegitmenleri se ON se.egitmen_id = e.egitmen_id
        LEFT JOIN siniflar s ON s.sinif_id = se.sinif_id
        WHERE k.aktif_mi = 1
        GROUP BY e.egitmen_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no
    `;
    db.query(sorgu, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// POST /api/egitmenler/ekle
router.post('/api/egitmenler/ekle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { ad, soyad, email, telefon, tc_no, sifre, siniflar } = req.body;
    
    if (!ad || !soyad || !email || !sifre) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const hash = crypto.createHash('sha256').update(sifre).digest('hex');
    const rol_id = 3; // 3 = Eğitmen

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Transaction başlatılamadı.' });

        const kullaniciSorgu = 'INSERT INTO kullanicilar (rol_id, ad, soyad, email, telefon, tc_no, sifre_hash, aktif_mi) VALUES (?, ?, ?, ?, ?, ?, ?, 1)';
        db.query(kullaniciSorgu, [rol_id, ad, soyad, email, telefon || null, tc_no || null, hash], (err1, res1) => {
            if (err1) {
                return db.rollback(() => {
                    console.error('Kullanıcı ekleme hatası:', err1);
                    res.status(500).json({ error: 'Kullanıcı eklenirken hata oluştu.' });
                });
            }

            const kullanici_id = res1.insertId;
            const egitmenSorgu = 'INSERT INTO egitmenler (kullanici_id) VALUES (?)';
            
            db.query(egitmenSorgu, [kullanici_id], (err2, res2) => {
                if (err2) {
                    return db.rollback(() => {
                        console.error('Eğitmen ekleme hatası:', err2);
                        res.status(500).json({ error: 'Eğitmen kaydı eklenirken hata oluştu.' });
                    });
                }

                const egitmen_id = res2.insertId;
                const siniflarArr = Array.isArray(siniflar) ? siniflar : (siniflar ? [siniflar] : []);

                if (siniflarArr.length > 0) {
                    const sinifDegerleri = siniflarArr.map(sId => [sId, egitmen_id]);
                    const sinifEgitmenSorgu = 'INSERT INTO sinifegitmenleri (sinif_id, egitmen_id) VALUES ?';
                    
                    db.query(sinifEgitmenSorgu, [sinifDegerleri], (err3) => {
                        if (err3) {
                            return db.rollback(() => {
                                console.error('Sınıf-eğitmen atama hatası:', err3);
                                res.status(500).json({ error: 'Sınıf atamaları yapılırken hata oluştu.' });
                            });
                        }

                        db.commit(err4 => {
                            if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                            res.json({ success: true, egitmen_id });
                        });
                    });
                } else {
                    db.commit(err4 => {
                        if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                        res.json({ success: true, egitmen_id });
                    });
                }
            });
        });
    });
});

// PUT /api/egitmenler/guncelle
router.put('/api/egitmenler/guncelle', oturumKontrol, rolKontrol([4]), (req, res) => {
    const { egitmen_id, kullanici_id, ad, soyad, email, telefon, tc_no, siniflar } = req.body;

    if (!egitmen_id || !kullanici_id || !ad || !soyad || !email) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

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

            const sinifSilSorgu = 'DELETE FROM sinifegitmenleri WHERE egitmen_id=?';
            db.query(sinifSilSorgu, [egitmen_id], (err2) => {
                if (err2) {
                    return db.rollback(() => {
                        console.error('Eski sınıf atamaları silinemedi:', err2);
                        res.status(500).json({ error: 'Sınıf atamaları güncellenirken hata oluştu.' });
                    });
                }

                const siniflarArr = Array.isArray(siniflar) ? siniflar : (siniflar ? [siniflar] : []);

                if (siniflarArr.length > 0) {
                    const sinifDegerleri = siniflarArr.map(sId => [sId, egitmen_id]);
                    const sinifEkleSorgu = 'INSERT INTO sinifegitmenleri (sinif_id, egitmen_id) VALUES ?';

                    db.query(sinifEkleSorgu, [sinifDegerleri], (err3) => {
                        if (err3) {
                            return db.rollback(() => {
                                console.error('Yeni sınıf atama hatası:', err3);
                                res.status(500).json({ error: 'Sınıflar atanamadı.' });
                            });
                        }

                        db.commit(err4 => {
                            if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                            res.json({ success: true });
                        });
                    });
                } else {
                    db.commit(err4 => {
                        if (err4) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                        res.json({ success: true });
                    });
                }
            });
        });
    });
});

// PUT /api/egitmenler/pasif-yap
router.put('/api/egitmenler/pasif-yap', oturumKontrol, rolKontrol([4]), (req, res) => {
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
