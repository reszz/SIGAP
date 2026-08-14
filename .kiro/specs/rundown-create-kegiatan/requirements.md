# Requirements Document

## Introduction

Fitur ini menambahkan input Rundown langsung ke dalam form Create Kegiatan (FR-10). Saat ini, Rundown hanya bisa diisi setelah Kegiatan dan Sesi sudah tersimpan melalui endpoint terpisah (`RundownController::upsert`). Dengan fitur ini, pengguna (Owner/Admin Team) dapat mengisi detail rundown tiap Sesi dalam satu form yang sama, dan seluruh data — Kegiatan, Sesi, dan Rundown — tersimpan dalam satu kali submit.

Rundown bersifat opsional per Sesi. `urutan` dihitung otomatis dari posisi baris dan direkompute saat baris dihapus sehingga tidak ada gap. Endpoint `RundownController::upsert` untuk edit sesi yang sudah ada tidak diubah.

## Glossary

- **Form_Create_Kegiatan**: Halaman `create.tsx` — form React untuk membuat Kegiatan baru beserta Sesi-sesinya.
- **Blok_Sesi**: Satu unit form Sesi di dalam Form_Create_Kegiatan, berisi tanggal, waktu mulai/selesai, lokasi, dan (setelah fitur ini) sub-bagian Rundown.
- **Baris_Rundown**: Satu entri rundown di dalam Blok_Sesi, berisi `waktu` (HH:mm) dan `uraian_acara` (teks). `urutan` diderivasi dari posisi baris.
- **KegiatanController_Store**: Handler `POST /{team_slug}/pengurus/kegiatan` di `KegiatanController::store()`.
- **StoreKegiatanRequest**: Form request yang memvalidasi payload dari Form_Create_Kegiatan.
- **Halaman_Detail_Kegiatan**: Halaman `kegiatan/show` dan komponen `EventDetailCard` yang menampilkan detail Kegiatan termasuk rundown tiap Sesi.
- **Owner_Admin**: Pengguna dengan team role `owner` atau `admin` — satu-satunya role yang dapat membuat Kegiatan.

---

## Requirements

### Requirement 1: Sub-bagian Rundown di Tiap Blok Sesi

**User Story:** Sebagai Owner/Admin Team, saya ingin mengisi rundown tiap Sesi langsung di form Create Kegiatan, agar saya tidak perlu membuka halaman terpisah setelah Kegiatan tersimpan.

#### Acceptance Criteria

1. THE Form_Create_Kegiatan SHALL menampilkan sub-bagian Rundown di dalam setiap Blok_Sesi, terletak di bawah field lokasi.
2. THE Form_Create_Kegiatan SHALL menyediakan tombol "Tambah Baris Rundown" di setiap sub-bagian Rundown yang menambahkan satu Baris_Rundown baru ke Blok_Sesi tersebut.
3. WHEN pengguna mengklik tombol "Tambah Baris Rundown", THE Form_Create_Kegiatan SHALL menambahkan satu Baris_Rundown baru dengan field `waktu` (time input HH:mm) dan `uraian_acara` (text input) yang kosong.
4. THE Form_Create_Kegiatan SHALL menampilkan nomor urut otomatis (1, 2, 3, …) di setiap Baris_Rundown berdasarkan posisi baris dalam sub-bagian Rundown.
5. WHEN pengguna menambahkan Blok_Sesi baru ke form, THE Form_Create_Kegiatan SHALL menampilkan sub-bagian Rundown kosong (0 Baris_Rundown) pada Blok_Sesi baru tersebut.

---

### Requirement 2: Hapus Baris Rundown dan Rekomputasi Urutan

**User Story:** Sebagai Owner/Admin Team, saya ingin bisa menghapus baris rundown yang salah tanpa mengacaukan urutan baris lain, agar data rundown tetap berurutan bersih (1, 2, 3, …).

#### Acceptance Criteria

1. THE Form_Create_Kegiatan SHALL menampilkan tombol hapus di setiap Baris_Rundown.
2. WHEN pengguna mengklik tombol hapus pada Baris_Rundown ke-N, THE Form_Create_Kegiatan SHALL menghapus baris tersebut dari daftar dan merekompute nomor urut seluruh baris yang tersisa sehingga urutannya menjadi 1, 2, 3, … tanpa gap.
3. IF sebuah Blok_Sesi hanya memiliki satu Baris_Rundown, THEN THE Form_Create_Kegiatan SHALL tetap mengizinkan penghapusan baris tersebut sehingga sub-bagian Rundown menjadi kosong.

---

### Requirement 3: Validasi Baris Rundown di Backend

**User Story:** Sebagai sistem, saya ingin memvalidasi data rundown sebelum disimpan, agar database tidak menerima data yang tidak lengkap atau tidak valid.

#### Acceptance Criteria

1. WHEN payload `POST` ke KegiatanController_Store mengandung array `sesi.*.rundown`, THE StoreKegiatanRequest SHALL memvalidasi bahwa setiap elemen array tersebut memiliki `waktu` berformat `H:i` dan `uraian_acara` berisi string tidak kosong dengan panjang maksimum 255 karakter.
2. IF elemen `sesi.*.rundown` tidak ada dalam payload (array kosong atau key tidak dikirim), THEN THE StoreKegiatanRequest SHALL menerimanya sebagai valid (rundown opsional per Sesi).
3. IF `sesi.*.rundown.*.waktu` tidak berformat `H:i`, THEN THE StoreKegiatanRequest SHALL mengembalikan pesan validasi error untuk field tersebut.
4. IF `sesi.*.rundown.*.uraian_acara` kosong atau melebihi 255 karakter, THEN THE StoreKegiatanRequest SHALL mengembalikan pesan validasi error untuk field tersebut.
5. THE StoreKegiatanRequest SHALL mengabaikan nilai `urutan` yang dikirim dari frontend — nilai `urutan` yang disimpan ke database HARUS diderivasi dari posisi elemen dalam array `sesi.*.rundown` (dimulai dari 1).

---

### Requirement 4: Penyimpanan Rundown Atomik Bersama Kegiatan dan Sesi

**User Story:** Sebagai Owner/Admin Team, saya ingin Kegiatan, Sesi, dan Rundown tersimpan sekaligus dalam satu submit, agar tidak ada data Kegiatan tersimpan tanpa Rundown-nya bila terjadi kegagalan.

#### Acceptance Criteria

1. WHEN KegiatanController_Store menerima payload valid yang berisi Kegiatan, satu atau lebih Sesi, dan satu atau lebih Baris_Rundown per Sesi, THE KegiatanController_Store SHALL menyimpan seluruh data — Kegiatan, Sesi, dan Rundown — dalam satu database transaction.
2. IF terjadi error saat menyimpan salah satu Rundown, THEN THE KegiatanController_Store SHALL me-rollback seluruh transaction sehingga tidak ada Kegiatan, Sesi, maupun Rundown yang tersimpan sebagian.
3. WHEN KegiatanController_Store menyimpan Baris_Rundown ke tabel `rundown`, THE KegiatanController_Store SHALL menyimpan nilai kolom `urutan` berdasarkan posisi elemen dalam array `sesi.*.rundown` (elemen ke-1 → `urutan = 1`, elemen ke-N → `urutan = N`).
4. WHEN KegiatanController_Store berhasil menyimpan Kegiatan beserta Sesi tanpa rundown (array rundown kosong atau tidak dikirim), THE KegiatanController_Store SHALL menyimpan Kegiatan dan Sesi tanpa membuat record Rundown apapun.

---

### Requirement 5: Tampilan Error Validasi Rundown di Form

**User Story:** Sebagai Owner/Admin Team, saya ingin melihat pesan error yang spesifik di samping field yang bermasalah, agar saya tahu persis baris dan field mana yang harus diperbaiki.

#### Acceptance Criteria

1. WHEN StoreKegiatanRequest mengembalikan error validasi untuk `sesi.{N}.rundown.{M}.waktu`, THE Form_Create_Kegiatan SHALL menampilkan pesan error tersebut di bawah field `waktu` pada Baris_Rundown ke-(M+1) dalam Blok_Sesi ke-(N+1).
2. WHEN StoreKegiatanRequest mengembalikan error validasi untuk `sesi.{N}.rundown.{M}.uraian_acara`, THE Form_Create_Kegiatan SHALL menampilkan pesan error tersebut di bawah field `uraian_acara` pada Baris_Rundown ke-(M+1) dalam Blok_Sesi ke-(N+1).
3. THE Form_Create_Kegiatan SHALL mempertahankan seluruh data yang sudah diisi pengguna (termasuk Baris_Rundown yang valid) setelah menerima respons validasi error, sehingga pengguna hanya perlu memperbaiki field yang bermasalah.

---

### Requirement 6: Rundown Tersimpan Ditampilkan di Halaman Detail dengan Urutan Benar

**User Story:** Sebagai anggota Team, saya ingin melihat rundown Kegiatan yang baru dibuat di halaman detail, agar saya tahu jadwal acara tiap Sesi secara berurutan.

#### Acceptance Criteria

1. WHEN Halaman_Detail_Kegiatan memuat data Kegiatan yang memiliki Sesi dengan Rundown, THE Halaman_Detail_Kegiatan SHALL menampilkan daftar Baris_Rundown tiap Sesi diurutkan berdasarkan nilai kolom `urutan` secara ascending.
2. WHEN Halaman_Detail_Kegiatan memuat data Kegiatan yang memiliki Sesi tanpa Rundown, THE Halaman_Detail_Kegiatan SHALL tidak menampilkan sub-bagian Rundown pada Sesi tersebut (tidak menampilkan daftar kosong atau placeholder).
3. THE Halaman_Detail_Kegiatan SHALL menampilkan `waktu` setiap Baris_Rundown dalam format HH:mm (5 karakter pertama dari nilai time) dan `uraian_acara` sebagai teks penuh.
