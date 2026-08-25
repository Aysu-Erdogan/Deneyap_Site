const express = require('express');
const router = express.Router();
const db = require('../db');
const { oturumKontrol, rolKontrol } = require('../middleware/auth');

// Ana Sayfa
router.get("/", (req, res) => {
    res.render("AnaSayfa");
});

// Öğrenci Paneli
router.get("/ogrenci", oturumKontrol, rolKontrol([1, 4]), (req, res) => {
    res.render("ogrenci", { showLogout: true });
});

// Veli Paneli
router.get("/veli", oturumKontrol, rolKontrol([2, 4]), (req, res) => {
    res.render("veli", { showLogout: true });
});

// Yönetici Paneli
router.get("/yonetici", oturumKontrol, rolKontrol([4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    
    console.log('[DEBUG YONETICI] SessionID:', req.sessionID, 'kullanici_id:', req.session.kullanici_id, 'Cookie header:', req.headers.cookie);
    
    const sorgu = 'SELECT ad, soyad, email, telefon FROM kullanicilar WHERE kullanici_id = ?';
    
    db.query(sorgu, [kullanici_id], (err, results) => {
        if (err || results.length === 0) {
            console.error('Yönetici bilgisi alınamadı:', err, 'kullanici_id:', kullanici_id);
            return res.redirect('/hata');
        }
        
        const user = results[0];
        res.render("yonetici", { showLogout: true, user });
    });
});

// Öğrenci Ders Sayfası
router.get("/ogrenci_ders", oturumKontrol, rolKontrol([1, 4]), (req, res) => {
    res.render("ogrenci_ders", { showLogout: true });
});

// Öğrenci Devamsızlık Sayfası
router.get("/ogrenci_devamsizlik", oturumKontrol, rolKontrol([1, 4]), (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    const secilenEgitimId = parseInt(req.query.egitim_id) || null;

    const ogrenciBilgiSorgu = `
        SELECT
            k.ad,
            k.soyad,
            s.sinif_adi,
            a.atolye_adi,
            CONCAT(ek.ad, ' ', ek.soyad) AS egitmen_adi
        FROM kullanicilar k
        JOIN ogrenciler o ON o.kullanici_id = k.kullanici_id
        JOIN siniflar s ON s.sinif_id = o.sinif_id
        JOIN atolyeler a ON a.atolye_id = s.atolye_id
        LEFT JOIN sinifegitmenleri se ON se.sinif_id = o.sinif_id
        LEFT JOIN egitmenler eg ON eg.egitmen_id = se.egitmen_id
        LEFT JOIN kullanicilar ek ON ek.kullanici_id = eg.kullanici_id
        WHERE k.kullanici_id = ?
        LIMIT 1
    `;

    const derslerSorgu = `
        SELECT
            e.egitim_id,
            d.ders_adi
        FROM ogrenciler o
        JOIN egitimsiniflar es ON es.sinif_id = o.sinif_id
        JOIN egitimler e ON e.egitim_id = es.egitim_id
        JOIN dersler d ON d.ders_id = e.ders_id
        WHERE o.kullanici_id = ?
        ORDER BY d.ders_adi
    `;

    db.query(ogrenciBilgiSorgu, [kullanici_id], (err, ogrenciSonuc) => {
        if (err || ogrenciSonuc.length === 0) {
            console.error('Öğrenci bilgisi hatası:', err);
            return res.redirect('/hata');
        }

        const ogrenciInfo = ogrenciSonuc[0];

        db.query(derslerSorgu, [kullanici_id], (err2, dersler) => {
            if (err2) {
                console.error('Dersler hatası:', err2);
                return res.redirect('/hata');
            }

            const aktifEgitimId = secilenEgitimId || (dersler.length > 0 ? dersler[0].egitim_id : null);

            if (!aktifEgitimId) {
                return res.render("ogrenci_devamsizlik", {
                    ogrenciInfo,
                    dersler,
                    aktifEgitimId: null,
                    devamsizliklar: [],
                    showLogout: true
                });
            }

            const devamsizlikSorgu = `
                SELECT
                    d.hafta_no,
                    d.durum,
                    d.tarih,
                    d.aciklama
                FROM devamsizliklar d
                JOIN ogrenciler o ON o.ogrenci_id = d.ogrenci_id
                WHERE o.kullanici_id = ? AND d.egitim_id = ?
                ORDER BY d.hafta_no
            `;

            db.query(devamsizlikSorgu, [kullanici_id, aktifEgitimId], (err3, devamsizliklar) => {
                if (err3) {
                    console.error('Devamsızlık hatası:', err3);
                    return res.redirect('/hata');
                }

                res.render("ogrenci_devamsizlik", {
                    ogrenciInfo,
                    dersler,
                    aktifEgitimId,
                    devamsizliklar,
                    showLogout: true
                });
            });
        });
    });
});

// Sertifikalar
router.get("/sertifikalar", oturumKontrol, rolKontrol([1, 4]), (req, res) => {
    res.render("sertifikalar", { showLogout: true });
});

// Sözlük
router.get("/sozluk", oturumKontrol, rolKontrol([1, 4]), (req, res) => {
    res.render("sozluk", { showLogout: true });
});

// Hata Sayfası
router.get("/hata", (req, res) => {
    res.render("hata");
});

module.exports = router;
