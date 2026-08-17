const express = require("express");
const path = require("path");

const app = express();
const port = 5000;
const db = require('./db');

// EJS ayarları
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend"));

// Statik dosyalar (CSS, JS, resimler)
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ana Sayfa
app.get("/", (req, res) => {
    res.render("AnaSayfa");
});

// Öğrenci
app.get("/ogrenci", (req, res) => {
    res.render("ogrenci");
});

// Veli
app.get("/veli", (req, res) => {
    res.render("veli");
});

// Eğitmen
app.get("/egitmen", (req, res) => {
    res.render("egitmen");
});

// Yönetici
app.get("/yonetici", (req, res) => {
    res.render("yonetici");
});

// Öğrenci Ders
app.get("/ogrenci_ders", (req, res) => {
    res.render("ogrenci_ders");
});

// Öğrenci Devamsızlık
app.get("/ogrenci_devamsizlik", (req, res) => {
    res.render("ogrenci_devamsizlik");
});

// Öğrenci sertifikalar
app.get("/sertifikalar", (req, res) => {
    res.render("sertifikalar");
});

// Öğrenci sözlük
app.get("/sozluk", (req, res) => {
    res.render("sozluk");
});




// Hata Sayfası
app.get("/hata", (req, res) => {
    res.render("hata");
});

const crypto = require('crypto');
app.post('/api/login', (req, res) => {
    const { email, sifre, role } = req.body;
    const hash = crypto.createHash('sha256').update(sifre).digest('hex');

    db.query('SELECT * FROM kullanicilar WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'Yanlış e-posta veya şifre' });
        }
        
        const user = results[0];
        // Kullanıcı tablosundaki şifre hash'i ile eşleşirse giriş yaptır
        if (user.sifre_hash === hash) {
            return res.json({ success: true, redirect: '/' + role });
        } else {
            return res.status(401).json({ error: 'Yanlış e-posta veya şifre' });
        }
    });
});

// Sunucu
app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});

app.get('/test-db', (req, res) => {

    db.query('SELECT * FROM kullanicilar', (err, results) => {

        if (err) {
            console.error(err);
            return res.status(500).send('Veritabanı sorgusunda hata oluştu.');
        }

        res.json(results);

    });

});
