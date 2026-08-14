# Requirements Document

## Introduction

Fitur Manajemen Divisi Panitia (FR-25) memungkinkan Owner/Admin Team mengelola Divisi dalam sebuah Kegiatan langsung dari halaman Detail Kegiatan. Divisi adalah pengelompokan struktural panitia (mis. "Acara", "Konsumsi", "Perlengkapan") yang nantinya akan menjadi wadah penugasan anggota (FR-26–28, scope terpisah).

Saat ini tabel `divisi_panitia` dan model `DivisiPanitia` sudah ada; halaman `kegiatan/show` sudah menampilkan daftar Divisi secara read-only. Spec ini menambahkan operasi tambah dan hapus Divisi tanpa mengubah skema database.

## Glossary

- **DivisiPanitiaController**: Controller Laravel baru yang menangani operasi store dan destroy Divisi.
- **Divisi**: Record di tabel `divisi_panitia` yang memiliki `kegiatan_id` dan `nama_divisi`.
- **Kegiatan**: Record di tabel `kegiatan` yang memiliki `team_id`; menjadi induk Divisi.
- **Pengurus**: Member dengan Team Role `owner` atau `admin` — diverifikasi oleh middleware `EnsureUserHasRole:pengurus`.
- **Member**: Member dengan Team Role `member` — hanya punya akses baca.
- **Team Aktif**: Team yang slug-nya ada di URL prefix `/{current_team}/`.
- **halaman Detail Kegiatan**: Inertia page `kegiatan/show` yang di-render oleh `KegiatanController::detail()`.

## Requirements

### Requirement 1: Tambah Divisi Baru

**User Story:** Sebagai Pengurus, saya ingin menambah Divisi baru ke sebuah Kegiatan, agar saya dapat mengorganisasi struktur kepanitiaan sebelum mengassign tugas.

#### Acceptance Criteria

1. WHEN Pengurus mengirim POST ke `/{team}/pengurus/kegiatan/{kegiatan}/divisi` dengan `nama_divisi` valid, THE DivisiPanitiaController SHALL membuat record `divisi_panitia` baru dengan `kegiatan_id` dari `{kegiatan}` yang diminta.
2. WHEN Pengurus mengirim request store Divisi, THE DivisiPanitiaController SHALL memverifikasi bahwa `kegiatan.team_id` sama dengan `id` Team yang slug-nya adalah `{current_team}` sebelum membuat record.
3. IF `kegiatan.team_id` tidak sama dengan Team Aktif, THEN THE DivisiPanitiaController SHALL mengembalikan response 403.
4. WHEN store Divisi berhasil, THE DivisiPanitiaController SHALL mengembalikan `redirect()->back()` agar halaman Detail Kegiatan me-refresh data dengan Divisi baru.
5. WHEN store Divisi berhasil, THE DivisiPanitiaController SHALL menyertakan flash message `'success'` berisi konfirmasi nama Divisi yang ditambahkan.

---

### Requirement 2: Validasi Input Nama Divisi

**User Story:** Sebagai Pengurus, saya ingin sistem menolak input nama Divisi yang tidak valid, agar data kepanitiaan tetap bersih dan konsisten.

#### Acceptance Criteria

1. THE DivisiPanitiaController SHALL memvalidasi bahwa `nama_divisi` wajib diisi (required) dan tidak boleh kosong.
2. THE DivisiPanitiaController SHALL memvalidasi bahwa panjang `nama_divisi` tidak melebihi 100 karakter, sesuai panjang kolom `varchar(100)` di database.
3. IF `nama_divisi` kosong atau tidak dikirim, THEN THE DivisiPanitiaController SHALL mengembalikan validation error dengan kunci `nama_divisi` tanpa membuat record.
4. IF `nama_divisi` melebihi 100 karakter, THEN THE DivisiPanitiaController SHALL mengembalikan validation error dengan kunci `nama_divisi` tanpa membuat record.
5. THE DivisiPanitiaController SHALL mengizinkan duplikasi `nama_divisi` dalam satu Kegiatan yang sama (tidak ada constraint unique).

---

### Requirement 3: Hapus Divisi

**User Story:** Sebagai Pengurus, saya ingin menghapus Divisi yang tidak dipakai, agar struktur kepanitiaan tetap relevan dengan kondisi aktual.

#### Acceptance Criteria

1. WHEN Pengurus mengirim DELETE ke `/{team}/pengurus/divisi/{divisi}`, THE DivisiPanitiaController SHALL menghapus record `divisi_panitia` yang diminta.
2. WHEN Pengurus mengirim request destroy Divisi, THE DivisiPanitiaController SHALL memverifikasi bahwa `divisi.kegiatan.team_id` sama dengan `id` Team Aktif sebelum menghapus.
3. IF `divisi.kegiatan.team_id` tidak sama dengan Team Aktif, THEN THE DivisiPanitiaController SHALL mengembalikan response 403.
4. WHEN destroy Divisi berhasil, THE DivisiPanitiaController SHALL mengembalikan `redirect()->back()` agar halaman Detail Kegiatan me-refresh tanpa Divisi yang dihapus.
5. WHEN sebuah Divisi dihapus, THE Database SHALL menghapus semua record `tugas_panitia` dengan `divisi_id` yang sama secara otomatis via cascade delete (sudah dikonfigurasi di migration FK).

---

### Requirement 4: Kontrol Akses Role

**User Story:** Sebagai Member biasa, saya hanya ingin dapat melihat daftar Divisi tanpa bisa menambah atau menghapus, agar data kepanitiaan tidak dimodifikasi oleh pihak yang tidak berwenang.

#### Acceptance Criteria

1. THE Route SHALL menempatkan endpoint `POST /{team}/pengurus/kegiatan/{kegiatan}/divisi` dan `DELETE /{team}/pengurus/divisi/{divisi}` di dalam route group `pengurus/` yang dilindungi middleware `EnsureUserHasRole:pengurus`.
2. IF pengguna dengan Team Role `member` mencoba mengakses endpoint store atau destroy Divisi, THEN THE Middleware SHALL mengembalikan response 403 sebelum request mencapai DivisiPanitiaController.
3. WHILE pengguna adalah Member, THE halaman Detail Kegiatan SHALL menampilkan daftar Divisi tanpa form tambah Divisi dan tanpa tombol hapus Divisi.
4. WHILE pengguna adalah Pengurus, THE halaman Detail Kegiatan SHALL menampilkan form tambah Divisi dan tombol hapus di setiap baris Divisi dalam seksi Panitia.

---

### Requirement 5: Tampilan Manajemen Divisi di Halaman Detail Kegiatan

**User Story:** Sebagai Pengurus, saya ingin mengelola Divisi langsung dari halaman Detail Kegiatan tanpa berpindah halaman, agar alur kerja manajemen kepanitiaan tetap terpusat dan efisien.

#### Acceptance Criteria

1. WHEN Pengurus mengakses halaman Detail Kegiatan, THE halaman Detail Kegiatan SHALL menampilkan form inline di seksi "Panitia dan Tugas" yang berisi input `nama_divisi` dan tombol simpan untuk menambah Divisi baru.
2. WHEN Pengurus mengisi form tambah Divisi dan submit, THE halaman Detail Kegiatan SHALL mengirim request via Inertia `useForm` ke endpoint store tanpa full-page reload.
3. WHEN store Divisi berhasil dan halaman di-refresh oleh `redirect()->back()`, THE halaman Detail Kegiatan SHALL menampilkan Divisi baru di daftar tanpa input manual dari pengguna.
4. WHEN Pengurus mengklik tombol hapus pada sebuah Divisi, THE halaman Detail Kegiatan SHALL mengirim request DELETE via `router.delete` (Inertia) dan menampilkan konfirmasi sederhana sebelum mengirim.
5. IF store atau destroy Divisi menghasilkan validation error atau error 403, THEN THE halaman Detail Kegiatan SHALL menampilkan pesan error yang relevan kepada pengguna tanpa menutup form.
