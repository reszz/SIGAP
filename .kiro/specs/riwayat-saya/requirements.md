# Requirements Document

## Introduction

Fitur **Halaman Riwayat Saya** (FR-41) menyediakan halaman read-only yang menampilkan rekap keterlibatan personal seorang User di Team aktifnya — meliputi riwayat RSVP, riwayat presensi per sesi, dan (bila modul tersedia) riwayat evaluasi yang sudah diberikan. Halaman ini bersifat murni informatif, tidak ada aksi kelola, dan dapat diakses oleh semua Team Role (owner/admin/member). Data yang ditampilkan selalu di-scope ketat ke Team aktif User yang sedang login sehingga tidak ada kebocoran data antar-User maupun antar-Team.

---

## Glossary

- **Halaman_Riwayat**: Halaman `/riwayat-saya` yang menjadi subyek spesifikasi ini.
- **User_Aktif**: User yang sedang terautentikasi dan memiliki sesi login aktif.
- **Team_Aktif**: Team yang saat ini tercatat sebagai `current_team_id` pada record User_Aktif.
- **RSVP**: Record pada tabel `rsvp` yang menghubungkan User dengan Kegiatan bertipe `terbuka`. Status valid: `terdaftar` atau `dibatalkan`.
- **Presensi**: Record pada tabel `presensi` yang menghubungkan User dengan Sesi spesifik dan menyimpan `waktu_isi`.
- **Sesi**: Unit kegiatan individual dalam sebuah Kegiatan, memiliki `tanggal`, `waktu_mulai`, `waktu_selesai`, dan computed attribute `status` (`terjadwal` / `berlangsung` / `selesai`).
- **Kegiatan**: Entitas utama kegiatan organisasi yang dimiliki oleh sebuah Team (`kegiatan.team_id`). Bertipe `terbuka` atau `wajib_hadir`.
- **Evaluasi**: Record pada tabel `evaluasi` yang menghubungkan User dengan Kegiatan, berisi `rating` (1–5) dan `komentar` opsional.
- **Empty_State**: Komponen UI yang ditampilkan ketika suatu section tidak memiliki data untuk ditampilkan.
- **Team_Role**: Peran User dalam konteks Team tertentu, disimpan di `team_members.role`. Nilai valid: `owner`, `admin`, `member`.

---

## Requirements

### Requirement 1: Akses dan Keamanan Halaman

**User Story:** Sebagai User yang terautentikasi, saya ingin mengakses halaman riwayat saya tanpa harus memanipulasi URL, sehingga saya bisa melihat data personal saya dengan aman.

#### Acceptance Criteria

1. THE Halaman_Riwayat SHALL dapat diakses melalui route bernama `riwayat-saya` pada path `/riwayat-saya`.
2. WHEN User_Aktif belum terautentikasi mengakses `/riwayat-saya`, THE sistem SHALL mengalihkan User ke halaman login dan menyimpan `/riwayat-saya` sebagai intended URL agar redirect-after-login berfungsi benar.
3. IF User_Aktif terautentikasi dan memiliki Team_Role `owner`, `admin`, atau `member` di Team_Aktif, THEN THE Halaman_Riwayat SHALL dapat diakses tanpa error.
4. THE Halaman_Riwayat SHALL hanya menampilkan data dengan filter `user_id = id User_Aktif` — tidak ada parameter URL, query string, atau body parameter yang dapat disubstitusi untuk menampilkan data user lain.
5. WHEN User_Aktif tidak terdaftar di Team mana pun, THE sistem SHALL mengalihkan User ke halaman pemilihan Team tanpa menampilkan data riwayat apa pun.
6. IF User_Aktif memiliki `global_role` yang tidak dikenali atau tidak valid, THEN THE sistem SHALL mengembalikan response 403 Forbidden tanpa menampilkan halaman riwayat.

---

### Requirement 2: Scope Data ke Team Aktif

**User Story:** Sebagai anggota beberapa Team, saya ingin halaman riwayat hanya menampilkan data dari Team yang sedang aktif, sehingga saya tidak tercampur data dari Team lain.

#### Acceptance Criteria

1. THE Halaman_Riwayat SHALL hanya memuat record RSVP, Presensi, dan Evaluasi milik User_Aktif yang berelasi dengan Kegiatan di bawah Team_Aktif (`kegiatan.team_id = current_team_id`) — record milik user lain tidak boleh ikut termuat.
2. WHEN User_Aktif berpindah Team (mengubah `current_team_id`) dan memuat ulang Halaman_Riwayat, THE Halaman_Riwayat SHALL menampilkan data yang di-scope ke Team baru sehingga tidak ada data dari Team sebelumnya yang tersisa di tampilan.
3. IF User_Aktif tidak memiliki data RSVP, Presensi, atau Evaluasi di Team_Aktif, THEN THE Halaman_Riwayat SHALL menampilkan masing-masing section sebagai daftar kosong (Empty_State) tanpa error.
4. IF `current_team_id` User_Aktif null atau tidak terdaftar sebagai keanggotaan aktif User_Aktif, THEN THE sistem SHALL menolak permintaan dan tidak mengembalikan data riwayat apa pun.

---

### Requirement 3: Section Riwayat RSVP

**User Story:** Sebagai anggota, saya ingin melihat daftar Kegiatan terbuka yang pernah saya daftarkan RSVP, beserta status RSVP saat ini, sehingga saya tahu kegiatan mana yang sudah saya konfirmasi keikutsertaannya.

#### Acceptance Criteria

1. THE Halaman_Riwayat SHALL menampilkan section "Riwayat RSVP" yang memuat semua record RSVP milik User_Aktif untuk Kegiatan bertipe `terbuka` yang tidak terhapus (non-soft-deleted) di Team_Aktif, diurutkan berdasarkan `rsvp.waktu_daftar` descending (terbaru di atas).
2. WHEN sebuah record RSVP ditampilkan, THE Halaman_Riwayat SHALL menampilkan nama Kegiatan, status RSVP (`terdaftar` atau `dibatalkan`), dan tanggal pendaftaran (`rsvp.waktu_daftar`).
3. WHILE status RSVP adalah `terdaftar`, THE Halaman_Riwayat SHALL menampilkan badge yang memuat label teks "terdaftar" dengan styling visual (warna atau bentuk) yang berbeda dari badge status `dibatalkan`.
4. WHILE status RSVP adalah `dibatalkan`, THE Halaman_Riwayat SHALL menampilkan badge yang memuat label teks "dibatalkan" dengan styling visual (warna atau bentuk) yang berbeda dari badge status `terdaftar`.
5. IF User_Aktif belum memiliki record RSVP di Team_Aktif, THEN THE Halaman_Riwayat SHALL menampilkan Empty_State pada section "Riwayat RSVP" dengan pesan yang menyatakan bahwa belum ada riwayat RSVP.
6. IF section "Riwayat RSVP" gagal dimuat karena kesalahan server atau jaringan, THEN THE Halaman_Riwayat SHALL menampilkan pesan error yang menginformasikan bahwa data riwayat RSVP tidak dapat dimuat, tanpa merusak atau menyembunyikan section lain pada halaman yang sama.

---

### Requirement 4: Section Riwayat Presensi

**User Story:** Sebagai anggota, saya ingin melihat daftar Sesi yang pernah saya hadiri beserta tanggal dan nama Kegiatan terkait, sehingga saya bisa memantau kehadiran saya.

#### Acceptance Criteria

1. THE Halaman_Riwayat SHALL menampilkan section "Riwayat Presensi" yang memuat semua record Presensi milik User_Aktif untuk Sesi yang berelasi dengan Kegiatan di Team_Aktif, diurutkan berdasarkan `presensi.waktu_isi` descending (terbaru di atas).
2. WHEN sebuah record Presensi ditampilkan, THE Halaman_Riwayat SHALL menampilkan nama Kegiatan terkait, nama Sesi, tanggal Sesi (`sesi.tanggal`), dan waktu pengisian presensi (`presensi.waktu_isi`).
3. IF User_Aktif belum memiliki record Presensi untuk Sesi di Team_Aktif, THEN THE Halaman_Riwayat SHALL menampilkan Empty_State pada section "Riwayat Presensi" dengan pesan yang menyatakan bahwa belum ada riwayat presensi.
4. THE Controller SHALL membatasi jumlah record Presensi yang dikembalikan maksimal 50 record terbaru per request untuk mencegah payload tidak terkendali; IF terdapat lebih dari 50 record, THEN hanya 50 record terbaru yang ditampilkan.
5. IF `sesi.tanggal` atau `presensi.waktu_isi` null pada suatu record, THEN THE Halaman_Riwayat SHALL menampilkan placeholder teks "-" pada field yang null tersebut, tanpa crash atau error rendering.

---

### Requirement 5: Section Riwayat Evaluasi

**User Story:** Sebagai anggota, saya ingin melihat daftar Kegiatan yang sudah saya beri evaluasi beserta rating yang saya berikan, sehingga saya tahu kegiatan mana yang sudah saya ulas.

#### Acceptance Criteria

1. THE Halaman_Riwayat SHALL menampilkan section "Riwayat Evaluasi" yang memuat semua record Evaluasi milik User_Aktif untuk Kegiatan yang tidak terhapus (non-soft-deleted) di Team_Aktif, diurutkan berdasarkan `evaluasi.created_at` descending (terbaru di atas).
2. WHEN sebuah record Evaluasi ditampilkan, THE Halaman_Riwayat SHALL menampilkan nama Kegiatan, nilai rating (`evaluasi.rating`, skala 1–5), dan tanggal pengisian evaluasi (`evaluasi.created_at`).
3. WHERE `evaluasi.komentar` tidak null dan tidak kosong, THE Halaman_Riwayat SHALL menampilkan teks komentar yang dipotong (truncated) pada 200 karakter pertama — jika komentar melebihi 200 karakter, teks yang tersisa digantikan dengan "…".
4. IF User_Aktif belum memiliki record Evaluasi di Team_Aktif, THEN THE Halaman_Riwayat SHALL menampilkan Empty_State pada section "Riwayat Evaluasi" dengan pesan yang menyatakan bahwa belum ada riwayat evaluasi.
5. IF Kegiatan yang terhubung dengan suatu record Evaluasi telah dihapus (soft-deleted), THEN THE Halaman_Riwayat SHALL tetap menyembunyikan record Evaluasi tersebut dari tampilan (hanya tampilkan Evaluasi untuk Kegiatan yang masih aktif).

---

### Requirement 6: Empty State Halaman Keseluruhan

**User Story:** Sebagai anggota baru yang belum pernah berinteraksi dengan kegiatan apa pun, saya ingin tetap melihat halaman yang informatif ketika semua section kosong, sehingga saya tidak bingung dengan halaman tanpa isi.

#### Acceptance Criteria

1. WHILE semua section (RSVP, Presensi, dan Evaluasi) tidak memiliki data, THE Halaman_Riwayat SHALL menampilkan setidaknya satu pesan Empty_State per section yang menjelaskan bahwa User_Aktif belum memiliki riwayat di Team_Aktif untuk kategori tersebut.
2. THE Halaman_Riwayat SHALL tidak pernah menampilkan halaman tanpa teks keterangan apa pun — dalam kondisi data kosong sekalipun, setidaknya satu pesan deskriptif harus terlihat tanpa perlu scroll.

---

### Requirement 7: Tampilan dan Navigasi

**User Story:** Sebagai pengguna aplikasi SIGAP, saya ingin halaman riwayat memiliki tampilan yang konsisten dengan halaman lain di aplikasi, sehingga saya tidak merasa menggunakan halaman yang berbeda.

#### Acceptance Criteria

1. THE Halaman_Riwayat SHALL menggunakan komponen layout utama yang sama dengan halaman lain dalam aplikasi (misalnya `AppSidebarLayout` atau komponen setara yang digunakan secara konsisten).
2. THE Halaman_Riwayat SHALL merender elemen `<Head title="Riwayat Saya" />` sehingga judul tab browser terbaca "Riwayat Saya".
3. THE Halaman_Riwayat SHALL menampilkan ketiga section (Riwayat RSVP, Riwayat Presensi, Riwayat Evaluasi) dalam satu halaman yang sama, dipisahkan oleh elemen pemisah visual (misalnya garis horizontal atau jarak vertikal yang konsisten dengan pola UI project), atau sebagai tab yang dapat dipilih secara individual.
4. THE Halaman_Riwayat SHALL bersifat read-only — tidak merender elemen interaktif (tombol aksi, form input, atau link yang memicu perubahan data) yang dapat mengubah state aplikasi.

---

### Requirement 8: Performa Query

**User Story:** Sebagai pengguna, saya ingin halaman riwayat memuat dengan cepat meskipun saya memiliki banyak riwayat, sehingga saya tidak menunggu lama setiap kali membuka halaman.

#### Acceptance Criteria

1. WHEN Halaman_Riwayat dimuat, THE Controller SHALL mengambil data RSVP, Presensi, dan Evaluasi menggunakan eager loading (`with()`) untuk semua relasi Kegiatan dan Sesi yang dibutuhkan — tidak boleh ada query N+1 (jumlah query database untuk satu request harus konstan terhadap jumlah record).
2. THE Controller SHALL membatasi jumlah record RSVP dan Evaluasi yang dikembalikan masing-masing maksimal 50 record terbaru; batas 50 record untuk Presensi sudah dinyatakan di Requirement 4 Criterion 4.
