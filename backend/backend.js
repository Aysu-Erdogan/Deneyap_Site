const express = require("express");
const path = require("path");
const crypto = require('crypto');
const session = require('express-session');

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

// Session kontrolü middleware
function oturumKontrol(req, res, next) {
    if (!req.session.kullanici_id) {
        return res.redirect('/');
    }
    next();
}

// Ana Sayfa
app.get("/", (req, res) => {
    res.render("AnaSayfa");
});

// Öğrenci
app.get("/ogrenci", oturumKontrol, (req, res) => {
    res.render("ogrenci", { showLogout: true });
});

// Veli
app.get("/veli", oturumKontrol, (req, res) => {
    res.render("veli", { showLogout: true });
});

// Eğitmen
app.get("/egitmen", oturumKontrol, (req, res) => {
    res.render("egitmen", { showLogout: true });
});

// Yönetici
app.get("/yonetici", oturumKontrol, (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    
    // Debug log
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

// Öğrenci Ders
app.get("/ogrenci_ders", oturumKontrol, (req, res) => {
    res.render("ogrenci_ders", { showLogout: true });
});

// Öğrenci Devamsızlık
app.get("/ogrenci_devamsizlik", oturumKontrol, (req, res) => {
    const kullanici_id = req.session.kullanici_id;
    const secilenEgitimId = parseInt(req.query.egitim_id) || null;

    // 1. Öğrenci bilgilerini çek (ad soyad, sınıf, atölye, eğitmen)
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

    // 2. Öğrencinin sınıfına atanmış dersleri çek
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

            // Seçilen ders yoksa ilk dersi seç
            const aktifEgitimId = secilenEgitimId || (dersler.length > 0 ? dersler[0].egitim_id : null);

            if (!aktifEgitimId) {
                // Hiç ders yoksa boş gönder
                return res.render("ogrenci_devamsizlik", {
                    ogrenciInfo,
                    dersler,
                    aktifEgitimId: null,
                    devamsizliklar: [],
                    showLogout: true
                });
            }

            // 3. Seçilen derse ait devamsızlıkları çek
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

// Öğrenci sertifikalar
app.get("/sertifikalar", oturumKontrol, (req, res) => {
    res.render("sertifikalar", { showLogout: true });
});

// Öğrenci sözlük
app.get("/sozluk", oturumKontrol, (req, res) => {
    res.render("sozluk", { showLogout: true });
});

// Hata Sayfası
app.get("/hata", (req, res) => {
    res.render("hata");
});

// Login
app.post('/api/login', (req, res) => {
    const { email, sifre, role } = req.body;
    const hash = crypto.createHash('sha256').update(sifre).digest('hex');

    db.query('SELECT * FROM kullanicilar WHERE email = ?', [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(401).json({ error: 'Yanlış e-posta veya şifre' });
        }

        const user = results[0];

        if (user.sifre_hash === hash) {
            // Session'a kullanici_id kaydet
            req.session.kullanici_id = user.kullanici_id;
            req.session.rol_id = user.rol_id;
            
            // Debug log
            console.log('[DEBUG LOGIN] SessionID:', req.sessionID, 'kullanici_id:', req.session.kullanici_id, 'rol_id:', req.session.rol_id);
            
            // Session'ı zorla kaydet
            req.session.save((err) => {
                if (err) {
                    console.error('[DEBUG LOGIN] Session save error:', err);
                } else {
                    console.log('[DEBUG LOGIN] Session saved, cookie will be set');
                }
                return res.json({ success: true, redirect: '/' + role });
            });
        } else {
            return res.status(401).json({ error: 'Yanlış e-posta veya şifre' });
        }
    });
});

// Profil Güncelleme
app.post('/api/kullanici/guncelle', oturumKontrol, (req, res) => {
    const { ad, soyad, email, telefon } = req.body;
    const kullanici_id = req.session.kullanici_id;

    if (!ad || !soyad || !email) {
        return res.status(400).json({ error: 'Ad, Soyad ve Email alanları zorunludur.' });
    }

    const sorgu = 'UPDATE kullanicilar SET ad = ?, soyad = ?, email = ?, telefon = ? WHERE kullanici_id = ?';
    
    db.query(sorgu, [ad, soyad, email, telefon, kullanici_id], (err, result) => {
        if (err) {
            console.error('Kullanıcı güncellenirken hata oluştu:', err);
            return res.status(500).json({ error: 'Veritabanı hatası.' });
        }
        res.json({ success: true });
    });
});

// GET /api/dersler - Tüm dersleri listele (dropdown için)
app.get('/api/dersler', oturumKontrol, (req, res) => {
    db.query('SELECT ders_id, ders_adi FROM dersler ORDER BY ders_adi', (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// GET /api/veliler/dropdown - Öğrenci formu için kısa veli listesi
app.get('/api/veliler/dropdown', oturumKontrol, (req, res) => {
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

// GET /api/ogrenciler
app.get('/api/ogrenciler', oturumKontrol, (req, res) => {
    const aktifMi = req.query.aktif_mi !== undefined ? parseInt(req.query.aktif_mi) : 1;
    const sorgu = `
        SELECT o.ogrenci_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.aktif_mi,
               s.sinif_id, s.sinif_adi, o.okul, o.sinif_seviyesi,
               v.veli_id, vk.ad AS veli_ad, vk.soyad AS veli_soyad
        FROM ogrenciler o
        JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id
        LEFT JOIN siniflar s ON s.sinif_id = o.sinif_id
        LEFT JOIN veliler v ON v.veli_id = o.veli_id
        LEFT JOIN kullanicilar vk ON vk.kullanici_id = v.kullanici_id
        WHERE k.aktif_mi = ?
    `;
    db.query(sorgu, [aktifMi], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// POST /api/ogrenciler/ekle
app.post('/api/ogrenciler/ekle', oturumKontrol, (req, res) => {
    const { ad, soyad, email, telefon, tc_no, sifre, sinif_id, veli_id, okul, sinif_seviyesi } = req.body;
    
    if (!ad || !soyad || !email || !sifre || !sinif_id || !veli_id) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    // Sınıf kontenjan kontrolü
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
                
                // Yeni öğrenci için devamsızlık şablonu otomatik oluştur
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
app.put('/api/ogrenciler/guncelle', oturumKontrol, (req, res) => {
    const { kullanici_id, ad, soyad, email, telefon, tc_no, sinif_id, veli_id, okul, sinif_seviyesi } = req.body;

    if (!kullanici_id || !ad || !soyad || !email || !sinif_id || !veli_id) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    // Mevcut öğrencinin sınıfını bul
    const mevcutSinifSorgu = 'SELECT sinif_id FROM ogrenciler WHERE kullanici_id = ?';
    db.query(mevcutSinifSorgu, [kullanici_id], (err, mevcutResult) => {
        if (err) {
            console.error('Mevcut sınıf kontrol hatası:', err);
            return res.status(500).json({ error: 'Kontrol sırasında hata oluştu.' });
        }

        const eskiSinifId = mevcutResult.length > 0 ? mevcutResult[0].sinif_id : null;
        const yeniSinifId = parseInt(sinif_id);

        // Eğer sınıf değişiyorsa yeni sınıfın kontenjanını kontrol et
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

                // Kontenjan uygun, güncellemeyi devam ettir
                ogrenciGuncelle();
            });
        } else {
            // Sınıf değişmediyse direkt güncelle
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
                    
                    // Eğer sınıf değiştiyse, yeni sınıf için devamsızlık şablonu oluştur
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
app.put('/api/ogrenciler/sil', oturumKontrol, (req, res) => {
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


// ==============================
// EĞİTMEN YÖNETİMİ
// ==============================

// GET /api/egitmenler
app.get('/api/egitmenler', oturumKontrol, (req, res) => {
    const aktifMi = req.query.aktif_mi !== undefined ? parseInt(req.query.aktif_mi) : 1;
    const sorgu = `
        SELECT e.egitmen_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no, k.aktif_mi,
               GROUP_CONCAT(se.sinif_id) as sinif_id_list,
               GROUP_CONCAT(s.sinif_adi SEPARATOR ', ') as siniflar
        FROM egitmenler e
        JOIN kullanicilar k ON k.kullanici_id = e.kullanici_id
        LEFT JOIN sinifegitmenleri se ON se.egitmen_id = e.egitmen_id
        LEFT JOIN siniflar s ON s.sinif_id = se.sinif_id
        WHERE k.aktif_mi = ?
        GROUP BY e.egitmen_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no, k.aktif_mi
    `;
    db.query(sorgu, [aktifMi], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// POST /api/egitmenler/ekle
app.post('/api/egitmenler/ekle', oturumKontrol, async (req, res) => {
    const { ad, soyad, email, telefon, tc_no, sifre, siniflar } = req.body;
    
    if (!ad || !soyad || !email || !sifre) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const hash = crypto.createHash('sha256').update(sifre).digest('hex');
    const rol_id = 3; // 3 = Eğitmen

    // Transaction başlat
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
                            if (err4) {
                                return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                            }
                            res.json({ success: true, egitmen_id });
                        });
                    });
                } else {
                    db.commit(err4 => {
                        if (err4) {
                            return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                        }
                        res.json({ success: true, egitmen_id });
                    });
                }
            });
        });
    });
});

// PUT /api/egitmenler/guncelle
app.put('/api/egitmenler/guncelle', oturumKontrol, (req, res) => {
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
app.put('/api/egitmenler/pasif-yap', oturumKontrol, (req, res) => {
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


// ==============================
// VELİ YÖNETİMİ
// ==============================

// GET /api/veliler - Veli listesi + bağlı öğrenciler
app.get('/api/veliler', oturumKontrol, (req, res) => {
    const aktifMi = req.query.aktif_mi !== undefined ? parseInt(req.query.aktif_mi) : 1;

    const sorgu = `
        SELECT v.veli_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no, k.aktif_mi,
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
        WHERE k.aktif_mi = ?
        GROUP BY v.veli_id, k.kullanici_id, k.ad, k.soyad, k.email, k.telefon, k.tc_no, k.aktif_mi
    `;
    db.query(sorgu, [aktifMi], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Veritabanı hatası' });
        }
        res.json(results);
    });
});

// GET /api/veliler/tum - Tüm veliler (aktif+pasif) - dropdown için
app.get('/api/veliler/tum', oturumKontrol, (req, res) => {
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

// GET /api/ogrenciler/bağsız - Veli atanmamış öğrenciler
app.get('/api/ogrenciler/bagsiz', oturumKontrol, (req, res) => {
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

// POST /api/veliler/ekle - Transaction ile veli oluştur
app.post('/api/veliler/ekle', oturumKontrol, (req, res) => {
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

// PUT /api/veliler/guncelle - kişisel bilgiler + öğrenci bağlantısı tam güncelleme
app.put('/api/veliler/guncelle', oturumKontrol, (req, res) => {
    const { veli_id, kullanici_id, ad, soyad, email, telefon, tc_no, ogrenci_idler } = req.body;

    if (!veli_id || !kullanici_id || !ad || !soyad || !email) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    const ogrenciArr = Array.isArray(ogrenci_idler) ? ogrenci_idler.map(Number) : (ogrenci_idler ? [Number(ogrenci_idler)] : []);

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ error: 'Transaction başlatılamadı.' });

        // Adım 1: Kullanıcı bilgilerini güncelle
        const kullaniciSorgu = 'UPDATE kullanicilar SET ad=?, soyad=?, email=?, telefon=?, tc_no=? WHERE kullanici_id=?';
        db.query(kullaniciSorgu, [ad, soyad, email, telefon || null, tc_no || null, kullanici_id], (err1) => {
            if (err1) {
                return db.rollback(() => {
                    console.error('Kullanıcı güncelleme hatası:', err1);
                    res.status(500).json({ error: 'Kullanıcı güncellenirken hata oluştu.' });
                });
            }

            // Adım 2: Bu veliye bağlı TÜM öğrencilerin bağlantısını kaldır (NULL yap)
            db.query('UPDATE ogrenciler SET veli_id = NULL WHERE veli_id = ?', [veli_id], (err2) => {
                if (err2) {
                    return db.rollback(() => {
                        console.error('Öğrenci bağlantı kaldırma hatası:', err2);
                        res.status(500).json({ error: 'Öğrenci bağlantıları kaldırılırken hata oluştu.' });
                    });
                }

                // Adım 3: Seçilen öğrencileri bu veliye bağla
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
                    // Seçili öğrenci yoksa sadece commit et (tüm bağlantılar kaldırılmış olur)
                    db.commit(err3 => {
                        if (err3) return db.rollback(() => res.status(500).json({ error: 'İşlem onaylanamadı.' }));
                        res.json({ success: true });
                    });
                }
            });
        });
    });
});

// PUT /api/veliler/pasif-yap - Soft delete
app.put('/api/veliler/pasif-yap', oturumKontrol, (req, res) => {
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

// ==============================
// SINIF YÖNETİMİ
// ==============================

// GET /api/siniflar - Tüm sınıfları listele (kontenjan, öğrenci sayısı dahil)
app.get('/api/siniflar', oturumKontrol, (req, res) => {
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

// GET /api/siniflar/tum - Tüm sınıflar (pasif dahil) - dropdown için
app.get('/api/siniflar/tum', oturumKontrol, (req, res) => {
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
app.post('/api/siniflar/ekle', oturumKontrol, (req, res) => {
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
app.put('/api/siniflar/guncelle', oturumKontrol, (req, res) => {
    const { sinif_id, sinif_adi, kontenjan, atolye_id } = req.body;

    if (!sinif_id || !sinif_adi || !kontenjan || !atolye_id) {
        return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    }

    // Kontenjan kontrolü: mevcut öğrenci sayısından az olamaz
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

// DELETE /api/siniflar/sil - Sınıf sil (güvenli - öğrenci varsa engelle)
app.delete('/api/siniflar/sil', oturumKontrol, (req, res) => {
    const { sinif_id } = req.body;
    if (!sinif_id) return res.status(400).json({ error: 'sinif_id gerekli.' });

    // Öğrenci var mı kontrol et
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

        // Sınıf-ders ilişkilerini de sil (CASCADE ile otomatik silinir ama güvenlik için)
        db.beginTransaction(err => {
            if (err) return res.status(500).json({ error: 'Transaction başlatılamadı.' });

            // sinif_dersler'dan sil
            db.query('DELETE FROM sinif_dersler WHERE sinif_id = ?', [sinif_id], (err1) => {
                if (err1) {
                    return db.rollback(() => {
                        console.error('Sınıf-ders silme hatası:', err1);
                        res.status(500).json({ error: 'Sınıf-ders ilişkileri silinirken hata oluştu.' });
                    });
                }

                // egitimsiniflar'dan da sil (varsa)
                db.query('DELETE FROM egitimsiniflar WHERE sinif_id = ?', [sinif_id], (err2) => {
                    if (err2) {
                        return db.rollback(() => {
                            console.error('Eğitim-sınıf silme hatası:', err2);
                            res.status(500).json({ error: 'Eğitim-sınıf ilişkileri silinirken hata oluştu.' });
                        });
                    }

                    // Sınıfı sil
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
app.get('/api/siniflar/:id/dersler', oturumKontrol, (req, res) => {
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
app.post('/api/siniflar/:id/dersler', oturumKontrol, (req, res) => {
    const { id } = req.params;
    const { ders_id } = req.body;

    if (!ders_id) {
        return res.status(400).json({ error: 'ders_id gerekli.' });
    }

    // Sınıf var mı kontrol et
    db.query('SELECT sinif_id FROM siniflar WHERE sinif_id = ?', [id], (err, result) => {
        if (err || result.length === 0) {
            return res.status(404).json({ error: 'Sınıf bulunamadı.' });
        }

        // Ders var mı kontrol et
        db.query('SELECT ders_id FROM dersler WHERE ders_id = ?', [ders_id], (err2, result2) => {
            if (err2 || result2.length === 0) {
                return res.status(404).json({ error: 'Ders bulunamadı.' });
            }

            // İlişki zaten var mı kontrol et (UNIQUE constraint sayesinde hata verecek ama önceden kontrol edelim)
            db.query('SELECT * FROM sinif_dersler WHERE sinif_id = ? AND ders_id = ?', [id, ders_id], (err3, result3) => {
                if (err3) {
                    console.error('Kontrol hatası:', err3);
                    return res.status(500).json({ error: 'Kontrol sırasında hata oluştu.' });
                }
                if (result3.length > 0) {
                    return res.status(400).json({ error: 'Bu ders bu sınıfa zaten atanmış.' });
                }

                // Ekle
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
app.delete('/api/siniflar/:id/dersler/:ders_id', oturumKontrol, (req, res) => {
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
app.get('/api/siniflar/:id/ogrenciler', oturumKontrol, (req, res) => {
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

// GET /api/siniflar/:id/detay - Sınıf detayı (kontenjan, dersler, öğrenciler)
app.get('/api/siniflar/:id/detay', oturumKontrol, (req, res) => {
    const { id } = req.params;

    // 1. Sınıf bilgisi
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

        // 2. Sınıfın dersleri
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

            // 3. Sınıfın öğrencileri
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

// GET /api/atolyeler - Atölye listesi (sınıf oluşturma için dropdown)
app.get('/api/atolyeler', oturumKontrol, (req, res) => {
    db.query('SELECT atolye_id, atolye_adi FROM atolyeler WHERE aktif_mi = 1 ORDER BY atolye_adi', (err, results) => {
        if (err) return res.status(500).json({ error: 'Veritabanı hatası' });
        res.json(results);
    });
});

// POST /api/ogrenci/:ogrenci_id/devamsizlik-auto - Yeni öğrenci için sınıf derslerine göre devamsızlık şablonu oluştur
app.post('/api/ogrenci/:ogrenci_id/devamsizlik-auto', oturumKontrol, (req, res) => {
    const { ogrenci_id } = req.params;

    // 1. Öğrencinin sınıfını ve sınıfın derslerini bul (sinif_dersler üzerinden)
    // Sonra her ders için egitim_id'yi bulup devamsizliklar tablosuna "Geldi" varsayılanı ile ekle
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

        // Sınıfın derslerini al (sinif_dersler -> ders_id -> egitimler -> egitim_id)
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

            // Her ders için devamsızlık kayıtları oluştur (hafta_sayisi kadar, varsayılan "Geldi")
            let completed = 0;
            let hasError = false;

            dersler.forEach(ders => {
                const egitim_id = ders.egitim_id;
                const hafta_sayisi = ders.hafta_sayisi;

                // Bugünün tarihi veya eğitim başlangıç tarihi baz alınabilir
                // Basitlik için her hafta için bir kayıt ekle, tarih = eğitim başlangıcı + hafta*7 gün
                // Mevcut örnek veride tarihler: 2026-09-05, 2026-09-12, 2026-09-19...
                // Eğitim başlangıç tarihini al
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
                    
                    // Her hafta için INSERT IGNORE (varsa ekleme)
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

// Çıkış
app.get('/cikis', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// GET /api/ogrenci/:ogrenci_id/dersler-devamsizlik - Yönetici paneli için öğrenci dersleri ve devamsızlıkları
app.get('/api/ogrenci/:ogrenci_id/dersler-devamsizlik', oturumKontrol, (req, res) => {
    const { ogrenci_id } = req.params;
    
    // 1. Öğrencinin dersleri
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

        // 2. Her ders için devamsızlık verileri
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
