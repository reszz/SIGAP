# Software Requirements Specification (SRS)
## SIGAP — Sistem Informasi Kegiatan, Absensi, dan Pelaporan

Proyek PKL — Institut Digital Ekonomi LPKIA Bandung
Disusun oleh: Salira Restu Gusti
Skala pengerjaan: 1 bulan (4 minggu efektif)

---

## 1. Pendahuluan

### 1.1 Tujuan Dokumen
Dokumen ini merinci kebutuhan fungsional dan non-fungsional dari platform SIGAP, sebagai acuan pengembangan selama masa PKL, diturunkan langsung dari Proposal Pengajuan Proyek PKL SIGAP dan disusun mengikuti timeline 4 minggu yang telah ditetapkan.

### 1.2 Ruang Lingkup Produk
SIGAP adalah platform manajemen kegiatan (event organizer) terpusat untuk organisasi mahasiswa, mencakup: jadwal & rundown kegiatan, manajemen panitia, pendaftaran/RSVP peserta, presensi digital, manajemen anggaran sederhana, arsip dokumentasi, evaluasi pasca-kegiatan, dan export laporan gabungan untuk keperluan LPJ (Laporan Pertanggungjawaban).

### 1.3 Definisi & Istilah

| Istilah | Definisi |
|---|---|
| Pengurus / Admin | Anggota organisasi dengan hak kelola penuh atas kegiatan |
| Anggota | Pengguna dengan akun login sendiri yang dapat melihat, RSVP, dan mengisi presensi kegiatan |
| RSVP | Pendaftaran kehadiran sebelum kegiatan berlangsung |
| LPJ | Laporan Pertanggungjawaban kegiatan |
| Divisi Panitia | Kelompok tugas kepanitiaan (Acara, Humas, Logistik, Konsumsi, dst.) |
| Kegiatan | Satu payung acara yang dapat terdiri dari satu atau lebih Sesi (mendukung kegiatan multi-hari) |
| Sesi Kegiatan | Satu unit tanggal/waktu/lokasi di dalam sebuah Kegiatan — kegiatan 1 hari punya 1 sesi, kegiatan multi-hari punya beberapa sesi yang tetap tergabung dalam satu Kegiatan (satu warna, satu identitas) |
| Kode Presensi | Kode/tautan unik per sesi untuk mengisi form presensi (memerlukan login Anggota) |

### 1.4 Referensi
- Proposal Pengajuan Proyek PKL "SIGAP" (2026), Salira Restu Gusti, Teknik Informatika, IDE LPKIA Bandung.
- `design.md` — brief desain UI/UX SIGAP (dokumen terpisah, satu paket dengan SRS ini).

---

## 2. Deskripsi Umum

### 2.1 Perspektif Produk
SIGAP adalah aplikasi web baru (bukan pengembangan sistem lama), dibangun dengan **Laravel + Inertia.js + React + TypeScript + Tailwind CSS**, ditujukan sebagai pengganti kombinasi manual (kertas, Google Form, chat WhatsApp, spreadsheet terpisah) yang selama ini dipakai pengurus organisasi mahasiswa.

### 2.2 Fungsi Utama Produk
Merujuk pemetaan solusi pada proposal, sepuluh permasalahan inti (presensi manual, data tersebar, sulit rekap kehadiran, tidak ada riwayat terpusat, info tercecer di WA, jadwal tidak diketahui tepat waktu, sulit lihat keaktifan anggota, tidak ada reminder, LPJ sulit disusun, dokumentasi tercecer) dijawab lewat modul: **Kegiatan & Rundown, RSVP, Presensi Digital, Panitia, Anggaran, Dokumentasi, Evaluasi, Dashboard Rekap, dan Export Laporan.**

### 2.3 Karakteristik Pengguna

| Peran | Deskripsi | Hak Akses Utama |
|---|---|---|
| **Anggota** | Mahasiswa anggota organisasi, memiliki akun login sendiri | Lihat kegiatan, RSVP, isi presensi (tervalidasi akun), isi evaluasi, lihat riwayat pribadi |
| **Pengurus (Admin)** | Pengurus/panitia inti organisasi | Semua hak anggota + CRUD kegiatan & sesi, kelola panitia, anggaran, dokumentasi, dashboard rekap, export laporan |

### 2.4 Batasan Sistem
- Skala pengerjaan versi ini dibatasi 1 bulan/4 minggu — setiap modul dikerjakan dalam **versi sederhana** (lihat catatan proposal §XI): manajemen panitia cukup assign anggota + status tugas (tanpa notifikasi otomatis), anggaran cukup estimasi/realisasi tanpa laporan keuangan mendalam.
- Fitur QR Code presensi, notifikasi H-1 otomatis, generate undangan digital, approval izin/sakit, validasi geolocation, dan filter multi-divisi/multi-unit **tidak termasuk** dalam ruang lingkup versi ini — dicatat sebagai pengembangan tahap lanjutan (lihat §9).
- Kalender kegiatan menggunakan library **FullCalendar** (`@fullcalendar/react`) sebagai komponen utama navigasi kegiatan.
- Satu Kegiatan dapat memiliki lebih dari satu Sesi (tanggal/waktu berbeda) untuk mendukung acara multi-hari; seluruh sesi dalam satu Kegiatan tetap tampil dengan satu warna yang sama di kalender.
- Seluruh peserta kegiatan (baik tipe Wajib Hadir maupun Terbuka) dibatasi pada **Anggota organisasi yang sudah terdaftar** di sistem. Pendaftaran peserta eksternal/tamu di luar organisasi (mis. mahasiswa umum untuk seminar terbuka) **tidak termasuk** dalam ruang lingkup versi ini — SIGAP versi PKL ini fokus sebagai alat bantu *event organizer internal* organisasi, bukan platform pendaftaran publik (lihat §9).
- **Status Sesi** (Terjadwal/Berlangsung/Selesai) **dihitung on-the-fly** (computed attribute, membandingkan waktu saat ini terhadap `waktu_mulai`/`waktu_selesai`), **bukan** kolom tersimpan yang di-update lewat scheduled job/cron. Ini sengaja dipilih untuk menghindari kebutuhan infrastruktur cron yang dianggap berlebihan untuk scope 1 bulan — lihat detail di `SIGAP-DataDictionary.md` §3.

### 2.5 Pustaka Pihak Ketiga yang Diputuskan

| Kebutuhan | Pustaka | Catatan |
|---|---|---|
| Autentikasi | `laravel/fortify` | Bawaan Laravel React Starter Kit (Inertia). Fitur registrasi publik dinonaktifkan (lihat `SIGAP-API-Endpoints.md` §0) |
| Kalender | `@fullcalendar/react` | Sudah diputuskan sejak awal, lihat `design.md` §6 |
| Export Excel | `maatwebsite/excel` | Standar de-facto ekosistem Laravel untuk export/import Excel |
| Export PDF | `barryvdh/laravel-dompdf` | Standar de-facto ekosistem Laravel untuk generate PDF dari HTML/Blade |
| Storage dokumentasi | Laravel local disk (`storage/app/public`) | Cukup untuk scope PKL 1 bulan; migrasi ke cloud storage (S3, dst.) dicatat sebagai pengembangan lanjutan jika kebutuhan storage membesar |

### 2.6 Asumsi
- Satu organisasi per instansi database pada versi ini (belum multi-tenant/multi-unit).
- Seluruh Anggota memiliki akun login (dibuat oleh Pengurus atau registrasi mandiri dengan NIM terverifikasi terhadap data anggota organisasi) — tidak ada jalur presensi/RSVP tanpa login.
- Akun **Pengurus pertama** (sebelum ada siapa pun di database) dibuat manual lewat **Database Seeder** Laravel saat setup awal, bukan lewat form aplikasi — password sementara wajib diganti saat login pertama. Penambahan/pergantian akun Pengurus berikutnya (mis. pergantian kepengurusan tiap periode) untuk versi PKL ini juga masih lewat seeder/`artisan tinker` manual, **belum** ada halaman UI khusus kelola akun Pengurus (beda dengan kelola akun Anggota yang sudah ada UI-nya, FR-03) — dicatat sebagai pengembangan lanjutan di §9.
- Presensi harus dilakukan dalam kondisi login dan divalidasi terhadap data akun Anggota yang bersangkutan (bukan input teks bebas), untuk mencegah presensi atas nama orang lain.
- Warna setiap Kegiatan bersifat bebas (tidak terikat kategori), namun sistem menjamin dua Kegiatan yang tampil berdekatan di kalender tidak memakai warna yang identik.
- Pengembang tunggal (Salira Restu Gusti) mengerjakan seluruh modul selama masa PKL.

---

## 3. Kebutuhan Fungsional

Kebutuhan fungsional dikelompokkan per modul dan dipetakan ke minggu pengerjaan sesuai timeline proyek.

### 3.1 Modul Autentikasi *(Minggu 2)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-01 | Sistem menyediakan login dengan email/NIM & password untuk kedua role (Pengurus dan Anggota) | Anggota, Pengurus |
| FR-02 | Sistem menyediakan logout | Anggota, Pengurus |
| FR-03 | Akun Anggota dibuat oleh Pengurus (input massal/manual data anggota) sehingga NIM yang login sudah pasti terdaftar sebagai anggota organisasi yang sah | Pengurus |
| FR-04 | Sistem melindungi seluruh halaman pengelolaan (kegiatan, panitia, anggaran) agar hanya dapat diakses Pengurus yang login, dan seluruh halaman RSVP/presensi/evaluasi agar hanya dapat diakses Anggota yang login | Anggota, Pengurus |

### 3.2 Modul Kegiatan, Jadwal & Rundown *(Minggu 1–2)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-05 | Pengurus dapat menambah Kegiatan baru (nama, **tipe: Wajib Hadir atau Terbuka+RSVP**, kuota — hanya berlaku jika tipe Terbuka, deskripsi) beserta satu atau lebih Sesi (tanggal, waktu mulai/selesai, lokasi per sesi) — mendukung kegiatan satu hari maupun multi-hari | Pengurus |
| FR-06 | Pengurus dapat mengedit dan menghapus data Kegiatan beserta sesi-sesinya (tambah/hapus sesi individual tanpa membuat Kegiatan baru) | Pengurus |
| FR-07 | Pengurus dapat menyusun rundown acara (baris waktu + uraian acara per baris) untuk tiap Sesi | Pengurus |
| FR-08 | Sistem menampilkan seluruh Sesi dari seluruh Kegiatan dalam tampilan kalender (FullCalendar) dengan status visual (Terjadwal/Berlangsung/Selesai) per sesi | Anggota, Pengurus |
| FR-09 | Anggota & Pengurus dapat mengklik sebuah event/sesi di kalender untuk membuka kartu detail Kegiatan (rundown, panitia, RSVP/kuota jika tipe Terbuka, dst. sesuai role); jika Kegiatan multi-hari, kartu detail menampilkan seluruh sesi terkait dalam satu tampilan | Anggota, Pengurus |
| FR-10 | Setiap Kegiatan memiliki satu warna unik yang otomatis di-assign sistem (dapat diubah manual oleh Pengurus) dan diterapkan konsisten ke seluruh sesi milik Kegiatan tersebut, sehingga sesi-sesi dari kegiatan multi-hari yang sama tetap terlihat sebagai satu identitas warna di kalender | Sistem, Pengurus |
| FR-11 | Kalender mendukung tampilan Bulan, Minggu, dan Agenda (list) | Anggota, Pengurus |

### 3.3 Modul Pendaftaran / RSVP *(Minggu 2)*
Modul ini **hanya berlaku untuk Kegiatan bertipe Terbuka**. Kegiatan bertipe Wajib Hadir (mis. rapat rutin) melewati modul ini sepenuhnya — seluruh Anggota otomatis dianggap diundang tanpa perlu mendaftar, dan bisa langsung mengisi presensi begitu sesi dimulai (lihat FR-16).

RSVP disederhanakan menjadi **satu alur saja (instant)** — begitu Anggota RSVP, langsung mendapat slot selama kuota masih tersedia, **tanpa proses persetujuan Pengurus**. Ini keputusan sadar untuk menjaga scope tetap realistis untuk 1 bulan/1 developer: HMIF sendiri tidak punya kebutuhan menyeleksi peserta acara, RSVP di sini murni soal mengelola kuota tempat/kursi, bukan seleksi siapa yang boleh ikut.

RSVP berada di **level Kegiatan** (bukan per Sesi) — satu kali RSVP otomatis berlaku untuk seluruh sesi dalam Kegiatan tersebut, termasuk kegiatan multi-hari.

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-12 | Untuk Kegiatan bertipe **Terbuka**, Anggota yang RSVP langsung mendapat status `terdaftar` selama kuota masih tersedia; jika kuota penuh, sistem menolak dengan pesan jelas | Anggota, Sistem |
| FR-12a | Untuk Kegiatan bertipe **Wajib Hadir**, sistem tidak menampilkan alur RSVP sama sekali — Anggota langsung diarahkan ke opsi presensi begitu sesi berstatus Berlangsung | Sistem |
| FR-12c | Anggota dapat membatalkan RSVP yang sudah diajukan sebelum kegiatan berlangsung; status berubah menjadi `dibatalkan` dan slot kuota yang terpakai kembali tersedia | Anggota |
| FR-13 | Sistem menampilkan status pendaftaran (`terdaftar` / `dibatalkan`) dan sisa kuota secara real-time untuk kegiatan Terbuka. **Kuota terpakai dihitung hanya dari peserta berstatus `terdaftar`** | Anggota, Pengurus, Sistem |
| FR-14 | Pengurus dapat melihat daftar peserta yang RSVP suatu kegiatan Terbuka (read-only — tidak ada aksi setuju/tolak karena RSVP bersifat instant) | Pengurus |

### 3.4 Modul Presensi Digital *(Minggu 2)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-15 | Setiap Sesi kegiatan otomatis mendapatkan kode/tautan presensi unik | Sistem |
| FR-16 | Anggota harus login terlebih dahulu untuk mengisi presensi; identitas (Nama, NIM, Jabatan/Divisi) terisi otomatis dari data akun, bukan input teks bebas — Anggota hanya menambahkan Catatan opsional lalu konfirmasi kehadiran. Untuk Kegiatan bertipe **Terbuka**, presensi **hanya dapat diisi jika status RSVP Anggota tersebut = `terdaftar`** (RSVP yang sudah `dibatalkan` tidak dapat mengisi presensi). Untuk Kegiatan bertipe **Wajib Hadir**, tidak ada syarat RSVP — semua Anggota dapat langsung mengisi presensi | Anggota |
| FR-17 | Sistem memvalidasi bahwa akun yang mengisi presensi memang tercatat sebagai Anggota terdaftar organisasi (dan, khusus Kegiatan Terbuka, tercatat berstatus RSVP "terdaftar") sebelum menyimpan data presensi | Sistem |
| FR-18 | Sistem menyimpan setiap data presensi terhubung ke `user_id` dan Sesi terkait, serta mencegah presensi ganda oleh akun yang sama pada sesi yang sama | Sistem |

### 3.5 Modul Panitia & Pembagian Tugas *(Minggu 3)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-19 | Pengurus dapat meng-assign anggota ke divisi panitia (Acara, Humas, Logistik, Konsumsi, dst.) pada suatu kegiatan | Pengurus |
| FR-20 | Pengurus dapat memberikan checklist tugas per anggota/divisi dengan status (belum/sedang/selesai) | Pengurus |
| FR-21 | Anggota panitia dapat melihat tugas yang diberikan kepadanya dan mengubah status tugasnya sendiri | Anggota |

### 3.6 Modul Anggaran Sederhana *(Minggu 3)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-22 | Pengurus dapat mencatat estimasi anggaran (pemasukan kas/sponsor, pengeluaran konsumsi/venue/doorprize) per kegiatan | Pengurus |
| FR-23 | Pengurus dapat mencatat realisasi anggaran dan sistem menghitung selisih terhadap estimasi | Pengurus |
| FR-24 | Sistem menampilkan ringkasan pemasukan/pengeluaran per kegiatan | Pengurus |

### 3.7 Modul Dokumentasi *(Minggu 3)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-25 | Pengurus dapat mengunggah foto dan notulen kegiatan, terhubung langsung ke record kegiatan terkait | Pengurus |
| FR-26 | Pengurus dan Anggota dapat melihat arsip dokumentasi suatu kegiatan dari kartu detail kegiatan | Anggota, Pengurus |

### 3.8 Modul Evaluasi Pasca-Kegiatan *(Minggu 4)*
Evaluasi disederhanakan menjadi dua input: **rating 1–5** (dipakai untuk statistik rata-rata kepuasan) dan **komentar bebas** (textarea, untuk kritik/saran/masukan). Setiap Anggota hanya mengisi **satu evaluasi per Kegiatan**, tetapi isiannya dapat diedit kembali selama diperlukan.

| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-27 | Anggota dapat mengisi form evaluasi (rating 1–5 + komentar bebas) setelah Kegiatan berstatus Selesai | Anggota |
| FR-27a | Sistem membatasi satu evaluasi per Anggota per Kegiatan (constraint unik `kegiatan_id + user_id`); jika Anggota mengisi ulang, sistem mengarahkan ke mode **edit** evaluasi yang sudah ada, bukan membuat baris baru | Sistem |
| FR-27b | Anggota dapat mengedit rating dan/atau komentar evaluasi yang pernah diisi | Anggota |
| FR-28 | Pengurus dapat melihat ringkasan hasil evaluasi per Kegiatan: rata-rata rating dan daftar komentar | Pengurus |

### 3.9 Modul Dashboard Rekap *(Minggu 4)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-29 | Pengurus dapat melihat dashboard rekap kehadiran per anggota (total lintas kegiatan dalam satu periode) | Pengurus |
| FR-30 | Pengurus dapat melihat dashboard rekap kehadiran per kegiatan | Pengurus |
| FR-31 | Dashboard menampilkan statistik keaktifan gabungan (kehadiran + keterlibatan sebagai panitia) per anggota | Pengurus |
| FR-32 | Anggota dapat melihat riwayat kehadiran dan keikutsertaannya sendiri | Anggota |

### 3.10 Modul Export Laporan *(Minggu 4)*
| ID | Kebutuhan | Aktor |
|---|---|---|
| FR-33 | Pengurus dapat memilih kegiatan/periode tertentu untuk direkap | Pengurus |
| FR-34 | Sistem dapat mengekspor data gabungan (kehadiran, anggaran, evaluasi) ke format Excel | Pengurus |
| FR-35 | Sistem dapat mengekspor data gabungan ke format PDF | Pengurus |

---

## 4. Kebutuhan Non-Fungsional

| ID | Kategori | Kebutuhan |
|---|---|---|
| NFR-01 | Usability | Form presensi (setelah login) harus dapat diisi tanpa training, selesai dalam <15 detik di perangkat mobile karena identitas sudah terisi otomatis dari akun |
| NFR-02 | Performance | Halaman kalender (FullCalendar) memuat data kegiatan bulanan dalam <2 detik pada koneksi kampus standar |
| NFR-03 | Security | Seluruh endpoint pengelolaan kegiatan/panitia/anggaran dilindungi middleware autentikasi Pengurus |
| NFR-04 | Security | Kode/tautan presensi bersifat unik per sesi dan tidak dapat ditebak (random token, bukan sequential ID); mengisi presensi tetap mewajibkan sesi login Anggota yang valid |
| NFR-05 | Compatibility | Antarmuka responsif dan berfungsi baik pada layar mobile (<640px), tablet, dan desktop |
| NFR-06 | Maintainability | Struktur kode mengikuti konvensi Laravel + Inertia.js + React + TypeScript agar mudah dikembangkan pada tahap lanjutan |
| NFR-07 | Reliability | Data presensi tidak boleh hilang meskipun pengisi menutup halaman sebelum konfirmasi — validasi sisi server wajib |
| NFR-08 | Data Integrity | Penghapusan data kegiatan harus mempertimbangkan data terkait (rundown, presensi, RSVP, anggaran, dokumentasi) — gunakan soft delete atau konfirmasi eksplisit |

---

## 5. Kebutuhan Data (Model Entitas)

Entitas inti yang perlu dirancang pada skema database (dikerjakan Minggu 1, sebagai bagian dari desain ERD):

| Entitas | Atribut Kunci | Relasi |
|---|---|---|
| **User** | id, name, NIM, email, password, role (pengurus/anggota) *(kolom `name` — bukan `nama` — mengikuti konvensi bawaan Laravel React Starter Kit/Fortify, satu-satunya pengecualian dari penamaan Bahasa Indonesia di dokumen ini)* | 1–N ke TugasPanitia, RSVP, Presensi, Evaluasi |
| **Kegiatan** | id, nama, deskripsi, **tipe (wajib_hadir / terbuka)**, kuota (nullable, hanya untuk tipe terbuka), warna (hex) | 1–N ke Sesi, Panitia, RSVP, Anggaran, Dokumentasi, Evaluasi |
| **Sesi** | id, kegiatan_id, tanggal, waktu_mulai, waktu_selesai, lokasi, **status (computed on-the-fly, bukan kolom tersimpan — lihat §2.5)**, kode_presensi | N–1 ke Kegiatan; 1–N ke Rundown, Presensi |
| **Rundown** | id, sesi_id, waktu, uraian_acara, urutan | N–1 ke Sesi |
| **DivisiPanitia** | id, kegiatan_id, nama_divisi | 1–N ke TugasPanitia |
| **TugasPanitia** | id, divisi_id, user_id, deskripsi_tugas, status | N–1 ke DivisiPanitia, User |
| **RSVP** | id, kegiatan_id, user_id, status (**terdaftar/dibatalkan**), waktu_daftar | N–1 ke Kegiatan, User — RSVP berlaku untuk seluruh Kegiatan (bukan per sesi), karena satu pendaftaran sudah mencakup semua sesi multi-hari. Constraint unik `kegiatan_id + user_id` (satu Anggota hanya punya satu baris RSVP aktif per Kegiatan) |
| **Presensi** | id, sesi_id, user_id, catatan, waktu_isi | N–1 ke Sesi, User — identitas (nama/NIM/jabatan) diambil dari relasi User, bukan disimpan ulang sebagai teks |
| **Anggaran** | id, kegiatan_id, jenis (pemasukan/pengeluaran), sumber_kategori, estimasi, realisasi | N–1 ke Kegiatan |
| **Dokumentasi** | id, kegiatan_id, tipe (foto/notulen), file_path, uploaded_by | N–1 ke Kegiatan |
| **Evaluasi** | id, kegiatan_id, user_id, rating (1–5), komentar, updated_at | N–1 ke Kegiatan, User — constraint unik `kegiatan_id + user_id` (satu evaluasi per Anggota per Kegiatan, dapat diedit) |

> **Catatan desain:** pemisahan Kegiatan ↔ Sesi adalah kunci untuk mendukung acara multi-hari — satu Kegiatan (nama, warna, kuota RSVP) bisa punya banyak Sesi (tanggal/jam/lokasi berbeda tiap hari), masing-masing dengan rundown dan presensinya sendiri, tapi tetap tampil sebagai satu identitas warna yang sama di kalender.

---

## 6. Kebutuhan Antarmuka

- **Antarmuka Kalender:** wajib menggunakan FullCalendar (`@fullcalendar/react`) dengan plugin `dayGrid`, `timeGrid`, `list`, `interaction`. Setiap event di kalender merepresentasikan satu Sesi, dengan warna diambil dari `Kegiatan.warna` (bukan kategori) sehingga sesi-sesi dari Kegiatan multi-hari yang sama tampil dengan warna identik. Struktur event & perilaku `eventClick` mengikuti spesifikasi pada `design.md` §6.
- **Antarmuka Detail Kegiatan:** dibuka sebagai panel slide-in/bottom-sheet saat event kalender diklik, bukan halaman terpisah; jika Kegiatan memiliki >1 sesi, panel menampilkan selector/tab tanggal untuk berpindah antar sesi (lihat `design.md` §4 & §6).
- **Antarmuka Form Presensi:** halaman `/presensi/{kode_unik_sesi}`, mewajibkan Anggota login terlebih dahulu (redirect ke login jika belum), lalu menampilkan identitas ter-autofill dari akun untuk dikonfirmasi.
- **Antarmuka Export:** tombol export tersedia dari Dashboard Rekap dan dari kartu detail kegiatan (export per-kegiatan maupun per-periode).

---

## 7. Matriks Kebutuhan vs Timeline

| Minggu | Modul Dikerjakan | Kebutuhan Terkait |
|---|---|---|
| Minggu 1 | Analisis, wireframe, desain ERD | Dasar seluruh FR & entitas §5 |
| Minggu 2 | Setup project, Kegiatan & Rundown, RSVP, Presensi | FR-05 s/d FR-18 |
| Minggu 3 | Panitia, Anggaran, Dokumentasi, testing modul 1–3 | FR-19 s/d FR-26 |
| Minggu 4 | Evaluasi, Dashboard Rekap, Export, testing akhir, dokumentasi teknis, presentasi | FR-27 s/d FR-35 |

---

## 8. Target Output (mengacu Proposal §XII)

1. Platform manajemen kegiatan & presensi organisasi yang berfungsi dengan baik, mencakup seluruh modul inti (panitia, rundown, RSVP, presensi, anggaran, dokumentasi, evaluasi).
2. Dokumentasi teknis sistem (struktur database dan alur sistem).
3. Laporan hasil pelaksanaan PKL.

---

## 9. Pengembangan Tahap Lanjutan (Di Luar Ruang Lingkup Versi Ini)

Sesuai proposal §XIV, berikut fitur yang **sengaja tidak termasuk** dalam SRS versi 1 bulan ini dan dicatat sebagai kandidat pengembangan lanjutan:

- QR Code Presensi (menggantikan input kode/tautan manual)
- Reminder/Notifikasi Otomatis (email/WhatsApp H-1)
- Generate Undangan Digital otomatis untuk pihak formal
- Approval Izin/Sakit oleh anggota
- Validasi Lokasi (Geolocation) saat presensi
- Filter Multi-Divisi/Multi-Unit (mendukung banyak sub-organisasi **di dalam satu organisasi yang sama**, mis. HMIF punya banyak divisi internal)
- **Dukungan multi-tenant** — platform dipakai lintas **organisasi/instansi yang berbeda** (bukan cuma satu HMIF, tapi bisa banyak himpunan/organisasi lain berbagi satu instalasi SIGAP dengan data terisolasi per organisasi). Ini berbeda dari poin filter multi-divisi di atas (yang masih dalam satu organisasi)
- Pendaftaran peserta eksternal/tamu di luar Anggota terdaftar (mis. membuka Kegiatan Terbuka untuk mahasiswa umum di luar organisasi, dengan alur registrasi tamu tanpa akun penuh)
- Halaman UI kelola akun Pengurus (tambah/hapus/edit sesama Pengurus dari aplikasi) — untuk versi PKL ini masih lewat Database Seeder/`artisan tinker` manual (lihat §2.6); pengembangan lanjutannya cukup meniru pola CRUD akun Anggota yang sudah ada

---

## 10. Keputusan Desain (Hasil Klarifikasi)

Empat pertanyaan terbuka pada draf sebelumnya telah dijawab dan diterapkan ke seluruh dokumen ini:

| # | Pertanyaan | Keputusan |
|---|---|---|
| 1 | Anggota perlu akun login? | **Ya.** Anggota memiliki akun login sendiri (dibuat Pengurus / registrasi dengan verifikasi NIM); tidak ada jalur presensi/RSVP tanpa login (FR-01–FR-04). |
| 2 | Skema warna kalender? | **Bebas per-Kegiatan**, tidak terikat kategori tetap. Sistem auto-assign warna unik ke tiap Kegiatan, Pengurus dapat override manual (FR-10). |
| 3 | Kegiatan multi-hari? | **Didukung.** Kegiatan dipisah dari Sesi (1 Kegiatan → N Sesi); tiap sesi punya tanggal/waktu/lokasi/rundown/presensi sendiri, tapi seluruh sesi tetap mewarisi satu warna Kegiatan yang sama (FR-05, FR-06, §5). |
| 4 | Validasi presensi? | **Tervalidasi terhadap akun Anggota.** Identitas presensi diambil dari data akun yang login, bukan input teks bebas (FR-16, FR-17, §5). |
| 5 | Siapa yang RSVP, dan untuk kegiatan apa? | **Campuran.** Kegiatan punya atribut `tipe`: **Wajib Hadir** (rapat rutin dsb — semua Anggota otomatis diundang, tanpa RSVP, langsung presensi) vs **Terbuka** (seminar/workshop dsb — perlu RSVP dulu, dibatasi kuota, presensi hanya untuk yang RSVP-nya berstatus "terdaftar") (FR-05, FR-12, FR-12a, FR-16). |
| 7 | Apakah RSVP perlu proses persetujuan Pengurus? | **Tidak.** RSVP disederhanakan jadi satu alur instant saja — HMIF tidak punya kebutuhan menyeleksi peserta, RSVP murni soal kuota tempat. Anggota RSVP → langsung `terdaftar` selama kuota ada, bisa `dibatalkan` kapan saja (FR-12, FR-12c). Mode Approval yang sempat dirancang dihapus dari scope (lihat §11 v1.3). |
| 8 | Bagaimana kuota dihitung & bagaimana bentuk evaluasi? | **Kuota** hanya menghitung peserta berstatus `terdaftar` (FR-13). **Evaluasi** disederhanakan jadi rating 1–5 + komentar bebas, satu per Anggota per Kegiatan, dan dapat diedit ulang (FR-27, FR-27a, FR-27b). |

Tidak ada lagi pertanyaan terbuka yang menghambat mulai pengerjaan Minggu 1.

---

## 11. Riwayat Revisi

| Versi | Perubahan |
|---|---|
| v1.0 | Draf awal berdasarkan Proposal PKL SIGAP. |
| v1.1 | Klarifikasi: akun login Anggota, warna bebas per-Kegiatan, dukungan multi-sesi, scope event organizer internal (lihat §10 item 1–6). |
| v1.2 | Hasil pembahasan lanjutan (sesuai `perubahan srs yang terjadi.txt`): (a) RSVP dibuat fleksibel dengan mode **Instant** vs **Approval** per Kegiatan, ditambah status `dibatalkan`; (b) kuota dihitung hanya dari RSVP berstatus `terdaftar`; (c) presensi Kegiatan Terbuka ditegaskan hanya untuk RSVP `terdaftar`; (d) Evaluasi disederhanakan jadi rating 1–5 + komentar bebas, satu evaluasi per Anggota per Kegiatan namun dapat diedit (lihat §10 item 7–8). Struktur inti (Pengurus/Anggota, Kegiatan Wajib Hadir/Terbuka, Sesi, Presensi, Panitia, Anggaran, Dokumentasi, Dashboard, Export) tidak berubah.
| v1.3 | **Penyederhanaan RSVP setelah refleksi kebutuhan riil.** Mode Approval dihapus sepenuhnya dari scope — RSVP kembali ke satu alur instant (daftar → langsung `terdaftar` selama kuota ada → bisa dibatalkan). Alasan: HMIF tidak punya kebutuhan menyeleksi peserta acara (dikonfirmasi user), dan kompleksitas approval (state `menunggu`/`ditolak`, endpoint setujui/tolak, UI kelola peserta) tidak sepadan untuk scope 1 bulan/1 developer. Field `mode_rsvp` di Kegiatan dan status `menunggu`/`ditolak` di RSVP dihapus dari model data. FR-12b dan FR-14a dihapus; FR-13 dan FR-14 disederhanakan. Modul lain tidak terpengaruh.
| v1.4 | **Audit konsistensi antara dokumen analisis dan `SIGAP-Tutorial-Setup.md`.** Ditemukan dan diperbaiki: (a) entitas User memakai kolom `name` (bukan `nama`) — mengikuti konvensi bawaan Laravel React Starter Kit/Fortify yang sudah dipakai di kode tutorial, disamakan di seluruh dokumen; (b) field `status_default` di entitas Kegiatan dihapus — sisa draf awal sebelum status dipindah jadi computed attribute milik Sesi, tidak pernah diimplementasikan; (c) kolom `created_at`/`updated_at` ditambahkan ke dokumentasi tabel `rundown`, `divisi_panitia`, `tugas_panitia` di ERD & Data Dictionary agar sesuai migration yang sudah ditulis di tutorial. Tidak ada perubahan pada logika bisnis atau scope fitur.

**Dokumen analisis pendamping** (satu paket dengan SRS ini, ada di folder yang sama):
- `design.md` — brief desain UI/UX
- `SIGAP-UseCaseDiagram.mermaid` — diagram use case
- `SIGAP-ERD.mermaid` — entity relationship diagram
- `SIGAP-DataDictionary.md` — kamus data lengkap tiap tabel
- `SIGAP-ClassDiagram.mermaid` — class diagram
- `SIGAP-SequenceDiagram-RSVP.mermaid` — sequence diagram alur RSVP (instant-only, lihat v1.3)
- `SIGAP-SequenceDiagram-Presensi.mermaid` — sequence diagram alur presensi
- `SIGAP-SequenceDiagram-Evaluasi.mermaid` — sequence diagram alur evaluasi (isi & edit)
- `SIGAP-StateDiagram-RSVP.mermaid` — state diagram status RSVP
- `SIGAP-StateDiagram-Sesi.mermaid` — state diagram status Sesi
