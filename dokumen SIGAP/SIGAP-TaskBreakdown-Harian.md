# Task Breakdown Harian — SIGAP
Turunan langsung dari `SIGAP_Timeline_PKL.xlsx`, dirinci jadi checklist kerja per hari. Tiap hari mengacu ke nomor FR (`SRS.md`), endpoint (`SIGAP-API-Endpoints.md`), dan diagram terkait — supaya nggak perlu bolak-balik nebak "ini seharusnya ngikutin yang mana".

Skala: 1 bulan = 4 minggu × 5 hari kerja = **20 hari**. Checklist ditulis sebagai target akhir hari, bukan jam-jaman — kalau ada yang meleset 1 hari, geser aja ke hari berikutnya tanpa mikir ulang urutannya (urutan dependency-nya sengaja dijaga supaya tetap valid walau ada slip).

---

## MINGGU 1 — Analisis & Perancangan

### Hari 1 — Kickoff & Requirement
- [ ] Diskusi ulang final dengan pengurus HMIF: konfirmasi kebutuhan dari proposal masih relevan
- [ ] Tentukan siapa yang jadi akun Pengurus pertama (buat data seeder nanti)
- [ ] Pastikan target output Minggu 1 dipahami: dokumen kebutuhan + skema DB + wireframe

### Hari 2 — SRS & Use Case
- [ ] Review ulang `SRS.md` (v1.2) — sudah final dari pembahasan sebelumnya
- [ ] Review `SIGAP-UseCaseDiagram.mermaid` — pastikan semua FR ke-cover di use case
- [ ] *(Dokumen ini sebenarnya sudah selesai dari sesi sebelumnya — hari ini cukup validasi ulang, bukan bikin dari nol)*

### Hari 3 — ERD, Data Dictionary, Class Diagram
- [ ] Review `SIGAP-ERD.mermaid` + `SIGAP-DataDictionary.md` — cek nama kolom, tipe data, constraint unik
- [ ] Review `SIGAP-ClassDiagram.mermaid`
- [ ] Siapkan draft nama migration Laravel 1:1 dengan tabel di Data Dictionary (`users`, `kegiatan`, `sesi`, `rundown`, `divisi_panitia`, `tugas_panitia`, `rsvp`, `presensi`, `anggaran`, `dokumentasi`, `evaluasi`)

### Hari 4 — Sequence & State Diagram
- [ ] Review `SIGAP-SequenceDiagram-RSVP.mermaid`, `-Presensi.mermaid`, `-Evaluasi.mermaid`
- [ ] Review `SIGAP-StateDiagram-RSVP.mermaid` dan `-Sesi.mermaid`
- [ ] Catat semua validasi/aturan bisnis yang muncul di diagram ini sebagai draft daftar unit test nanti

### Hari 5 — Wireframe, Endpoint List & Review Mentor
- [ ] Buat wireframe low-fidelity per halaman (Dashboard, Kalender, Form Kegiatan, Event Detail Card, Form Presensi, Panitia, Anggaran, Dokumentasi, Evaluasi) berdasarkan struktur di `design.md` §5
- [ ] Review `SIGAP-API-Endpoints.md` — pastikan tidak ada modul yang kelewat
- [ ] Presentasi/review seluruh dokumen analisis ke mentor sebelum masuk coding
- [ ] **Output Minggu 1 selesai:** dokumen kebutuhan ✅, desain UI/UX ✅, skema database ✅

---

## MINGGU 2 — Setup, Autentikasi, Kegiatan & Kalender

### Hari 6 — Setup Project & Database
- [ ] `laravel new sigap` dengan React Starter Kit (Inertia + Fortify + Tailwind bawaan)
- [ ] Buat **seluruh migration sekaligus** (11 tabel dari Data Dictionary) — jangan bertahap per modul, supaya nggak ada refactor skema di tengah jalan
- [ ] Buat `DatabaseSeeder` untuk 1 akun Pengurus pertama (role `pengurus`)
- [ ] Jalankan `php artisan migrate --seed`, pastikan semua tabel & relasi FK sudah benar
- [ ] Install `@fullcalendar/react` + plugin (`dayGrid`, `timeGrid`, `list`, `interaction`)

### Hari 7 — Autentikasi & Akun Anggota
- [ ] Config `config/fortify.php`: matikan `Features::registration()`, aktifkan `resetPasswords()`
- [ ] Buat middleware `role` custom (cek `auth()->user()->role`)
- [ ] Endpoint `GET/POST /pengurus/anggota`, `/pengurus/anggota/import`, `PATCH/DELETE /pengurus/anggota/{user}` (FR-03)
- [ ] Test manual: login Pengurus (seeder), bikin 2-3 akun Anggota dummy buat testing modul berikutnya

### Hari 8 — CRUD Kegiatan, Sesi & Rundown
- [ ] `KegiatanController`: create/edit/delete Kegiatan dengan field `tipe`, `kuota` (FR-05, FR-06)
- [ ] Validasi aplikasi: jika `tipe = wajib_hadir`, paksa `kuota` null
- [ ] Nested form tambah Sesi (bisa lebih dari satu untuk multi-hari) + Rundown per sesi (FR-07)
- [ ] Auto-generate `warna` kegiatan dari palet 10 warna di `design.md` §3.1b
- [ ] Auto-generate `kode_presensi` unik (random token) tiap Sesi dibuat

### Hari 9 — Kalender FullCalendar
- [ ] Endpoint `GET /kalender/events` — return JSON sesuai struktur di `design.md` §6 (`id, groupId, title, start, end, color, extendedProps`)
- [ ] Render kalender di halaman `/kalender` (bulan/minggu/agenda)
- [ ] Implementasi `eventClick` → buka Event Detail Card (slide-in), tarik data dari `GET /kegiatan/{kegiatan}` (FR-09)
- [ ] Status Sesi ditampilkan pakai computed attribute (bukan kolom DB — lihat `SIGAP-DataDictionary.md` §3)

### Hari 10 — Polish Kalender & Testing Minggu 2
- [ ] Hover highlight untuk sesi dengan `groupId` sama (kegiatan multi-hari)
- [ ] Legend daftar kegiatan aktif + view mobile default `listWeek`
- [ ] Testing manual: login kedua role, CRUD kegiatan multi-hari, kalender tampil benar
- [ ] **Output Minggu 2 selesai:** Kegiatan, Sesi, Rundown, Kalender berfungsi

---

## MINGGU 3 — RSVP, Presensi, Panitia, Anggaran, Dokumentasi

### Hari 11 — RSVP (instant-only)
- [ ] `POST /kegiatan/{kegiatan}/rsvp` — cek `tipe = terbuka`, hitung sisa kuota (hanya status `terdaftar`), insert langsung `terdaftar` selama kuota tersedia (FR-12, FR-13)
- [ ] **Wajib pakai DB transaction + row lock** saat cek & insert, cegah race condition kuota
- [ ] `DELETE /kegiatan/{kegiatan}/rsvp` — Anggota batalkan RSVP → status `dibatalkan` (FR-12c)
- [ ] `GET /kegiatan/{kegiatan}/rsvp` — halaman lihat daftar peserta sisi Pengurus (read-only, FR-14)
- [ ] Tombol "RSVP Sekarang"/"Batalkan RSVP" di Event Detail Card, tampilkan sisa kuota real-time
- [ ] Test manual seluruh transisi sesuai `SIGAP-StateDiagram-RSVP.mermaid` (cuma 2 status: Terdaftar ↔ Dibatalkan — jauh lebih sederhana dari draf sebelumnya)

### Hari 12 — Buffer / Integrasi RSVP + Presensi
*(Hari ini sengaja dikosongkan sebagai buffer setelah RSVP disederhanakan — dulu dijatah 2 hari penuh untuk mode Approval yang sekarang dihapus dari scope)*
- [ ] Kalau RSVP di Hari 11 udah kelar duluan: lanjut ke integrasi awal RSVP↔Presensi (cek status RSVP `terdaftar` udah kebaca bener di alur presensi)
- [ ] Kalau Hari 11 molor: pakai hari ini buat nyelesain sisa RSVP tanpa nge-geser jadwal hari-hari berikutnya
- [ ] Kalau udah kelar semua: boleh mulai duluan bikin form Presensi (Hari 13)

### Hari 13 — Presensi
- [ ] `GET/POST /presensi/{kode_presensi}` — ikuti persis `SIGAP-SequenceDiagram-Presensi.mermaid`
- [ ] Redirect ke login jika belum login; identitas autofill dari akun (FR-16)
- [ ] Validasi: jika `tipe = terbuka`, cek RSVP `terdaftar`; jika `wajib_hadir`, langsung lolos (FR-16, FR-17)
- [ ] Constraint unique `(sesi_id, user_id)` — test submit dobel harus ditolak (FR-18)

### Hari 14 — Panitia & Anggaran
- [ ] Divisi Panitia + assign Tugas + update status oleh Anggota pemilik tugas (FR-19–21)
- [ ] Anggaran: input estimasi/realisasi per kegiatan, hitung selisih (FR-22–24)

### Hari 15 — Dokumentasi & Testing Minggu 1-3
- [ ] Upload foto/notulen ke local disk (`storage/app/public`), terhubung ke `kegiatan_id` (FR-25–26)
- [ ] **Regression testing modul RSVP + Presensi** — ini modul paling rawan bug karena banyak state, alokasikan waktu ekstra di sini kalau perlu geser dari Anggaran/Dokumentasi
- [ ] **Output Minggu 3 selesai:** Panitia, RSVP, Presensi, Anggaran, Dokumentasi berfungsi

---

## MINGGU 4 — Evaluasi, Dashboard, Export & Finalisasi

### Hari 16 — Evaluasi
- [ ] `POST/PUT /kegiatan/{kegiatan}/evaluasi` — cek existing dulu (constraint unik `kegiatan_id+user_id`), submit baru vs edit (FR-27, FR-27a, FR-27b)
- [ ] `GET .../evaluasi/ringkasan` — rata-rata rating + daftar komentar sisi Pengurus (FR-28)
- [ ] Ikuti `SIGAP-SequenceDiagram-Evaluasi.mermaid` untuk alur isi/edit

### Hari 17 — Dashboard Rekap
- [ ] `GET /dashboard/rekap-anggota` — total kehadiran + keaktifan panitia per Anggota (FR-29, FR-31)
- [ ] `GET /dashboard/rekap-kegiatan` — rekap per Kegiatan (FR-30)
- [ ] `GET /riwayat-saya` — riwayat pribadi Anggota (FR-32)

### Hari 18 — Export Laporan
- [ ] Install `maatwebsite/excel` + `barryvdh/laravel-dompdf`
- [ ] `POST /laporan/export/excel` dan `/export/pdf` — gabungan kehadiran + anggaran + evaluasi (FR-33–35)

### Hari 19 — Pengujian End-to-End & Bug Fixing
- [ ] Jalankan ulang seluruh skenario di 3 sequence diagram sebagai manual test script
- [ ] Fokus edge case: kuota RSVP pas-pasan, presensi dobel, evaluasi edit dua kali, kegiatan multi-hari dengan sesi campur status
- [ ] Fix bug prioritas tinggi dulu (yang menghalangi alur utama), catat bug minor buat dikerjain kalau waktu sisa

### Hari 20 — Dokumentasi Teknis & Presentasi
- [ ] Susun dokumentasi teknis final (struktur database + alur sistem) — tinggal rapikan dari dokumen yang sudah ada (`SIGAP-ERD.mermaid`, `SIGAP-DataDictionary.md`, dst.)
- [ ] Siapkan draft laporan hasil pelaksanaan PKL
- [ ] Presentasi ke mentor
- [ ] **Output Minggu 4 & Target Output Proyek selesai** (lihat `SRS.md` §8)

---

## Kalau Waktu Mepet — Cut List

Kandidat yang paling aman disederhanakan tanpa merusak nilai inti proyek, urut prioritas potong:

1. **Export PDF** — pertahankan Excel dulu (lebih gampang diperiksa manual buat LPJ), PDF bisa nyusul kalau Hari 19-20 masih ada waktu
2. **Import massal Excel akun Anggota** — kalau kepepet, cukup input manual satu-satu dulu
3. **Filter/highlight kalender lanjutan** (hover groupId, dst.) — bisa disederhanakan jadi tampilan polos dulu, styling detail nyusul

Jangan potong: **Kalender + Event Detail Card** (ini elemen paling terlihat & jadi bukti utama produk jalan), **Presensi** (ini core problem yang mau diselesaikan proposal), **Dashboard Rekap dasar** (dibutuhkan buat laporan PKL).
