
document.addEventListener('DOMContentLoaded', () => {
    // 1. DINAMIK PROFIL BUTONU EKLENMESI
    const logoutBtnContainer = document.querySelector('.ms-auto.me-2');
    if (logoutBtnContainer) {
        const profileBtn = document.createElement('a');
        profileBtn.href = '#profil';
        profileBtn.className = 'header-profil-btn';
        profileBtn.innerHTML = '<i class="bi bi-person-circle"></i> Profil';
        logoutBtnContainer.style.display = 'flex';
        logoutBtnContainer.style.alignItems = 'center';
        logoutBtnContainer.insertBefore(profileBtn, logoutBtnContainer.firstChild);

        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const profilNavItem = document.querySelector('a[data-card="profilCard"]');
            if(profilNavItem) profilNavItem.click();
            
    // 4. DASHBOARD ISTATISTIKLERINI YUKLE
    function loadDashboardStats() {
        fetch('/egitmen/api/dashboard-stats')
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    const elYoklama = document.getElementById('stat-yoklama');
                    const elEgitim = document.getElementById('stat-egitim');
                    const elBilgi = document.getElementById('stat-bilgi');
                    
                    if(elYoklama) elYoklama.textContent = data.stats.bekleyenYoklama;
                    if(elEgitim) elEgitim.textContent = data.stats.yeniEgitimIcerigi;
                    if(elBilgi) elBilgi.textContent = data.stats.yeniBilgiBankasi;
                }
            })
            .catch(err => console.error('Dashboard stats error:', err));
    }
    loadDashboardStats();

});
    }

    // 2. SIDEBAR TAB MANTIGI
    const teacherItems = document.querySelectorAll('#teacherNav a');
    const teacherCards = document.querySelectorAll('.teacher-card');
    
    function showSection(cardId) {
        teacherCards.forEach(card => card.style.display = 'none');
        if (cardId) {
            const activeCard = document.getElementById(cardId);
            if (activeCard) activeCard.style.display = 'block';
        } else {
            const dashCard = document.getElementById('dashboardCard');
            if (dashCard) dashCard.style.display = 'block';
        }
    }
    
    // Header logoya tiklayinca dashboard'a donmek icin
    const mainBrand = document.querySelector('.navbar-brand');
    if (mainBrand) {
        mainBrand.addEventListener('click', (e) => {
            if (window.location.pathname === '/egitmen' || window.location.pathname === '/egitmen/') {
                e.preventDefault();
                teacherItems.forEach(li => li.classList.remove('active'));
                showSection(null);
            }
        });
    }

    teacherItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            teacherItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            showSection(item.getAttribute('data-card'));
        });
    });

    // 3. PROFIL ISLEMLERI
    const profilDuzenleBtn = document.getElementById('profilDuzenleBtn');
    const profilIptalBtn = document.getElementById('profilIptalBtn');
    const profilKaydetBtn = document.getElementById('profilKaydetBtn');
    const profilBilgileri = document.getElementById('profilBilgileri');
    const profilDuzenleForm = document.getElementById('profilDuzenleForm');
    const profilMesaj = document.getElementById('profilMesaj');
    let currentProfile = {};

    function loadProfile() {
        fetch('/egitmen/api/profil')
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    currentProfile = data.user;
                    document.getElementById('profil-ad-soyad').textContent = data.user.ad + ' ' + data.user.soyad;
                    document.getElementById('profil-ad-soyad-text').textContent = data.user.ad + ' ' + data.user.soyad;
                    document.getElementById('profil-email-text').textContent = data.user.email;
                    document.getElementById('profil-telefon-text').textContent = data.user.telefon || '-';
                    document.getElementById('edit-ad').value = data.user.ad;
                    document.getElementById('edit-soyad').value = data.user.soyad;
                    document.getElementById('edit-email').value = data.user.email;
                    document.getElementById('edit-telefon').value = data.user.telefon || '';
                }
            })
            .catch(err => console.error(err));
    }

    loadProfile();

    if(profilDuzenleBtn) {
        profilDuzenleBtn.addEventListener('click', () => {
            profilBilgileri.style.display = 'none';
            profilDuzenleForm.style.display = 'block';
            if(profilMesaj) profilMesaj.style.display = 'none';
        });
    }

    if(profilIptalBtn) {
        profilIptalBtn.addEventListener('click', () => {
            profilDuzenleForm.style.display = 'none';
            profilBilgileri.style.display = 'block';
            document.getElementById('edit-ad').value = currentProfile.ad;
            document.getElementById('edit-soyad').value = currentProfile.soyad;
            document.getElementById('edit-email').value = currentProfile.email;
            document.getElementById('edit-telefon').value = currentProfile.telefon || '';
        });
    }

    if(profilKaydetBtn) {
        profilKaydetBtn.addEventListener('click', () => {
            const ad = document.getElementById('edit-ad').value.trim();
            const soyad = document.getElementById('edit-soyad').value.trim();
            const email = document.getElementById('edit-email').value.trim();
            const telefon = document.getElementById('edit-telefon').value.trim();

            if(!ad || !soyad || !email) {
                profilMesaj.className = 'alert alert-warning';
                profilMesaj.textContent = 'Ad, Soyad ve E-posta zorunludur.';
                profilMesaj.style.display = 'block';
                return;
            }

            fetch('/egitmen/api/profil', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ad, soyad, email, telefon })
            }).then(res => res.json()).then(data => {
                if(data.success) {
                    profilMesaj.className = 'alert alert-success';
                    profilMesaj.textContent = 'Guncellendi.';
                    profilMesaj.style.display = 'block';
                    loadProfile();
                    setTimeout(() => {
                        profilDuzenleForm.style.display = 'none';
                        profilBilgileri.style.display = 'block';
                    }, 1500);
                } else {
                    profilMesaj.className = 'alert alert-danger';
                    profilMesaj.textContent = data.error || 'Hata olustu.';
                    profilMesaj.style.display = 'block';
                }
            });
        });
    }
});


    // 5. DEVAMSIZLIKLAR (SINIFLARIM & YOKLAMA)
    const sinifListesiGorunumu = document.getElementById('sinifListesiGorunumu');
    const sinifKartlariContainer = document.getElementById('sinifKartlariContainer');
    const yoklamaEkraniGorunumu = document.getElementById('yoklamaEkraniGorunumu');
    const btnYoklamaGeri = document.getElementById('btnYoklamaGeri');
    const yoklamaTarihSelect = document.getElementById('yoklamaTarihSelect');
    const yoklamaTabloContainer = document.getElementById('yoklamaTabloContainer');
    const yoklamaOgrenciListesi = document.getElementById('yoklamaOgrenciListesi');
    const btnYoklamaKaydet = document.getElementById('btnYoklamaKaydet');
    const yoklamaMesaj = document.getElementById('yoklamaMesaj');

    let currentSinifId = null;
    let currentEgitimId = null;
    let currentOgrenciler = [];

    // Devamsizliklar tabina tiklaninca siniflari yukle
    const devamsizlikTab = document.querySelector('a[data-card="devamsizliklarCard"]');
    if (devamsizlikTab) {
        devamsizlikTab.addEventListener('click', () => {
            loadSiniflar();
            sinifListesiGorunumu.style.display = 'block';
            yoklamaEkraniGorunumu.style.display = 'none';
        });
    }

    function loadSiniflar() {
        sinifKartlariContainer.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-primary"></div></div>';
        
        fetch('/egitmen/api/siniflarim')
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    renderSinifKartlari(data.siniflar);
                } else {
                    sinifKartlariContainer.innerHTML = `<div class="col-12"><div class="alert alert-danger">${data.error}</div></div>`;
                }
            })
            .catch(err => {
                sinifKartlariContainer.innerHTML = '<div class="col-12"><div class="alert alert-danger">Bağlantı hatası.</div></div>';
            });
    }

    function renderSinifKartlari(siniflar) {
        if(siniflar.length === 0) {
            sinifKartlariContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-inbox text-secondary" style="font-size: 3rem;"></i>
                    <p class="mt-3 text-secondary">Size atanmış herhangi bir sınıf bulunamadı.</p>
                </div>
            `;
            return;
        }

        sinifKartlariContainer.innerHTML = siniflar.map(s => {
            const dolulukOrani = s.kontenjan > 0 ? Math.round((s.ogrenci_sayisi / s.kontenjan) * 100) : 0;
            const dersAdi = s.ders_adi || 'Ders Atanmamış';
            const egitmenler = s.diger_egitmenler || 'Bilinmiyor';
            
            return `
            <div class="col-md-6 col-lg-6">
                <div class="card h-100 border-0 shadow-sm" style="border-radius: 12px; overflow: hidden;">
                    <div class="card-body p-4">
                        <div class="d-flex justify-content-between align-items-start mb-3">
                            <div>
                                <h4 class="fw-bold mb-1" style="color: var(--text-primary);">${s.sinif_adi}</h4>
                                <span class="badge bg-light text-dark border"><i class="bi bi-book me-1"></i>${dersAdi}</span>
                            </div>
                            <span class="badge ${s.aktif_mi ? 'bg-success' : 'bg-secondary'} bg-opacity-10 text-${s.aktif_mi ? 'success' : 'secondary'}">
                                ${s.aktif_mi ? '🟢 Aktif Sınıf' : 'Pasif Sınıf'}
                            </span>
                        </div>
                        
                        <div class="mb-3 text-sm" style="color: var(--text-secondary);">
                            <div class="mb-1"><i class="bi bi-people me-2"></i><strong>Eğitmenler:</strong> ${egitmenler}</div>
                        </div>

                        <div class="mb-4">
                            <div class="d-flex justify-content-between text-sm mb-1">
                                <span class="text-secondary">Doluluk: ${s.ogrenci_sayisi} / ${s.kontenjan || '?'}</span>
                                <strong>${dolulukOrani}%</strong>
                            </div>
                            <div class="progress" style="height: 6px;">
                                <div class="progress-bar ${dolulukOrani >= 100 ? 'bg-danger' : 'bg-info'}" style="width: ${dolulukOrani}%"></div>
                            </div>
                        </div>
                        
                        <button class="btn w-100 btn-primary btn-yoklama-gir" data-sinif-id="${s.sinif_id}" data-sinif-adi="${s.sinif_adi}" data-ders-adi="${dersAdi}">
                            <i class="bi bi-clipboard-check me-2"></i> Yoklama Gir
                        </button>
                    </div>
                </div>
            </div>
            `;
        }).join('');

        document.querySelectorAll('.btn-yoklama-gir').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const sinifId = e.target.closest('button').dataset.sinifId;
                const sinifAdi = e.target.closest('button').dataset.sinifAdi;
                const dersAdi = e.target.closest('button').dataset.dersAdi;
                openYoklamaEkrani(sinifId, sinifAdi, dersAdi);
            });
        });
    }

    if(btnYoklamaGeri) {
        btnYoklamaGeri.addEventListener('click', () => {
            yoklamaEkraniGorunumu.style.display = 'none';
            sinifListesiGorunumu.style.display = 'block';
            currentSinifId = null;
        });
    }

    function openYoklamaEkrani(sinifId, sinifAdi, dersAdi) {
        currentSinifId = sinifId;
        document.getElementById('yoklamaSinifAdi').textContent = sinifAdi;
        document.getElementById('yoklamaDersAdi').textContent = dersAdi;
        
        sinifListesiGorunumu.style.display = 'none';
        yoklamaEkraniGorunumu.style.display = 'block';
        yoklamaTabloContainer.style.display = 'none';
        yoklamaTarihSelect.innerHTML = '<option value="">Tarihler Yükleniyor...</option>';
        
        fetch(`/egitmen/api/yoklama-tarihleri/${sinifId}`)
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    currentEgitimId = data.egitim_id;
                    if(data.tarihler.length === 0) {
                        yoklamaTarihSelect.innerHTML = '<option value="">Geçerli ders tarihi bulunamadı</option>';
                    } else {
                        yoklamaTarihSelect.innerHTML = '<option value="">Lütfen tarih seçin...</option>' + 
                            data.tarihler.map(t => `<option value="${t.tarih}" data-hafta="${t.hafta_no}">Hafta ${t.hafta_no} (${t.tarih})</option>`).join('');
                    }
                } else {
                    yoklamaTarihSelect.innerHTML = `<option value="">${data.error}</option>`;
                }
            })
            .catch(err => {
                yoklamaTarihSelect.innerHTML = '<option value="">Bağlantı hatası.</option>';
            });
    }

    if(yoklamaTarihSelect) {
        yoklamaTarihSelect.addEventListener('change', (e) => {
            const tarih = e.target.value;
            if(!tarih) {
                yoklamaTabloContainer.style.display = 'none';
                return;
            }
            loadYoklamaOgrenciler(tarih);
        });
    }

    function loadYoklamaOgrenciler(tarih) {
        yoklamaOgrenciListesi.innerHTML = '<tr><td colspan="3" class="text-center py-4"><div class="spinner-border text-primary"></div></td></tr>';
        yoklamaTabloContainer.style.display = 'block';
        yoklamaMesaj.style.display = 'none';
        
        fetch(`/egitmen/api/yoklama-ogrenciler/${currentSinifId}/${tarih}`)
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    currentOgrenciler = data.ogrenciler;
                    if(currentOgrenciler.length === 0) {
                        yoklamaOgrenciListesi.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-secondary">Bu sınıfta kayıtlı öğrenci yok.</td></tr>';
                        btnYoklamaKaydet.disabled = true;
                        return;
                    }
                    
                    btnYoklamaKaydet.disabled = false;
                    yoklamaOgrenciListesi.innerHTML = currentOgrenciler.map(o => {
                        const isGeldi = o.durum === 'Geldi';
                        const isGelmedi = o.durum === 'Gelmedi';
                        const isIzinli = o.durum === 'İzinli';
                        
                        return `
                        <tr data-ogrenci-id="${o.ogrenci_id}">
                            <td class="fw-medium">${o.ad} ${o.soyad}</td>
                            <td>
                                <div class="btn-group btn-group-sm yoklama-btn-group" role="group">
                                    <input type="radio" class="btn-check" name="durum_${o.ogrenci_id}" id="geldi_${o.ogrenci_id}" value="Geldi" ${isGeldi ? 'checked' : ''}>
                                    <label class="btn btn-outline-success" for="geldi_${o.ogrenci_id}">Evet (Geldi)</label>
                                    
                                    <input type="radio" class="btn-check" name="durum_${o.ogrenci_id}" id="gelmedi_${o.ogrenci_id}" value="Gelmedi" ${isGelmedi ? 'checked' : ''}>
                                    <label class="btn btn-outline-danger" for="gelmedi_${o.ogrenci_id}">Hayır (Gelmedi)</label>

                                    <input type="radio" class="btn-check" name="durum_${o.ogrenci_id}" id="izinli_${o.ogrenci_id}" value="İzinli" ${isIzinli ? 'checked' : ''}>
                                    <label class="btn btn-outline-warning" for="izinli_${o.ogrenci_id}">İzinli</label>
                                </div>
                            </td>
                            <td>
                                <input type="text" class="form-control form-control-sm yoklama-aciklama" placeholder="Geç kaldı, vb." value="${o.aciklama || ''}">
                            </td>
                        </tr>
                        `;
                    }).join('');
                }
            })
            .catch(err => {
                yoklamaOgrenciListesi.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-danger">Yükleme hatası.</td></tr>';
            });
    }

    if(btnYoklamaKaydet) {
        btnYoklamaKaydet.addEventListener('click', () => {
            const tarih = yoklamaTarihSelect.value;
            const selectedOption = yoklamaTarihSelect.options[yoklamaTarihSelect.selectedIndex];
            const hafta_no = selectedOption ? selectedOption.dataset.hafta : null;
            
            if(!tarih || !hafta_no) return;
            
            const yoklamalar = [];
            let missing = false;
            
            document.querySelectorAll('#yoklamaOgrenciListesi tr').forEach(tr => {
                const ogrenci_id = tr.dataset.ogrenciId;
                if(!ogrenci_id) return;
                
                const checkedDurum = tr.querySelector(`input[name="durum_${ogrenci_id}"]:checked`);
                const aciklama = tr.querySelector('.yoklama-aciklama').value.trim();
                
                if(!checkedDurum) {
                    missing = true;
                } else {
                    yoklamalar.push({
                        ogrenci_id,
                        durum: checkedDurum.value,
                        aciklama
                    });
                }
            });
            
            if(missing && yoklamalar.length === 0) {
                yoklamaMesaj.className = 'alert alert-warning';
                yoklamaMesaj.textContent = 'Lütfen en az bir öğrencinin durumunu seçin.';
                yoklamaMesaj.style.display = 'block';
                return;
            }
            
            btnYoklamaKaydet.disabled = true;
            btnYoklamaKaydet.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Kaydediliyor...';
            
            fetch('/egitmen/api/yoklama-kaydet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sinif_id: currentSinifId,
                    egitim_id: currentEgitimId,
                    hafta_no: hafta_no,
                    tarih: tarih,
                    yoklamalar: yoklamalar
                })
            })
            .then(res => res.json())
            .then(data => {
                btnYoklamaKaydet.disabled = false;
                btnYoklamaKaydet.innerHTML = '<i class="bi bi-check2-circle me-2"></i> Yoklamayı Kaydet';
                
                if(data.success) {
                    yoklamaMesaj.className = 'alert alert-success';
                    yoklamaMesaj.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i> Yoklama başarıyla kaydedildi.';
                    yoklamaMesaj.style.display = 'block';
                    setTimeout(() => { yoklamaMesaj.style.display = 'none'; }, 3000);
                } else {
                    yoklamaMesaj.className = 'alert alert-danger';
                    yoklamaMesaj.textContent = data.error || 'Hata oluştu.';
                    yoklamaMesaj.style.display = 'block';
                }
            })
            .catch(err => {
                btnYoklamaKaydet.disabled = false;
                btnYoklamaKaydet.innerHTML = '<i class="bi bi-check2-circle me-2"></i> Yoklamayı Kaydet';
                yoklamaMesaj.className = 'alert alert-danger';
                yoklamaMesaj.textContent = 'Bağlantı hatası.';
                yoklamaMesaj.style.display = 'block';
            });
        });
    }
