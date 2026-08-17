const express = require("express");
const path = require("path");

const app = express();
const port = 5000;

// EJS ayarları
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../frontend"));

// Statik dosyalar (CSS, JS, resimler)
app.use(express.static(path.join(__dirname, "../frontend")));

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




// Sunucu
app.listen(port, () => {
    console.log(`Sunucu http://localhost:${port} adresinde çalışıyor.`);
});