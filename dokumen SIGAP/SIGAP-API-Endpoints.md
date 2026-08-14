# Daftar Endpoint / Route — SIGAP
Laravel 12 + Inertia (React Starter Kit) + Fortify

Dokumen ini melengkapi `SIGAP-DataDictionary.md` dan `SIGAP-SequenceDiagram-*.mermaid` dengan daftar route konkret yang perlu dibuat. Karena stack-nya **Inertia**, sebagian besar route bukan REST API murni — kolom **Tipe** menandai apakah route itu me-render halaman Inertia, sekadar redirect-back (form action), atau JSON murni (dipakai fetch dari komponen React, terutama untuk FullCalendar dan aksi cepat seperti approve/reject).

---

## 0. Autentikasi & Akun (Fortify)

Autentikasi **tidak ditulis manual** — dipakai langsung dari `laravel/fortify` bawaan starter kit. Yang perlu dikonfigurasi di `config/fortify.php`:

```php
'features' => [
    // Features::registration(),      // ❌ NONAKTIFKAN — tidak ada self-register publik (lihat SRS §2.5, FR-03)
    Features::resetPasswords(),        // ✅ Anggota/Pengurus lupa password tetap bisa reset
    // Features::emailVerification(), // opsional, boleh dinonaktifkan untuk scope 1 bulan
    // Features::twoFactorAuthentication(...), // di luar scope PKL, nonaktifkan
],
```

Karena `Features::registration()` dimatikan, route publik `/register` bawaan Fortify **tidak dipakai** — diganti custom endpoint di bawah, khusus Pengurus yang input akun Anggota.

| Method | Path | Deskripsi | Role | Sumber |
|---|---|---|---|---|
| GET | `/login` | Halaman login (Inertia page) | Guest | Fortify bawaan |
| POST | `/login` | Proses login (email/NIM + password) | Guest | Fortify bawaan |
| POST | `/logout` | Logout | Anggota, Pengurus | Fortify bawaan |
| GET | `/forgot-password` | Halaman lupa password | Guest | Fortify bawaan |
| POST | `/forgot-password` | Kirim link reset password | Guest | Fortify bawaan |
| POST | `/reset-password` | Submit password baru | Guest | Fortify bawaan |
| GET | `/settings/profile` | Halaman edit profil sendiri (starter kit default) | Anggota, Pengurus | Starter kit bawaan |
| PATCH | `/settings/profile` | Update nama/email sendiri | Anggota, Pengurus | Starter kit bawaan |

### Manajemen Akun Anggota (custom — pengganti self-register)

| Method | Path | Tipe | Deskripsi | Role | Request | FR |
|---|---|---|---|---|---|---|
| GET | `/pengurus/anggota` | Inertia Page | Daftar seluruh akun Anggota | Pengurus | — | FR-03 |
| POST | `/pengurus/anggota` | Redirect | Tambah 1 akun Anggota manual (name, NIM, email, password default) | Pengurus | `name, nim, email, password` | FR-03 |
| POST | `/pengurus/anggota/import` | Redirect | Import massal akun Anggota dari file Excel/CSV | Pengurus | `file` | FR-03 |
| PATCH | `/pengurus/anggota/{user}` | Redirect | Edit data Anggota | Pengurus | `name, nim, email` | FR-03 |
| DELETE | `/pengurus/anggota/{user}` | Redirect | Nonaktifkan/hapus akun Anggota | Pengurus | — | FR-03 |

---

## 1. Kegiatan, Sesi & Rundown *(FR-05 – FR-11)*

| Method | Path | Tipe | Deskripsi | Role | Request Utama |
|---|---|---|---|---|---|
| GET | `/kegiatan` | Inertia Page | Daftar kegiatan (list/manage, sisi Pengurus) | Pengurus | query: filter tipe/status |
| GET | `/kegiatan/create` | Inertia Page | Form tambah Kegiatan baru | Pengurus | — |
| POST | `/kegiatan` | Redirect | Simpan Kegiatan baru + Sesi pertama | Pengurus | `nama, tipe, kuota?, deskripsi, sesi[]` |
| GET | `/kegiatan/{kegiatan}/edit` | Inertia Page | Form edit Kegiatan | Pengurus | — |
| PATCH | `/kegiatan/{kegiatan}` | Redirect | Update data Kegiatan | Pengurus | sama seperti create |
| DELETE | `/kegiatan/{kegiatan}` | Redirect | Hapus (soft delete) Kegiatan beserta sesi-sesinya | Pengurus | — |
| POST | `/kegiatan/{kegiatan}/sesi` | Redirect | Tambah Sesi baru ke Kegiatan (multi-hari) | Pengurus | `tanggal, waktu_mulai, waktu_selesai, lokasi` |
| PATCH | `/sesi/{sesi}` | Redirect | Edit satu Sesi | Pengurus | `tanggal, waktu_mulai, waktu_selesai, lokasi` |
| DELETE | `/sesi/{sesi}` | Redirect | Hapus satu Sesi (kegiatan tetap ada jika masih ada sesi lain) | Pengurus | — |
| PUT | `/sesi/{sesi}/rundown` | Redirect | Simpan/replace seluruh baris rundown suatu Sesi | Pengurus | `rundown[]: {waktu, uraian_acara, urutan}` |
| GET | `/kegiatan/{kegiatan}` | JSON | **Detail Kegiatan untuk Event Detail Card** — dipanggil saat event kalender diklik | Anggota, Pengurus | — |

---

## 2. Kalender *(FR-08 – FR-11, spesifikasi `design.md` §6)*

| Method | Path | Tipe | Deskripsi | Role |
|---|---|---|---|---|
| GET | `/kalender` | Inertia Page | Halaman kalender utama (shell FullCalendar) | Anggota, Pengurus |
| GET | `/kalender/events` | JSON | Feed event untuk FullCalendar — return array objek sesuai struktur di `design.md` §6 (`id, groupId, title, start, end, color, extendedProps`). Query param: `start`, `end` (rentang tanggal yang lagi ditampilkan) | Anggota, Pengurus |

---

## 3. RSVP *(FR-12 – FR-14, khusus Kegiatan bertipe Terbuka, alur instant-only)*

| Method | Path | Tipe | Deskripsi | Role | Request |
|---|---|---|---|---|---|
| POST | `/kegiatan/{kegiatan}/rsvp` | JSON | Anggota mengajukan RSVP — langsung `terdaftar` selama kuota tersedia | Anggota | — |
| DELETE | `/kegiatan/{kegiatan}/rsvp` | JSON | Anggota membatalkan RSVP miliknya (→ `dibatalkan`) | Anggota | — |
| GET | `/kegiatan/{kegiatan}/rsvp` | JSON | Pengurus lihat daftar peserta yang RSVP (read-only, tidak ada aksi setuju/tolak) | Pengurus | — |

**Catatan implementasi:** endpoint `POST` **wajib** mengecek ulang sisa kuota di dalam transaction DB (lock row) sebelum commit, untuk menghindari race condition dua orang RSVP di detik yang sama saat kuota tersisa 1.

---

## 4. Presensi *(FR-15 – FR-18)*

| Method | Path | Tipe | Deskripsi | Role | Request |
|---|---|---|---|---|---|
| GET | `/presensi/{kode_presensi}` | Inertia Page | Halaman form presensi (redirect ke `/login` dulu jika belum login) | Anggota | — |
| POST | `/presensi/{kode_presensi}` | Redirect | Submit presensi | Anggota | `catatan?` |

**Catatan implementasi:** logika validasi ikuti persis `SIGAP-SequenceDiagram-Presensi.mermaid` — cek tipe Kegiatan → jika Terbuka, cek RSVP `terdaftar` → cek belum pernah presensi di sesi ini (constraint unique `sesi_id + user_id`).

---

## 5. Panitia & Pembagian Tugas *(FR-19 – FR-21)*

| Method | Path | Tipe | Deskripsi | Role | Request |
|---|---|---|---|---|---|
| POST | `/kegiatan/{kegiatan}/divisi` | Redirect | Tambah divisi panitia baru | Pengurus | `nama_divisi` |
| DELETE | `/divisi/{divisi}` | Redirect | Hapus divisi | Pengurus | — |
| POST | `/divisi/{divisi}/tugas` | Redirect | Assign anggota + deskripsi tugas ke divisi | Pengurus | `user_id, deskripsi_tugas` |
| PATCH | `/tugas/{tugas}/status` | JSON | Update status tugas (dipakai Pengurus **atau** Anggota pemilik tugas) | Anggota (pemilik), Pengurus | `status` |
| DELETE | `/tugas/{tugas}` | Redirect | Hapus penugasan | Pengurus | — |

---

## 6. Anggaran *(FR-22 – FR-24)*

| Method | Path | Tipe | Deskripsi | Role | Request |
|---|---|---|---|---|---|
| GET | `/kegiatan/{kegiatan}/anggaran` | JSON | Lihat seluruh baris anggaran + ringkasan (tab di Event Detail Card) | Pengurus | — |
| POST | `/kegiatan/{kegiatan}/anggaran` | Redirect | Tambah baris anggaran (estimasi) | Pengurus | `jenis, sumber_kategori, estimasi` |
| PATCH | `/anggaran/{anggaran}` | Redirect | Update realisasi / edit baris | Pengurus | `realisasi, sumber_kategori?, estimasi?` |
| DELETE | `/anggaran/{anggaran}` | Redirect | Hapus baris anggaran | Pengurus | — |

---

## 7. Dokumentasi *(FR-25 – FR-26)*

| Method | Path | Tipe | Deskripsi | Role | Request |
|---|---|---|---|---|---|
| GET | `/kegiatan/{kegiatan}/dokumentasi` | JSON | Lihat arsip dokumentasi (tab di Event Detail Card) | Anggota, Pengurus | — |
| POST | `/kegiatan/{kegiatan}/dokumentasi` | Redirect | Upload foto/notulen | Pengurus | `tipe, file` |
| DELETE | `/dokumentasi/{dokumentasi}` | Redirect | Hapus item dokumentasi | Pengurus | — |

---

## 8. Evaluasi *(FR-27 – FR-28)*

| Method | Path | Tipe | Deskripsi | Role | Request |
|---|---|---|---|---|---|
| GET | `/kegiatan/{kegiatan}/evaluasi/saya` | JSON | Ambil evaluasi milik Anggota yang login untuk kegiatan ini (kosong jika belum pernah isi) | Anggota | — |
| POST | `/kegiatan/{kegiatan}/evaluasi` | JSON | Submit evaluasi baru (rating + komentar) | Anggota | `rating, komentar?` |
| PUT | `/kegiatan/{kegiatan}/evaluasi` | JSON | Edit evaluasi yang sudah ada | Anggota | `rating, komentar?` |
| GET | `/kegiatan/{kegiatan}/evaluasi/ringkasan` | JSON | Rata-rata rating + daftar komentar (sisi Pengurus) | Pengurus | — |

---

## 9. Dashboard Rekap *(FR-29 – FR-32)*

| Method | Path | Tipe | Deskripsi | Role |
|---|---|---|---|---|
| GET | `/dashboard` | Inertia Page | Dashboard Pengurus — statistik + kalender (lihat `design.md` §5.2) | Pengurus |
| GET | `/dashboard/rekap-anggota` | JSON | Rekap kehadiran & keaktifan per Anggota, lintas kegiatan dalam periode tertentu | Pengurus |
| GET | `/dashboard/rekap-kegiatan` | JSON | Rekap kehadiran per Kegiatan | Pengurus |
| GET | `/riwayat-saya` | Inertia Page | Riwayat kehadiran & keikutsertaan pribadi Anggota | Anggota |

---

## 10. Export Laporan *(FR-33 – FR-35)*

Diimplementasikan dengan `maatwebsite/excel` (Excel) dan `barryvdh/laravel-dompdf` (PDF) — lihat `SRS.md` §2.5.

| Method | Path | Tipe | Deskripsi | Role | Request |
|---|---|---|---|---|---|
| GET | `/laporan/export` | Inertia Page | Halaman pilih kegiatan/periode untuk export | Pengurus | — |
| POST | `/laporan/export/excel` | File Download | Generate & download laporan gabungan (kehadiran+anggaran+evaluasi) format Excel | Pengurus | `kegiatan_id[]` atau `periode_mulai, periode_selesai` |
| POST | `/laporan/export/pdf` | File Download | Sama seperti di atas, format PDF | Pengurus | sama seperti di atas |

---

## Ringkasan Middleware/Role

```php
// routes/web.php (gambaran besar)

Route::middleware('guest')->group(function () {
    // route login/forgot-password bawaan Fortify
});

Route::middleware('auth')->group(function () {
    Route::get('/kalender', ...);
    Route::get('/kalender/events', ...);
    Route::get('/kegiatan/{kegiatan}', ...); // detail, dua role boleh akses

    Route::middleware('role:anggota')->group(function () {
        Route::post('/kegiatan/{kegiatan}/rsvp', ...);
        Route::delete('/kegiatan/{kegiatan}/rsvp', ...);
        Route::get('/presensi/{kode}', ...);
        Route::post('/presensi/{kode}', ...);
        Route::post('/kegiatan/{kegiatan}/evaluasi', ...);
        Route::get('/riwayat-saya', ...);
    });

    Route::middleware('role:pengurus')->group(function () {
        Route::resource('kegiatan', KegiatanController::class);
        Route::get('/pengurus/anggota', ...);
        Route::get('/dashboard', ...);
        Route::get('/laporan/export', ...);
        // dst.
    });
});
```

Butuh middleware `role` custom sederhana (cek `auth()->user()->role`), karena Fortify sendiri tidak menyediakan role/permission — itu di luar tanggung jawabnya.

---

## Referensi Silang

| Dokumen | Kaitan |
|---|---|
| `SRS.md` §3 | Sumber nomor FR di setiap tabel di atas |
| `SIGAP-DataDictionary.md` | Nama kolom persis yang dipakai di request body |
| `SIGAP-SequenceDiagram-RSVP.mermaid` | Detail alur `POST/PATCH .../rsvp` |
| `SIGAP-SequenceDiagram-Presensi.mermaid` | Detail alur `GET/POST /presensi/{kode}` |
| `SIGAP-SequenceDiagram-Evaluasi.mermaid` | Detail alur `POST/PUT .../evaluasi` |
| `design.md` §6 | Struktur JSON response `/kalender/events` |
