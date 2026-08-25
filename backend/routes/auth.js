const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../db');
const { oturumKontrol } = require('../middleware/auth');

// Rol ID'sini yönlendirme adresine çeviren yardımcı fonksiyon
function rolYonlendirmesi(rol_id) {
    switch (rol_id) {
        case 1: return '/ogrenci';
        case 2: return '/veli';
        case 3: return '/egitmen';
        case 4: return '/yonetici';
        default: return '/';
    }
}

// Login API
router.post('/api/login', (req, res) => {
    const { email, sifre } = req.body;

    if (!email || !sifre) {
        return res.status(400).json({ error: 'E-posta ve şifre zorunludur.' });
    }

    const hash = crypto.createHash('sha256').update(sifre).digest('hex');

    db.query('SELECT * FROM kullanicilar WHERE email = ? AND aktif_mi = 1', [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'Yanlış e-posta veya şifre' });
        }

        const user = results[0];

        if (user.sifre_hash === hash) {
            req.session.kullanici_id = user.kullanici_id;
            req.session.rol_id = user.rol_id;
            
            // Yönlendirme adresi VERİTABANINDAKİ rol_id'ye göre belirleniyor,
            // frontend'den gelen 'role' parametresi kullanılmıyor (güvenlik açığı kapatıldı)
            const redirect = rolYonlendirmesi(user.rol_id);
            
            req.session.save((err) => {
                if (err) {
                    console.error('[LOGIN] Session kaydetme hatası:', err);
                }
                return res.json({ success: true, redirect });
            });
        } else {
            return res.status(401).json({ error: 'Yanlış e-posta veya şifre' });
        }
    });
});

// Profil Güncelleme API (genel - tüm roller için)
router.post('/api/kullanici/guncelle', oturumKontrol, (req, res) => {
    const { ad, soyad, email, telefon } = req.body;
    const kullanici_id = req.session.kullanici_id;

    if (!ad || !soyad || !email) {
        return res.status(400).json({ error: 'Ad, Soyad ve Email alanları zorunludur.' });
    }

    const sorgu = 'UPDATE kullanicilar SET ad = ?, soyad = ?, email = ?, telefon = ? WHERE kullanici_id = ?';
    
    db.query(sorgu, [ad, soyad, email, telefon || null, kullanici_id], (err, result) => {
        if (err) {
            console.error('Kullanıcı güncellenirken hata oluştu:', err);
            return res.status(500).json({ error: 'Veritabanı hatası.' });
        }
        res.json({ success: true });
    });
});

// Çıkış
router.get('/cikis', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

module.exports = router;
