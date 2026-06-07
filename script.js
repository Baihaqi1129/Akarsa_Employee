// ==========================================
// --- KONFIGURASI API ---
// ==========================================
const API_URL = "https://script.google.com/macros/s/AKfycbw79f6kuQ2Cgxt-t5EBwA6zy4m1Xp1Cf_8tZF1CcbOCY00OAFFn-yeoWcPx4FRhfDMp/exec"; 
let userAktif = null; 
let isModeKioskMurni = false;

// ==========================================
// --- FITUR LOGIN & LOGOUT ---
// ==========================================
function togglePassword() {
  const pinInput = document.getElementById("pin");
  const toggleIcon = document.getElementById("toggleIcon");
  if (pinInput.type === "password") {
    pinInput.type = "text"; toggleIcon.className = "bi bi-eye";
  } else {
    pinInput.type = "password"; toggleIcon.className = "bi bi-eye-slash";
  }
}

async function prosesLogin() {
  const btn = document.getElementById('btnMasuk');
  
  if (btn.disabled) return; 

  const inputNik = document.getElementById('nik').value.trim();
  const inputPin = document.getElementById('pin').value.trim();
  
  if (!inputNik || !inputPin) { alert('Ups! NIK dan PIN tidak boleh kosong.'); return; }

  btn.innerHTML = 'Memvalidasi...'; 
  btn.disabled = true;

  let isLoginSukses = false; 
  const payload = { action: "login", nik: inputNik, pin: inputPin };

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const responServer = await response.json();

    if (responServer.status === "SUKSES") {
      isLoginSukses = true; 

      if (responServer.jenis_login === "SISTEM") {
        document.getElementById('adminWelcome').innerText = responServer.nama;
        document.getElementById('adminRoleDesc').innerText = responServer.role;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardAdmin').style.display = 'block';
        saklarMenuAdmin('dash', 'Dashboard Overview');
      } else if (responServer.jenis_login === "KARYAWAN") {
        userAktif = { nik: responServer.nik, nama: responServer.nama, ...responServer.data_hris };
        document.getElementById('namaKaryawan').innerText = userAktif.nama;
        document.getElementById('jabatanKaryawan').innerText = userAktif.jabatan;
        document.getElementById('nikKaryawan').innerText = "NIK: " + userAktif.nik;
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('dashboardKaryawan').style.display = 'block';
        
        if (typeof loadNotifikasi === "function") loadNotifikasi(); 
      }
    } else {
      alert(responServer.pesan);
      btn.innerHTML = 'MASUK SISTEM';
      btn.disabled = false;
    }
  } catch (error) {
    if (!isLoginSukses) {
        if (error.name !== 'AbortError' && !error.message.includes('Failed to fetch') && !error.message.includes('Load failed')) {
           alert("Koneksi gagal! (Pesan sistem: " + error.message + ")");
        }
        btn.innerHTML = 'MASUK SISTEM';
        btn.disabled = false;
    }
  }
}
function logout() {
  if (confirm('Apakah Anda yakin ingin keluar?')) {
    document.getElementById('dashboardKaryawan').style.display = 'none';
    document.getElementById('dashboardAdmin').style.display = 'none';
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('nik').value = '';
    document.getElementById('pin').value = '';
  }
}

// ==========================================
// --- PENGENDALI PANEL NOTIFIKASI ---
// ==========================================
function bukaNotifikasi() {
  document.getElementById('panelNotifikasi').style.display = 'flex';
  const badge = document.getElementById('badgeNotif');
  if(badge) badge.style.display = 'none';
  loadNotifikasi(); 
}

function tutupNotifikasi() {
  document.getElementById('panelNotifikasi').style.display = 'none';
}

async function loadNotifikasi() {
  const container = document.getElementById('listNotifikasi');
  const badge = document.getElementById('badgeNotif');
  
  container.innerHTML = '<div class="text-center text-muted mt-5"><div class="spinner-border spinner-border-sm text-danger mb-2"></div><br><small>Menarik kotak masuk...</small></div>';
  
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_notifikasi", nik: userAktif.nik })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      container.innerHTML = "";
      let jumlahBelumDibaaca = 0;
      
      if (res.data.length === 0) {
        container.innerHTML = '<div class="text-center text-muted mt-5 opacity-50"><i class="bi bi-inbox fs-1 d-block mb-2"></i><small>Belum ada notifikasi.</small></div>';
        badge.style.display = 'none';
        return;
      }
      
      res.data.forEach(item => {
        if (item.status === "unread") jumlahBelumDibaaca++;
        
        let warnaBatas = "#3b82f6"; 
        let iconAlert = '<i class="bi bi-info-circle-fill text-primary me-1"></i>';
        
        if (item.tipe === "warning") {
          warnaBatas = "#fbbf24"; iconAlert = '<i class="bi bi-exclamation-triangle-fill text-warning me-1"></i>';
        } else if (item.tipe === "danger") {
          warnaBatas = "#ef4444"; iconAlert = '<i class="bi bi-x-octagon-fill text-danger me-1"></i>';
        } else if (item.tipe === "success") {
          warnaBatas = "#10b981"; iconAlert = '<i class="bi bi-check-circle-fill text-success me-1"></i>';
        }
        
        container.innerHTML += `
          <div class="alert border-0 shadow-sm rounded-4 mb-3 position-relative overflow-hidden" style="background-color: #ffffff; font-size: 13px;">
            <div class="position-absolute top-0 start-0 w-100" style="height: 4px; background: ${warnaBatas};"></div>
            <div class="d-flex justify-content-between mb-2 mt-1">
              <strong class="text-dark">${iconAlert} ${item.judul}</strong>
              <small class="text-muted fw-bold" style="font-size: 10px;">${item.waktu}</small>
            </div>
            <p class="mb-0 text-dark">${item.pesan}</p>
          </div>
        `;
      });
      
      if (jumlahBelumDibaaca > 0) {
        badge.innerText = jumlahBelumDibaaca;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  } catch (error) {
    container.innerHTML = '<div class="text-center text-danger mt-5"><i class="bi bi-wifi-off fs-3 d-block mb-2"></i>Gagal memuat notifikasi.</div>';
  }
}

// ==========================================
// --- PENGENDALI SIDEBAR & TAB HALAMAN ADMIN ---
// ==========================================
function toggleSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const content = document.getElementById('adminContent');
  sidebar.classList.toggle('collapsed');
  content.classList.toggle('expanded');
}

function saklarMenuAdmin(targetRuangan, judulHalaman) {
  // ==========================================
  // 🚨 SATPAM DIGITAL (MATRIKS HAK AKSES) 🚨
  // ==========================================
  const myRole = document.getElementById('adminRoleDesc').innerText.trim();
  
  // Daftar menu (ID) yang dilarang berdasarkan kasta
  const areaDeveloperOnly = ['hak_akses', 'set']; // 'set' biasanya untuk Pengaturan GPS
  const areaManagerOnly = ['grade', 'sp']; // Hanya Developer & HR Manager yang boleh
  const areaStaffBanned = ['user', 'dokumen', 'appv-cuti', 'appv-lembur', 'grade', 'sp', 'hak_akses', 'set', 'shift', 'kalender']; 
  
  // Eksekusi Pengecekan Gembok
  if (areaDeveloperOnly.includes(targetRuangan) && myRole !== 'Developer') {
      alert(`⛔ AKSES DITOLAK!\nMenu ini hanya dapat dibuka oleh Developer Utama.`);
      return; // Berhenti di sini, jangan buka halamannya
  }
  if (areaManagerOnly.includes(targetRuangan) && (myRole === 'HR' || myRole === 'Staff')) {
      alert(`⛔ AKSES DITOLAK!\nMenu Kenaikan Grade & SP hanya untuk HR Manager dan Developer.`);
      return;
  }
  if (areaStaffBanned.includes(targetRuangan) && myRole === 'Staff') {
      alert(`⛔ AKSES DITOLAK!\nLevel 'Staff' (Lobi/Sekuriti) hanya diizinkan memantau Kios Lobi dan Live Log Kehadiran.`);
      return;
  }
  // ==========================================


  // Lanjutkan eksekusi jika lolos pengecekan (Akses Diterima)
  document.querySelectorAll('.sub-halaman-hris').forEach(sub => sub.style.display = 'none');
  document.querySelectorAll('.sidebar-link').forEach(link => link.classList.remove('active'));

  const targetElement = document.getElementById('sub-' + targetRuangan);
  if (targetElement) targetElement.style.display = 'block';
  
  const linkElement = document.getElementById('lnk-' + targetRuangan);
  if (linkElement) linkElement.classList.add('active');
  
  document.getElementById('judulHalamanAdmin').innerText = judulHalaman;

  // PENGATUR DATA OTOMATIS SAAT MENU DIKLIK
  if (targetRuangan === 'user') loadDataUser(); 
  else if (targetRuangan === 'set') loadPengaturan(); 
  else if (targetRuangan === 'log') loadLiveLog(); 
  else if (targetRuangan === 'kalender') loadKalender();
  else if (targetRuangan === 'dokumen') loadTabelArsip();
  else if (targetRuangan === 'shift') { muatDropdownShift(); loadTabelShift(); }
  else if (targetRuangan === 'sp') { muatDropdownSP(); loadRiwayatSP(); }
  else if (targetRuangan === 'appv-cuti' || targetRuangan === 'appv-lembur') {loadApprovalHR();}
  else if (targetRuangan === 'grade') { muatDropdownMutasi(); loadRiwayatMutasi(); }
  else if (targetRuangan === 'hak_akses') { loadAdmins(); }
  else if (targetRuangan === 'pengumuman') { muatDropdownBroadcast(); }
}

// ==========================================
// --- KIOS QR (TOTP) & NAVIGASI KIOS ---
// ==========================================
let qrInterval;
let waktuQR = 15;

function bukaAdminMenu(menu) {
  if (menu === 'kiosQR') {
    document.getElementById('dashboardAdmin').style.display = 'none';
    document.getElementById('adminKiosQR').style.display = 'block';
    jalankanKiosQR();
  }
}

function kembaliKeAdmin() {
  if (isModeKioskMurni) return; 
  document.getElementById('adminKiosQR').style.display = 'none';
  document.getElementById('dashboardAdmin').style.display = 'block';
  clearInterval(qrInterval);
  if (document.fullscreenElement) document.exitFullscreen();
}

function jalankanKiosQR() {
  waktuQR = 15;
  document.getElementById('timerQR').innerText = waktuQR;
  updateQRCode(); 
  clearInterval(qrInterval);
  qrInterval = setInterval(() => {
    waktuQR--;
    document.getElementById('timerQR').innerText = waktuQR;
    if (waktuQR <= 0) {
      waktuQR = 15; document.getElementById('timerQR').innerText = waktuQR;
      updateQRCode(); 
    }
  }, 1000);
}

function updateQRCode() {
  const container = document.getElementById('qrContainer');
  container.innerHTML = ""; 
  const timeWindow = Math.floor(Date.now() / 15000); 
  const tokenQR = "AKARSA-TOTP-" + timeWindow; 
  new QRCode(container, {
    text: tokenQR, width: 240, height: 240,
    colorDark : "#ea384d", colorLight : "#ffffff", correctLevel : QRCode.CorrectLevel.H 
  });
}

function toggleFullScreen() {
  const fsIcon = document.getElementById('fullScreenIcon');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => fsIcon.className = "bi bi-fullscreen-exit fs-5 text-dark")
    .catch(err => alert("Error layar penuh: " + err.message));
  } else {
    document.exitFullscreen().then(() => fsIcon.className = "bi bi-fullscreen fs-5 text-dark");
  }
}

// ==========================================
// --- FITUR SCANNER QR KARYAWAN ---
// ==========================================
let html5QrCode;
let jenisAbsenAktif = ""; 
let streamKamera;

async function mulaiScanner(jenis) {
  jenisAbsenAktif = jenis;
  navigator.geolocation.getCurrentPosition(async (pos) => {
    userAktif.lat = pos.coords.latitude; userAktif.lng = pos.coords.longitude;
    document.getElementById('layarScanner').style.display = 'block';
    html5QrCode = new Html5Qrcode("reader");
    const config = { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
    try {
      await html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
        stopScanner(); prosesHasilScan(decodedText, jenisAbsenAktif);
      });
    } catch (err) {
      alert("Kamera diblokir atau tidak ditemukan."); stopScanner();
    }
  }, (err) => { alert("❌ Akses Lokasi Ditolak! Anda wajib mengizinkan GPS untuk absen."); }, { enableHighAccuracy: true, timeout: 10000 });
}

function stopScanner() {
  if (html5QrCode) {
    html5QrCode.stop().then(() => document.getElementById('layarScanner').style.display = 'none')
      .catch(() => document.getElementById('layarScanner').style.display = 'none');
  } else document.getElementById('layarScanner').style.display = 'none';
}

async function prosesHasilScan(dataQR, jenis) {
  if (!dataQR.includes("AKARSA-TOTP-")) { alert("❌ QR Code tidak valid atau bukan berasal dari Kios Akarsa Resmi."); return; }
  const payload = { action: "save_attendance", nik: userAktif.nik, nama: userAktif.nama, type: jenis, metode: "QR", tokenQR: dataQR, lat: userAktif.lat, lng: userAktif.lng, keterangan: "Scan Kios Pabrik" };
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    const res = await response.json();
    if (res.status === "SUKSES") alert("✅ BERHASIL!\n" + res.pesan); else alert("⚠️ GAGAL:\n" + res.pesan);
  } catch (error) { alert("Terjadi kesalahan koneksi saat mengirim data absen."); }
}

// ==========================================
// --- FITUR DINAS LUAR (FOTO SELFIE + GPS) ---
// ==========================================
async function absenDinasLuar(jenis) {
  if (!navigator.geolocation) { alert("Maaf, HP Anda tidak mendukung fitur GPS."); return; }
  jenisAbsenAktif = jenis; document.getElementById('layarSelfie').style.display = 'block';
  const video = document.getElementById('videoSelfie');
  try {
    streamKamera = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
    video.srcObject = streamKamera;
  } catch (err) { alert("Gagal mengakses kamera depan."); tutupSelfie(); }
}

async function ambilFoto() {
  const canvas = document.getElementById('canvasSelfie'); const video = document.getElementById('videoSelfie');
  canvas.width = video.videoWidth; canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const fotoBase64 = canvas.toDataURL('image/jpeg', 0.6); 
  tutupSelfie();
  alert("📍 Mengunci Lokasi & Mengirim Data...\nMohon tunggu...");
  navigator.geolocation.getCurrentPosition((pos) => {
    kirimAbsenKeServer(jenisAbsenAktif, "GPS", fotoBase64, pos.coords.latitude, pos.coords.longitude);
  }, (err) => { alert("❌ Gagal mendapatkan lokasi GPS. Pastikan GPS aktif."); }, { enableHighAccuracy: true, timeout: 15000 });
}

function tutupSelfie() {
  if (streamKamera) streamKamera.getTracks().forEach(t => t.stop());
  document.getElementById('layarSelfie').style.display = 'none';
}

async function kirimAbsenKeServer(jenis, metode, foto, lat, lng) {
  const payload = { action: "save_attendance", nik: userAktif.nik, nama: userAktif.nama, type: jenis, metode: metode, foto: foto, lat: lat, lng: lng };
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    const res = await response.json();
    if (res.status === "SUKSES") alert("✅ BERHASIL!\n" + res.pesan); else alert("⚠️ GAGAL:\n" + res.pesan);
  } catch (error) { alert("❌ Terjadi kesalahan koneksi ke server."); }
}

// ==========================================
// --- ADMIN SUB-MODULE: LIVE LOG & USER ---
// ==========================================
async function loadLiveLog() {
  // Ubah Header Tabel secara dinamis agar sesuai format gabungan
  const thead = document.querySelector('#sub-log thead tr');
  if(thead) thead.innerHTML = '<th>NAMA KARYAWAN</th><th>JAM MASUK</th><th>JAM KELUAR</th><th>STATUS</th><th>BUKTI & METODE</th>';

  const tabel = document.getElementById('tabelLiveLog');
  tabel.innerHTML = '<tr><td colspan="5" class="text-center text-primary py-3"><div class="spinner-border spinner-border-sm me-2"></div>Menarik data...</td></tr>';
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_live_log" }) });
    const res = await response.json();
    if (res.status === "SUKSES") {
      tabel.innerHTML = "";
      if (res.data.length === 0) { tabel.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Belum ada aktivitas presensi hari ini.</td></tr>'; return; }
      
      res.data.forEach(item => {
        let badgeStyle = "bg-success-subtle text-success border-success";
        if (item.status === "Dinas Luar") badgeStyle = "bg-primary-subtle text-primary border-primary";
        if (item.status.includes("Izin") || item.status.includes("Sakit") || item.status.includes("Cuti")) badgeStyle = "bg-info-subtle text-info border-info";
        if (item.status === "Terlambat") badgeStyle = "bg-warning-subtle text-warning border-warning";
        
        const getIcon = (metode) => {
           if(metode === "QR") return '<i class="bi bi-qr-code text-secondary fs-6" title="QR Kios"></i>';
           if(metode === "GPS") return '<i class="bi bi-geo-alt-fill text-primary fs-6" title="GPS"></i>';
           if(metode === "System HR") return '<i class="bi bi-robot text-info fs-6" title="Sistem HR"></i>';
           return "-";
        };

        const btnFotoM = (item.fotoMasuk && item.fotoMasuk !== "-") ? `<a href="${item.fotoMasuk}" target="_blank" class="btn btn-xs btn-outline-success ms-1 py-0 px-1 shadow-sm"><i class="bi bi-image"></i></a>` : "";
        const btnFotoK = (item.fotoKeluar && item.fotoKeluar !== "-") ? `<a href="${item.fotoKeluar}" target="_blank" class="btn btn-xs btn-outline-danger ms-1 py-0 px-1 shadow-sm"><i class="bi bi-image"></i></a>` : "";

        tabel.innerHTML += `
          <tr>
            <td>
              <div class="fw-bold text-dark">${item.nama}</div>
              <div class="text-muted" style="font-size: 10.5px;">${item.nik}</div>
            </td>
            <td class="fw-bold text-success" style="font-size: 14px;">${item.jamMasuk}</td>
            <td class="fw-bold text-danger" style="font-size: 14px;">${item.jamKeluar}</td>
            <td><span class="badge ${badgeStyle} border" style="font-size:11px;">${item.status}</span></td>
            <td>
              <div style="font-size:10.5px;" class="mb-1"><span class="text-muted">In:</span> ${getIcon(item.metodeMasuk)} ${btnFotoM}</div>
              <div style="font-size:10.5px;"><span class="text-muted">Out:</span> ${getIcon(item.metodeKeluar)} ${btnFotoK}</div>
            </td>
          </tr>
        `;
      });
    } else tabel.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Gagal: ${res.pesan}</td></tr>`;
  } catch (error) { tabel.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Gagal memuat log data server.</td></tr>`; }
}

function sesuaikanFormUser() {
  const jenis = document.getElementById('formJenisAkun').value;
  if (jenis === 'KARYAWAN') {
    document.getElementById('labelIdUser').innerText = "NIK Karyawan";
    document.getElementById('fieldKaryawan').style.display = 'block'; 
    document.getElementById('fieldAdmin').style.display = 'none';
  } else {
    document.getElementById('labelIdUser').innerText = "ID Sistem (Cth: Admin-02)";
    document.getElementById('fieldKaryawan').style.display = 'none'; 
    document.getElementById('fieldAdmin').style.display = 'block';
  }
}

// ----------------------------------------------------
// FUNGSI GABUNGAN: TAMBAH (GENERATOR NIK) & EDIT USER
// ----------------------------------------------------
let modalUserElement;
async function bukaModalUser(mode, jenis = 'KARYAWAN', id = '', nama = '', jabatanAtauRole = '', status = 'Aktif') {
  if (!modalUserElement) modalUserElement = new bootstrap.Modal(document.getElementById('modalFormUser'));
  const formIdUser = document.getElementById('formIdUser'); 
  
  document.getElementById('formUser').reset();
  
  if (mode === 'baru') {
    document.getElementById('modalUserTitle').innerText = 'Tambah User Baru';
    document.getElementById('formJenisAkun').disabled = false;
    document.getElementById('formJenisAkun').value = "KARYAWAN";
    
    if(typeof sesuaikanFormUser === 'function') sesuaikanFormUser(); 
    
    // Kunci kolom NIK dengan animasi loading
    formIdUser.disabled = true;
    formIdUser.value = "Men-generate NIK...";
    modalUserElement.show(); 
    
    try {
      const response = await fetch(API_URL, {
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "get_next_nik" })
      });
      const res = await response.json();
      
      if (res.status === "SUKSES") {
        formIdUser.value = res.nik_baru;
        formIdUser.readOnly = true; 
        formIdUser.disabled = false;
      } else {
        formIdUser.value = "";
        formIdUser.readOnly = false;
        formIdUser.disabled = false;
        alert("Gagal: " + res.pesan);
      }
    } catch(e) {
      formIdUser.value = "";
      formIdUser.readOnly = false;
      formIdUser.disabled = false;
      alert("Koneksi gagal saat meminta NIK otomatis!");
    }
  } else if (mode === 'edit') {
    document.getElementById('modalUserTitle').innerText = "Edit Data User";
    formIdUser.readOnly = true; 
    document.getElementById('formJenisAkun').disabled = true; 
    document.getElementById('formJenisAkun').value = jenis; 
    formIdUser.value = id; 
    document.getElementById('formNamaUser').value = nama; 
    document.getElementById('formStatusUser').value = status;
    
    if(jenis === 'KARYAWAN') {
       const jabInput = document.getElementById('formJabatan');
       if(jabInput) jabInput.value = jabatanAtauRole;
    } else {
       const roleInput = document.getElementById('formRoleSistem');
       if(roleInput) roleInput.value = jabatanAtauRole;
    }
    
    if(typeof sesuaikanFormUser === 'function') sesuaikanFormUser();
    modalUserElement.show();
  }
}

// ----------------------------------------------------
// FUNGSI TARIK TABEL DENGAN DETEKTOR BERKAS
// ----------------------------------------------------
async function loadDataUser() {
  const tabelKaryawan = document.getElementById('tabelKaryawan');
  const tabelAdmin = document.getElementById('tabelAdmin');

  if(!tabelKaryawan) return; 

  tabelKaryawan.innerHTML = '<tr><td colspan="5" class="text-center text-primary py-3"><div class="spinner-border spinner-border-sm me-2"></div>Memuat data...</td></tr>';
  if(tabelAdmin) tabelAdmin.innerHTML = '<tr><td colspan="4" class="text-center text-primary py-3"><div class="spinner-border spinner-border-sm me-2"></div>Memuat data...</td></tr>';

  try {
    const response = await fetch(API_URL, { 
        method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, 
        body: JSON.stringify({ action: "get_users" }) 
    });
    const res = await response.json();

    if (res.status === "SUKSES") {
      // 1. Render Tabel Karyawan
      tabelKaryawan.innerHTML = "";
      if (res.karyawan.length === 0) {
         tabelKaryawan.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-3">Belum ada data pegawai.</td></tr>';
      } else {
         res.karyawan.forEach(k => {
           // Fitur Badge Cerdas
           let badgeBerkas = k.isLengkap ? '<span class="badge bg-success" style="font-size:10px;">Berkas Lengkap</span>' : '<span class="badge bg-warning text-dark" style="font-size:10px;">Belum Lengkap</span>';
           let badgeStatus = (k.status === "Aktif") ? '<span class="badge bg-primary" style="font-size:10px;">Aktif</span>' : `<span class="badge bg-danger" style="font-size:10px;">${k.status}</span>`;

           tabelKaryawan.innerHTML += `<tr>
             <td class="fw-bold">${k.nama} <br><span class="text-muted fw-normal" style="font-size:10.5px;">${k.nik}</span></td>
             <td>${k.jabatan || '-'} <br>${badgeBerkas}</td>
             <td style="font-size:11.5px;">${k.role || '-'}</td>
             <td>${badgeStatus}</td>
             <td>
               <button class="btn btn-sm btn-outline-primary shadow-sm py-1 px-2" style="font-size:11px;" onclick="bukaModalEditProfilLengkap('${k.nik}', this)"><i class="bi bi-pencil-square"></i> Lengkapi Profil</button>
               <button class="btn btn-sm btn-outline-secondary shadow-sm py-1 px-2" style="font-size:11px;" title="Reset PIN" onclick="resetPinKaryawan('${k.nik}', '${k.nama}')"><i class="bi bi-key"></i></button>
               <button class="btn btn-sm btn-outline-danger shadow-sm py-1 px-2" style="font-size:11px;" title="Proses Offboarding/Resign" onclick="bukaModalResign('${k.nik}', '${k.nama}')"><i class="bi bi-door-open-fill"></i></button>
             </td>
           </tr>`;
         });
      }

      // 2. Render Tabel Admin Sistem
      if(tabelAdmin) {
          tabelAdmin.innerHTML = "";
          res.sistem.forEach(s => {
            let badgeStatus = (s.status === "Aktif") ? '<span class="badge bg-primary" style="font-size:10px;">Aktif</span>' : `<span class="badge bg-danger" style="font-size:10px;">${s.status}</span>`;
            tabelAdmin.innerHTML += `<tr>
              <td class="fw-bold">${s.nama} <br><span class="text-muted fw-normal" style="font-size:10.5px;">${s.id}</span></td>
              <td style="font-size:11.5px;">${s.role}</td>
              <td>${badgeStatus}</td>
              <td><button class="btn btn-xs btn-light text-primary border py-1 px-2" style="font-size:11px;" onclick="bukaModalUser('edit', 'SISTEM', '${s.id}', '${s.nama}', '${s.role}', '${s.status}')"><i class="bi bi-pencil-square"></i> Edit</button></td>
            </tr>`;
          });
      }
    } else {
       tabelKaryawan.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-2">Gagal memuat data dari server.</td></tr>`;
    }
  } catch (error) {
     tabelKaryawan.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-2">Error jaringan atau belum Deploy Kode.gs terbaru.</td></tr>`;
  }
}

async function simpanDataUser() {
  const jenis = document.getElementById('formJenisAkun').value;
  const idUser = document.getElementById('formIdUser').value.trim();
  const nama = document.getElementById('formNamaUser').value.trim();
  const pin = document.getElementById('formPinUser').value.trim();
  const status = document.getElementById('formStatusUser').value;
  
  const departemenElement = document.getElementById('formDepartemen');
  const departemen = departemenElement ? departemenElement.value.trim() : "";
  const jabatanElement = document.getElementById('formJabatan');
  const jabatan = jabatanElement ? jabatanElement.value.trim() : "";
  const roleKaryawanElement = document.getElementById('formRoleKaryawan');
  const roleKaryawan = roleKaryawanElement ? roleKaryawanElement.value : "Karyawan";
  
  const roleSistem = document.getElementById('formRoleSistem') ? document.getElementById('formRoleSistem').value : "";

  if (!idUser || !nama) return alert("NIK dan Nama wajib diisi!");
  if (jenis === "KARYAWAN" && (!departemen || !jabatan)) return alert("Departemen dan Jabatan wajib diisi untuk Bank Data Karyawan!");

  const payload = {
    action: "save_user", jenis: jenis, idUser: idUser, nama: nama, pin: pin, status: status,
    departemen: departemen, jabatan: jabatan, roleKaryawan: roleKaryawan, roleSistem: roleSistem
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      alert("✅ " + res.pesan);
      bootstrap.Modal.getInstance(document.getElementById('modalFormUser')).hide();
      loadDataUser(); // Langsung reload tabel agar data baru muncul
    } else {
      alert("❌ Gagal: " + res.pesan);
    }
  } catch(e) {
    alert("❌ Koneksi gagal saat menyimpan data!");
  }
}

// Fitur Pencarian Data User
document.getElementById('cariUser').addEventListener('keyup', function() {
  let keyword = this.value.toLowerCase();
  document.querySelectorAll('#tabelKaryawan tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(keyword) ? '' : 'none'; });
  document.querySelectorAll('#tabelAdmin tr').forEach(row => { row.style.display = row.innerText.toLowerCase().includes(keyword) ? '' : 'none'; });
});

// ==========================================
// --- DASHBOARD ADMIN: PENGATURAN GPS ---
// ==========================================
async function loadPengaturan() {
  const btn = document.getElementById('btnSimpanPengaturan'); btn.disabled = true;
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_settings" }) });
    const res = await response.json();
    if (res.status === "SUKSES") {
      document.getElementById('inputLat').value = res.lat; document.getElementById('inputLng').value = res.lng; document.getElementById('inputRadius').value = res.radius;
    }
  } catch (error) { console.log("Gagal memuat GPS"); } finally { btn.disabled = false; }
}

async function simpanPengaturan() {
  const btn = document.getElementById('btnSimpanPengaturan'); btn.innerHTML = 'Menyimpan...'; btn.disabled = true;
  const payload = { action: "save_settings", lat: document.getElementById('inputLat').value, lng: document.getElementById('inputLng').value, radius: document.getElementById('inputRadius').value };
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    const res = await response.json();
    if (res.status === "SUKSES") alert("✅ " + res.pesan); else alert("❌ GAGAL: " + res.pesan);
  } catch (error) { alert("Koneksi internet bermasalah."); } finally { btn.innerHTML = '<i class="bi bi-save me-2"></i>SIMPAN PARAMETER'; btn.disabled = false; }
}

// ==========================================
// --- INTERAKSI KARYAWAN FRONTEND ---
// ==========================================
function bukaSubMenu(menuId) {
  document.getElementById('dashboardKaryawan').style.display = 'none';
  if (menuId === 'presensi') { document.getElementById('subMenuPresensi').style.display = 'block'; } 
  else if (menuId === 'profil') {
    
    // ===================================================
    // 🌟 HELPER MULTI-FUNGSI: FORMAT TANGGAL INDONESIA
    // ===================================================
    const formatTanggalIndo = (dateStr) => {
      if (!dateStr || dateStr === "-" || dateStr === "") return "-";
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr; // Jika bukan format date, biarkan teks asli
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    };

    // ===================================================
    // ⏳ HITUNG OTOMATIS LAMA BEKERJA (MASA KERJA) VIA GPS/SISTEM
    // ===================================================
    let teksMasaKerja = "-";
    if (userAktif.masaKerja && userAktif.masaKerja !== "-") {
      const tglMasuk = new Date(userAktif.masaKerja);
      if (!isNaN(tglMasuk.getTime())) {
        const hariIni = new Date();
        let tahun = hariIni.getFullYear() - tglMasuk.getFullYear();
        let bulan = hariIni.getMonth() - tglMasuk.getMonth();
        let hari = hariIni.getDate() - tglMasuk.getDate();
        
        if (hari < 0) {
          bulan--;
          const bulanLalu = new Date(hariIni.getFullYear(), hariIni.getMonth(), 0);
          hari += bulanLalu.getDate();
        }
        if (bulan < 0) {
          tahun--;
          bulan += 12;
        }
        
        let arrMasa = [];
        if (tahun > 0) arrMasa.push(tahun + " Tahun");
        if (bulan > 0) arrMasa.push(bulan + " Bulan");
        if (hari > 0) arrMasa.push(hari + " Hari");
        teksMasaKerja = arrMasa.join(", ") || "0 Hari";
      } else {
        teksMasaKerja = userAktif.masaKerja; // Fallback jika format teks biasa
      }
    }

    // ===================================================
    // 🖨️ SUNTIK DATA PROFIL KARYAWAN (UI MODERN BARU)
    // ===================================================
    document.getElementById('profNama').innerText = userAktif.nama; 
    document.getElementById('profNik').innerText = "NIK: " + userAktif.nik; 
    document.getElementById('profStatusAktif').innerText = userAktif.statusAktif || "Aktif"; 
    
    // Header & Kepegawaian
    document.getElementById('profDivisi').innerText = userAktif.divisi || userAktif.dept || "-"; 
    document.getElementById('profJabatanGrade').innerText = (userAktif.jabatan || "-") + " (" + (userAktif.grade || "-") + ")"; 
    document.getElementById('profStatusKaryawan').innerText = userAktif.statusKaryawan || "-"; 
    document.getElementById('profMasaKerja').innerText = teksMasaKerja; // Hanya masukkan teks "1 Tahun 2 Bulan"
    document.getElementById('profKontrak').innerText = formatTanggalIndo(userAktif.tglKontrak || userAktif.tglKontrakAkhir); 
    
    // Data Pribadi
    document.getElementById('profNikKtp').innerText = userAktif.nikKtp || "-"; 
    document.getElementById('profTtl').innerText = (userAktif.tempatLahir || "-") + ", " + formatTanggalIndo(userAktif.tglLahir); 
    document.getElementById('profKelamin').innerText = userAktif.kelamin || "-"; 
    document.getElementById('profAgamaNikah').innerText = (userAktif.agama || "-") + " | " + (userAktif.statusNikah || "-"); 
    document.getElementById('profAlamat').innerText = userAktif.alamat || "-"; 
    
    // Kontak & Darurat
    document.getElementById('profHp').innerText = userAktif.noHp || "-"; 
    document.getElementById('profEmail').innerText = userAktif.email || "-"; 
    document.getElementById('profKontakDarurat').innerText = (userAktif.kontakDarurat || "-") + " (" + (userAktif.hubDarurat || "-") + ") - " + (userAktif.noDarurat || "-"); 
    
    // Finansial & Dokumen
    document.getElementById('profCuti').innerText = (userAktif.sisaCuti || 0) + " Hari"; 
    document.getElementById('profRekening').innerText = (userAktif.namaBank || "Bank") + " - " + (userAktif.rekening || userAktif.noRekening || "-"); 
    document.getElementById('profBpjs').innerText = "Kes: " + (userAktif.bpjsKes || "-") + " | TK: " + (userAktif.bpjsTk || "-"); 
    document.getElementById('profNpwp').innerText = "NPWP: " + (userAktif.npwp || "-");
    
    // Siapkan Tombol Berkas Dokumen
    const siapkanTombol = (idTombol, url) => { const btn = document.getElementById(idTombol); if (url && url.length > 5) { btn.href = url; btn.classList.remove('disabled'); } else { btn.removeAttribute('href'); btn.classList.add('disabled'); } };
    siapkanTombol('btnCv', userAktif.urlCv); siapkanTombol('btnKtp', userAktif.urlKtp); siapkanTombol('btnKk', userAktif.urlKk);
    
    // 📸 Render Foto Profil Pintar (Bypass Limitasi Google Drive)
    let urlFotoTampil = "https://ui-avatars.com/api/?name=" + encodeURIComponent(userAktif.nama) + "&background=0d6efd&color=fff&size=200&bold=true"; 
    const linkMentah = userAktif.fotoProfil;
    
    if (linkMentah && linkMentah.includes("drive.google.com")) { 
        const regexDriveId = /[-\w]{25,}(?!.*[-\w]{25,})/; 
        const match = linkMentah.match(regexDriveId); 
        if (match) {
            // Tweak: Menggunakan endpoint /thumbnail lebih stabil untuk di-embed di HTML
            urlFotoTampil = "https://drive.google.com/thumbnail?id=" + match[0] + "&sz=w500"; 
        }
    } else if (linkMentah && linkMentah.length > 10) { 
        urlFotoTampil = linkMentah; 
    }
    
    const imgElement = document.getElementById('profImg'); 
    imgElement.src = urlFotoTampil;
    imgElement.onerror = function() { 
        // Fallback jika akses foto ditolak oleh Google
        this.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(userAktif.nama) + "&background=f8f9fa&color=0d6efd&size=200&bold=true"; 
    };

    // ===================================================
    // 🛑 LOGIKA BANNER CERDAS (SP & RESIGN COUNTDOWN)
    // ===================================================
    const alertBox = document.getElementById('alertNotifikasi'); 
    alertBox.style.setProperty('display', 'none', 'important'); 
    
    // 1. Deteksi Prioritas 1: Apakah dalam masa Notice Period / Resign?
    if ((userAktif.statusResign && userAktif.statusResign !== "-") || (userAktif.tglEfektifResign && userAktif.tglEfektifResign !== "-")) { 
        let sisaHariTeks = "";
        
        if (userAktif.tglEfektifResign && userAktif.tglEfektifResign !== "-") {
          const tglAkhirResign = new Date(userAktif.tglEfektifResign);
          const hariIni = new Date();
          const selisihWaktu = tglAkhirResign.getTime() - hariIni.getTime();
          const sisaHari = Math.ceil(selisihWaktu / (1000 * 3600 * 24));
          sisaHariTeks = ` (Sisa ${sisaHari} Hari Kerja)`;
        }
        
        document.getElementById('judulNotif').innerText = "Masa Transisi (Resign)"; 
        document.getElementById('isiNotif').innerHTML = `Status: <strong>Notice Period${sisaHariTeks}</strong>`; 
        document.getElementById('detailNotif').innerText = "Tanggal Efektif Berhenti: " + formatTanggalIndo(userAktif.tglEfektifResign); 
        alertBox.className = "alert alert-warning d-flex align-items-start mb-3 shadow-sm rounded-4 text-dark border border-warning"; 
        alertBox.style.setProperty('display', 'flex', 'important'); 
        
    // 2. Deteksi Prioritas 2: Apakah memiliki SP Aktif?
    } else if (userAktif.statusSP && userAktif.statusSP !== "-" && userAktif.statusSP !== "") { 
        document.getElementById('judulNotif').innerText = "Peringatan Kedisiplinan"; 
        document.getElementById('isiNotif').innerHTML = `Status Akun: <strong class="text-white">${userAktif.statusSP}</strong>`; 
        document.getElementById('detailNotif').innerText = "Masa Berlaku s/d: " + formatTanggalIndo(userAktif.tglAkhirSp); 
        alertBox.className = "alert alert-danger d-flex align-items-start mb-3 shadow-sm rounded-4 text-white"; 
        alertBox.style.setProperty('display', 'flex', 'important'); 
    }
    
    document.getElementById('subMenuProfil').style.display = 'block';
  } else if (menuId === 'pengajuan') { document.getElementById('subMenuPengajuan').style.display = 'block'; }
}

function kembaliKeDashboard() {
  document.getElementById('subMenuPresensi').style.display = 'none'; document.getElementById('subMenuProfil').style.display = 'none'; document.getElementById('subMenuPengajuan').style.display = 'none'; document.getElementById('dashboardKaryawan').style.display = 'block';
}

function sesuaikanFormPengajuan() {
  const jenis = document.getElementById('jenisPengajuan').value;
  document.getElementById('fieldSesi').style.display = 'none'; document.getElementById('fieldJamLembur').style.display = 'none'; document.getElementById('fieldLampiran').style.display = 'none'; document.getElementById('fieldTglSelesai').style.display = 'block';
  if (jenis === 'Izin 1/2 Hari') { document.getElementById('fieldSesi').style.display = 'block'; document.getElementById('fieldTglSelesai').style.display = 'none'; } else if (jenis === 'Lembur') { document.getElementById('fieldJamLembur').style.display = 'block'; document.getElementById('fieldTglSelesai').style.display = 'none'; document.getElementById('fieldLampiran').style.display = 'block'; document.getElementById('labelLampiran').innerText = "Lampiran Bukti SPL"; } else if (jenis === 'Sakit' || jenis === 'Dinas Luar') { document.getElementById('fieldLampiran').style.display = 'block'; document.getElementById('labelLampiran').innerText = "Lampiran Dokumen"; }
}

function prosesFileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

async function kirimPengajuan() {
  const jenis = document.getElementById('jenisPengajuan').value; const tglMulai = document.getElementById('tglMulai').value; const tglSelesai = document.getElementById('tglSelesai').value; const alasan = document.getElementById('alasanPengajuan').value;
  if (!jenis || !tglMulai || !alasan) { alert("Harap lengkapi formulir."); return; }
  const btn = document.getElementById('btnKirimPengajuan'); btn.disabled = true;
  let sesiAtauJam = "-"; if (jenis === 'Izin 1/2 Hari') sesiAtauJam = document.getElementById('inputSesi').value; if (jenis === 'Lembur') sesiAtauJam = document.getElementById('inputJamLembur').value + " Jam";
  let fotoBase64 = null;
  if (jenis === 'Sakit' || jenis === 'Dinas Luar' || jenis === 'Lembur') {
    const fileInput = document.getElementById('inputLampiran');
    if (fileInput.files.length === 0) { alert("⚠️ Wajib melampirkan file foto bukti!"); btn.disabled = false; return; }
    fotoBase64 = await prosesFileBase64(fileInput.files[0]);
  }
  const payload = { 
    action: "save_pengajuan", 
    nik: userAktif.nik, 
    nama: userAktif.nama, 
    tipe: jenis, // <-- Ganti 'jenis: jenis' menjadi 'tipe: jenis'
    tglMulai: tglMulai, 
    tglSelesai: (jenis === 'Izin 1/2 Hari' || jenis === 'Lembur') ? tglMulai : tglSelesai, 
    sesiAtauJam: sesiAtauJam, 
    alasan: alasan, 
    foto: fotoBase64 
  };
  
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    const res = await response.json();
    
    // Perbaiki alert error agar menampilkan alasan spesifik dari server
    if (res.status === "SUKSES") { 
      alert("✅ " + res.pesan); 
      document.getElementById('formPengajuan').reset(); 
      sesuaikanFormPengajuan(); 
    } else {
      alert("❌ Gagal: " + res.pesan); // <-- Tambahkan + res.pesan di sini
    }
  } catch (error) { 
    alert("❌ Koneksi gagal saat mengirim pengajuan."); 
  } finally { 
    btn.disabled = false; 
  }
}

// ==========================================
// --- PENGATUR JEBAKAN ROUTER ---
// ==========================================
function aturLaluLintasTampilan() {
  const urlParams = new URLSearchParams(window.location.search); const view = urlParams.get('v');
  document.getElementById('loginSection').style.display = 'none'; document.getElementById('dashboardKaryawan').style.display = 'none'; document.getElementById('dashboardAdmin').style.display = 'none'; document.getElementById('adminKiosQR').style.display = 'none';
  if (view === 'kiosk') {
    isModeKioskMurni = true; document.getElementById('adminKiosQR').style.display = 'block'; document.getElementById('kiosHeader').style.display = 'none'; document.body.style.backgroundColor = "#ffffff"; jalankanKiosQR(); 
  } else if (view === 'admin') {
    isModeKioskMurni = false; document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('loginSection').style.background = "linear-gradient(45deg, #1e293b, #0f172a, #1e293b, #020617)"; document.querySelector('.glass-card').style.background = "rgba(255, 255, 255, 0.85)"; document.querySelector('.app-name').innerText = "Portal Admin HRD"; document.querySelector('.logo-icon').style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8)"; document.querySelector('.logo-icon').style.webkitBackgroundClip = "text"; document.querySelector('.btn-login').style.background = "linear-gradient(135deg, #3b82f6, #1d4ed8)"; document.querySelectorAll('.form-label')[0].innerText = "ID Admin Sistem"; document.getElementById('nik').placeholder = "Ketik ID Admin Anda...";
  } else {
    isModeKioskMurni = false; document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('loginSection').style.background = "linear-gradient(45deg, #ffecd2, #fcb69f, #ffecd2, #fff1eb)"; document.querySelector('.glass-card').style.background = "rgba(255, 255, 255, 0.4)"; document.querySelector('.app-name').innerText = "Akarsa Employee"; document.querySelector('.logo-icon').style.background = "linear-gradient(135deg, #ff416c, #ff4b2b)"; document.querySelector('.logo-icon').style.webkitBackgroundClip = "text"; document.querySelector('.btn-login').style.background = "linear-gradient(135deg, #ff416c, #ff4b2b)"; document.querySelectorAll('.form-label')[0].innerText = "ID/NIK Karyawan"; document.getElementById('nik').placeholder = "Ketik NIK Anda...";
  }
}
window.addEventListener('DOMContentLoaded', aturLaluLintasTampilan);

// ===================================================
// 📅 MODUL KALENDER KHUSUS (ADMIN)
// ===================================================
async function loadKalender() {
  const tbody = document.querySelector('#sub-kalender tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-primary"><span class="spinner-border spinner-border-sm me-2"></span> Memuat daftar kebijakan...</td></tr>';
  
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_kalender" })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      tbody.innerHTML = "";
      if (res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Belum ada kebijakan khusus.</td></tr>';
        return;
      }
      
      res.data.forEach(item => {
        const tglBagus = new Date(item.tgl).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const warnaBadge = (item.status === "Libur Ekstra") ? "bg-danger" : "bg-primary";
        
        tbody.innerHTML += `
          <tr>
            <td class="fw-bold">${tglBagus}</td>
            <td><span class="badge ${warnaBadge}">${item.status}</span></td>
            <td class="text-muted" style="font-size: 11px;">${item.ket}</td>
            <td><button class="btn btn-sm btn-outline-danger py-0 px-2" style="font-size:10px;" onclick="alert('Fitur hapus menyusul')"><i class="bi bi-trash"></i></button></td>
          </tr>
        `;
      });
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-danger">Gagal terhubung ke server.</td></tr>';
  }
}

async function simpanKalender() {
  const inputs = document.querySelectorAll('#sub-kalender input, #sub-kalender select, #sub-kalender textarea');
  const tgl = inputs[0].value;
  const status = inputs[1].value;
  const ket = inputs[2].value;
  
  if (!tgl || !status || !ket) return alert("⚠️ Mohon isi Lengkap Tanggal, Status, dan Keterangannya!");
  
  const btn = document.querySelector('#sub-kalender button');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...';
  btn.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "save_kalender", tanggal: tgl, statusHari: status, keterangan: ket })
    });
    const res = await response.json();
    alert("✅ " + res.pesan);
    
    inputs[0].value = ""; inputs[2].value = "";
    loadKalender();
  } catch (error) {
    alert("❌ Terjadi kesalahan: " + error.message);
  }
  
  btn.innerHTML = '<i class="bi bi-save me-2"></i>SIMPAN KEBIJAKAN';
  btn.disabled = false;
}

// ===================================================
// ♟️ MODUL MANAJEMEN SHIFT ROSTER (ADMIN)
// ===================================================
let dataKaryawanGlobal = []; 

async function muatDropdownShift() {
  const inputEl = document.getElementById('inputCariKaryawan');
  inputEl.disabled = true;
  inputEl.placeholder = "⏳ Mengunduh data...";
  
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_users" })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      dataKaryawanGlobal = res.karyawan; 
      inputEl.disabled = false;
      inputEl.placeholder = "🔍 Ketik NIK atau Nama...";
    } else {
      inputEl.placeholder = "❌ Gagal: " + res.pesan;
    }
  } catch (e) {
    inputEl.placeholder = "❌ Gagal memuat data!";
  }
}

document.getElementById('inputCariKaryawan').addEventListener('input', function() {
  const val = this.value.toLowerCase();
  const listDiv = document.getElementById('listKaryawanShift');
  listDiv.innerHTML = '';
  
  if (!val) {
    listDiv.style.display = 'none';
    return;
  }
  
  const filtered = dataKaryawanGlobal.filter(k => 
    (k.nik && k.nik.toString().toLowerCase().includes(val)) || 
    (k.nama && k.nama.toLowerCase().includes(val))
  );
  
  if (filtered.length > 0) {
    listDiv.style.display = 'block';
    filtered.forEach(k => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'list-group-item list-group-item-action py-1 px-2 border-bottom';
      item.style.fontSize = '12px';
      item.textContent = `${k.nik} - ${k.nama}`;
      
      item.onclick = function() {
        document.getElementById('inputCariKaryawan').value = this.textContent;
        listDiv.style.display = 'none';
      };
      listDiv.appendChild(item);
    });
  } else {
    listDiv.style.display = 'none';
  }
});

document.addEventListener('click', function(e) {
  if(e.target.id !== 'inputCariKaryawan') {
    const listDiv = document.getElementById('listKaryawanShift');
    if(listDiv) listDiv.style.display = 'none';
  }
});

async function loadTabelShift() {
  const tbody = document.getElementById('tabelPapanCatur');
  tbody.innerHTML = '<tr><td colspan="32" class="text-center py-3 text-primary"><span class="spinner-border spinner-border-sm me-2"></span> Memuat papan catur...</td></tr>';
  
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_shift" })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      tbody.innerHTML = "";
      if (res.data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="32" class="text-center py-3 text-muted">Belum ada data shift. Silakan terapkan jadwal di atas.</td></tr>';
        return;
      }
      
      res.data.forEach(item => {
        let rowHTML = `<tr><td class="text-start ps-2 fw-bold bg-white" style="min-width: 150px; position: sticky; left: 0; z-index: 1; border-right: 2px solid #dee2e6;">${item.nama} <br><small class="text-muted fw-normal">${item.nik}</small></td>`;
        
        for(let i=0; i<31; i++) {
          let shift = item.jadwal[i] || "";
          let bgClass = "bg-light text-muted";
          let display = "-";
          
          let shiftBersih = shift.toString().toUpperCase().trim();
          if (shiftBersih === "P") { bgClass = "bg-warning-subtle fw-bold text-dark"; display = "P"; }
          else if (shiftBersih === "M") { bgClass = "bg-primary-subtle fw-bold text-primary"; display = "M"; }
          else if (shiftBersih === "L") { bgClass = "bg-danger-subtle fw-bold text-danger"; display = "L"; }
          
          rowHTML += `<td class="${bgClass}">${display}</td>`;
        }
        rowHTML += `</tr>`;
        tbody.innerHTML += rowHTML;
      });
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="32" class="text-center py-3 text-danger">Gagal memuat data shift.</td></tr>';
  }
}

async function terapkanShift() {
  const inputValue = document.getElementById('inputCariKaryawan').value;
  const tglMulai = document.getElementById('tglMulaiShift').value;
  const tglSelesai = document.getElementById('tglSelesaiShift').value;
  const kodeShift = document.getElementById('pilihKodeShift').value;
  
  if (!inputValue || !tglMulai || !tglSelesai) return alert("⚠️ Harap lengkapi Karyawan dan rentang tanggalnya!");
  if (new Date(tglMulai) > new Date(tglSelesai)) return alert("⚠️ Tanggal Akhir tidak boleh mendahului Tanggal Mulai!");

  if (!inputValue.includes("-")) {
    return alert("❌ ERROR: Harap pilih karyawan dari daftar yang muncul! (Format harus NIK - Nama)");
  }

  const nikPisah = inputValue.split("-")[0].trim();
  const namaPisah = inputValue.split("-")[1].trim();

  const btn = document.getElementById('btnTerapkanShift');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';
  btn.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "save_shift", nik: nikPisah, nama: namaPisah, tglMulai: tglMulai, tglSelesai: tglSelesai, kodeShift: kodeShift })
    });
    const res = await response.json();
    alert("✅ " + res.pesan);
    
    document.getElementById('inputCariKaryawan').value = "";
    loadTabelShift(); 
  } catch (error) {
    alert("❌ Terjadi kesalahan: " + error.message);
  }
  
  btn.innerHTML = '<i class="bi bi-check-circle"></i> Terapkan';
  btn.disabled = false;
}

// ===================================================
// 📊 MODUL REKAP LAPORAN (HARIAN, MINGGUAN, BULANAN)
// ===================================================

function eksporExcel(tableId, namaFile) {
  let table = document.getElementById(tableId);
  if (!table) return;
  
  let csv = [];
  let rows = table.querySelectorAll("tr");
  
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].innerText.includes("Menarik data") || rows[i].innerText.includes("Pilih")) continue;
    
    let row = [], cols = rows[i].querySelectorAll("td, th");
    for (let j = 0; j < cols.length; j++) {
      let data = cols[j].innerText.replace(/(\r\n|\n|\r)/gm, " "); 
      row.push('"' + data.replace(/"/g, '""') + '"');
    }
    csv.push(row.join(","));
  }
  
  let csvFile = new Blob([csv.join("\n")], { type: "text/csv;charset=utf-8;" });
  let downloadLink = document.createElement("a");
  downloadLink.download = namaFile + "_" + Date.now() + ".csv";
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

async function loadLaporanHarian() {
  const tgl = document.getElementById('filterTglHarian').value;
  const cari = document.getElementById('cariHarian').value.toLowerCase();
  const tbody = document.getElementById('tabelHarian');
  
  if (!tgl) return alert("⚠️ Pilih tanggal terlebih dahulu!");
  
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-primary"><span class="spinner-border spinner-border-sm me-2"></span> Menarik data harian...</td></tr>';
  
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_laporan_harian", tanggal: tgl })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      tbody.innerHTML = "";
      let filtered = res.data.filter(k => k.nama.toLowerCase().includes(cari) || (k.nik && k.nik.toString().toLowerCase().includes(cari)));
      
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Tidak ada data kehadiran di tanggal tersebut.</td></tr>';
        return;
      }
      
      filtered.forEach(k => {
        let badgeClass = "bg-success";
        if (k.status.includes("Telat")) badgeClass = "bg-danger";
        if (k.status.includes("Dinas")) badgeClass = "bg-primary";
        if (k.status.includes("Lembur") || k.status.includes("Libur")) badgeClass = "bg-warning text-dark";
        
        tbody.innerHTML += `<tr>
          <td class="fw-bold">${k.nama} <br><span class="text-muted fw-normal" style="font-size:10.5px;">${k.nik}</span></td>
          <td class="fw-bold">${k.masuk}</td>
          <td class="fw-bold">${k.keluar}</td>
          <td><span class="badge ${badgeClass}">${k.status}</span></td>
          <td class="text-muted" style="font-size:11px;">${k.ket}</td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">⚠️ Gagal: ${res.pesan || "Terjadi kesalahan (Mungkin belum Deploy Versi Baru)"}</td></tr>`;
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Gagal terhubung ke server.</td></tr>';
  }
}

async function loadLaporanMingguan() {
  const weekVal = document.getElementById('filterMinggu').value;
  const cari = document.getElementById('cariMingguan').value.toLowerCase();
  const tbody = document.getElementById('tabelMingguan');
  
  if (!weekVal) return alert("⚠️ Pilih minggu (Week) terlebih dahulu!");
  
  const year = parseInt(weekVal.split('-W')[0]);
  const week = parseInt(weekVal.split('-W')[1]);
  const simpleDate = new Date(year, 0, 1 + (week - 1) * 7);
  const dayOfWeek = simpleDate.getDay();
  
  const tglMulai = new Date(simpleDate);
  tglMulai.setDate(simpleDate.getDate() - dayOfWeek + 1);
  const tglSelesai = new Date(tglMulai);
  tglSelesai.setDate(tglMulai.getDate() + 6);

  const strMulai = tglMulai.toISOString().split('T')[0];
  const strSelesai = tglSelesai.toISOString().split('T')[0];

  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-primary"><span class="spinner-border spinner-border-sm me-2"></span> Merekap data mingguan...</td></tr>';
  
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_laporan_rekap", tglMulai: strMulai, tglSelesai: strSelesai })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      tbody.innerHTML = "";
      let filtered = res.data.filter(k => k.nama.toLowerCase().includes(cari) || (k.nik && k.nik.toString().toLowerCase().includes(cari)));
      
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Tidak ada data untuk minggu tersebut.</td></tr>';
        return;
      }
      
      filtered.forEach(k => {
        tbody.innerHTML += `<tr>
          <td class="fw-bold">${k.nama} <br><span class="text-muted fw-normal" style="font-size:10.5px;">${k.nik}</span></td>
          <td class="text-center fw-bold text-success">${k.hadir}</td>
          <td class="text-center fw-bold text-danger">${k.telat}</td>
          <td class="text-center fw-bold text-primary">${k.dinas}</td>
          <td class="text-center fw-bold text-warning">${k.lembur}</td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">⚠️ Gagal: ${res.pesan || "Terjadi kesalahan backend"}</td></tr>`;
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Gagal terhubung ke server.</td></tr>';
  }
}

async function loadLaporanBulanan() {
  const monthVal = document.getElementById('filterBulanLaporan').value; 
  const cari = document.getElementById('filterNamaLaporan').value.toLowerCase();
  const tbody = document.getElementById('tabelLaporanBulanan');
  
  if (!monthVal) return alert("⚠️ Pilih bulan terlebih dahulu!");
  
  const tglMulai = `${monthVal}-01`;
  const tglSelesaiObj = new Date(parseInt(monthVal.split('-')[0]), parseInt(monthVal.split('-')[1]), 0);
  const strSelesai = tglSelesaiObj.toLocaleDateString('en-CA'); 

  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-primary"><span class="spinner-border spinner-border-sm me-2"></span> Menghitung rekapitulasi payroll...</td></tr>';
  
  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_laporan_rekap", tglMulai: tglMulai, tglSelesai: strSelesai })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      tbody.innerHTML = "";
      let filtered = res.data.filter(k => k.nama.toLowerCase().includes(cari) || (k.nik && k.nik.toString().toLowerCase().includes(cari)));
      
      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Tidak ada rekam data bulan ini.</td></tr>';
        return;
      }
      
      filtered.forEach(k => {
        tbody.innerHTML += `<tr>
          <td class="fw-bold">${k.nama} <br><span class="text-muted fw-normal" style="font-size:10.5px;">${k.nik}</span></td>
          <td class="text-center fw-bold text-success">${k.hadir}</td>
          <td class="text-center fw-bold text-danger">${k.telat}</td>
          <td class="text-center fw-bold text-primary">${k.dinas}</td>
          <td class="text-center fw-bold text-warning">${k.lembur}</td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4">⚠️ Gagal: ${res.pesan || "Terjadi kesalahan backend"}</td></tr>`;
    }
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Gagal terhubung ke server.</td></tr>';
  }
}

// ----------------------------------------------------
// FUNGSI EDIT PROFIL RAKSASA & BERKAS
// ----------------------------------------------------
async function bukaModalEditProfilLengkap(nik, btnElement) {
  const originalHtml = btnElement.innerHTML;
  btnElement.innerHTML = '<span class="spinner-border spinner-border-sm"></span>'; btnElement.disabled = true;

  try {
    // V2: Gunakan endpoint get_profil
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "get_profil", nik: nik })
    });
    const res = await response.json();

    if (res.status === "SUKSES") {
      const p = res.profil; // V2 menggunakan bungkusan objek 'profil'
      
      document.getElementById('epNamaHeader').innerText = p.nama; 
      document.getElementById('epNikHeader').innerText = "NIK: " + p.nik; 
      document.getElementById('epNikHidden').value = p.nik;
      
      // RESET FORM FILE & TAB
      document.getElementById('formEditProfilLengkap').reset();
      new bootstrap.Tab(document.querySelector('#profilTabs button[data-bs-target="#pane-pribadi"]')).show();

      // ISI TEKS BIODATA (Menggunakan Object Key V2, bukan Array d[x])
      document.getElementById('epNikKtp').value = p.nikKtp !== "-" ? p.nikKtp : ""; 
      document.getElementById('epTempatLahir').value = p.tempatLahir !== "-" ? p.tempatLahir : "";
      if(p.tglLahir && p.tglLahir !== "-") document.getElementById('epTglLahir').value = p.tglLahir;
      document.getElementById('epJk').value = p.jenisKelamin !== "-" ? p.jenisKelamin : "Laki-Laki"; 
      document.getElementById('epDarah').value = p.golDarah !== "-" ? p.golDarah : "-"; 
      document.getElementById('epAgama').value = p.agama !== "-" ? p.agama : "Islam"; 
      document.getElementById('epNikah').value = p.statusNikah !== "-" ? p.statusNikah : "Lajang"; 
      document.getElementById('epPendidikan').value = p.pendidikan !== "-" ? p.pendidikan : "-"; 
      document.getElementById('epAlamatKtp').value = p.alamatKtp !== "-" ? p.alamatKtp : ""; 
      document.getElementById('epAlamatDomisili').value = p.alamatDomisili !== "-" ? p.alamatDomisili : ""; 
      document.getElementById('epIbu').value = p.namaIbu !== "-" ? p.namaIbu : "";
      
      document.getElementById('epEmail').value = p.email !== "-" ? p.email : ""; 
      document.getElementById('epHp').value = p.nomorHp !== "-" ? p.nomorHp : ""; 
      document.getElementById('epNamaDarurat').value = p.namaDarurat !== "-" ? p.namaDarurat : ""; 
      document.getElementById('epHubDarurat').value = p.hubunganDarurat !== "-" ? p.hubunganDarurat : ""; 
      document.getElementById('epHpDarurat').value = p.hpDarurat !== "-" ? p.hpDarurat : "";
      
      document.getElementById('epDept').value = p.dept !== "-" ? p.dept : ""; 
      document.getElementById('epJabatan').value = p.jabatan !== "-" ? p.jabatan : ""; 
      document.getElementById('epGrade').value = p.grade !== "-" ? p.grade : "";
      if(p.tglGabung && p.tglGabung !== "-") document.getElementById('epTglGabung').value = p.tglGabung; 
      document.getElementById('epStatusKaryawan').value = p.statusKaryawan !== "-" ? p.statusKaryawan : "TETAP";
      if(p.tglKontrak && p.tglKontrak !== "-") document.getElementById('epTglKontrak').value = p.tglKontrak; 
      document.getElementById('epSisaCuti').value = p.sisaCuti !== "-" ? p.sisaCuti : "0";
      
      document.getElementById('epBpjsKes').value = p.bpjsKesehatan !== "-" ? p.bpjsKesehatan : ""; 
      document.getElementById('epBpjsTk').value = p.bpjsKetenagakerjaan !== "-" ? p.bpjsKetenagakerjaan : ""; 
      document.getElementById('epNpwp').value = p.npwp !== "-" ? p.npwp : ""; 
      document.getElementById('epBank').value = p.bank !== "-" ? p.bank : ""; 
      document.getElementById('epRekening').value = p.rekening !== "-" ? p.rekening : "";

      new bootstrap.Modal(document.getElementById('modalEditProfil')).show();
    } else { alert("⚠️ " + res.pesan); }
  } catch(e) { alert("❌ Gagal menarik data profil!"); } finally { btnElement.innerHTML = originalHtml; btnElement.disabled = false; }
}

async function simpanProfilLengkap() {
  const btn = document.getElementById('btnSimpanProfilLengkap');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengunggah File & Data...'; btn.disabled = true;

  // PROSES KONVERSI FILE KE BASE64
  const getFileBase64 = async (idHtml) => {
    const el = document.getElementById(idHtml);
    if(el && el.files.length > 0) {
      const file = el.files[0];
      const base64Murni = await prosesFileBase64(file);
      return { nama: file.name, mime: file.type, data: base64Murni.split(',')[1] };
    } return null;
  };

  const payload = {
    action: "update_user_profil", 
    nik: document.getElementById('epNikHidden').value, 
    
    // Data Teks dikirim pakai Keys langsung (V2 Standard)
    nikKtp: document.getElementById('epNikKtp').value || "-",
    namaIbu: document.getElementById('epIbu').value || "-",
    tempatLahir: document.getElementById('epTempatLahir').value || "-",
    tglLahir: document.getElementById('epTglLahir').value || "-",
    jenisKelamin: document.getElementById('epJk').value || "-",
    golDarah: document.getElementById('epDarah').value || "-",
    agama: document.getElementById('epAgama').value || "-",
    statusNikah: document.getElementById('epNikah').value || "-",
    alamatKtp: document.getElementById('epAlamatKtp').value || "-",
    alamatDomisili: document.getElementById('epAlamatDomisili').value || "-",
    pendidikan: document.getElementById('epPendidikan').value || "-",
    dept: document.getElementById('epDept').value || "-",
    jabatan: document.getElementById('epJabatan').value || "-",
    grade: document.getElementById('epGrade').value || "-",
    tglGabung: document.getElementById('epTglGabung').value || "-",
    sisaCuti: document.getElementById('epSisaCuti').value || "0",
    statusKaryawan: document.getElementById('epStatusKaryawan').value || "-",
    tglKontrak: document.getElementById('epTglKontrak').value || "-",
    nomorHp: document.getElementById('epHp').value || "-",
    email: document.getElementById('epEmail').value || "-",
    namaDarurat: document.getElementById('epNamaDarurat').value || "-",
    hubunganDarurat: document.getElementById('epHubDarurat').value || "-",
    hpDarurat: document.getElementById('epHpDarurat').value || "-",
    bank: document.getElementById('epBank').value || "-",
    rekening: document.getElementById('epRekening').value || "-",
    bpjsKesehatan: document.getElementById('epBpjsKes').value || "-",
    bpjsKetenagakerjaan: document.getElementById('epBpjsTk').value || "-",
    npwp: document.getElementById('epNpwp').value || "-",
    
    // Berkas File
    fileFoto: await getFileBase64('epUploadFoto'),
    fileKtp: await getFileBase64('epUploadKtp'),
    fileKk: await getFileBase64('epUploadKk'),
    fileCv: await getFileBase64('epUploadCv'),
    fileIjazah: await getFileBase64('epUploadIjazah')
  };

  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    const res = await response.json();
    if (res.status === "SUKSES") {
      alert("✅ " + res.pesan); bootstrap.Modal.getInstance(document.getElementById('modalEditProfil')).hide(); loadDataUser();
    } else alert("❌ Gagal: " + res.pesan);
  } catch(e) { alert("❌ Koneksi gagal saat mengunggah file! (Mungkin ukuran file terlalu besar)"); } 
  finally { btn.innerHTML = '<i class="bi bi-cloud-arrow-up me-2"></i>Unggah & Simpan'; btn.disabled = false; }
}

// ==========================================
// 📂 MODUL ARSIP INTERNAL (DOKUMEN & BERKAS)
// ==========================================
async function loadTabelArsip() {
  const tbody = document.getElementById('tabelArsip');
  if(!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-primary"><span class="spinner-border spinner-border-sm me-2"></span> Menyusun berkas arsip...</td></tr>';

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_arsip" })
    });
    const res = await response.json();

    if (res.status === "SUKSES") {
      tbody.innerHTML = "";
      const filterKategori = document.getElementById('filterKategoriArsip').value;

      // Filter berdasarkan Dropdown Kategori
      let filteredData = res.data;
      if (filterKategori !== "SEMUA") {
        filteredData = filteredData.filter(item => item.kategori === filterKategori);
      }

      if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Belum ada dokumen yang diarsipkan di kategori ini.</td></tr>';
        return;
      }

      filteredData.forEach(item => {
        let badgeClass = "bg-secondary";
        if(item.kategori.includes("SP")) badgeClass = "bg-danger";
        else if(item.kategori.includes("SK")) badgeClass = "bg-primary";
        else if(item.kategori.includes("Kontrak")) badgeClass = "bg-success";

        let btnLink = item.link !== "-" ? `<a href="${item.link}" target="_blank" class="btn btn-sm btn-outline-primary py-0 px-2" style="font-size:11px;"><i class="bi bi-cloud-arrow-down"></i> Buka File</a>` : `<span class="badge bg-light text-muted border">Tidak ada file</span>`;

        tbody.innerHTML += `<tr>
          <td style="font-size:11.5px;">${item.tanggal}</td>
          <td class="fw-bold">${item.nama || "UMUM / PERUSAHAAN"} <br><span class="text-muted fw-normal" style="font-size:10px;">${item.nik !== "-" ? item.nik : ""}</span></td>
          <td><span class="badge ${badgeClass}" style="font-size:10.5px;">${item.kategori}</span></td>
          <td style="font-size:11.5px;">${item.judul}</td>
          <td class="text-center">${btnLink}</td>
        </tr>`;
      });
    }
  } catch (error) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger py-4">Gagal terhubung ke server.</td></tr>';
  }
}

// Fitur Pencarian Pintar
function filterTabelArsip() {
  let keyword = document.getElementById('cariArsip').value.toLowerCase();
  document.querySelectorAll('#tabelArsip tr').forEach(row => {
    row.style.display = row.innerText.toLowerCase().includes(keyword) ? '' : 'none';
  });
}

let modalArsipEl;
function bukaModalArsip() {
  if (!modalArsipEl) modalArsipEl = new bootstrap.Modal(document.getElementById('modalUploadArsip'));
  document.getElementById('formArsip').reset();
  modalArsipEl.show();
}

async function simpanArsip() {
  const rawKaryawan = document.getElementById('arsipKaryawan').value;
  const kategori = document.getElementById('arsipKategori').value;
  const judul = document.getElementById('arsipJudul').value;
  const fileInput = document.getElementById('arsipFile');

  if (!judul) return alert("⚠️ Judul dokumen wajib diisi!");
  if (fileInput.files.length === 0) return alert("⚠️ Anda belum memilih file (PDF/Gambar) untuk diupload!");

  // Cerdas memisahkan NIK dan Nama dari input HRD
  let nik = "-";
  let nama = "UMUM / PERUSAHAAN";
  if(rawKaryawan.trim() !== "") {
     if(rawKaryawan.includes("-")) {
         nik = rawKaryawan.split("-")[0].trim();
         nama = rawKaryawan.split("-")[1].trim();
     } else {
         nama = rawKaryawan.trim();
     }
  }

  const btn = document.getElementById('btnSimpanArsip');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Mengunggah...';
  btn.disabled = true;

  const file = fileInput.files[0];
  const base64Murni = await prosesFileBase64(file);
  const fileObj = { nama: file.name, mime: file.type, data: base64Murni.split(',')[1] };

  const payload = {
    action: "save_arsip",
    nik: nik, nama: nama, kategori: kategori, judul: judul, fileData: fileObj
  };

  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(payload) });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      alert("✅ " + res.pesan);
      modalArsipEl.hide();
      loadTabelArsip(); // Langsung perbarui tabel
    } else {
      alert("❌ Gagal: " + res.pesan);
    }
  } catch(e) {
    alert("❌ Gagal mengunggah arsip! (Pastikan koneksi stabil & ukuran file tidak > 3MB)");
  } finally {
    btn.innerHTML = '<i class="bi bi-upload me-2"></i>Unggah Arsip';
    btn.disabled = false;
  }
}

// ==========================================
// 📢 MODUL BROADCAST PENGUMUMAN
// ==========================================
function toggleNotifTarget() {
  const val = document.getElementById('notifTarget').value;
  document.getElementById('notifTargetNikContainer').style.display = (val === 'PILIH') ? 'block' : 'none';
}

async function kirimPengumuman() {
  const target = document.getElementById('notifTarget').value;
  const niks = document.getElementById('notifTargetNik').value;
  const tipe = document.getElementById('notifTipe').value;
  const judul = document.getElementById('notifJudul').value.trim();
  const pesan = document.getElementById('notifPesan').value.trim();

  // Validasi Pencegah Error
  if (!judul || !pesan) return alert("⚠️ Judul dan Isi Pesan wajib diisi!");
  if (target === 'PILIH' && !niks) return alert("⚠️ Silakan ketik NIK karyawan yang ingin dikirimkan pesan!");

  // Memecah NIK jika HRD mengirim ke beberapa orang sekaligus
  let penerimaArray = [];
  if (target === 'SEMUA') {
    penerimaArray = ["SEMUA"]; // Sandi rahasia untuk dikirim ke seluruh pabrik
  } else {
    penerimaArray = niks.split(',').map(n => n.trim()).filter(n => n !== "");
  }

  const btn = document.getElementById('btnKirimNotif');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyiarkan...';
  btn.disabled = true;

  const payload = {
    action: "kirim_notifikasi",
    penerima: penerimaArray,
    tipe: tipe,
    judul: judul,
    pesan: pesan
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      alert("✅ " + res.pesan);
      // Bersihkan formulir setelah sukses terkirim
      document.getElementById('notifJudul').value = "";
      document.getElementById('notifPesan').value = "";
      document.getElementById('notifTargetNik').value = "";
    } else {
      alert("❌ Gagal: " + res.pesan);
    }
  } catch(e) {
    alert("❌ Koneksi gagal saat menyiarkan pengumuman!");
  } finally {
    btn.innerHTML = '<i class="bi bi-rocket-takeoff me-2"></i>Kirim Notifikasi Sekarang';
    btn.disabled = false;
  }
}

// ==========================================
// --- MODUL APPROVAL PENGAJUAN (ADMIN) ---
// ==========================================
// ==========================================
// --- MODUL APPROVAL PENGAJUAN (ADMIN) ---
// ==========================================
async function loadApprovalHR() {
  const tP = { c: document.getElementById('tabelAppvCuti'), l: document.getElementById('tabelAppvLembur') };
  const tR = { c: document.getElementById('tabelRiwayatCuti'), l: document.getElementById('tabelRiwayatLembur') };
  
  const loadingHtml = '<tr><td colspan="5" class="text-center py-3 text-primary"><span class="spinner-border spinner-border-sm me-2"></span>Memuat data...</td></tr>';
  if(tP.c) tP.c.innerHTML = loadingHtml; if(tP.l) tP.l.innerHTML = loadingHtml;
  if(tR.c) tR.c.innerHTML = loadingHtml; if(tR.l) tR.l.innerHTML = loadingHtml;

  try {
    // Tarik 2 API sekaligus biar ngebut
    const [resPending, resRiwayat] = await Promise.all([
      fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_pending_pengajuan" }) }).then(r => r.json()),
      fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_riwayat_pengajuan" }) }).then(r => r.json())
    ]);
    
    // --- RENDER TABEL PENDING ---
    if (resPending.status === "SUKSES") {
      let hCuti = ""; let hLembur = "";
      resPending.data.forEach(p => {
        let tgl = p.tglMulai.split('T')[0];
        if (p.tglMulai !== p.tglSelesai && p.tglSelesai) tgl += " s/d " + p.tglSelesai.split('T')[0];
        
        let btn = `<button class="btn btn-sm btn-success py-1 px-2 me-1 shadow-sm" onclick="prosesApproval(${p.id}, true)" title="Setujui"><i class="bi bi-check-circle-fill"></i></button>
                   <button class="btn btn-sm btn-danger py-1 px-2 shadow-sm" onclick="prosesApproval(${p.id}, false)" title="Tolak"><i class="bi bi-x-circle-fill"></i></button>`;

        let row = `<tr>
          <td class="fw-bold">${p.nama} <br><span class="text-muted" style="font-size:10px;">${p.nik}</span></td>
          <td><span class="badge bg-primary">${p.tipe}</span></td>
          <td style="font-size:11px;">${tgl} <br><span class="text-danger fw-bold">${p.jumlahHari} Hari</span></td>
          <td style="font-size:11px;">${p.alasan}</td>
          <td class="text-center">${btn}</td>
        </tr>`;

        if (p.tipe.toLowerCase() === "lembur") hLembur += row; else hCuti += row;
      });
      if(tP.c) tP.c.innerHTML = hCuti || '<tr><td colspan="5" class="text-center text-muted py-3">Tidak ada yang pending.</td></tr>';
      if(tP.l) tP.l.innerHTML = hLembur || '<tr><td colspan="5" class="text-center text-muted py-3">Tidak ada yang pending.</td></tr>';
    }

    // --- RENDER TABEL RIWAYAT ---
    if (resRiwayat.status === "SUKSES") {
      let rCuti = ""; let rLembur = "";
      resRiwayat.data.forEach(p => {
        let badgeStatus = p.status === "Disetujui" ? "bg-success" : "bg-danger";
        let row = `<tr>
          <td class="fw-bold">${p.nama} <br><span class="text-muted" style="font-size:10px;">${p.nik}</span></td>
          <td>${p.tipe}</td>
          <td style="font-size:11px;">${p.tglMulai.split('T')[0]}</td>
          <td><span class="badge ${badgeStatus}">${p.status}</span></td>
          <td style="font-size:11px;"><i class="bi bi-person-check-fill text-success me-1"></i>${p.persetuju || '-'}</td>
        </tr>`;

        if (p.tipe.toLowerCase() === "lembur") rLembur += row; else rCuti += row;
      });
      if(tR.c) tR.c.innerHTML = rCuti || '<tr><td colspan="5" class="text-center text-muted py-3">Belum ada riwayat.</td></tr>';
      if(tR.l) tR.l.innerHTML = rLembur || '<tr><td colspan="5" class="text-center text-muted py-3">Belum ada riwayat.</td></tr>';
    }
  } catch (e) {
    alert("Gagal menarik data approval.");
  }
}

async function prosesApproval(idPengajuan, isApproved) {
  let konfirmasi = confirm(isApproved ? "Apakah Anda yakin ingin MENYETUJUI pengajuan ini?" : "Apakah Anda yakin ingin MENOLAK pengajuan ini?");
  if (!konfirmasi) return;

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ 
        action: "update_pengajuan", 
        id: idPengajuan, 
        approved: isApproved, 
        approverName: document.getElementById('adminWelcome').innerText 
      })
    });
    const res = await response.json();
    
    if (res.status === "SUKSES") {
      alert("✅ " + res.pesan);
      loadApprovalHR(); // Reload tabel secara live setelah disetujui/ditolak
    } else {
      alert("❌ Gagal: " + res.pesan);
    }
  } catch (e) {
    alert("❌ Koneksi terputus saat memproses approval.");
  }
}

// --- FUNGSI LIVE SEARCH UNTUK TABEL APPROVAL ---
function filterTabel(inputId, idTabelPending, idTabelRiwayat) {
  const keyword = document.getElementById(inputId).value.toLowerCase();
  
  [idTabelPending, idTabelRiwayat].forEach(idTabel => {
    const tbody = document.getElementById(idTabel);
    if (tbody) {
      const baris = tbody.getElementsByTagName('tr');
      for (let i = 0; i < baris.length; i++) {
        const teksBaris = baris[i].innerText.toLowerCase();
        baris[i].style.display = teksBaris.includes(keyword) ? "" : "none";
      }
    }
  });
}

// ===================================================
// 🚨 MODUL SURAT PERINGATAN (SP)
// ===================================================
async function muatDropdownSP() {
  const inputEl = document.getElementById('inputCariKaryawanSP');
  inputEl.disabled = true; inputEl.placeholder = "⏳ Mengunduh data...";
  try {
    if (!dataKaryawanGlobal || dataKaryawanGlobal.length === 0) {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_users" }) }).then(r => r.json());
        if (res.status === "SUKSES") dataKaryawanGlobal = res.karyawan;
    }
    inputEl.disabled = false; inputEl.placeholder = "🔍 Ketik NIK atau Nama...";
  } catch (e) { inputEl.placeholder = "❌ Gagal memuat data!"; }
}

// Logika Pencarian Nama (Dropwdown)
document.getElementById('inputCariKaryawanSP').addEventListener('input', function() {
  const val = this.value.toLowerCase();
  const listDiv = document.getElementById('listKaryawanSP'); listDiv.innerHTML = '';
  if (!val) { listDiv.style.display = 'none'; return; }

  const filtered = dataKaryawanGlobal.filter(k => (k.nik && k.nik.toString().toLowerCase().includes(val)) || (k.nama && k.nama.toLowerCase().includes(val)));
  if (filtered.length > 0) {
    listDiv.style.display = 'block';
    filtered.forEach(k => {
      const item = document.createElement('button');
      item.type = 'button'; item.className = 'list-group-item list-group-item-action py-1 px-2 border-bottom'; item.style.fontSize = '12px'; item.textContent = `${k.nik} - ${k.nama}`;
      item.onclick = function() { document.getElementById('inputCariKaryawanSP').value = this.textContent; listDiv.style.display = 'none'; };
      listDiv.appendChild(item);
    });
  } else { listDiv.style.display = 'none'; }
});
document.addEventListener('click', function(e) { if(e.target.id !== 'inputCariKaryawanSP') { const listDiv = document.getElementById('listKaryawanSP'); if(listDiv) listDiv.style.display = 'none'; } });

// Tarik Riwayat ke Tabel
async function loadRiwayatSP() {
  const tbody = document.getElementById('tabelRiwayatSP');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-primary"><span class="spinner-border spinner-border-sm"></span> Memuat riwayat...</td></tr>';
  try {
      const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_riwayat_sp" }) }).then(r => r.json());
      if (res.status === "SUKSES") {
          tbody.innerHTML = "";
          if (res.data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Belum ada riwayat SP.</td></tr>';
          res.data.forEach(item => {
              let tgl = item.waktu.split(' ')[0] || item.waktu;
              tbody.innerHTML += `<tr>
                  <td>${tgl}</td>
                  <td class="fw-bold">${item.nama} <br><small class="text-muted fw-normal">${item.nik}</small></td>
                  <td><span class="badge bg-danger shadow-sm">${item.tingkat}</span></td>
                  <td class="text-danger fw-bold"><i class="bi bi-alarm me-1"></i>${item.kedaluwarsa}</td>
              </tr>`;
          });
      }
  } catch (e) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-danger">Gagal menarik riwayat.</td></tr>'; }
}

// Eksekusi Tembak SP
async function terbitkanSP() {
  const inputValue = document.getElementById('inputCariKaryawanSP').value;
  const tingkatSP = document.getElementById('tingkatSP').value;
  const alasan = document.getElementById('alasanSP').value.trim();

  if (!inputValue || !alasan) return alert("⚠️ Harap pilih karyawan dan tulis alasan pemberian SP!");
  if (!inputValue.includes("-")) return alert("❌ Format karyawan tidak valid. Pilih dari daftar yang muncul!");

  const nikPisah = inputValue.split("-")[0].trim(); const namaPisah = inputValue.split("-")[1].trim();
  const konfirm = confirm(`PERINGATAN!\nAnda yakin ingin menerbitkan ${tingkatSP} untuk ${namaPisah}?\n\nKaryawan akan menerima notifikasi merah di HP-nya sekarang juga.`);
  if(!konfirm) return;

  const btn = document.getElementById('btnTerbitkanSP');
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Memproses...'; btn.disabled = true;

  try {
    const res = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "save_sp", nikTarget: nikPisah, namaTarget: namaPisah, tingkatSP: tingkatSP, alasan: alasan, admin: document.getElementById('adminWelcome').innerText })
    }).then(r => r.json());
    
    if (res.status === "SUKSES") {
        alert("✅ " + res.pesan);
        document.getElementById('inputCariKaryawanSP').value = ""; document.getElementById('alasanSP').value = "";
        loadRiwayatSP(); // Refresh tabel
    } else alert("❌ Gagal: " + res.pesan);
  } catch (e) { alert("❌ Terjadi kesalahan jaringan."); }
  finally { btn.innerHTML = '<i class="bi bi-send-fill me-2"></i>TERBITKAN SP SEKARANG'; btn.disabled = false; }
}

// ===================================================
// 📈 MODUL KENAIKAN GRADE & MUTASI
// ===================================================
async function muatDropdownMutasi() {
  const inputEl = document.getElementById('inputCariMutasi');
  inputEl.disabled = true; inputEl.placeholder = "⏳ Memuat data karyawan...";
  try {
    if (!dataKaryawanGlobal || dataKaryawanGlobal.length === 0) {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_users" }) }).then(r => r.json());
        if (res.status === "SUKSES") dataKaryawanGlobal = res.karyawan;
    }
    inputEl.disabled = false; inputEl.placeholder = "🔍 Ketik NIK atau Nama...";
  } catch (e) { inputEl.placeholder = "❌ Gagal memuat data!"; }
}

document.getElementById('inputCariMutasi').addEventListener('input', function() {
  const val = this.value.toLowerCase();
  const listDiv = document.getElementById('listKaryawanMutasi'); listDiv.innerHTML = '';
  if (!val) { listDiv.style.display = 'none'; return; }

  const filtered = dataKaryawanGlobal.filter(k => (k.nik && k.nik.toString().toLowerCase().includes(val)) || (k.nama && k.nama.toLowerCase().includes(val)));
  if (filtered.length > 0) {
    listDiv.style.display = 'block';
    filtered.forEach(k => {
      const item = document.createElement('button');
      item.type = 'button'; item.className = 'list-group-item list-group-item-action py-1 px-2 border-bottom fw-bold'; item.style.fontSize = '12px'; 
      item.textContent = `${k.nik} - ${k.nama}`;
      item.onclick = function() { 
        document.getElementById('inputCariMutasi').value = this.textContent; 
        listDiv.style.display = 'none'; 
        tarikDetailLamaKaryawan(k.nik); // Otomatis tarik data saat ini
      };
      listDiv.appendChild(item);
    });
  } else { listDiv.style.display = 'none'; }
});
document.addEventListener('click', function(e) { if(e.target.id !== 'inputCariMutasi') { const listDiv = document.getElementById('listKaryawanMutasi'); if(listDiv) listDiv.style.display = 'none'; } });

// Tarik data saat ini ke dalam form
async function tarikDetailLamaKaryawan(nik) {
  document.getElementById('mutDeptLama').value = "Loading...";
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_profil", nik: nik }) }).then(r => r.json());
    if (res.status === "SUKSES") {
       const p = res.profil; // Gunakan res.profil karena V2
       document.getElementById('mutDeptLama').value = p.dept;
       document.getElementById('mutDeptBaru').value = p.dept; 
       
       document.getElementById('mutJabatanLama').value = p.jabatan;
       document.getElementById('mutJabatanBaru').value = p.jabatan;
       
       document.getElementById('mutGradeLama').value = p.grade;
       document.getElementById('mutGradeBaru').value = p.grade;
    }
  } catch(e) { alert("Gagal menarik data detail karyawan."); }
}

async function simpanMutasi() {
  const inputKaryawan = document.getElementById('inputCariMutasi').value;
  if (!inputKaryawan.includes("-")) return alert("Pilih Karyawan dari daftar dropdown terlebih dahulu!");
  
  const nik = inputKaryawan.split("-")[0].trim();
  const nama = inputKaryawan.split("-")[1].trim();
  const tglEfektif = document.getElementById('mutTglEfektif').value;
  const alasan = document.getElementById('mutAlasan').value.trim();

  if (!tglEfektif || !alasan) return alert("Harap isi Tanggal Efektif dan Alasan Mutasi!");

  const payload = {
    action: "save_mutasi", nik: nik, nama: nama, tglEfektif: tglEfektif, alasan: alasan, admin: document.getElementById('adminWelcome').innerText,
    lama: { dept: document.getElementById('mutDeptLama').value, jabatan: document.getElementById('mutJabatanLama').value, grade: document.getElementById('mutGradeLama').value },
    baru: { dept: document.getElementById('mutDeptBaru').value, jabatan: document.getElementById('mutJabatanBaru').value, grade: document.getElementById('mutGradeBaru').value }
  };

  if(!confirm(`PROSES MUTASI/KENAIKAN?\nPastikan data Jabatan dan Grade Baru untuk ${nama} sudah benar.`)) return;

  const btn = document.getElementById('btnSimpanMutasi'); btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...'; btn.disabled = true;
  
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify(payload) }).then(r => r.json());
    if (res.status === "SUKSES") {
        alert("✅ " + res.pesan);
        document.getElementById('inputCariMutasi').value = ""; document.getElementById('mutAlasan').value = "";
        loadRiwayatMutasi();
    } else alert("❌ Gagal: " + res.pesan);
  } catch (e) { alert("Terjadi kesalahan jaringan."); }
  finally { btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>PROSES MUTASI SEKARANG'; btn.disabled = false; }
}

async function loadRiwayatMutasi() {
  const tbody = document.getElementById('tabelRiwayatMutasi');
  tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-primary"><span class="spinner-border spinner-border-sm"></span> Memuat riwayat...</td></tr>';
  try {
      const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_riwayat_mutasi" }) }).then(r => r.json());
      if (res.status === "SUKSES") {
          tbody.innerHTML = "";
          if (res.data.length === 0) return tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-muted">Belum ada riwayat mutasi.</td></tr>';
          res.data.forEach(item => {
              tbody.innerHTML += `<tr>
                  <td>${item.tgl}</td>
                  <td class="fw-bold">${item.nama} <br><small class="text-muted fw-normal">${item.nik}</small></td>
                  <td><span class="badge bg-primary shadow-sm">${item.gradeBaru}</span><br><small class="text-muted">${item.jabBaru}</small></td>
                  <td class="text-muted" style="font-size: 10px;">${item.alasan}</td>
              </tr>`;
          });
      }
  } catch (e) { tbody.innerHTML = '<tr><td colspan="4" class="text-center py-3 text-danger">Gagal menarik riwayat.</td></tr>'; }
}

// ===================================================
// 🛡️ MODUL HAK AKSES ADMIN
// ===================================================
async function loadAdmins() {
  const tbody = document.getElementById('tabelAdmins');
  tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-primary"><span class="spinner-border spinner-border-sm"></span> Menarik data admin...</td></tr>';
  try {
      const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_admins" }) }).then(r => r.json());
      if (res.status === "SUKSES") {
          tbody.innerHTML = "";
          res.data.forEach(item => {
              let badgeRole = item.role === "Developer" ? "bg-dark" : (item.role === "HR Manager" ? "bg-danger" : "bg-primary");
              if (item.role === "Staff") badgeRole = "bg-secondary";
              let badgeStatus = item.status === "Aktif" ? "text-success" : "text-danger fw-bold";
              
              tbody.innerHTML += `<tr>
                  <td class="fw-bold">${item.user}</td>
                  <td>${item.nama}</td>
                  <td><span class="badge ${badgeRole} shadow-sm">${item.role}</span></td>
                  <td class="${badgeStatus}">${item.status}</td>
                  <td>
                    <button class="btn btn-xs btn-outline-dark py-0" onclick="editAdmin('${item.user}', '${item.nama}', '${item.role}', '${item.status}')"><i class="bi bi-pencil"></i> Edit</button>
                  </td>
              </tr>`;
          });
      }
  } catch (e) { tbody.innerHTML = '<tr><td colspan="5" class="text-center py-3 text-danger">Gagal menarik data.</td></tr>'; }
}

function editAdmin(user, nama, role, status) {
  document.getElementById('admUser').value = user;
  document.getElementById('admUser').disabled = true; // Username tak bisa diganti
  document.getElementById('admNama').value = nama;
  document.getElementById('admRole').value = role;
  document.getElementById('admStatus').value = status;
  document.getElementById('admPin').value = ""; // Kosongkan PIN
}

async function simpanAdmin() {
  const user = document.getElementById('admUser').value.trim();
  const nama = document.getElementById('admNama').value.trim();
  const role = document.getElementById('admRole').value;
  const status = document.getElementById('admStatus').value;
  const pin = document.getElementById('admPin').value.trim();

  if (!user || !nama) return alert("Username dan Nama wajib diisi!");

  const btn = document.getElementById('btnSimpanAdmin'); 
  btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Menyimpan...'; btn.disabled = true;
  
  try {
    const res = await fetch(API_URL, { 
      method: "POST", 
      body: JSON.stringify({ action: "save_admin", user: user, nama: nama, role: role, status: status, pin: pin }) 
    }).then(r => r.json());
    
    if (res.status === "SUKSES") {
        alert("✅ " + res.pesan);
        document.getElementById('admUser').value = ""; document.getElementById('admUser').disabled = false;
        document.getElementById('admNama').value = ""; document.getElementById('admPin').value = "";
        loadAdmins();
    } else alert("❌ Gagal: " + res.pesan);
  } catch (e) { alert("Terjadi kesalahan jaringan."); }
  finally { btn.innerHTML = '<i class="bi bi-save-fill me-2"></i>SIMPAN DATA ADMIN'; btn.disabled = false; }
}

// Fungsi Reset PIN Karyawan dari Master Data
async function resetPinKaryawan(nik, nama) {
  if(!confirm(`⚠️ PERINGATAN!\nAnda yakin ingin mereset PIN untuk karyawan ${nama} (${nik})?\n\nPIN akan dikembalikan menjadi default: 123456`)) return;
  
  try {
    const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "reset_pin", nik: nik }) }).then(r => r.json());
    if (res.status === "SUKSES") alert("✅ " + res.pesan);
    else alert("❌ Gagal: " + res.pesan);
  } catch (e) { alert("❌ Terjadi kesalahan jaringan."); }
}

// --- AUTO-COMPLETE UNTUK BROADCAST INFO ---
const inputBroadcast = document.getElementById('inputNikBroadcast');
if(inputBroadcast) {
  inputBroadcast.addEventListener('input', async function() {
    const val = this.value.toLowerCase();
    const listDiv = document.getElementById('listKaryawanBroadcast'); listDiv.innerHTML = '';
    if (!val) { listDiv.style.display = 'none'; return; }

    // Tarik data karyawan jika belum ada
    if (!dataKaryawanGlobal || dataKaryawanGlobal.length === 0) {
       inputBroadcast.placeholder = "Memuat...";
       const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_users" }) }).then(r => r.json());
       if (res.status === "SUKSES") dataKaryawanGlobal = res.karyawan;
       inputBroadcast.placeholder = "🔍 Cari NIK / Nama...";
    }

    const filtered = dataKaryawanGlobal.filter(k => (k.nik && k.nik.toString().toLowerCase().includes(val)) || (k.nama && k.nama.toLowerCase().includes(val)));
    if (filtered.length > 0) {
      listDiv.style.display = 'block';
      filtered.forEach(k => {
        const item = document.createElement('button');
        item.type = 'button'; item.className = 'list-group-item list-group-item-action py-1 px-2 border-bottom'; item.style.fontSize = '12px'; 
        item.textContent = `${k.nik} - ${k.nama}`;
        item.onclick = function() { 
          // Isi NIK-nya saja ke form (agar sistem Broadcast bisa membaca dengan benar)
          inputBroadcast.value = k.nik; 
          listDiv.style.display = 'none'; 
        };
        listDiv.appendChild(item);
      });
    } else { listDiv.style.display = 'none'; }
  });
  
  // Tutup dropdown jika klik di luar area
  document.addEventListener('click', function(e) { if(e.target.id !== 'inputNikBroadcast') { const listDiv = document.getElementById('listKaryawanBroadcast'); if(listDiv) listDiv.style.display = 'none'; } });
}

// --- AUTO-COMPLETE UNTUK BROADCAST INFO ---
async function muatDropdownBroadcast() {
  const inputEl = document.getElementById('inputNikBroadcast');
  if(!inputEl) return;
  inputEl.disabled = true; inputEl.placeholder = "⏳ Memuat data karyawan...";
  try {
    if (!dataKaryawanGlobal || dataKaryawanGlobal.length === 0) {
        const res = await fetch(API_URL, { method: "POST", body: JSON.stringify({ action: "get_users" }) }).then(r => r.json());
        if (res.status === "SUKSES") dataKaryawanGlobal = res.karyawan;
    }
    inputEl.disabled = false; inputEl.placeholder = "🔍 Ketik NIK atau Nama...";
  } catch (e) { inputEl.placeholder = "❌ Gagal memuat data!"; }
}

document.addEventListener("DOMContentLoaded", function() {
  const inputBroadcast = document.getElementById('inputNikBroadcast');
  if(inputBroadcast) {
    inputBroadcast.addEventListener('input', function() {
      const val = this.value.toLowerCase();
      const listDiv = document.getElementById('listKaryawanBroadcast'); listDiv.innerHTML = '';
      if (!val) { listDiv.style.display = 'none'; return; }

      const filtered = dataKaryawanGlobal.filter(k => (k.nik && k.nik.toString().toLowerCase().includes(val)) || (k.nama && k.nama.toLowerCase().includes(val)));
      if (filtered.length > 0) {
        listDiv.style.display = 'block';
        filtered.forEach(k => {
          const item = document.createElement('button');
          item.type = 'button'; item.className = 'list-group-item list-group-item-action py-1 px-2 border-bottom'; item.style.fontSize = '12px'; 
          item.textContent = `${k.nik} - ${k.nama}`;
          item.onclick = function() { 
            inputBroadcast.value = k.nik; // Cukup masukkan NIK-nya agar sistem terbaca
            listDiv.style.display = 'none'; 
          };
          listDiv.appendChild(item);
        });
      } else { listDiv.style.display = 'none'; }
    });
    
    document.addEventListener('click', function(e) { if(e.target.id !== 'inputNikBroadcast') { const listDiv = document.getElementById('listKaryawanBroadcast'); if(listDiv) listDiv.style.display = 'none'; } });
  }
});

// --- LOGIKA SEMBUNYI/TAMPIL KOTAK PENCARIAN BROADCAST ---
function toggleNotifTarget() {
  const jenis = document.getElementById('notifTarget').value;
  const bungkusNik = document.getElementById('bungkusCariNik');
  
  if (jenis === "PILIH") {
    bungkusNik.style.display = 'block'; // Munculkan kotak pencarian
  } else {
    bungkusNik.style.display = 'none'; // Sembunyikan
    document.getElementById('inputNikBroadcast').value = ""; // Bersihkan teks jika kembali ke "Semua"
  }
}

// --- FITUR OFFBOARDING (RESIGN) ---
let nikResignAktif = "";

function bukaModalResign(nik, nama) {
  nikResignAktif = nik;
  document.getElementById('nikResignTarget').innerText = nik;
  document.getElementById('namaResignTarget').innerText = nama;
  document.getElementById('tipeResign').value = "One Month Notice";
  document.getElementById('alasanResign').value = "";
  
  // Fitur Cerdas: Set otomatis tanggal ke 30 hari dari hari ini (One Month Notice)
  let tglDefault = new Date();
  tglDefault.setDate(tglDefault.getDate() + 30);
  document.getElementById('tglEfektifResign').value = tglDefault.toISOString().split('T')[0];
  
  new bootstrap.Modal(document.getElementById('modalResign')).show();
}

// ===================================================
// 📈 FITUR JEJAK KARIR / TIMELINE KARYAWAN
// ===================================================
async function bukaTimelineKarir() {
  const modalTimeline = new bootstrap.Modal(document.getElementById('modalTimelineKarir'));
  const container = document.getElementById('timelineContainer');
  
  // Efek Loading
  container.innerHTML = '<div class="text-center py-5"><span class="spinner-border spinner-border-sm text-primary mb-2"></span><br><small class="text-muted fw-bold">Menelusuri arsip karir...</small></div>';
  modalTimeline.show();

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_riwayat_mutasi" })
    });
    const res = await response.json();

    if (res.status === "SUKSES") {
      // Filter cerdas: Tarik semua data, tapi hanya tampilkan milik user yang sedang login
      const riwayatKu = res.data.filter(item => item.nik.toString() === userAktif.nik.toString());

      if (riwayatKu.length === 0) {
        container.innerHTML = `
          <div class="text-center py-5 text-muted">
            <i class="bi bi-clipboard-x fs-1 d-block mb-3 opacity-50"></i>
            <h6 class="fw-bold">Belum Ada Rekam Jejak</h6>
            <small>Anda belum memiliki riwayat mutasi atau kenaikan grade.</small>
          </div>`;
        return;
      }

      let htmlTimeline = '';
      riwayatKu.forEach((item, index) => {
        const dotColor = index === 0 ? '#3b82f6' : '#cbd5e1'; // Biru untuk yang terbaru, abu untuk masa lalu
        const garisBorder = index === riwayatKu.length - 1 ? 'border-left: 0;' : 'border-left: 2px solid #e2e8f0;';
        
        // Konversi format tanggal bawaan spreadsheet
        const tglFormat = new Date(item.tgl).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        htmlTimeline += `
          <div style="position: relative; padding-left: 24px; padding-bottom: 20px; ${garisBorder}">
            <div style="position: absolute; left: -5px; top: 0; width: 12px; height: 12px; border-radius: 50%; background-color: ${dotColor}; box-shadow: 0 0 0 3px #f8f9fa;"></div>
            <div class="text-primary fw-bold mb-1" style="font-size: 11px;"><i class="bi bi-calendar2-check-fill me-1"></i>${tglFormat}</div>
            <div class="bg-white p-3 rounded-3 shadow-sm border border-light">
              <div style="font-size: 13px; font-weight: 800; color: #1e293b; margin-bottom: 4px;">
                Naik ke ${item.gradeBaru} <br><span class="text-muted fw-normal" style="font-size: 11px;">Posisi: ${item.jabBaru}</span>
              </div>
              <div style="font-size: 11px; color: #64748b; font-style: italic; border-top: 1px dashed #e2e8f0; padding-top: 6px; margin-top: 6px;">
                <i class="bi bi-chat-right-quote-fill me-1 opacity-50"></i> "${item.alasan}"
              </div>
            </div>
          </div>
        `;
      });
      container.innerHTML = htmlTimeline;
    } else {
      container.innerHTML = `<div class="text-center py-4 text-danger fw-bold"><i class="bi bi-exclamation-triangle me-1"></i> ${res.pesan}</div>`;
    }
  } catch (error) {
    container.innerHTML = '<div class="text-center py-4 text-danger fw-bold"><i class="bi bi-wifi-off me-1"></i> Gagal terhubung ke server HRIS.</div>';
  }
}

async function simpanResign() {
  const btn = event.target;
  const teksAsli = btn.innerHTML;
  const tipe = document.getElementById('tipeResign').value;
  const tglEfektif = document.getElementById('tglEfektifResign').value;
  const alasan = document.getElementById('alasanResign').value;

  if (!tglEfektif || !alasan) { Swal.fire("Oops", "Tanggal efektif dan Alasan wajib diisi untuk arsip!", "warning"); return; }

  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Memproses...';
  btn.disabled = true;

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "proses_resign", nik: nikResignAktif, nama: document.getElementById('namaResignTarget').innerText, tipe: tipe, tgl_efektif: tglEfektif, alasan: alasan, admin: userAktif.nama })
    });
    const res = await response.json();

    if (res.status === "SUKSES") {
      Swal.fire("Berhasil!", "Data resign tercatat. Karyawan kini memasuki masa Notice Period.", "success");
      bootstrap.Modal.getInstance(document.getElementById('modalResign')).hide();
      loadDataUser(); // Refresh tabel biar update
    } else { Swal.fire("Gagal", res.pesan, "error"); }
  } catch (error) { Swal.fire("Error", "Gagal menghubungi server.", "error"); } 
  finally { btn.innerHTML = teksAsli; btn.disabled = false; }
}

// ===================================================
// 🕒 FITUR RIWAYAT & REKAP ABSENSI KARYAWAN
// ===================================================
let modalRiwayatAbsenEl;

async function bukaRiwayatAbsen(bulanPilih = '') {
  if (!modalRiwayatAbsenEl) modalRiwayatAbsenEl = new bootstrap.Modal(document.getElementById('modalRiwayatAbsen'));
  
  const wadah = document.getElementById('wadahListRiwayat');
  const inputBulan = document.getElementById('bulanRiwayat');
  
  // Jika parameter bulan kosong, otomatis setel ke bulan saat ini
  if (!bulanPilih) {
    const today = new Date();
    const bln = ("0" + (today.getMonth() + 1)).slice(-2);
    bulanPilih = today.getFullYear() + "-" + bln;
    inputBulan.value = bulanPilih;
  }

  // Reset Angka Kalkulator
  document.getElementById('rekHadir').innerText = "0";
  document.getElementById('rekTelat').innerText = "0";
  document.getElementById('rekDinas').innerText = "0";

  // Tampilkan efek loading
  wadah.innerHTML = '<div class="text-center py-5"><span class="spinner-border spinner-border-sm text-danger mb-2"></span><br><small class="text-muted fw-bold">Menarik rekap dari server...</small></div>';
  modalRiwayatAbsenEl.show();

  try {
    const response = await fetch(API_URL, {
      method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "get_riwayat_presensi", nik: userAktif.nik, bulan: bulanPilih })
    });
    const res = await response.json();

    if (res.status === "SUKSES") {
      let totHadir = 0, totTelat = 0, totDinas = 0;
      
      if (res.data.length === 0) {
        wadah.innerHTML = `
          <div class="text-center py-5 text-muted">
            <i class="bi bi-calendar-x fs-1 d-block mb-2 opacity-50"></i>
            <h6 class="fw-bold">Tidak Ada Data</h6>
            <small>Belum ada riwayat kehadiran di bulan ini.</small>
          </div>`;
        return;
      }

      let htmlList = '';
      res.data.forEach(item => {
        // Kalkulator Logika
        const statusStr = item.status || "Hadir";
        if (statusStr.includes("Hadir")) totHadir++;
        if (statusStr.includes("Terlambat")) { totHadir++; totTelat++; } // Telat tetap dihitung sebagai hadir
        if (statusStr.includes("Dinas Luar")) totDinas++;

        // Desain Warna Status (Badge)
        let badgeStyle = "bg-success";
        if (statusStr.includes("Terlambat")) badgeStyle = "bg-warning text-dark";
        if (statusStr.includes("Dinas")) badgeStyle = "bg-primary";
        if (statusStr.includes("Izin") || statusStr.includes("Cuti") || statusStr.includes("Sakit")) badgeStyle = "bg-info text-dark";

        // Format Tanggal (Misal: Kam, 14 Agu)
        const d = new Date(item.tanggal);
        const tglCantik = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });

        htmlList += `
          <div class="card border-0 shadow-sm rounded-4 mb-2">
            <div class="card-body p-3 d-flex align-items-center justify-content-between">
              <div>
                <div class="fw-bold text-dark mb-1" style="font-size: 13px;">${tglCantik}</div>
                <span class="badge ${badgeStyle}" style="font-size: 10px;">${statusStr}</span>
              </div>
              <div class="text-end">
                <div style="font-size: 11px;"><span class="text-muted">In:</span> <strong class="text-success">${item.jamMasuk}</strong></div>
                <div style="font-size: 11px;"><span class="text-muted">Out:</span> <strong class="text-danger">${item.jamKeluar}</strong></div>
              </div>
            </div>
          </div>
        `;
      });
      
      // Lempar hasil ke HTML
      wadah.innerHTML = htmlList;
      
      // Update Angka di UI Kalkulator
      document.getElementById('rekHadir').innerText = totHadir;
      document.getElementById('rekTelat').innerText = totTelat;
      document.getElementById('rekDinas').innerText = totDinas;

    } else {
      wadah.innerHTML = `<div class="text-center py-4 text-danger fw-bold"><i class="bi bi-exclamation-triangle me-1"></i> ${res.pesan}</div>`;
    }
  } catch (error) {
    wadah.innerHTML = '<div class="text-center py-4 text-danger fw-bold"><i class="bi bi-wifi-off me-1"></i> Gagal terhubung ke server.</div>';
  }
}