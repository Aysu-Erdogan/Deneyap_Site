const express = require("express");
const path = require("path");
const session = require('express-session');
const db = require('./db');

const app = express();
const port = 5000;

// EJS ayarları
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend"));

// Statik dosyalar (CSS, JS, resimler)
app.use(express.static(path.join(__dirname, "../frontend")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session ayarları
app.use(session({
    secret: 'deneyap-gizli-anahtar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 2, // 2 saat
        httpOnly: true,
        sameSite: 'lax',
        secure: false // localhost development için
    }
}));

// Rotaları İçe Aktar
const viewsRouter = require('./routes/views');
const authRouter = require('./routes/auth');
const ogrenciRouter = require('./routes/ogrenci');
const veliRouter = require('./routes/veli');
const egitmenAdminRouter = require('./routes/egitmen');
const sinifRouter = require('./routes/sinif');
const egitmenPanelRouter = require('./egitmen');

// Rotaları Bağla
app.use('/', viewsRouter);
app.use('/', authRouter);
app.use('/', ogrenciRouter);
app.use('/', veliRouter);
app.use('/', egitmenAdminRouter);
app.use('/', sinifRouter);
app.use('/egitmen', egitmenPanelRouter);

// Test veritabanı rotası
app.get('/test-db', (req, res) => {
    db.query('SELECT * FROM kullanicilar', (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Veritabanı sorgusunda hata oluştu.');
        }
        res.json(results);
    });
});

// Sunucuyu Başlat
app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});
