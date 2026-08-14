# Requirements Document

## Introduction

Fitur ini melengkapi modul Manajemen Panitia SIGAP dengan kemampuan penuh:
assign Member Team ke Divisi Panitia beserta deskripsi tugas (FR-26), hapus
assignment tugas (FR-27), dan update status tugas oleh Member pemilik (FR-28).
Infrastruktur data (`tugas_panitia`, model `TugasPanitia`, relasi di
`DivisiPanitia`) dan tampilan read-only di `show.tsx` sudah ada — fitur ini
menambahkan endpoint mutasi, controller, dan UI interaktif di atasnya.

Seluruh operasi harus di-scope ke Team aktif untuk mencegah kebocoran data
antar-Team. Pengurus (owner/admin Team) mengelola assignment; Member hanya
boleh mengubah status tugasnya sendiri.

## Glossary

- **TugasPanitia**: Record satu tugas yang di-assign ke seorang Member dalam
  sebuah Divisi Panitia. Atribut: `id`, `divisi_id`, `user_id`,
  `deskripsi_tugas`, `status` (belum/sedang/selesai).
- **DivisiPanitia**: Kelompok tugas kepanitiaan (mis. Acara, Humas, Logistik)
  yang terhubung ke satu Kegiatan via `kegiatan_id`.
- **Pengurus**: User dengan `team_members.role` = `owner` atau `admin` pada
  Team aktif. Direpresentasikan oleh middleware `EnsureUserHasRole:pengurus`.
- **Member**: User dengan `team_members.role` = `member` pada Team aktif.
  Direpresentasikan oleh middleware `EnsureUserHasRole:anggota`.
- **Anggota_Team**: Semua Member yang terdaftar di Team yang sama dengan
  Kegiatan (`team_members` dimana `team_id = kegiatan.team_id`).
- **TugasPanitia_Controller**: Controller Laravel baru yang menangani
  store/destroy (Pengurus) dan update-status (Member pemilik).
- **Form_Assign**: Elemen UI per Divisi di halaman `kegiatan/show` yang
  memungkinkan Pengurus memilih Member dan mengisi deskripsi tugas.
- **Progres_Divisi**: Ringkasan "N dari M tugas selesai" yang ditampilkan di
  header setiap Divisi.

---

## Requirements

### Requirement 1: Assign Member Team ke Divisi Panitia (FR-26)

**User Story:** Sebagai Pengurus, saya ingin meng-assign Member Team ke Divisi
Panitia dengan deskripsi tugas, sehingga pembagian kerja kepanitiaan tercatat
di sistem dan terlihat oleh semua anggota.

#### Acceptance Criteria

1. WHEN Pengurus mengirim POST ke endpoint assign tugas dengan `user_id` yang
   valid, `divisi_id` yang valid, dan `deskripsi_tugas` yang tidak kosong, THE
   TugasPanitia_Controller SHALL membuat record `tugas_panitia` baru dengan
   `status` = `belum` dan merespons dengan redirect atau Inertia reload yang
   memuat data terbaru.

2. WHEN Pengurus mengirim request assign tugas, THE TugasPanitia_Controller
   SHALL memverifikasi bahwa `divisi_id` tersebut dimiliki oleh sebuah
   `DivisiPanitia` yang `kegiatan_id`-nya terhubung ke Team yang sama dengan
   user yang sedang login, dan IF verifikasi gagal, THEN THE
   TugasPanitia_Controller SHALL mengembalikan response 403.

3. WHEN Pengurus mengirim request assign tugas dengan `user_id` dari User yang
   bukan Member Team yang sama dengan Kegiatan terkait, THEN THE
   TugasPanitia_Controller SHALL mengembalikan validation error bahwa user
   tidak terdaftar di Team ini.

4. THE TugasPanitia_Controller SHALL mengizinkan satu Member memiliki lebih
   dari satu tugas dalam Divisi yang sama (tidak ada unique constraint
   `divisi_id + user_id`).

5. THE TugasPanitia_Controller SHALL mengizinkan satu Member di-assign ke
   lebih dari satu Divisi dalam Kegiatan yang sama.

6. IF `deskripsi_tugas` kosong atau melebihi 255 karakter, THEN THE
   TugasPanitia_Controller SHALL mengembalikan validation error dengan pesan
   yang menjelaskan batasan tersebut.

7. WHEN endpoint assign tugas berhasil, THE KegiatanController SHALL
   menyertakan prop `anggotaTeam` (daftar Member Team: `id` dan `name`) di
   respons halaman `kegiatan/show`, sehingga Form_Assign dapat merender
   dropdown pilihan Member.

---

### Requirement 2: Form Assign Tugas di UI Pengurus (FR-26 — Sisi Frontend)

**User Story:** Sebagai Pengurus, saya ingin melihat form assign tugas per
Divisi langsung di halaman detail Kegiatan, sehingga saya tidak perlu
berpindah halaman untuk mendelegasikan pekerjaan.

#### Acceptance Criteria

1. WHEN `canManage` bernilai `true` dan Divisi sudah ada, THE Form_Assign
   SHALL menampilkan dropdown berisi Anggota_Team (nama) dan input teks
   deskripsi tugas di bawah daftar tugas tiap Divisi yang sudah ada.

2. WHEN Pengurus berhasil submit Form_Assign, THE Form_Assign SHALL mereset
   field dropdown dan deskripsi ke kondisi kosong dan mempertahankan posisi
   scroll halaman.

3. WHEN Form_Assign sedang diproses (loading), THE Form_Assign SHALL
   menonaktifkan tombol submit untuk mencegah double-submit.

4. THE halaman `kegiatan/show` SHALL menampilkan Progres_Divisi berupa teks
   "N dari M tugas selesai" di header setiap Divisi, dihitung dari jumlah
   `tugas_panitia` dengan `status = selesai` dibanding total tugas di divisi
   tersebut.

5. WHEN `canManage` bernilai `false`, THE halaman `kegiatan/show` SHALL tidak
   menampilkan Form_Assign maupun tombol hapus tugas.

---

### Requirement 3: Hapus Assignment Tugas (FR-27)

**User Story:** Sebagai Pengurus, saya ingin menghapus tugas tertentu yang
sudah di-assign, sehingga kesalahan assignment atau perubahan pembagian kerja
dapat dikoreksi.

#### Acceptance Criteria

1. WHEN Pengurus mengirim DELETE ke endpoint hapus tugas dengan `tugas_id`
   yang valid, THE TugasPanitia_Controller SHALL menghapus record
   `tugas_panitia` tersebut secara permanen dan merespons dengan redirect atau
   Inertia reload yang memuat data terbaru.

2. WHEN Pengurus mengirim request hapus tugas, THE TugasPanitia_Controller
   SHALL memverifikasi bahwa `tugas_panitia` tersebut dimiliki oleh
   `DivisiPanitia` yang `kegiatan_id`-nya terhubung ke Team yang sama dengan
   user yang sedang login, dan IF verifikasi gagal, THEN THE
   TugasPanitia_Controller SHALL mengembalikan response 403.

3. WHEN Member (bukan Pengurus) mengirim DELETE ke endpoint hapus tugas dengan
   `tugas_id` milik dirinya sendiri sekalipun, THEN THE
   TugasPanitia_Controller SHALL mengembalikan response 403 karena hapus tugas
   hanya diizinkan untuk Pengurus.

4. WHEN Pengurus mengklik tombol hapus tugas di UI, THE halaman
   `kegiatan/show` SHALL menampilkan konfirmasi browser (`window.confirm`)
   sebelum mengirim request DELETE, untuk mencegah penghapusan tidak sengaja.

---

### Requirement 4: Update Status Tugas oleh Member Pemilik (FR-28)

**User Story:** Sebagai Member yang mendapat tugas kepanitiaan, saya ingin
mengubah status tugas saya sendiri (belum/sedang/selesai), sehingga Pengurus
dapat memantau progres pembagian kerja secara real-time.

#### Acceptance Criteria

1. WHEN Member mengirim PATCH ke `/tugas/{tugas}/status` dengan `status` yang
   valid (`belum`, `sedang`, atau `selesai`), THE TugasPanitia_Controller
   SHALL memperbarui kolom `status` pada record `tugas_panitia` tersebut dan
   merespons dengan redirect atau Inertia reload yang memuat data terbaru.

2. WHEN Member mengirim request update status, THE TugasPanitia_Controller
   SHALL memverifikasi bahwa `tugas_panitia.user_id` === ID user yang sedang
   login, dan IF verifikasi gagal, THEN THE TugasPanitia_Controller SHALL
   mengembalikan response 403.

3. WHEN Member mengirim request update status dengan payload yang menyertakan
   field selain `status` (mis. `deskripsi_tugas` atau `user_id`), THE
   TugasPanitia_Controller SHALL mengabaikan field tambahan tersebut dan hanya
   memperbarui `status`.

4. IF `status` yang dikirim bukan salah satu dari `belum`, `sedang`, atau
   `selesai`, THEN THE TugasPanitia_Controller SHALL mengembalikan validation
   error.

5. WHEN Pengurus (bukan pemilik tugas) mengirim PATCH ke endpoint update
   status milik Member lain, THEN THE TugasPanitia_Controller SHALL
   mengembalikan response 403, karena endpoint ini eksklusif untuk pemilik
   tugas.

6. THE TugasPanitia_Controller SHALL mengizinkan perubahan status ke arah mana
   saja (`belum → sedang`, `sedang → selesai`, `selesai → belum`, dll.) tanpa
   pembatasan urutan.

---

### Requirement 5: UI Update Status Tugas di Tampilan Member (FR-28 — Sisi Frontend)

**User Story:** Sebagai Member, saya ingin melihat tugas saya sendiri dengan
kontrol update status, sementara tugas milik Member lain tampil read-only,
sehingga saya tidak bisa mengubah status orang lain secara tidak sengaja.

#### Acceptance Criteria

1. WHEN `authUserId` cocok dengan `tugas.user.id`, THE halaman
   `kegiatan/show` SHALL menampilkan kontrol pembaruan status (mis. dropdown
   atau tombol tiga pilihan) untuk tugas tersebut, bukan teks status statis.

2. WHEN `authUserId` tidak cocok dengan `tugas.user.id`, THE halaman
   `kegiatan/show` SHALL menampilkan status tugas sebagai teks read-only tanpa
   kontrol interaktif.

3. WHEN kontrol update status di-submit oleh Member, THE kontrol tersebut
   SHALL menonaktifkan diri selama proses berlangsung dan mengembalikan ke
   kondisi aktif setelah mendapat respons, untuk mencegah double-submit.

4. THE KegiatanController SHALL menyertakan prop `authUserId` (integer, ID
   user yang sedang login) di respons halaman `kegiatan/show`, sehingga
   komponen React dapat membedakan tugas milik sendiri vs tugas orang lain
   tanpa request tambahan.

---

### Requirement 6: Integritas Data dan Scoping Team (Cross-Cutting)

**User Story:** Sebagai sistem, saya ingin memastikan semua operasi tugas
panitia terisolasi per Team, sehingga data kepanitiaan satu Team tidak pernah
bocor atau dimanipulasi oleh user dari Team lain.

#### Acceptance Criteria

1. THE TugasPanitia_Controller SHALL pada setiap endpoint mutasi memverifikasi
   rantai kepemilikan: `tugas_panitia → divisi_panitia → kegiatan → team_id`
   harus cocok dengan Team aktif user yang login, dan IF rantai putus di mana
   pun, THEN THE TugasPanitia_Controller SHALL mengembalikan response 403 atau
   404 tanpa mengekspos detail data milik Team lain.

2. WHEN endpoint store tugas dipanggil dengan `user_id` dari User yang
   memang terdaftar di Team yang benar, THE TugasPanitia_Controller SHALL
   menerima request — bahkan jika User tersebut juga merupakan Member di Team
   lain.

3. WHEN Divisi Panitia dihapus (oleh Pengurus via endpoint yang sudah ada),
   THE database SHALL menghapus seluruh `tugas_panitia` yang `divisi_id`-nya
   merujuk ke Divisi tersebut secara otomatis melalui `CASCADE DELETE` yang
   sudah terdefinisi di migration (tidak perlu logika manual).

4. THE sistem SHALL tidak memerlukan scheduled job atau cron untuk
   memelihara konsistensi data `tugas_panitia` — seluruh operasi bersifat
   sinkron (request/response) dan tidak bergantung pada state tersimpan di
   luar kolom `status`.
