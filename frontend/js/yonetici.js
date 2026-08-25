  const adminNav = document.querySelector('.admin-magic-nav');
  const adminItems = document.querySelectorAll('.admin-magic-nav li');
  const adminIndicator = document.querySelector('.admin-magic-nav .indicator');
  const tabContents = document.querySelectorAll('.tab-content');

  // Şifre göster / gizle
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('pw-toggle-btn')) {
      const input = e.target.closest('.input-group').querySelector('.pw-toggle-input');
      if (input.type === 'password') {
        input.type = 'text';
        e.target.textContent = '🙈';
      } else {
        input.type = 'password';
        e.target.textContent = '👁';
      }
    }
  });

  function setAdminActive(item) {
    adminItems.forEach(li => li.classList.toggle('active', li === item));

    const navRect = adminNav.getBoundingClientRect();
    const itemRect = item.getBoundingClientRect();
    const centerY = itemRect.top - navRect.top + (itemRect.height / 2);
    const indicatorHalf = adminIndicator.offsetHeight / 2;
    adminIndicator.style.transform = `translateY(${centerY - indicatorHalf}px)`;
  }

  adminItems.forEach(item => {
    item.addEventListener('click', (event) => {
      event.preventDefault();
      setAdminActive(item);

      // Sekme içeriğini değiştir
      const href = item.querySelector('a').getAttribute('href').substring(1);
      tabContents.forEach(tab => {
        tab.style.display = 'none';
      });
      const selectedTab = document.getElementById(href + '-content');
      if (selectedTab) {
        selectedTab.style.display = 'block';
      }
    });
  });

  if (adminItems.length) {
    setAdminActive(adminItems[0]);
  }

  // Profile Edit Logic
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const cancelEditBtn = document.getElementById('cancelEditBtn');
  const editActionBtns = document.getElementById('editActionBtns');
  const infoTexts = document.querySelectorAll('.info-text');
  const infoEdits = document.querySelectorAll('.info-edit');

  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', () => {
      editProfileBtn.style.display = 'none';
      editActionBtns.style.display = 'block';
      infoTexts.forEach(el => el.style.display = 'none');
      infoEdits.forEach(el => el.style.display = 'block');
    });

    cancelEditBtn.addEventListener('click', () => {
      editActionBtns.style.display = 'none';
      editProfileBtn.style.display = 'inline-block';
      infoEdits.forEach(el => el.style.display = 'none');
      infoTexts.forEach(el => el.style.display = 'inline-block');
      
      document.getElementById('edit-ad').value = '<%= user.ad %>';
      document.getElementById('edit-soyad').value = '<%= user.soyad %>';
      document.getElementById('edit-email').value = '<%= user.email %>';
      document.getElementById('edit-telefon').value = '<%= user.telefon || "" %>';
    });

    saveProfileBtn.addEventListener('click', async () => {
      const ad = document.getElementById('edit-ad').value;
      const soyad = document.getElementById('edit-soyad').value;
      const email = document.getElementById('edit-email').value;
      const telefon = document.getElementById('edit-telefon').value;

      try {
        const response = await fetch('/api/kullanici/guncelle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ad, soyad, email, telefon })
        });
        
        if (response.ok) {
          alert('Profil başarıyla güncellendi!');
          window.location.reload();
        } else {
          const data = await response.json();
          alert('Hata: ' + (data.error || 'Güncelleme başarısız.'));
        }
      } catch (err) {
        console.error(err);
        alert('Sunucu ile iletişim kurulamadı.');
      }
    });
  }
  // Öğrenci Yönetimi
  const ogrencilerContent = document.getElementById('ogrenciler-content');
  const studentsTableBody = document.getElementById('studentsTableBody');

  const addStudentModal = new bootstrap.Modal(document.getElementById('addStudentModal'));
  const editStudentModal = new bootstrap.Modal(document.getElementById('editStudentModal'));

  let siniflarList = [];
  let velilerList = [];

  // Verileri yükle
  async function loadDropdowns() {
    try {
      const sinifRes = await fetch('/api/siniflar');
      siniflarList = await sinifRes.json();
      const veliRes = await fetch('/api/veliler/dropdown');
      velilerList = await veliRes.json();

      let sinifOptions = '<option value="">Sınıf Seçiniz</option>';
      siniflarList.forEach(s => {
        sinifOptions += `<option value="${s.sinif_id}">${s.sinif_adi}</option>`;
      });

      let veliOptions = '<option value="">Veli Seçiniz</option>';
      velilerList.forEach(v => {
        veliOptions += `<option value="${v.veli_id}">${v.ad} ${v.soyad} (${v.email})</option>`;
      });

      document.querySelectorAll('.sinif-select').forEach(el => el.innerHTML = sinifOptions);
      document.querySelectorAll('.veli-select').forEach(el => el.innerHTML = veliOptions);

      // Sınıf seçildiğinde kontenjan uyarısını göster
      document.querySelectorAll('.sinif-select').forEach(select => {
        select.addEventListener('change', function() {
          const sinifId = this.value;
          const uyariDiv = this.parentElement.querySelector('.kontenjan-uyari');
          if (!sinifId || !uyariDiv) return;
          
          const sinif = siniflarList.find(s => s.sinif_id == sinifId);
          if (sinif) {
            const bosKontenjan = sinif.kontenjan - sinif.ogrenci_sayisi;
            if (bosKontenjan <= 0) {
              uyariDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Bu sınıf kontenjanı dolu! (${sinif.ogrenci_sayisi}/${sinif.kontenjan})`;
              uyariDiv.className = 'kontenjan-uyari danger';
              uyariDiv.style.display = 'block';
            } else if (bosKontenjan <= 3) {
              uyariDiv.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Kalan kontenjan: ${bosKontenjan} (${sinif.ogrenci_sayisi}/${sinif.kontenjan})`;
              uyariDiv.className = 'kontenjan-uyari';
              uyariDiv.style.display = 'block';
            } else {
              uyariDiv.style.display = 'none';
            } 
          }
        });
      });
    } catch (err) {
      console.error('Dropdown verileri yüklenemedi', err);
    }
  }

  async function loadStudents() {

    try {
      const res = await fetch('/api/ogrenciler?aktif_mi=1');
      const students = await res.json();

      let html = '';
      students.forEach(std => {
        const trClass = std.aktif_mi === 0 ? 'table-secondary text-muted' : '';
        html += `
          <tr class="${trClass}">
            <td>${std.ad} ${std.soyad}</td>
            <td>${std.email}</td>
            <td>${std.sinif_adi || '-'}</td>
            <td>${std.okul || '-'}</td>
            <td>${std.veli_ad ? std.veli_ad + ' ' + std.veli_soyad : '-'}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary btn-edit-student" data-student='${JSON.stringify(std).replace(/'/g, "&#39;")}'>Düzenle</button>
              ${std.aktif_mi === 1 ? `<button class="btn btn-sm btn-outline-danger btn-delete-student" data-id="${std.kullanici_id}">Sil</button>` : ''}
            </td>
          </tr>
        `;
      });
      studentsTableBody.innerHTML = html;
      attachStudentEvents();
    } catch (err) {
      console.error('Öğrenciler yüklenemedi', err);
    }
  }

  function attachStudentEvents() {
    document.querySelectorAll('.btn-edit-student').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const student = JSON.parse(e.target.getAttribute('data-student'));
        const form = document.getElementById('editStudentForm');
        form.kullanici_id.value = student.kullanici_id;
        form.ad.value = student.ad;
        form.soyad.value = student.soyad;
        form.email.value = student.email;
        form.telefon.value = student.telefon || '';
        form.tc_no.value = student.tc_no || '';
        form.sinif_id.value = student.sinif_id || '';
        form.veli_id.value = student.veli_id || '';
        form.okul.value = student.okul || '';
        form.sinif_seviyesi.value = student.sinif_seviyesi || '';
        
        // Düzenleme modalında sınıf seçiliyse kontenjan uyarısını göster
        const editSelect = form.querySelector('.sinif-select');
        const editUyari = form.querySelector('.kontenjan-uyari');
        if (editSelect && editUyari && student.sinif_id) {
          const sinif = siniflarList.find(s => s.sinif_id == student.sinif_id);
          if (sinif) {
            const bosKontenjan = sinif.kontenjan - sinif.ogrenci_sayisi;
            if (bosKontenjan <= 0) {
              editUyari.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Bu sınıf kontenjanı dolu! (${sinif.ogrenci_sayisi}/${sinif.kontenjan})`;
              editUyari.className = 'kontenjan-uyari danger';
              editUyari.style.display = 'block';
            } else if (bosKontenjan <= 3) {
              editUyari.innerHTML = `<i class="bi bi-exclamation-triangle-fill"></i> Kalan kontenjan: ${bosKontenjan} (${sinif.ogrenci_sayisi}/${sinif.kontenjan})`;
              editUyari.className = 'kontenjan-uyari';
              editUyari.style.display = 'block';
            } else {
              editUyari.style.display = 'none';
            }
          }
        }
        editStudentModal.show();
      });
    });

    document.querySelectorAll('.btn-delete-student').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(!confirm('Öğrenciyi silmek (pasif yapmak) istediğinize emin misiniz?')) return;
        const id = e.target.getAttribute('data-id');
        try {
          const res = await fetch('/api/ogrenciler/sil', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kullanici_id: id })
          });
          if(res.ok) {
            loadStudents();
          } else {
            alert('Silme başarısız');
          }
        } catch(err) {
          console.error(err);
        }
      });
    });
  }



  // Yeni öğrenci modalı açıldığında kontenjan uyarısını temizle
  document.getElementById('addStudentModal').addEventListener('shown.bs.modal', () => {
    const uyariDiv = document.getElementById('addStudentKontenjanUyari');
    if (uyariDiv) uyariDiv.style.display = 'none';
  });

  // Öğrenci düzenleme modalı açıldığında kontenjan uyarısını temizle (yeniden hesaplanacak)
  document.getElementById('editStudentModal').addEventListener('hidden.bs.modal', () => {
    const uyariDiv = document.getElementById('editStudentKontenjanUyari');
    if (uyariDiv) uyariDiv.style.display = 'none';
  });

  document.getElementById('saveNewStudentBtn').addEventListener('click', async () => {
    const form = document.getElementById('addStudentForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/ogrenciler/ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        addStudentModal.hide();
        form.reset();
        loadStudents();
      } else {
        const errData = await res.json();
        alert('Hata: ' + errData.error);
      }
    } catch(err) {
      console.error(err);
    }
  });

  document.getElementById('updateStudentBtn').addEventListener('click', async () => {
    const form = document.getElementById('editStudentForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await fetch('/api/ogrenciler/guncelle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        editStudentModal.hide();
        loadStudents();
      } else {
        const errData = await res.json();
        alert('Hata: ' + errData.error);
      }
    } catch(err) {
      console.error(err);
    }
  });

  // ==============================
  // VELİ YÖNETİMİ
  // ==============================
  const velilerTableBody = document.getElementById('velilerTableBody');

  const addVeliModal = new bootstrap.Modal(document.getElementById('addVeliModal'));
  const editVeliModal = new bootstrap.Modal(document.getElementById('editVeliModal'));

  let tumOgrencilerList = [];

  async function loadVeliDropdowns() {
    try {
      const res = await fetch('/api/ogrenciler/bagsiz');
      tumOgrencilerList = await res.json();
    } catch(err) {
      console.error('Öğrenci listesi yüklenemedi', err);
    }
    const ogrOptions = tumOgrencilerList.map(o => `<option value="${o.ogrenci_id}">${o.ad} ${o.soyad}</option>`).join('');
    document.querySelectorAll('.ogrenci-multiple-select').forEach(el => el.innerHTML = ogrOptions);
  }

  async function loadVeliler() {

    try {
      const res = await fetch('/api/veliler?aktif_mi=1');
      const veliler = await res.json();

      let html = '';
      veliler.forEach(v => {
        const trClass = v.aktif_mi === 0 ? 'table-secondary text-muted' : '';
        const ogrenciListesi = v.ogrenci_adlari
          ? v.ogrenci_adlari.split('||').map(ad => `<div class="text-sm">└ ${ad}</div>`).join('')
          : '<span class="text-muted">—</span>';
        const vStr = JSON.stringify(v).replace(/'/g, '&#39;');
        html += `
          <tr class="${trClass}">
            <td>${v.ad} ${v.soyad}</td>
            <td>${v.email}</td>
            <td>${v.telefon || '—'}</td>
            <td>${ogrenciListesi}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary btn-edit-veli" data-veli='${vStr}'>Düzenle</button>
              ${v.aktif_mi === 1 ? `<button class="btn btn-sm btn-outline-danger btn-pasif-veli" data-id="${v.kullanici_id}">Pasif Yap</button>` : ''}
            </td>
          </tr>
        `;
      });
      velilerTableBody.innerHTML = html;
      attachVeliEvents();
    } catch(err) {
      console.error('Veliler yüklenemedi', err);
    }
  }

  function attachVeliEvents() {
    document.querySelectorAll('.btn-edit-veli').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const v = JSON.parse(e.target.getAttribute('data-veli'));
        const form = document.getElementById('editVeliForm');
        form.veli_id.value = v.veli_id;
        form.kullanici_id.value = v.kullanici_id;
        form.ad.value = v.ad;
        form.soyad.value = v.soyad;
        form.email.value = v.email;
        form.telefon.value = v.telefon || '';
        form.tc_no.value = v.tc_no || '';

        // Mevcut öğrenciler bilgi satırı
        const mevcutDiv = document.getElementById('editVeliMevcutOgrenciler');
        if (v.ogrenci_adlari) {
          mevcutDiv.innerHTML = v.ogrenci_adlari.split('||').map(ad => `<div>└ ${ad}</div>`).join('');
        } else {
          mevcutDiv.textContent = 'Bu veliye bağlı öğrenci yok.';
        }

        // Seçme listesinde mevcut öğrencileri seçili göster
        const bagliogrenciIds = v.ogrenci_id_list
          ? v.ogrenci_id_list.split(',').map(s => s.trim())
          : [];
        const select = form.ogrenci_idler;
        Array.from(select.options).forEach(opt => {
          opt.selected = bagliogrenciIds.includes(opt.value);
        });

        editVeliModal.show();
      });
    });

    document.querySelectorAll('.btn-pasif-veli').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if (!confirm('Bu veliyi pasif yapmak istediğinize emin misiniz?')) return;
        const id = e.target.getAttribute('data-id');
        try {
          const res = await fetch('/api/veliler/pasif-yap', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kullanici_id: id })
          });
          if (res.ok) loadVeliler();
          else alert('İşlem başarısız');
        } catch(err) { console.error(err); }
      });
    });
  }



  document.getElementById('saveNewVeliBtn').addEventListener('click', async () => {
    const form = document.getElementById('addVeliForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const formData = new FormData(form);
    const ogrenci_idler = Array.from(form.ogrenci_idler.selectedOptions).map(o => o.value);
    const data = {
      ad: formData.get('ad'),
      soyad: formData.get('soyad'),
      email: formData.get('email'),
      sifre: formData.get('sifre'),
      telefon: formData.get('telefon'),
      tc_no: formData.get('tc_no'),
      ogrenci_idler
    };
    try {
      const res = await fetch('/api/veliler/ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) { addVeliModal.hide(); form.reset(); loadVeliler(); }
      else { const err = await res.json(); alert('Hata: ' + err.error); }
    } catch(err) { console.error(err); }
  });

  document.getElementById('updateVeliBtn').addEventListener('click', async () => {
    const form = document.getElementById('editVeliForm');
    if (!form.checkValidity()) { form.reportValidity(); return; }

    const formData = new FormData(form);
    const ogrenci_idler = Array.from(form.ogrenci_idler.selectedOptions).map(o => o.value);
    const data = {
      veli_id: formData.get('veli_id'),
      kullanici_id: formData.get('kullanici_id'),
      ad: formData.get('ad'),
      soyad: formData.get('soyad'),
      email: formData.get('email'),
      telefon: formData.get('telefon'),
      tc_no: formData.get('tc_no'),
      ogrenci_idler
    };
    try {
      const res = await fetch('/api/veliler/guncelle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) { editVeliModal.hide(); loadVeliler(); }
      else { const err = await res.json(); alert('Hata: ' + err.error); }
    } catch(err) { console.error(err); }
  });

  // Veliler sekmesine ilk tıklandığında yükle
  let velilerLoaded = false;

  // ==============================
  // EĞİTMEN YÖNETİMİ
  // ==============================
  const egitmenlerContent = document.getElementById('egitmenler-content');
  const egitmenlerTableBody = document.getElementById('egitmenlerTableBody');

  const addEgitmenModal = new bootstrap.Modal(document.getElementById('addEgitmenModal'));
  const editEgitmenModal = new bootstrap.Modal(document.getElementById('editEgitmenModal'));

  async function loadEgitmenDropdowns() {
    try {
      if (siniflarList.length === 0) {
        const sinifRes = await fetch('/api/siniflar');
        siniflarList = await sinifRes.json();
      }
      let sinifOptions = '';
      siniflarList.forEach(s => {
        sinifOptions += `<option value="${s.sinif_id}">${s.sinif_adi}</option>`;
      });
      document.querySelectorAll('.sinif-multiple-select').forEach(el => el.innerHTML = sinifOptions);
    } catch (err) {
      console.error('Sınıf verileri yüklenemedi', err);
    }
  }

  async function loadEgitmenler() {

    try {
      const res = await fetch('/api/egitmenler?aktif_mi=1');
      const egitmenler = await res.json();

      let html = '';
      egitmenler.forEach(eg => {
        const trClass = eg.aktif_mi === 0 ? 'table-secondary text-muted' : '';
        html += `
          <tr class="${trClass}">
            <td>${eg.ad} ${eg.soyad}</td>
            <td>${eg.email}</td>
            <td>${eg.telefon || '-'}</td>
            <td>${eg.siniflar || '-'}</td>
            <td class="text-end">
              <button class="btn btn-sm btn-outline-primary btn-edit-egitmen" data-egitmen='${JSON.stringify(eg).replace(/'/g, "&#39;")}'>Düzenle</button>
              ${eg.aktif_mi === 1 ? `<button class="btn btn-sm btn-outline-danger btn-delete-egitmen" data-id="${eg.kullanici_id}">Sil</button>` : ''}
            </td>
          </tr>
        `;
      });
      egitmenlerTableBody.innerHTML = html;
      attachEgitmenEvents();
    } catch (err) {
      console.error('Eğitmenler yüklenemedi', err);
    }
  }

  function attachEgitmenEvents() {
    document.querySelectorAll('.btn-edit-egitmen').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eg = JSON.parse(e.target.getAttribute('data-egitmen'));
        const form = document.getElementById('editEgitmenForm');
        form.egitmen_id.value = eg.egitmen_id;
        form.kullanici_id.value = eg.kullanici_id;
        form.ad.value = eg.ad;
        form.soyad.value = eg.soyad;
        form.email.value = eg.email;
        form.telefon.value = eg.telefon || '';
        form.tc_no.value = eg.tc_no || '';
        
        // Sınıfları seçili hale getir
        const sinifIds = eg.sinif_id_list ? eg.sinif_id_list.split(',').map(s => s.trim()) : [];
        const select = form.siniflar;
        Array.from(select.options).forEach(opt => {
          opt.selected = sinifIds.includes(opt.value);
        });

        editEgitmenModal.show();
      });
    });

    document.querySelectorAll('.btn-delete-egitmen').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        if(!confirm('Eğitmeni silmek istediğinize emin misiniz?')) return;
        const id = e.target.getAttribute('data-id');
        try {
          const res = await fetch('/api/egitmenler/pasif-yap', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ kullanici_id: id })
          });
          if(res.ok) {
            loadEgitmenler();
          } else {
            alert('İşlem başarısız');
          }
        } catch(err) {
          console.error(err);
        }
      });
    });
  }



  document.getElementById('saveNewEgitmenBtn').addEventListener('click', async () => {
    const form = document.getElementById('addEgitmenForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    const formData = new FormData(form);
    
    // Multiple select değerlerini al
    const siniflar = [];
    Array.from(form.siniflar.selectedOptions).forEach(opt => siniflar.push(opt.value));
    
    const data = {
      ad: formData.get('ad'),
      soyad: formData.get('soyad'),
      email: formData.get('email'),
      sifre: formData.get('sifre'),
      telefon: formData.get('telefon'),
      tc_no: formData.get('tc_no'),
      siniflar: siniflar
    };

    try {
      const res = await fetch('/api/egitmenler/ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        addEgitmenModal.hide();
        form.reset();
        loadEgitmenler();
      } else {
        const errData = await res.json();
        alert('Hata: ' + errData.error);
      }
    } catch(err) {
      console.error(err);
    }
  });

  document.getElementById('updateEgitmenBtn').addEventListener('click', async () => {
    const form = document.getElementById('editEgitmenForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
    
    const formData = new FormData(form);
    const siniflar = [];
    Array.from(form.siniflar.selectedOptions).forEach(opt => siniflar.push(opt.value));

    const data = {
      egitmen_id: formData.get('egitmen_id'),
      kullanici_id: formData.get('kullanici_id'),
      ad: formData.get('ad'),
      soyad: formData.get('soyad'),
      email: formData.get('email'),
      telefon: formData.get('telefon'),
      tc_no: formData.get('tc_no'),
      siniflar: siniflar
    };

    try {
      const res = await fetch('/api/egitmenler/guncelle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        editEgitmenModal.hide();
        loadEgitmenler();
      } else {
        const errData = await res.json();
        alert('Hata: ' + errData.error);
      }
    } catch(err) {
      console.error(err);
    }
  });

  // Eğitmenler sekmesine tıklandığında yükle
  let egitmenlerLoaded = false;
  adminItems.forEach(item => {
    item.addEventListener('click', () => {
      const href = item.querySelector('a').getAttribute('href');
      // Öğrenciler sekmesi için önceki kontrol burada duruyor:
      if (href === '#ogrenciler' && !studentsLoaded) {
        loadDropdowns().then(loadStudents);
        studentsLoaded = true;
      }
      // Eğitmenler sekmesi
      if (href === '#egitmenler' && !egitmenlerLoaded) {
        loadEgitmenDropdowns().then(loadEgitmenler);
        egitmenlerLoaded = true;
      }
      // Veliler sekmesi
      if (href === '#veliler' && !velilerLoaded) {
        loadVeliDropdowns().then(loadVeliler);
        velilerLoaded = true;
      }
      // Sınıf Yönetimi sekmesi
      if (href === '#siniflar' && !siniflarLoaded) {
        loadSiniflarYonetim();
        siniflarLoaded = true;
      }
      // Devamsızlıklar sekmesi
      if (href === '#devamsizliklar' && !devamsizlikklarLoaded) {
        loadSiniflar();
        devamsizlikklarLoaded = true;
      }
    });
  });

  // ==============================
  // SINIF YÖNETİMİ
  // ==============================
  let siniflarLoaded = false;
  let atolyelerList = [];
  let derslerList = [];

  const siniflarGrid = document.getElementById('siniflarGrid');
  const addSinifModal = new bootstrap.Modal(document.getElementById('addSinifModal'));
  const editSinifModal = new bootstrap.Modal(document.getElementById('editSinifModal'));
  const sinifDetayModal = new bootstrap.Modal(document.getElementById('sinifDetayModal'));
  const addSinifDersModal = new bootstrap.Modal(document.getElementById('addSinifDersModal'));

  // Atölye ve ders listelerini yükle
  async function loadSinifDropdowns() {
    try {
      const atolyeRes = await fetch('/api/atolyeler');
      atolyelerList = await atolyeRes.json();
      const dersRes = await fetch('/api/dersler');
      derslerList = await dersRes.json();
    } catch (err) {
      console.error('Dropdown verileri yüklenemedi', err);
    }
  }

  // Sınıf yönetimi verilerini yükle
  async function loadSiniflarYonetim() {
    try {
      const res = await fetch('/api/siniflar');
      const siniflar = await res.json();

      let html = '';
      siniflar.forEach(sinif => {
        const dolulukYuzde = sinif.kontenjan > 0 ? Math.round((sinif.ogrenci_sayisi / sinif.kontenjan) * 100) : 0;
        const progressClass = dolulukYuzde >= 100 ? 'bg-danger' : (dolulukYuzde >= 80 ? 'bg-warning' : 'bg-success');
        
        html += `
          <div class="col-md-6 col-lg-4 col-xl-3">
            <div class="card sinif-yonetim-kart h-100 shadow-sm border-0" data-sinif-id="${sinif.sinif_id}">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <h5 class="card-title mb-0">${sinif.sinif_adi}</h5>
                  <span class="badge bg-primary">${sinif.atolye_adi || 'Atölye yok'}</span>
                </div>
                <div class="mb-3">
                  <div class="d-flex justify-content-between small mb-1">
                    <span class="text-muted">Kontenjan</span>
                    <span class="fw-bold">${sinif.kontenjan}</span>
                  </div>
                  <div class="progress" style="height: 8px;">
                    <div class="progress-bar ${progressClass}" role="progressbar" style="width: ${dolulukYuzde}%" aria-valuenow="${dolulukYuzde}" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                  <div class="d-flex justify-content-between small mt-1">
                    <span class="text-muted">Mevcut</span>
                    <span class="fw-bold text-${dolulukYuzde >= 100 ? 'danger' : 'success'}">${sinif.ogrenci_sayisi}</span>
                  </div>
                  <div class="d-flex justify-content-between small">
                    <span class="text-muted">Boş</span>
                    <span class="fw-bold">${sinif.bos_kontenjan}</span>
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button class="btn btn-sm btn-outline-primary flex-fill btn-sinif-detay" data-sinif-id="${sinif.sinif_id}">
                    <i class="bi bi-eye me-1"></i>Detay
                  </button>
                  <button class="btn btn-sm btn-outline-secondary flex-fill btn-sinif-duzenle" data-sinif-id="${sinif.sinif_id}">
                    <i class="bi bi-pencil me-1"></i>Düzenle
                  </button>
                  <button class="btn btn-sm btn-outline-danger flex-fill btn-sinif-sil" data-sinif-id="${sinif.sinif_id}" data-sinif-adi="${sinif.sinif_adi}">
                    <i class="bi bi-trash me-1"></i>Sil
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      });
      
      siniflarGrid.innerHTML = html;
      attachSinifEvents();
    } catch (err) {
      console.error('Sınıflar yüklenemedi', err);
    }
  }

  function attachSinifEvents() {
    // Detay butonu
    document.querySelectorAll('.btn-sinif-detay').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const sinifId = e.target.closest('.btn-sinif-detay').getAttribute('data-sinif-id');
        await showSinifDetay(sinifId);
      });
    });

    // Düzenle butonu
    document.querySelectorAll('.btn-sinif-duzenle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sinifId = e.target.closest('.btn-sinif-duzenle').getAttribute('data-sinif-id');
        loadSinifForEdit(sinifId);
      });
    });

    // Sil butonu
    document.querySelectorAll('.btn-sinif-sil').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const btnEl = e.target.closest('.btn-sinif-sil');
        const sinifId = btnEl.getAttribute('data-sinif-id');
        const sinifAdi = btnEl.getAttribute('data-sinif-adi');
        
        if (!confirm(`${sinifAdi} sınıfını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) return;
        
        try {
          const res = await fetch('/api/siniflar/sil', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sinif_id: sinifId })
          });
          if (res.ok) {
            loadSiniflarYonetim();
          } else {
            const err = await res.json();
            alert('Hata: ' + err.error);
          }
        } catch(err) {
          console.error(err);
          alert('Sunucu ile iletişim kurulamadı.');
        }
      });
    });
  }

  // Sınıf detayını göster
  async function showSinifDetay(sinifId) {
    try {
      const res = await fetch(`/api/siniflar/${sinifId}/detay`);
      const data = await res.json();
      
      if (!data.sinif) return;

      // Başlık
      document.getElementById('sinifDetayBaslik').textContent = `${data.sinif.sinif_adi} - Detay`;
      
      // Bilgiler
      document.getElementById('detayKontenjan').textContent = data.sinif.kontenjan;
      document.getElementById('detayMevcutOgrenci').textContent = data.sinif.ogrenci_sayisi;
      document.getElementById('detayBosKontenjan').textContent = data.sinif.bos_kontenjan;

      // Dersler
      let derslerHtml = '';
      if (data.dersler && data.dersler.length > 0) {
        data.dersler.forEach(ders => {
          derslerHtml += `
            <tr>
              <td>${ders.ders_adi}</td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-danger btn-ders-sil" data-sinif-id="${sinifId}" data-ders-id="${ders.ders_id}">
                  <i class="bi bi-trash"></i> Çıkar
                </button>
              </td>
            </tr>
          `;
        });
      } else {
        derslerHtml = '<tr><td colspan="2" class="text-center text-muted">Bu sınıfa henüz ders atanmamış.</td></tr>';
      }
      document.getElementById('sinifDetayDerslerBody').innerHTML = derslerHtml;

      // Öğrenciler
      let ogrencilerHtml = '';
      if (data.ogrenciler && data.ogrenciler.length > 0) {
        data.ogrenciler.forEach(ogr => {
          ogrencilerHtml += `
            <tr>
              <td>${ogr.ad} ${ogr.soyad}</td>
              <td>${ogr.email}</td>
              <td>${ogr.okul || '-'}</td>
              <td>${ogr.sinif_seviyesi || '-'}</td>
              <td>${ogr.veli_ad ? ogr.veli_ad + ' ' + ogr.veli_soyad : '-'}</td>
            </tr>
          `;
        });
      } else {
        ogrencilerHtml = '<tr><td colspan="5" class="text-center text-muted">Bu sınıfta henüz öğrenci yok.</td></tr>';
      }
      document.getElementById('sinifDetayOgrencilerBody').innerHTML = ogrencilerHtml;

      // Ders silme eventleri
      document.querySelectorAll('.btn-ders-sil').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const btnEl = e.target.closest('.btn-ders-sil');
          const sId = btnEl.getAttribute('data-sinif-id');
          const dId = btnEl.getAttribute('data-ders-id');
          
          if (!confirm('Bu dersi sınıftan çıkarmak istediğinize emin misiniz?')) return;
          
          try {
            const res = await fetch(`/api/siniflar/${sId}/dersler/${dId}`, {
              method: 'DELETE'
            });
            if (res.ok) {
              showSinifDetay(sId); // Yeniden yükle
            } else {
              alert('İşlem başarısız');
            }
          } catch(err) {
            console.error(err);
          }
        });
      });

      // Ders ekle butonuna sınıf ID'sini ata
      document.getElementById('dersSinifId').value = sinifId;
      loadDerslerForSinif(sinifId); // Ders ekle modalı için kullanılabilir dersleri yükle

      sinifDetayModal.show();
    } catch (err) {
      console.error('Sınıf detayı yüklenemedi', err);
    }
  }

  // Ders ekle modalı için kullanılabilir dersleri yükle (sınıfına atanmamış dersler)
  async function loadDerslerForSinif(sinifId) {
    try {
      // Tüm dersleri getir
      const tumDerslerRes = await fetch('/api/dersler');
      const tumDersler = await tumDerslerRes.json();
      
      // Atanmış dersleri al
      const atanmisRes = await fetch(`/api/siniflar/${sinifId}/dersler`);
      const atanmisDersler = await atanmisRes.json();
      const atanmisIds = atanmisDersler.map(d => d.ders_id);

      // Atanmamış dersleri filtrele
      const kullanilabilirDersler = tumDersler.filter(d => !atanmisIds.includes(d.ders_id));
      
      // Dropdown'u doldur
      let dersOptions = '<option value="">Ders Seçiniz</option>';
      kullanilabilirDersler.forEach(d => {
        dersOptions += `<option value="${d.ders_id}">${d.ders_adi}</option>`;
      });
      document.querySelectorAll('.ders-select').forEach(el => el.innerHTML = dersOptions);
      
      if (kullanilabilirDersler.length === 0) {
        document.querySelector('.ders-select').innerHTML = '<option value="">Tüm dersler bu sınıfa atanmış</option>';
      }
    } catch (err) {
      console.error('Dersler yüklenemedi', err);
    }
  }

  // Sınıf düzenleme için veriyi yükle
  async function loadSinifForEdit(sinifId) {
    try {
      const res = await fetch('/api/siniflar');
      const siniflar = await res.json();
      const sinif = siniflar.find(s => s.sinif_id == sinifId);
      
      if (!sinif) return;

      const form = document.getElementById('editSinifForm');
      form.sinif_id.value = sinif.sinif_id;
      form.sinif_adi.value = sinif.sinif_adi;
      form.kontenjan.value = sinif.kontenjan;
      form.atolye_id.value = sinif.atolye_id;

      // Atölye dropdown'ını doldur
      if (atolyelerList.length === 0) {
        const atolyeRes = await fetch('/api/atolyeler');
        atolyelerList = await atolyeRes.json();
      }
      let atolyeOptions = '<option value="">Atölye Seçiniz</option>';
      atolyelerList.forEach(a => {
        atolyeOptions += `<option value="${a.atolye_id}" ${a.atolye_id == sinif.atolye_id ? 'selected' : ''}>${a.atolye_adi}</option>`;
      });
      document.querySelectorAll('#editSinifForm .atolye-select').forEach(el => el.innerHTML = atolyeOptions);

      editSinifModal.show();
    } catch (err) {
      console.error('Sınıf düzenleme verisi yüklenemedi', err);
    }
  }

  // Yeni sınıf kaydet
  document.getElementById('saveNewSinifBtn').addEventListener('click', async () => {
    const form = document.getElementById('addSinifForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.kontenjan = parseInt(data.kontenjan);
    data.atolye_id = parseInt(data.atolye_id);

    try {
      const res = await fetch('/api/siniflar/ekle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        addSinifModal.hide();
        form.reset();
        loadSiniflarYonetim();
      } else {
        const errData = await res.json();
        alert('Hata: ' + errData.error);
      }
    } catch(err) {
      console.error(err);
    }
  });

  // Sınıf güncelle
  document.getElementById('updateSinifBtn').addEventListener('click', async () => {
    const form = document.getElementById('editSinifForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.kontenjan = parseInt(data.kontenjan);
    data.atolye_id = parseInt(data.atolye_id);

    try {
      const res = await fetch('/api/siniflar/guncelle', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        editSinifModal.hide();
        loadSiniflarYonetim();
      } else {
        const errData = await res.json();
        alert('Hata: ' + errData.error);
      }
    } catch(err) {
      console.error(err);
    }
  });

  // Sınıfa ders ekle
  document.getElementById('saveSinifDersBtn').addEventListener('click', async () => {
    const form = document.getElementById('addSinifDersForm');
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const sinifId = document.getElementById('dersSinifId').value;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.ders_id = parseInt(data.ders_id);

    try {
      const res = await fetch(`/api/siniflar/${sinifId}/dersler`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        addSinifDersModal.hide();
        form.reset();
        showSinifDetay(sinifId); // Detayı yenile
      } else {
        const errData = await res.json();
        alert('Hata: ' + errData.error);
      }
    } catch(err) {
      console.error(err);
    }
  });

  // Yeni sınıf modalı açıldığında atölye dropdown'ını doldur
  document.getElementById('addSinifModal').addEventListener('shown.bs.modal', async () => {
    if (atolyelerList.length === 0) {
      const atolyeRes = await fetch('/api/atolyeler');
      atolyelerList = await atolyeRes.json();
    }
    let atolyeOptions = '<option value="">Atölye Seçiniz</option>';
    atolyelerList.forEach(a => {
      atolyeOptions += `<option value="${a.atolye_id}">${a.atolye_adi}</option>`;
    });
    document.querySelectorAll('#addSinifForm .atolye-select').forEach(el => el.innerHTML = atolyeOptions);
  });

  // ==============================
  // DEVAMSIZLIK YÖNETİMİ
  // ==============================
  let devamsizlikklarLoaded = false;
  let tumOgrenciDevamsizlik = [];

  async function loadSiniflar() {
    try {
      const res = await fetch('/api/siniflar');
      const siniflar = await res.json();
      
      let html = '';
      siniflar.forEach(sinif => {
        html += `
          <div class="col-md-4">
            <div class="sinif-kart" data-sinif-id="${sinif.sinif_id}">
              <div class="sinif-kart-ikon">
                <i class="bi bi-folder-fill"></i>
              </div>
              <p class="sinif-kart-isim">${sinif.sinif_adi}</p>
            </div>
          </div>
        `;
      });
      
      document.getElementById('siniflarContainer').innerHTML = html;
      
      // Sınıf kartlarına click event ekle
      document.querySelectorAll('.sinif-kart').forEach(kart => {
        kart.addEventListener('click', (e) => {
          const sinifId = e.currentTarget.getAttribute('data-sinif-id');
          loadOgrenciByClass(sinifId);
        });
      });
    } catch (err) {
      console.error('Sınıflar yüklenemedi', err);
    }
  }

  async function loadOgrenciByClass(sinifId) {
    try {
      const res = await fetch('/api/ogrenciler?aktif_mi=1');
      const tumOgrenciler = await res.json();
      
      // Seçilen sınıfa ait öğrencileri filtrele
      const sinifOgrencileri = tumOgrenciler.filter(og => og.sinif_id == sinifId);
      
      // Sınıf adını bul
      const sinifRes = await fetch('/api/siniflar');
      const tumSiniflar = await sinifRes.json();
      const secilenSinif = tumSiniflar.find(s => s.sinif_id == sinifId);
      
      // Başlığı güncelle
      document.getElementById('sinifBasligi').textContent = secilenSinif ? secilenSinif.sinif_adi : 'Sınıf';
      
      let html = '';
      if (sinifOgrencileri.length === 0) {
        html = '<div class="col-12"><p class="text-muted text-center">Bu sınıfta öğrenci bulunmamaktadır.</p></div>';
      } else {
        sinifOgrencileri.forEach(og => {
          html += `
            <div class="col-md-4">
              <div class="ogrenci-kart" data-ogrenci-id="${og.kullanici_id}">
                <div class="ogrenci-kart-ikon">
                  <i class="bi bi-person-fill"></i>
                </div>
                <p class="ogrenci-kart-isim">${og.ad} ${og.soyad}</p>
              </div>
            </div>
          `;
        });
      }
      
      document.getElementById('ogrenciKartlariContainer').innerHTML = html;
      
      // Öğrenci kartlarına click event ekle
      document.querySelectorAll('.ogrenci-kart').forEach(kart => {
        kart.addEventListener('click', (e) => {
          const ogrenciId = e.currentTarget.getAttribute('data-ogrenci-id');
          const ogrenciAdi = e.currentTarget.querySelector('.ogrenci-kart-isim').textContent;
          loadDerslerByOgrenci(ogrenciId, ogrenciAdi);
        });
      });
      
      // Görünümü değiştir
      document.getElementById('siniflarView').style.display = 'none';
      document.getElementById('ogrenciView').style.display = 'block';
    } catch (err) {
      console.error('Öğrenciler yüklenemedi', err);
      alert('Öğrenciler yüklenirken hata oluştu');
    }
  }

  async function loadDerslerByOgrenci(ogrenciId, ogrenciAdi) {
    try {
      const res = await fetch(`/api/ogrenci/${ogrenciId}/dersler-devamsizlik`);
      const dersler = await res.json();
      
      // Başlığı güncelle
      document.getElementById('ogrenciBasligi').textContent = ogrenciAdi;
      
      if (dersler.length === 0) {
        document.getElementById('derslerKartlariContainer').innerHTML = '<div class="col-12"><p class="text-muted text-center">Bu öğrencinin dersi bulunmamaktadır.</p></div>';
      } else {
        // Dersleri kartlar halinde göster
        let html = '';
        dersler.forEach((ders, index) => {
          html += `
            <div class="col-lg-6">
              <div class="ders-kart">
                <h5 class="ders-kart-isim">${ders.ders_adi}</h5>
                <div class="ders-grafik-container">
                  <canvas id="dersChart${index}" style="max-width: 100%; max-height: 250px;"></canvas>
                </div>
              </div>
            </div>
          `;
        });
        
        document.getElementById('derslerKartlariContainer').innerHTML = html;
        
        // Grafikler render et
        renderDersGrafikleri(dersler);
      }
      
      // Görünümü değiştir
      document.getElementById('ogrenciView').style.display = 'none';
      document.getElementById('derslerView').style.display = 'block';
    } catch (err) {
      console.error('Dersler yüklenemedi', err);
      alert('Dersler yüklenirken hata oluştu');
    }
  }

  function renderDersGrafikleri(dersler) {
    dersler.forEach((ders, index) => {
      const canvas = document.getElementById(`dersChart${index}`);
      if (!canvas) return;

      // Devamsızlık verilerini say
      let geldi = 0, gelmedi = 0, izinli = 0;

      if (ders.devamsizliklar && ders.devamsizliklar.length > 0) {
        ders.devamsizliklar.forEach(kayit => {
          if (kayit.durum === 'Geldi') geldi++;
          else if (kayit.durum === 'Gelmedi') gelmedi++;
          else if (kayit.durum === 'İzinli') izinli++;
        });
      }

      // Chart.js doughnut grafik
      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Geldi', 'Gelmedi', 'İzinli'],
          datasets: [{
            data: [geldi, gelmedi, izinli],
            backgroundColor: ['#198754', '#dc3545', '#f39c12'],
            borderColor: '#ffffff',
            borderWidth: 3,
            hoverOffset: 10
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                font: { size: 12 },
                padding: 15
              }
            }
          }
        }
      });
    });
  }

  // Geri butonu (Öğrenciler → Sınıflar)
  document.getElementById('geriButonuOgrenci').addEventListener('click', () => {
    document.getElementById('ogrenciView').style.display = 'none';
    document.getElementById('siniflarView').style.display = 'block';
  });

  // Geri butonu (Dersler → Öğrenciler)
  document.getElementById('geriButonuDersler').addEventListener('click', () => {
    document.getElementById('derslerView').style.display = 'none';
    document.getElementById('ogrenciView').style.display = 'block';
  });

