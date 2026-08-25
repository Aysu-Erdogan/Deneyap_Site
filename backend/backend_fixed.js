// POST /api/siniflar/:id/dersler - Sınıfa ders ekle
// Sınıfa ders eklendiğinde, sınıftaki tüm aktif öğrenciler için devamsızlık şablonu otomatik oluşturulur
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

                // Dersin egitim_id'sini bul (ders_id -> egitimler)
                const egitimSorgu = `
                    SELECT egitim_id, hafta_sayisi, baslangic_tarihi
                    FROM egitimler
                    WHERE ders_id = ?
                    ORDER BY egitim_id DESC
                    LIMIT 1
                `;

                db.query(egitimSorgu, [ders_id], (errEgitim, egitimResult) => {
                    if (errEgitim || egitimResult.length === 0) {
                        console.error('Eğitim bilgisi bulunamadı:', errEgitim);
                        // Eğitim kaydı yoksa sadece sinif_dersler'e ekle, devamsızlık oluşturma
                        return db.query('INSERT INTO sinif_dersler (sinif_id, ders_id) VALUES (?, ?)', [id, ders_id], (err4, result4) => {
                            if (err4) {
                                console.error('Ders ekleme hatası:', err4);
                                return res.status(500).json({ error: 'Ders eklenirken hata oluştu.' });
                            }
                            res.json({ success: true, sinif_ders_id: result4.insertId, warning: 'Eğitim kaydı bulunamadı, devamsızlık şablonu oluşturulamadı.' });
                        });
                    });

                    const egitim = egitimResult[0];
                    const egitim_id = egitim.egitim_id;
                    const hafta_sayisi = egitim.hafta_sayisi;
                    const baslangicTarihi = new Date(egitim.baslangic_tarihi);

                    // Sınıfı sinif_dersler'e ekle
                    db.query('INSERT INTO sinif_dersler (sinif_id, ders_id) VALUES (?, ?)', [id, ders_id], (err4, result4) => {
                        if (err4) {
                            console.error('Ders ekleme hatası:', err4);
                            return res.status(500).json({ error: 'Ders eklenirken hata oluştu.' });
                        }

                        // Sınıftaki aktif öğrencileri bul
                        const ogrencilerSorgu = `
                            SELECT o.ogrenci_id
                            FROM ogrenciler o
                            JOIN kullanicilar k ON k.kullanici_id = o.kullanici_id
                            WHERE o.sinif_id = ? AND k.aktif_mi = 1
                        `;

                        db.query(ogrencilerSorgu, [id], (errOgr, ogrenciResult) => {
                            if (errOgr) {
                                console.error('Öğrenci listeleme hatası:', errOgr);
                                // Sınıf-ders ilişkisi eklendi ama devamsızlık oluşturulamadı
                                return res.json({
                                    success: true,
                                    sinif_ders_id: result4.insertId,
                                    warning: 'Sınıf-ders ilişkisi eklendi ancak devamsızlık şablonu oluşturulamadı.'
                                });
                            }

                            if (ogrenciResult.length === 0) {
                                return res.json({
                                    success: true,
                                    sinif_ders_id: result4.insertId,
                                    message: 'Sınıfta aktif öğrenci yok, devamsızlık şablonu oluşturulmadı.'
                                });
                            }

                            // Eğitim başlangıç tarihi
                            const baslangicTarihi = new Date(egitimResult[0].baslangic_tarihi);
                            const hafta_sayisi = egitimResult[0].hafta_sayisi;
                            const egitim_id = egitimResult[0].egitim_id;

                            // Her öğrenci için devamsızlık şablonu oluştur
                            let completed = 0;
                            let hasError = false;

                            if (ogrenciResult.length === 0) {
                                return res.json({ success: true, sinif_ders_id: result4.insertId });
                            }

                            ogrenciResult.forEach(ogrenci => {
                                const ogrenci_id = ogrenci.ogrenci_id;

                                // Her hafta için INSERT IGNORE (varsa ekleme)
                                let haftaCompleted = 0;
                                for (let hafta = 1; hafta <= egitimResult[0].hafta_sayisi; hafta++) {
                                    const tarih = new Date(baslangicTarihi);
                                    tarih.setDate(tarih.getDate() + (hafta - 1) * 7);
                                    const tarihStr = tarih.toISOString().split('T')[0];

                                    const insertSorgu = `
                                        INSERT IGNORE INTO devamsizliklar (ogrenci_id, egitim_id, hafta_no, durum, tarih)
                                        VALUES (?, ?, ?, 'Geldi', ?)
                                    `;
                                    db.query(insertSorgu, [ogrenci.ogrenci_id, egitimResult[0].egitim_id, hafta, tarihStr], (err4) => {
                                        haftaCompleted++;
                                        if (haftaCompleted === egitimResult[0].hafta_sayisi) {
                                            completed++;
                                            if (completed === ogrenciResult.length) {
                                                res.json({ success: true, sinif_ders_id: result4.insertId });
                                            }
                                        }
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});