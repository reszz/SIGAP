# Data Dictionary — SIGAP
Sistem Informasi Kegiatan, Absensi, dan Pelaporan

Kamus data ini merinci setiap tabel pada `SIGAP-ERD.mermaid`, termasuk tipe data, constraint, dan aturan bisnis yang tidak bisa ditangkap oleh diagram ER saja. Dipakai sebagai acuan langsung saat menulis migration Laravel.

---

## 1. `users`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| name | varchar(255) | not null | **Kolom bawaan Laravel React Starter Kit — bukan `nama`.** Satu-satunya pengecualian dari konvensi Bahasa Indonesia di kamus data ini, sengaja dipertahankan supaya nyambung dengan komponen bawaan starter kit (halaman profil, Fortify) tanpa perlu modifikasi tambahan |
| nim | varchar(20) | unique, not null | Dipakai sebagai identitas login alternatif & validasi keanggotaan |
| email | varchar(255) | unique, not null | Kolom bawaan Laravel, tidak dimodifikasi |
| password | varchar(255) | not null | Di-hash (bcrypt) |
| role | enum('pengurus','anggota') | not null, default 'anggota' | |
| created_at, updated_at | timestamp | nullable | Laravel default timestamps |

**Aturan bisnis:** akun `anggota` hanya dibuat oleh `pengurus` (input manual/massal) — tidak ada self-registration bebas, memastikan NIM yang terdaftar memang anggota organisasi sah (FR-03).

---

## 2. `kegiatan`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| nama | varchar(150) | not null | |
| deskripsi | text | nullable | |
| tipe | enum('wajib_hadir','terbuka') | not null | Menentukan apakah modul RSVP aktif |
| kuota | int unsigned | nullable | **Wajib diisi jika `tipe = terbuka`**, null jika `wajib_hadir` |
| warna | char(7) | not null, default auto-generate | Format hex `#RRGGBB`, diambil dari palet warna kegiatan (lihat `design.md` §3.1b) |
| created_at, updated_at | timestamp | nullable | |

**Aturan bisnis:**
- Jika `tipe = wajib_hadir`, kolom `kuota` harus `NULL` (validasi di level aplikasi, bukan hanya constraint DB).
- `warna` sebaiknya di-generate saat insert (hash `id`/`nama` terhadap indeks palet 10 warna) agar dua kegiatan yang berdekatan tanggal tidak bertabrakan warna.

---

## 3. `sesi`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| kegiatan_id | bigint | FK → `kegiatan.id`, not null, on delete cascade | |
| tanggal | date | not null | |
| waktu_mulai | time | not null | |
| waktu_selesai | time | not null | Harus > `waktu_mulai` (validasi aplikasi) |
| lokasi | varchar(200) | not null | |
| kode_presensi | varchar(32) | unique, not null | Random token (bukan sequential), di-generate saat sesi dibuat |
| created_at, updated_at | timestamp | nullable | |

**`status` BUKAN kolom database.** Status (`terjadwal` / `berlangsung` / `selesai`) dihitung **on-the-fly** lewat accessor di model `Sesi`, membandingkan `now()` terhadap `tanggal + waktu_mulai` dan `tanggal + waktu_selesai`:

```php
public function getStatusAttribute(): string
{
    $mulai = $this->tanggal->copy()->setTimeFrom($this->waktu_mulai);
    $selesai = $this->tanggal->copy()->setTimeFrom($this->waktu_selesai);
    $now = now();

    if ($now->lt($mulai)) return 'terjadwal';
    if ($now->between($mulai, $selesai)) return 'berlangsung';
    return 'selesai';
}
```

**Kenapa bukan kolom + cron job?** Untuk scope PKL 1 bulan, menjalankan Laravel Scheduler (cron) di server hanya untuk update satu kolom status dianggap kompleksitas infrastruktur yang tidak sepadan. Menghitung on-the-fly menghilangkan risiko status "telat update" sekaligus menghilangkan kebutuhan cron sama sekali — trade-off-nya cuma sedikit komputasi ekstra tiap request, yang untuk skala organisasi mahasiswa sama sekali tidak signifikan.

**Aturan bisnis:** presensi (`presensi.sesi_id`) dan rundown (`rundown.sesi_id`) selalu merujuk ke `sesi`, bukan `kegiatan` langsung — memungkinkan tiap hari dari kegiatan multi-hari punya presensi & rundown terpisah.

---

## 4. `rundown`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| sesi_id | bigint | FK → `sesi.id`, not null, on delete cascade | |
| waktu | time | not null | |
| uraian_acara | varchar(255) | not null | |
| urutan | int unsigned | not null | Untuk pengurutan tampilan (bukan hanya sort by `waktu`, agar Pengurus bisa reorder manual) |
| created_at, updated_at | timestamp | nullable | Laravel default timestamps |

---

## 5. `divisi_panitia`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| kegiatan_id | bigint | FK → `kegiatan.id`, not null, on delete cascade | |
| nama_divisi | varchar(100) | not null | Contoh: Acara, Humas, Logistik, Konsumsi |
| created_at, updated_at | timestamp | nullable | Laravel default timestamps |

---

## 6. `tugas_panitia`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| divisi_id | bigint | FK → `divisi_panitia.id`, not null, on delete cascade | |
| user_id | bigint | FK → `users.id`, not null | Anggota yang ditugaskan |
| deskripsi_tugas | varchar(255) | not null | |
| status | enum('belum','sedang','selesai') | not null, default 'belum' | Anggota dapat mengubah kolom ini sendiri (FR-21) |
| created_at, updated_at | timestamp | nullable | Laravel default timestamps |

---

## 7. `rsvp`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| kegiatan_id | bigint | FK → `kegiatan.id`, not null, on delete cascade | Hanya berlaku untuk `kegiatan.tipe = terbuka` |
| user_id | bigint | FK → `users.id`, not null | |
| status | enum('terdaftar','dibatalkan') | not null, default 'terdaftar' | RSVP bersifat **instant** — begitu diajukan, langsung `terdaftar` selama kuota tersedia. Tidak ada proses persetujuan Pengurus |
| waktu_daftar | timestamp | not null, default now() | |
| **UNIQUE** | | `(kegiatan_id, user_id)` | Satu Anggota hanya punya satu baris RSVP aktif per Kegiatan — pembatalan meng-update baris yang sama, bukan insert baru |

**Aturan bisnis (kuota):**
```
sisa_kuota = kegiatan.kuota - COUNT(rsvp WHERE kegiatan_id = X AND status = 'terdaftar')
```
Baris berstatus `dibatalkan` **tidak** dihitung sebagai pemakai kuota.

**Transisi status yang diizinkan** (lihat juga `SIGAP-StateDiagram-RSVP.mermaid`):
- `terdaftar → dibatalkan` (dibatalkan Anggota sendiri, kapan saja sebelum kegiatan selesai)

**Wajib pakai DB transaction + row lock** saat cek sisa kuota & insert RSVP baru, untuk mencegah race condition dua Anggota RSVP di detik yang sama saat kuota tersisa 1.

---

## 8. `presensi`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| sesi_id | bigint | FK → `sesi.id`, not null, on delete cascade | |
| user_id | bigint | FK → `users.id`, not null | |
| catatan | text | nullable | |
| waktu_isi | timestamp | not null, default now() | |
| **UNIQUE** | | `(sesi_id, user_id)` | Mencegah presensi ganda oleh akun yang sama pada sesi yang sama (FR-18) |

**Aturan bisnis (validasi sebelum insert):**
1. User harus login (session valid).
2. Jika `kegiatan.tipe = terbuka`: harus ada baris `rsvp` dengan `kegiatan_id` terkait, `user_id` = user login, dan `status = 'terdaftar'`.
3. Jika `kegiatan.tipe = wajib_hadir`: langsung lolos ke insert (tanpa cek RSVP).
4. Cek constraint unique `(sesi_id, user_id)` — jika sudah ada, tolak dengan pesan "presensi sudah tercatat".

---

## 9. `anggaran`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| kegiatan_id | bigint | FK → `kegiatan.id`, not null, on delete cascade | |
| jenis | enum('pemasukan','pengeluaran') | not null | |
| sumber_kategori | varchar(100) | not null | Contoh: "Kas HMIF", "Sponsor", "Konsumsi", "Venue", "Doorprize" |
| estimasi | decimal(12,2) | not null, default 0 | |
| realisasi | decimal(12,2) | nullable | Diisi setelah kegiatan berjalan; selisih dihitung di aplikasi (`realisasi - estimasi`) |

---

## 10. `dokumentasi`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| kegiatan_id | bigint | FK → `kegiatan.id`, not null, on delete cascade | |
| tipe | enum('foto','notulen') | not null | |
| file_path | varchar(255) | not null | Path/URL penyimpanan file |
| uploaded_by | bigint | FK → `users.id`, not null | |
| created_at | timestamp | nullable | |

---

## 11. `evaluasi`

| Kolom | Tipe | Constraint | Keterangan |
|---|---|---|---|
| id | bigint | PK, auto-increment | |
| kegiatan_id | bigint | FK → `kegiatan.id`, not null, on delete cascade | |
| user_id | bigint | FK → `users.id`, not null | |
| rating | tinyint unsigned | not null, check 1–5 | |
| komentar | text | nullable | Bebas, tempat kritik/saran/pengalaman |
| created_at | timestamp | nullable | |
| updated_at | timestamp | nullable | Terisi ulang setiap kali Anggota mengedit evaluasinya |
| **UNIQUE** | | `(kegiatan_id, user_id)` | Satu evaluasi per Anggota per Kegiatan — submit ulang = update baris yang sama (FR-27a) |

---

## 12. Ringkasan Constraint Unik Lintas Tabel

| Tabel | Unique Constraint | Alasan |
|---|---|---|
| `users` | `nim`, `email` | Satu akun per identitas |
| `sesi` | `kode_presensi` | Token presensi tidak boleh bentrok/ditebak |
| `rsvp` | `(kegiatan_id, user_id)` | Satu status RSVP aktif per Anggota per Kegiatan |
| `presensi` | `(sesi_id, user_id)` | Cegah presensi ganda per sesi |
| `evaluasi` | `(kegiatan_id, user_id)` | Satu evaluasi per Anggota per Kegiatan, dapat diedit |

## 13. Soft Delete

Sesuai NFR-08 pada `SRS.md`, tabel `kegiatan` dan `sesi` disarankan memakai **soft delete** (`deleted_at` nullable) karena keduanya adalah induk dari banyak data anak (rundown, presensi, RSVP, anggaran, dokumentasi, evaluasi) — penghapusan permanen berisiko merusak riwayat LPJ.
