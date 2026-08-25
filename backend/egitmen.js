const express = require('express');
const router = express.Router();
const db = require('./db');
const { oturumKontrol, rolKontrol } = require('./middleware/auth');

router.get('/', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    db.query('SELECT ad FROM kullanicilar WHERE kullanici_id = ?', [kullanici_id], (err, results) => {
        if (err || results.length === 0) {
            return res.render('egitmen', { showLogout: true, egitmenAd: 'Egitmen' });
        }
        res.render('egitmen', { showLogout: true, egitmenAd: results[0].ad });
    });
});

router.get('/api/profil', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    db.query('SELECT ad, soyad, email, telefon FROM kullanicilar WHERE kullanici_id = ?', [kullanici_id], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ success: false, error: 'Hata' });
        }
        res.json({ success: true, user: results[0] });
    });
});

router.put('/api/profil', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    const { ad, soyad, email, telefon } = req.body;
    
    if (!ad || !soyad || !email) {
        return res.status(400).json({ success: false, error: 'Ad, Soyad ve Email zorunludur' });
    }
    
    const sorgu = 'UPDATE kullanicilar SET ad = ?, soyad = ?, email = ?, telefon = ? WHERE kullanici_id = ?';
    db.query(sorgu, [ad, soyad, email, telefon || null, kullanici_id], (err) => {
        if (err) return res.status(500).json({ success: false, error: 'Guncelleme hatasi' });
        res.json({ success: true });
    });
});


// API: Dashboard Istatistikleri
router.get('/api/dashboard-stats', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    
    // Varsayilan degerler
    let stats = {
        bekleyenYoklama: 0,
        yeniEgitimIcerigi: 0,
        yeniBilgiBankasi: 0
    };

    // Egitmen ID'sini bulmak icin sorgu
    db.query('SELECT egitmen_id FROM egitmenler WHERE kullanici_id = ?', [kullanici_id], (err, egitmenResult) => {
        if (err || egitmenResult.length === 0) {
            return res.json({ success: true, stats });
        }
        
        const egitmen_id = egitmenResult[0].egitmen_id;

        // 1. Bekleyen Yoklama (Su an tablo yapisina gore ornek sorgu, daha karmasik hesaplanabilir)
        // Tum devamsizliklar tablosundaki kayitlari sayiyoruz ornek olarak. 
        // Veya daha sonra devamsizlik alinmamis dersler hesaplanabilir.
        db.query('SELECT COUNT(*) AS yoklamaSayisi FROM devamsizliklar', (err, devamsizlikResult) => {
            if (!err) stats.bekleyenYoklama = devamsizlikResult[0].yoklamaSayisi;

            // 2. Yeni Egitim Icerigi (dersicerikleri tablosundan)
            db.query('SELECT COUNT(*) AS icerikSayisi FROM dersicerikleri', (err, icerikResult) => {
                if (!err) stats.yeniEgitimIcerigi = icerikResult[0].icerikSayisi;

                // 3. Yeni Bilgi Bankasi Paylasimi (egitmenpaylasimlari tablosundan)
                db.query('SELECT COUNT(*) AS paylasimSayisi FROM egitmenpaylasimlari', (err, paylasimResult) => {
                    if (!err) stats.yeniBilgiBankasi = paylasimResult[0].paylasimSayisi;

                    res.json({ success: true, stats });
                });
            });
        });
    });
});



// ================= DEVAMSIZLIK & YOKLAMA SISTEMI =================

// Eğitmene atanan sınıfları getir
router.get('/api/siniflarim', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    
    // Once egitmen_id bul
    db.query('SELECT egitmen_id FROM egitmenler WHERE kullanici_id = ?', [kullanici_id], (err, egitmenRes) => {
        if (err || egitmenRes.length === 0) return res.json({ success: false, error: 'Eğitmen bulunamadı.' });
        
        const egitmen_id = egitmenRes[0].egitmen_id;

        const sorgu = `
            SELECT 
                s.sinif_id, s.sinif_adi, s.kontenjan, s.aktif_mi,
                (SELECT COUNT(*) FROM ogrenciler WHERE sinif_id = s.sinif_id) as ogrenci_sayisi,
                d.ders_adi,
                eg.egitim_id, eg.baslangic_tarihi, eg.bitis_tarihi, eg.hafta_sayisi,
                GROUP_CONCAT(DISTINCT CONCAT(k.ad, ' ', k.soyad) SEPARATOR ', ') as diger_egitmenler
            FROM siniflar s
            JOIN sinifegitmenleri se ON s.sinif_id = se.sinif_id
            LEFT JOIN egitimsiniflar es ON es.sinif_id = s.sinif_id
            LEFT JOIN egitimler eg ON eg.egitim_id = es.egitim_id
            LEFT JOIN dersler d ON d.ders_id = eg.ders_id
            LEFT JOIN sinifegitmenleri se2 ON se2.sinif_id = s.sinif_id
            LEFT JOIN egitmenler e2 ON e2.egitmen_id = se2.egitmen_id
            LEFT JOIN kullanicilar k ON k.kullanici_id = e2.kullanici_id
            WHERE se.egitmen_id = ?
            GROUP BY s.sinif_id, d.ders_adi, eg.egitim_id
        `;

        db.query(sorgu, [egitmen_id], (err, siniflar) => {
            if (err) return res.status(500).json({ success: false, error: 'Veritabanı hatası' });
            res.json({ success: true, siniflar });
        });
    });
});

// Sınıfın geçerli yoklama tarihlerini getir (Egitim baslangicindan itibaren hafta_sayisi kadar)
router.get('/api/yoklama-tarihleri/:sinif_id', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const { sinif_id } = req.params;
    const kullanici_id = req.session.kullanici_id;

    // Yetki kontrolu
    db.query('SELECT e.egitmen_id FROM egitmenler e JOIN sinifegitmenleri se ON e.egitmen_id = se.egitmen_id WHERE e.kullanici_id = ? AND se.sinif_id = ?', 
    [kullanici_id, sinif_id], (err, yetki) => {
        if (err || yetki.length === 0) return res.status(403).json({ success: false, error: 'Bu sınıfa yetkiniz yok.' });

        const egitimSorgu = `
            SELECT eg.egitim_id, eg.baslangic_tarihi, eg.hafta_sayisi 
            FROM egitimsiniflar es 
            JOIN egitimler eg ON eg.egitim_id = es.egitim_id 
            WHERE es.sinif_id = ? LIMIT 1
        `;
        
        db.query(egitimSorgu, [sinif_id], (err, egitimler) => {
            if (err || egitimler.length === 0) return res.json({ success: false, error: 'Sınıfa atanmış aktif eğitim bulunamadı.' });
            
            const egitim = egitimler[0];
            const dates = [];
            const baslangic = new Date(egitim.baslangic_tarihi);
            const now = new Date();
            
            for(let i = 0; i < egitim.hafta_sayisi; i++) {
                let d = new Date(baslangic);
                d.setDate(d.getDate() + (i * 7));
                
                // Gelecek tarihleri gosterme (veya istersen goster ama secilemesin, simdilik sadece bugune kadar olanlar)
                if(d <= now) {
                    dates.push({
                        tarih: d.toISOString().split('T')[0],
                        hafta_no: i + 1
                    });
                }
            }
            
            res.json({ success: true, tarihler: dates, egitim_id: egitim.egitim_id });
        });
    });
});

// Tarih secildiginde ogrencileri ve o tarihteki mevcut yoklamalari getir
router.get('/api/yoklama-ogrenciler/:sinif_id/:tarih', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const { sinif_id, tarih } = req.params;
    const kullanici_id = req.session.kullanici_id;

    // Yetki kontrolu
    db.query('SELECT e.egitmen_id FROM egitmenler e JOIN sinifegitmenleri se ON e.egitmen_id = se.egitmen_id WHERE e.kullanici_id = ? AND se.sinif_id = ?', 
    [kullanici_id, sinif_id], (err, yetki) => {
        if (err || yetki.length === 0) return res.status(403).json({ success: false, error: 'Bu sınıfa yetkiniz yok.' });

        const sorgu = `
            SELECT o.ogrenci_id, k.ad, k.soyad, 
                   d.devamsizlik_id, d.durum, d.aciklama
            FROM ogrenciler o
            JOIN kullanicilar k ON o.kullanici_id = k.kullanici_id
            LEFT JOIN devamsizliklar d ON d.ogrenci_id = o.ogrenci_id AND d.tarih = ?
            WHERE o.sinif_id = ? AND k.aktif_mi = 1
            ORDER BY k.ad, k.soyad
        `;

        db.query(sorgu, [tarih, sinif_id], (err, ogrenciler) => {
            if (err) return res.status(500).json({ success: false, error: 'Veritabanı hatası' });
            res.json({ success: true, ogrenciler });
        });
    });
});

// Yoklamayi kaydet
router.post('/api/yoklama-kaydet', oturumKontrol, rolKontrol([3, 4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    const { sinif_id, egitim_id, hafta_no, tarih, yoklamalar } = req.body;

    // Yetki kontrolu
    db.query('SELECT e.egitmen_id FROM egitmenler e JOIN sinifegitmenleri se ON e.egitmen_id = se.egitmen_id WHERE e.kullanici_id = ? AND se.sinif_id = ?', 
    [kullanici_id, sinif_id], (err, yetki) => {
        if (err || yetki.length === 0) return res.status(403).json({ success: false, error: 'Bu sınıfa yetkiniz yok.' });

        if(!yoklamalar || yoklamalar.length === 0) return res.json({ success: true });

        let tamamlanan = 0;
        let hata = false;

        yoklamalar.forEach(yoklama => {
            // Ayni tarihte ayni ogrenciye kayit var mi?
            db.query('SELECT devamsizlik_id FROM devamsizliklar WHERE ogrenci_id = ? AND tarih = ?', 
            [yoklama.ogrenci_id, tarih], (err, rows) => {
                if(rows && rows.length > 0) {
                    // Update
                    db.query('UPDATE devamsizliklar SET durum=?, aciklama=? WHERE devamsizlik_id=?', 
                    [yoklama.durum, yoklama.aciklama, rows[0].devamsizlik_id], (err) => {
                        checkDone(err);
                    });
                } else {
                    // Insert
                    db.query('INSERT INTO devamsizliklar (ogrenci_id, egitim_id, hafta_no, durum, tarih, aciklama) VALUES (?, ?, ?, ?, ?, ?)',
                    [yoklama.ogrenci_id, egitim_id, hafta_no, yoklama.durum, tarih, yoklama.aciklama], (err) => {
                        checkDone(err);
                    });
                }
            });
        });

        function checkDone(err) {
            if (err) hata = true;
            tamamlanan++;
            if(tamamlanan === yoklamalar.length) {
                if(hata) return res.status(500).json({ success: false, error: 'Bazı kayıtlar kaydedilirken hata oluştu.' });
                res.json({ success: true });
            }
        }
    });
});

module.exports = router;
