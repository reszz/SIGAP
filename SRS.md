# Software Requirements Specification (SRS)
## SIGAP — Sistem Informasi Kegiatan, Absensi, dan Pelaporan

Proyek PKL — Institut Digital Ekonomi LPKIA Bandung
Disusun oleh: Salira Restu Gusti
**Versi 3.0 — revisi besar: otorisasi 4-layer per-Kegiatan, modul Surat Menyurat, restrukturisasi UI (Informasi vs Proses).**

---

## 0. Catatan Penting Sebelum Membaca (Baca Ini Duluan)

Ini revisi paling besar sejak v2.0. Empat perubahan utama:

1. **Otorisasi sekarang 4 layer**, bukan cuma role global. Urutannya: Global Role → Team Role (flat `pengurus`/`anggota`, **BUKAN** Owner/Admin/Member seperti v2.0-2.1 yang ternyata salah — dikoreksi di sini) → Role dalam Kegiatan (Ketua Pelaksana) → Jabatan Kepanitiaan (Bendahara, Sekretaris, 4 Divisi).
2. **Modul baru: Surat Menyurat** (surat masuk/keluar, terhubung ke Kegiatan).
3. **Panitia direstrukturisasi total**: dari "Divisi bebas nama + banyak Tugas" (v2.1) jadi entitas terpadu `Kepanitiaan` dengan jabatan tetap (Ketua Pelaksana, Bendahara, Sekretaris = 1 orang; 4 Divisi = banyak orang). **Ini mengubah skema data Panitia yang sudah sempat dibangun sebelumnya — perlu migrasi ulang, bukan cuma tambahan.**
4. **Arsitektur UI dipisah tegas**: Halaman Detail Kegiatan = **cuma menampilkan informasi**, tidak ada proses CRUD di situ. Semua proses (Panitia, Anggaran, Dokumentasi, Evaluasi, Rundown, Surat) pindah ke halaman masing-masing, masing-masing punya selector kegiatan sendiri.

**Yang TIDAK berubah dari v2.1**: struktur Team sebagai wadah organisasi (tetap bukan SaaS), Kegiatan tipe Wajib Hadir/Terbuka, RSVP instant-only, status Sesi computed tanpa cron, kolom `name` (bukan `nama`) untuk User.

**Sumber:** `REVISI_REQUIREMENT_SIGAP.md` yang diberikan user, dikonfirmasi lewat diskusi (Pengurus Utama = Pengurus Himpunan, disatukan; Bendahara & Sekretaris masing-masing tunggal per Kegiatan).

---

## 1. Struktur Otorisasi (4 Layer)

```
Super Admin (global_role, lintas-Team, maintenance sistem)
    │
Pengurus Himpunan (role='pengurus' di Team — flat, bukan Owner/Admin/Member)
    │  ├── Kelola Kegiatan (CRUD penuh)
    │  ├── Assign Ketua Pelaksana per Kegiatan
    │  └── Assign role Pengurus/Anggota ke User dalam Team
    │
Ketua Pelaksana (per-Kegiatan — user dengan jabatan 'ketua_pelaksana' di Kepanitiaan Kegiatan X)
    │  └── Setara akses Pengurus, TAPI HANYA untuk Kegiatan X. Tidak otomatis
    │      dapat akses ke Kegiatan lain, meski dia Ketua Pelaksana di situ juga
    │      (akses per-Kegiatan dievaluasi terpisah).
    │
    ├── Sekretaris (1 orang/Kegiatan)     → Dokumentasi tipe=notulen, Surat Menyurat (semua tipe), administrasi
    ├── Bendahara (1 orang/Kegiatan)      → Anggaran (pemasukan/pengeluaran/rekap, akses penuh)
    ├── Divisi Acara (banyak orang)       → Rundown
    ├── Divisi Humas (banyak orang)       → Surat Menyurat tipe=keluar
    ├── Divisi PDD (banyak orang)         → Dokumentasi tipe=foto
    └── Divisi Logistik (banyak orang)    → Anggaran (baris pengeluaran kategori logistik saja)
```

**Prinsip pemeriksaan otorisasi** (dari `REVISI_REQUIREMENT_SIGAP.md` §15), berlaku di setiap endpoint pengelolaan:
1. Apakah User anggota Team yang relevan?
2. Apakah User punya akses ke Kegiatan spesifik ini (lewat Team membership, atau Ketua Pelaksana Kegiatan ini)?
3. Apa Team Role User (`pengurus`/`anggota`)?
4. Apa jabatan User di Kepanitiaan Kegiatan ini (kalau ada)?
5. Apa permission yang mengikuti jabatan itu?
6. Apakah resource yang diakses (Anggaran/Surat/dst) benar berasal dari Kegiatan yang sama dengan konteks akses?

**Contoh konkret** (langsung dari dokumen sumber): Ketua Kegiatan A tidak otomatis punya akses ke Kegiatan B. Bendahara Kegiatan A hanya kelola keuangan Kegiatan A. Anggota biasa cuma lihat info/tugas sesuai aksesnya.

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk
Tetap seperti v2.1 — aplikasi internal manajemen kegiatan organisasi berbasis Team, bukan SaaS. Yang baru: setiap Kegiatan sekarang punya struktur kepanitiaan formal dengan jabatan definitif (bukan sekadar "anggota + tugas bebas"), mencerminkan struktur kepanitiaan riil organisasi mahasiswa (Ketua Pelaksana, Sekretaris, Bendahara, 4 Divisi standar).

### 2.2 Fungsi Utama Produk
1. Autentikasi & Team (tidak berubah dari v2.1).
2. Kegiatan, Sesi & Rundown.
3. Kalender (klik event → slide-in detail, lihat §2.4).
4. RSVP (instant-only, tidak berubah).
5. Presensi (tidak berubah).
6. **Kepanitiaan** — assign Ketua Pelaksana, Bendahara, Sekretaris, anggota 4 Divisi.
7. **Manajemen Tugas** — tugas per Divisi dengan PIC, prioritas, deadline; tampil sebagai widget "Tugas Saya" di Dashboard Anggota, **bukan halaman/menu tersendiri**.
8. Anggaran (akses dikontrol jabatan Bendahara/Logistik).
9. Evaluasi.
10. Dokumentasi (dipisah tipe foto ↔ notulen, akses dikontrol jabatan PDD/Sekretaris).
11. **Surat Menyurat** — surat masuk/keluar per Kegiatan.
12. Dashboard & Laporan (dashboard direstruktur, lihat §2.5).

### 2.3 Karakteristik Pengguna (Otorisasi Lengkap)

| Layer | Nilai | Cakupan |
|---|---|---|
| Global Role | `user` / `super_admin` | Lintas-Team, maintenance sistem |
| Team Role | `pengurus` / `anggota` (flat, kolom `users.role`) | Seluruh Team yang diikuti User |
| Role Kegiatan | `ketua_pelaksana` (opsional, per-Kegiatan) | Hanya Kegiatan yang di-assign |
| Jabatan Kepanitiaan | `bendahara` / `sekretaris` / `div_acara` / `div_humas` / `div_pdd` / `div_logistik` (opsional, per-Kegiatan) | Hanya Kegiatan yang di-assign |

Satu User bisa punya kombinasi apa saja dari 4 layer ini secara bersamaan (mis. Team Role `anggota` tapi jadi Ketua Pelaksana di satu Kegiatan spesifik).

### 2.4 Perubahan Arsitektur UI (Informasi vs Proses)

**Prinsip:** *Detail Kegiatan = pusat informasi dan monitoring. Halaman fitur = tempat seluruh proses pengelolaan.*

- **Halaman Detail Kegiatan** — read-only. Menampilkan: info kegiatan, sesi, kepanitiaan, divisi, ringkasan anggaran, ringkasan dokumentasi, ringkasan evaluasi, ringkasan surat, rundown. **Tidak ada tombol tambah/edit/hapus di sini.**
- **Halaman proses terpisah per fitur** (Panitia, Anggaran, Dokumentasi, Evaluasi, Rundown, Surat) — masing-masing punya **selector Kegiatan** di atas, baru menampilkan data & aksi CRUD untuk Kegiatan yang dipilih.
- **Daftar Kegiatan** — jadi tampilan card (nama, deskripsi, status, jumlah sesi, jumlah panitia, tombol Edit/Hapus).
- **Klik card** → **slide-in detail** (bukan pindah halaman), isinya sama seperti Halaman Detail Kegiatan di atas — kalau User punya permission untuk suatu proses, ada link ke halaman proses terkait dari situ.
- **Dashboard** juga memicu slide-in yang sama saat kegiatan diklik dari situ.

### 2.5 Dashboard (Direstruktur)

**Dashboard Pengurus:**
- Statistik: total kegiatan, total anggota, total kegiatan selesai, total kegiatan berjalan.
- **Kegiatan Akan Datang** (belum dilaksanakan) — **terpisah** dari **Kegiatan Terbaru** (baru dibuat/baru ada aktivitas). Dua section berbeda, tidak digabung jadi satu daftar.
- Aktivitas terbaru.
- Progress kegiatan (opsional, kalau relevan).

**Dashboard Anggota:**
- Kegiatan Akan Datang (Wajib Hadir + Terbuka yang sudah RSVP — **BUG dari sesi audit sebelumnya yang perlu diperbaiki: Kegiatan Terbuka yang BELUM di-RSVP juga harus tetap muncul**, lihat catatan di FR terkait).
- Kegiatan yang Sudah Terdaftar (RSVP).
- Kegiatan Wajib Hadir.
- **Tugas Saya** — widget/section, bukan halaman terpisah, bukan route tersendiri.

### 2.6 Batasan Sistem
- Semua batasan v2.1 tetap berlaku (bukan SaaS, peserta terbatas ke Member terdaftar, RSVP instant-only, status Sesi computed).
- **Baru:** Ketua Pelaksana, Bendahara, Sekretaris masing-masing **maksimal satu orang aktif per Kegiatan** — sistem harus mencegah assign ganda ke jabatan yang sama.
- **Baru:** PIC sebuah Tugas **wajib** anggota dari Divisi terkait tugas itu — tidak boleh assign PIC dari luar Divisi tersebut.
- **Baru:** Tidak ada route/halaman/menu khusus untuk Tugas — hanya widget di Dashboard Anggota.

### 2.7 Pustaka & Fitur Pihak Ketiga
Tidak berubah dari v2.1 (Fortify full-feature, `@fullcalendar/react`, `maatwebsite/excel`, `barryvdh/laravel-dompdf`, local disk storage) — ditambah kebutuhan upload file untuk entitas Surat (pakai mekanisme storage yang sama seperti Dokumentasi).

---

## 3. Kebutuhan Fungsional

### 3.1 Autentikasi, Team & Assignment Role *(tidak berubah dari v2.1, plus tambahan)*

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-01 – FR-04 | Sama seperti v2.1 (registrasi, login, buat/undang/switch Team) | User, Owner-setara |
| FR-05 | Pengurus Himpunan dapat assign Team Role (`pengurus`/`anggota`) ke User dalam Team-nya | Pengurus |
| FR-06 | Seluruh endpoint pengelolaan divalidasi lewat pemeriksaan 4-layer otorisasi (§1) sebelum data diproses | Sistem |

### 3.2 Kegiatan, Sesi & Rundown

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-07 | Pengurus dapat membuat Kegiatan (nama, tipe, deskripsi, warna, lokasi, kuota) dalam Team aktif | Pengurus |
| FR-08 | Kegiatan dapat memiliki satu/lebih Sesi (multi-hari) | Pengurus, Ketua Pelaksana (kegiatannya) |
| FR-09 | Setiap Sesi dapat kode presensi unik otomatis | Sistem |
| FR-10 | **Rundown dikelola di halaman terpisah `/rundown` (dengan selector Kegiatan), bukan lagi bagian form Create Kegiatan** — perubahan dari v2.1. Hanya Divisi Acara Kegiatan tersebut (atau Pengurus/Ketua Pelaksana) yang dapat mengelola | Div Acara, Pengurus, Ketua Pelaksana |
| FR-11 | Pengurus/Ketua Pelaksana dapat edit/hapus Kegiatan beserta Sesi & Rundown-nya | Pengurus, Ketua Pelaksana (kegiatannya) |
| FR-12 | **Halaman Detail Kegiatan hanya menampilkan informasi** — seluruh sesi, rundown (read-only), ringkasan kepanitiaan, ringkasan anggaran, ringkasan dokumentasi, ringkasan evaluasi, ringkasan surat. Tidak ada aksi CRUD di halaman ini | Semua Member Team |

### 3.3 Kalender & Interaksi

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-13 | Kalender menampilkan seluruh Kegiatan Team aktif, satu Sesi = satu event | Semua Member Team |
| FR-14 | Klik event kalender → **slide-in** Detail Kegiatan (bukan pindah halaman); dari situ, kalau User punya permission untuk suatu proses, disediakan link ke halaman proses terkait | Semua Member Team |
| FR-15 | Warna Kegiatan konsisten di seluruh Sesi-nya | Sistem |
| FR-16 | Status Sesi computed on-the-fly (tidak berubah dari v2.1) | Sistem |

### 3.4 RSVP *(tidak berubah dari v2.1 — instant-only, status terdaftar/dibatalkan)*

FR-17 – FR-20 sama seperti v2.1.

### 3.5 Presensi *(tidak berubah dari v2.1)*

FR-21 – FR-24 sama seperti v2.1.

### 3.6 Kepanitiaan *(RESTRUKTURISASI TOTAL dari v2.1 §3.6)*

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-25 | Pengurus dapat menentukan Ketua Pelaksana untuk sebuah Kegiatan (1 orang, dapat diganti) | Pengurus |
| FR-26 | Pengurus atau Ketua Pelaksana Kegiatan tersebut dapat menentukan Sekretaris (1 orang) dan Bendahara (1 orang) untuk Kegiatan itu | Pengurus, Ketua Pelaksana |
| FR-27 | Pengurus atau Ketua Pelaksana dapat menambahkan anggota ke 4 Divisi tetap (Acara, Humas, PDD, Logistik) — satu Divisi bisa berisi banyak anggota | Pengurus, Ketua Pelaksana |
| FR-28 | Sistem mencegah lebih dari satu orang menjabat Ketua Pelaksana/Sekretaris/Bendahara yang aktif secara bersamaan pada Kegiatan yang sama | Sistem |
| FR-29 | Halaman `/panitia` (dengan selector Kegiatan) adalah satu-satunya tempat proses kelola kepanitiaan — **bukan lagi di Detail Kegiatan** | Pengurus, Ketua Pelaksana |
| FR-30 | Semua Member Team dapat melihat struktur kepanitiaan suatu Kegiatan (read-only) dari halaman Detail Kegiatan | Semua Member Team |

### 3.7 Manajemen Tugas *(BARU, menggantikan sebagian FR-27/28 lama di v2.1)*

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-31 | Pengurus/Ketua Pelaksana/pemegang jabatan Divisi terkait dapat membuat Tugas untuk sebuah Divisi dalam Kegiatan tertentu (deskripsi, PIC, status, prioritas, deadline) | Pengurus, Ketua Pelaksana, jabatan Divisi terkait |
| FR-32 | PIC Tugas **wajib** merupakan anggota dari Divisi yang sama dengan Tugas tersebut — sistem menolak assignment PIC dari luar Divisi | Sistem |
| FR-33 | Pemilik Tugas (PIC) dapat mengubah status tugasnya sendiri | Member (PIC) |
| FR-34 | **Tugas TIDAK memiliki halaman/menu/route tersendiri.** Tugas milik seorang User ditampilkan sebagai widget "Tugas Saya" di Dashboard Anggota (nama tugas, kegiatan, divisi, deadline, status, prioritas) | Sistem |

### 3.8 Anggaran

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-35 | Bendahara Kegiatan dapat mencatat estimasi & realisasi anggaran (pemasukan/pengeluaran) — akses penuh ke seluruh baris anggaran Kegiatan tersebut | Bendahara (kegiatannya) |
| FR-36 | Divisi Logistik Kegiatan dapat mencatat baris pengeluaran dengan kategori logistik saja (subset dari akses Bendahara) | Div Logistik (kegiatannya) |
| FR-37 | Sistem menghitung selisih estimasi vs realisasi otomatis, per baris dan total | Sistem |
| FR-38 | Halaman `/anggaran` (dengan selector Kegiatan) — bukan lagi bagian Detail Kegiatan | Bendahara, Div Logistik, Pengurus, Ketua Pelaksana |

### 3.9 Evaluasi *(tidak berubah secara logika dari v2.1, pindah ke halaman terpisah)*

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-39 | Member isi evaluasi (rating 1-5 + komentar) setelah Kegiatan selesai, satu per Member per Kegiatan, dapat diedit | Member |
| FR-40 | Halaman `/evaluasi` (dengan selector Kegiatan) untuk Pengurus/Ketua Pelaksana melihat ringkasan | Pengurus, Ketua Pelaksana |

### 3.10 Dokumentasi *(dipisah akses berdasarkan tipe)*

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-41 | Divisi PDD dapat mengunggah dokumentasi **tipe foto** untuk Kegiatan-nya | Div PDD (kegiatannya) |
| FR-42 | Sekretaris dapat mengunggah dokumentasi **tipe notulen** untuk Kegiatan-nya | Sekretaris (kegiatannya) |
| FR-43 | Semua Member Team dapat melihat arsip dokumentasi (read-only) dari Detail Kegiatan | Semua Member Team |
| FR-44 | Halaman `/dokumentasi` (dengan selector Kegiatan) untuk proses upload/hapus | Div PDD, Sekretaris, Pengurus, Ketua Pelaksana |

### 3.11 Surat Menyurat *(BARU)*

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-45 | Sekretaris dapat mencatat surat masuk maupun keluar untuk Kegiatan-nya | Sekretaris (kegiatannya) |
| FR-46 | Divisi Humas dapat mencatat **surat keluar saja** untuk Kegiatan-nya (subset dari akses Sekretaris) | Div Humas (kegiatannya) |
| FR-47 | Data surat minimal: nomor surat, jenis surat, perihal, tanggal surat, pengirim/penerima, file surat, keterangan, kegiatan terkait, pembuat/pengunggah | Sistem |
| FR-48 | Halaman `/surat` (dengan selector Kegiatan) — daftar & proses CRUD surat, filter tipe masuk/keluar | Sekretaris, Div Humas, Pengurus, Ketua Pelaksana |
| FR-49 | Semua Member Team dapat melihat ringkasan surat (read-only) dari Detail Kegiatan | Semua Member Team |

### 3.12 Dashboard & Laporan

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-50 | Dashboard Pengurus: statistik (total kegiatan/anggota/selesai/berjalan), **Kegiatan Akan Datang** dan **Kegiatan Terbaru** sebagai dua section terpisah, aktivitas terbaru, progress kegiatan | Pengurus |
| FR-51 | Dashboard Anggota: Kegiatan Akan Datang, Kegiatan Terdaftar (RSVP), Kegiatan Wajib Hadir, widget Tugas Saya | Member |
| FR-52 | **Perbaikan bug v2.1**: "Kegiatan Akan Datang" untuk Member wajib menampilkan Kegiatan Terbuka yang **belum** di-RSVP juga (bukan cuma yang sudah RSVP + Wajib Hadir), dengan indikator status RSVP per item | Sistem |
| FR-53 | Owner/Pengurus dapat export laporan gabungan (kehadiran, anggaran, evaluasi) ke Excel/PDF, termasuk realisasi anggaran | Pengurus, Ketua Pelaksana |
| FR-54 | Member dapat melihat riwayat kehadiran/keikutsertaan pribadinya | Member |

---

## 4. Kebutuhan Non-Fungsional

| ID | Kategori | Kebutuhan |
|---|---|---|
| NFR-01 | Security | Setiap akses ke halaman proses (Panitia/Anggaran/Dokumentasi/Evaluasi/Rundown/Surat) divalidasi lewat pemeriksaan 4-layer otorisasi (§1), bukan cuma Team Role |
| NFR-02 | Security | Ketua Pelaksana/Bendahara/Sekretaris/anggota Divisi HANYA dapat mengakses data dari Kegiatan yang menjadi konteks jabatan mereka — dicoba akses Kegiatan lain via manipulasi ID harus ditolak |
| NFR-03 | Data Integrity | Constraint unik (kegiatan_id, jabatan) untuk jabatan tunggal (ketua_pelaksana, bendahara, sekretaris) |
| NFR-04 | Data Integrity | PIC Tugas divalidasi merupakan anggota Divisi yang sama sebelum tugas tersimpan |
| NFR-05 | Usability | Setiap halaman proses (Panitia/Anggaran/dst) menampilkan selector Kegiatan yang jelas sebelum menampilkan data |
| NFR-06 | Usability | Slide-in Detail Kegiatan harus tetap terasa di kalender/dashboard yang sama tanpa reload halaman penuh |

---

## 5. Kebutuhan Data (Model Entitas — Direvisi)

| Entitas | Atribut Kunci | Relasi |
|---|---|---|
| **User** | id, name, email, password, global_role, current_team_id, role (Team Role: pengurus/anggota) | — |
| **Team** | id, name, slug | 1–N ke Kegiatan |
| **Kegiatan** | id, team_id, nama, deskripsi, tipe, kuota, warna, lokasi | 1–N ke Sesi, Kepanitiaan, RSVP, Anggaran, Evaluasi, Dokumentasi, **Surat (baru)** |
| **Sesi** | id, kegiatan_id, tanggal, waktu_mulai, waktu_selesai, lokasi, kode_presensi | Status computed |
| **Rundown** | id, sesi_id, waktu, uraian_acara, urutan | N–1 ke Sesi |
| **Kepanitiaan** *(BARU, mengganti DivisiPanitia lama)* | id, kegiatan_id, user_id, jabatan (enum: `ketua_pelaksana`, `bendahara`, `sekretaris`, `div_acara`, `div_humas`, `div_pdd`, `div_logistik`) | N–1 ke Kegiatan, User. Unique `(kegiatan_id, jabatan)` HANYA untuk 3 jabatan tunggal (divalidasi di aplikasi, bukan constraint DB murni karena Divisi boleh banyak baris) |
| **Tugas** *(BARU, mengganti TugasPanitia lama)* | id, kegiatan_id, jabatan (harus salah satu dari 4 div_*), pic_user_id, dibuat_oleh, deskripsi_tugas, status, prioritas, deadline | N–1 ke Kegiatan, User (PIC & pembuat) |
| **RSVP** | id, kegiatan_id, user_id, status (terdaftar/dibatalkan) | Tidak berubah dari v2.1 |
| **Presensi** | id, sesi_id, user_id, catatan, waktu_isi | Tidak berubah |
| **Anggaran** | id, kegiatan_id, jenis, sumber_kategori, estimasi, realisasi | Tidak berubah struktur, akses dikontrol jabatan |
| **Evaluasi** | id, kegiatan_id, user_id, rating, komentar | Tidak berubah |
| **Dokumentasi** | id, kegiatan_id, tipe (foto/notulen), file_path, uploaded_by | Tidak berubah struktur, akses dikontrol jabatan (foto→PDD, notulen→Sekretaris) |
| **Surat** *(BARU)* | id, kegiatan_id, tipe (masuk/keluar), nomor_surat, jenis_surat, perihal, tanggal_surat, pengirim_penerima, file_path, keterangan, dibuat_oleh | N–1 ke Kegiatan, User |

> **Catatan migrasi penting:** entitas `DivisiPanitia` dan `TugasPanitia` yang sudah dibangun di Spec 3/4 sebelumnya **perlu direstrukturisasi**, bukan sekadar ditambah kolom. `DivisiPanitia` (nama_divisi bebas teks) digantikan `Kepanitiaan` (jabatan tetap, termasuk Ketua/Bendahara/Sekretaris yang sebelumnya tidak ada wadahnya sama sekali). Data existing (kalau ada) perlu strategi migrasi manual — divisi dengan nama yang cocok (Acara/Humas/PDD/Logistik) bisa dipetakan ke jabatan yang sesuai, divisi custom lain perlu keputusan terpisah (pertahankan sebagai kategori tambahan, atau hapus).

---

## 6. Kebutuhan Antarmuka & Struktur URL

Mengikuti `REVISI_REQUIREMENT_SIGAP.md` §16-17:

```
Pengurus:
/{team}/pengurus/kegiatan              (daftar, card-based)
/{team}/pengurus/kegiatan/{kegiatan}   (detail, read-only + slide-in trigger)
/{team}/pengurus/panitia               (selector kegiatan + proses)
/{team}/pengurus/anggaran              (selector kegiatan + proses)
/{team}/pengurus/dokumentasi           (selector kegiatan + proses)
/{team}/pengurus/evaluasi              (selector kegiatan + proses)
/{team}/pengurus/rundown               (selector kegiatan + proses)
/{team}/pengurus/surat                 (selector kegiatan + proses)

Anggota:
/{team}/anggota/dashboard              (termasuk widget Tugas Saya)
/{team}/anggota/kegiatan
/{team}/anggota/kegiatan/{kegiatan}
```

**Tidak ada route khusus untuk Tugas** — sesuai keputusan §2.6/FR-34.

Kegiatan Ketua Pelaksana/jabatan Kepanitiaan mengakses halaman proses (Panitia/Anggaran/dst) lewat route Pengurus yang sama (`/{team}/pengurus/...`), bukan namespace terpisah — otorisasi dicek di controller berdasarkan jabatan mereka di Kegiatan yang dipilih dari selector, bukan dari prefix URL.

---

## 7. Matriks Fase Pengerjaan (Diperbarui)

| Fase | Modul | FR Terkait |
|---|---|---|
| 1-2 | Foundation, Auth, Team (tidak berubah) | FR-01 - FR-06 |
| 3-6 | Kegiatan, Sesi, (Rundown pindah ke fase terpisah) | FR-07, FR-08, FR-09, FR-11, FR-12 |
| **Baru** | **Restrukturisasi Kepanitiaan** (migrasi DivisiPanitia/TugasPanitia lama → Kepanitiaan/Tugas baru) | FR-25 - FR-34 |
| 7 | Kalender + slide-in | FR-13 - FR-16 |
| 8 | RSVP | FR-17 - FR-20 |
| 9 | Presensi | FR-21 - FR-24 |
| **Baru** | Rundown (halaman terpisah) | FR-10 |
| **Baru** | Anggaran (dgn akses Bendahara/Logistik) | FR-35 - FR-38 |
| 10 | Evaluasi | FR-39 - FR-40 |
| **Baru** | Dokumentasi (akses PDD/Sekretaris) | FR-41 - FR-44 |
| **Baru** | **Surat Menyurat** | FR-45 - FR-49 |
| 11-12 | Dashboard direstruktur + Laporan | FR-50 - FR-54 |
| 13 | UI restructuring: card kegiatan + slide-in, testing, deployment | — |

---

## 8. Pengembangan Lanjutan (Tidak Berubah dari v2.1)

Peserta eksternal, filter multi-divisi organisasi lintas-Team, notifikasi otomatis, QR code presensi, approval izin/sakit, geolocation — semua tetap di luar scope.

---

## 9. Riwayat Revisi

Lihat versi sebelumnya (v1.0-v2.1) untuk histori lengkap.

| Versi | Perubahan |
|---|---|
| v2.1 | Modul Dokumentasi dikonfirmasi & ditambahkan (lihat riwayat sebelumnya untuk detail v2.0). |
| **v3.0** | **Revisi besar berdasarkan `REVISI_REQUIREMENT_SIGAP.md`.** (a) **Koreksi model role**: Team Role ternyata flat (`pengurus`/`anggota`), bukan Owner/Admin/Member seperti diasumsikan di v2.0-2.1 — dikoreksi berdasarkan audit kode aktual. (b) **Otorisasi jadi 4 layer**: Global Role → Team Role → Role Kegiatan (Ketua Pelaksana, scoped per-Kegiatan, tidak otomatis lintas-Kegiatan) → Jabatan Kepanitiaan (Bendahara & Sekretaris masing-masing tunggal per Kegiatan; 4 Divisi tetap — Acara/Humas/PDD/Logistik — masing-masing bisa banyak anggota). (c) **Panitia direstrukturisasi total**: entitas `DivisiPanitia`+`TugasPanitia` lama diganti `Kepanitiaan`+`Tugas` baru — perlu migrasi data, bukan sekadar tambahan kolom. (d) **Modul baru: Surat Menyurat** (FR-45 - FR-49), akses Sekretaris (semua tipe) dan Div Humas (surat keluar saja). (e) **Dokumentasi dipisah akses per tipe**: foto→Div PDD, notulen→Sekretaris. (f) **Anggaran dipisah akses**: Bendahara akses penuh, Div Logistik cuma kategori logistik. (g) **Manajemen Tugas ditambahkan TAPI sengaja TIDAK dapat halaman/route sendiri** — cuma widget "Tugas Saya" di Dashboard Anggota. (h) **Arsitektur UI dipisah tegas**: Detail Kegiatan jadi read-only murni (termasuk versi slide-in dari card/kalender/dashboard), seluruh proses CRUD (Panitia/Anggaran/Dokumentasi/Evaluasi/Rundown/Surat) pindah ke halaman masing-masing dengan selector Kegiatan. (i) Daftar Kegiatan jadi card-based dengan tombol Edit/Hapus. (j) Dashboard Pengurus & Anggota direstruktur, termasuk perbaikan bug "Kegiatan Akan Datang" yang sempat tidak menampilkan Kegiatan Terbuka yang belum di-RSVP (FR-52). Struktur URL baru mengikuti `/{team}/pengurus/{fitur}` dan `/{team}/anggota/{fitur}`.

**Dokumen pendamping (ERD, Data Dictionary, Class Diagram, Use Case, API Endpoints, SKILL.md, Task Breakdown) BELUM disesuaikan ke v3.0 ini** — perbedaannya cukup besar (skema Kepanitiaan baru, entitas Surat baru, restrukturisasi UI) sehingga semuanya perlu ditulis ulang, bukan diedit sebagian. Beri tahu kapan siap lanjut ke situ.
