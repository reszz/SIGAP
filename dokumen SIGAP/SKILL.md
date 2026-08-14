---
name: sigap-project-context
description: Konteks lengkap project SIGAP (Sistem Informasi Kegiatan, Absensi, dan Pelaporan) — platform manajemen kegiatan organisasi mahasiswa untuk PKL Salira Restu Gusti di Teknik Informatika, IDE LPKIA Bandung. WAJIB dipakai setiap kali mengerjakan apa pun yang berkaitan dengan SIGAP: menulis kode (Laravel/Inertia/React/TypeScript/Fortify), membuat atau merevisi dokumen analisis (SRS, ERD, use case, sequence/state diagram, data dictionary), mendesain UI/kalender FullCalendar, menyusun timeline/task breakdown, atau menjawab pertanyaan tentang requirement/scope/keputusan desain proyek ini. Jangan menjawab dari asumsi/tebakan soal SIGAP — selalu cek skill ini dan dokumen pendamping yang dirujuk di dalamnya dulu, karena banyak keputusan (terutama soal RSVP) sudah direvisi beberapa kali dan versi lama tidak berlaku lagi.
---

# SIGAP — Project Context

Skill ini merangkum keputusan final proyek SIGAP supaya kerja lanjutan (coding, revisi dokumen, atau sesi AI baru) nggak perlu re-derive dari nol atau salah pakai keputusan versi lama yang udah direvisi.

## Ringkasan Proyek

**SIGAP** = Sistem Informasi Kegiatan, Absensi, dan Pelaporan — platform manajemen kegiatan (event organizer) **internal** untuk organisasi mahasiswa (HMIF, Teknik Informatika, IDE LPKIA Bandung). Dikerjakan solo oleh Salira Restu Gusti sebagai proyek PKL, skala **1 bulan / 20 hari kerja**.

**Stack:** Laravel 12 (React Starter Kit) + Inertia + React + TypeScript + Tailwind + Fortify (auth) + FullCalendar (`@fullcalendar/react`).

**Scope inti:** kalender kegiatan, RSVP, presensi digital, manajemen panitia, anggaran sederhana, dokumentasi, evaluasi pasca-kegiatan, dashboard rekap, export laporan (Excel/PDF).

**Di luar scope versi ini (dicatat sebagai pengembangan lanjutan, JANGAN diimplementasikan kecuali user eksplisit minta):** peserta eksternal/tamu di luar Anggota terdaftar, dukungan multi-tenant lintas organisasi, UI kelola akun Pengurus, notifikasi otomatis, QR code presensi, approval izin/sakit, validasi geolocation.

## Keputusan Final yang WAJIB Diikuti (sering salah kalau nebak)

Ini poin-poin yang paling sering direvisi selama analisis — pastikan versi TERBARU ini yang dipakai, bukan asumsi umum:

1. **Dua role saja:** `pengurus` dan `anggota`. Anggota WAJIB punya akun login sendiri (bukan guest/tanpa akun). Akun Anggota hanya dibuat oleh Pengurus (tidak ada self-register publik — `Features::registration()` Fortify dimatikan).
2. **Akun Pengurus pertama** dibuat manual lewat Database Seeder (bukan lewat form aplikasi) — solusi buat chicken-and-egg problem karena Anggota/Pengurus lain cuma bisa dibuat oleh Pengurus yang udah login.
3. **Kegiatan punya dua tipe:** `wajib_hadir` (rapat rutin dst — semua Anggota otomatis boleh hadir, TIDAK ada RSVP, langsung presensi) vs `terbuka` (workshop/seminar dst — ada kuota, WAJIB RSVP dulu sebelum bisa presensi).
4. **RSVP versi final itu SEDERHANA (instant-only)** — ini titik yang paling sering salah diasumsikan karena sempat ada draf lebih kompleks yang sudah DIBATALKAN:
   - Cuma 2 status: `terdaftar` dan `dibatalkan`.
   - TIDAK ADA mode approval, TIDAK ADA status `menunggu`/`ditolak`, TIDAK ADA Pengurus menyetujui/menolak satu-satu.
   - Anggota RSVP → langsung `terdaftar` selama kuota masih ada. Kuota cuma dihitung dari status `terdaftar`.
   - RSVP di level **Kegiatan**, bukan per Sesi — satu RSVP berlaku untuk semua sesi kegiatan multi-hari.
   - Presensi Kegiatan Terbuka HANYA bisa diisi kalau status RSVP Anggota = `terdaftar`.
5. **Kegiatan bisa multi-hari** — dipisah jadi entitas `Kegiatan` (induk: nama, tipe, kuota, warna) dan `Sesi` (anak: tanggal, jam, lokasi, kode presensi — bisa lebih dari satu per Kegiatan). Rundown & presensi nempel ke Sesi, bukan ke Kegiatan langsung.
6. **Status Sesi (`terjadwal`/`berlangsung`/`selesai`) itu COMPUTED, BUKAN kolom database.** Dihitung on-the-fly dari `waktu_mulai`/`waktu_selesai` vs waktu sekarang (accessor di model). **Sengaja TIDAK pakai cron/scheduled job** — keputusan sadar untuk menghindari kompleksitas infrastruktur yang nggak sepadan untuk scope 1 bulan.
7. **Warna kegiatan itu bebas per-Kegiatan** (auto-assign dari palet 10 warna, bisa diubah manual Pengurus), BUKAN warna tetap per kategori. Semua sesi dari Kegiatan yang sama otomatis mewarisi warna yang sama (pakai `groupId` di FullCalendar).
8. **Evaluasi:** rating 1–5 + komentar bebas (textarea). Satu evaluasi per Anggota per Kegiatan (constraint unik `kegiatan_id+user_id`), tapi BISA diedit ulang — submit kedua = update, bukan insert baru.
9. **Library export:** `maatwebsite/excel` (Excel) + `barryvdh/laravel-dompdf` (PDF). *(Catatan: `barryvdh` TIDAK punya package Excel yang aktif dipelihara — jangan salah pakai fork lamanya.)*
10. **Storage dokumentasi:** local disk (`storage/app/public`), bukan cloud — cukup untuk scope PKL.
11. **Kolom nama User pakai `name` (bukan `nama`)** — satu-satunya pengecualian dari konvensi Bahasa Indonesia di seluruh dokumen, sengaja dipertahankan karena itu kolom bawaan Laravel React Starter Kit/Fortify (dipakai komponen profil, dst). Semua tabel lain (kegiatan.nama, divisi_panitia.nama_divisi, dst) tetap Bahasa Indonesia.

## Dokumen Pendamping — Kapan Dirujuk

Semua di folder yang sama dengan skill ini. **Baca yang relevan sebelum kerja, jangan cuma modal skill ini doang** — skill ini ringkasan, bukan pengganti detail lengkap.

| File | Konsultasi kalau... |
|---|---|
| `SRS.md` | Butuh nomor FR/NFR spesifik, riwayat revisi lengkap (v1.0–v1.3), atau alasan di balik suatu keputusan |
| `SIGAP-ERD.mermaid` | Butuh lihat relasi antar tabel |
| `SIGAP-DataDictionary.md` | Nulis migration — nama kolom, tipe data, constraint, aturan bisnis persis |
| `SIGAP-ClassDiagram.mermaid` | Butuh struktur OOP/model |
| `SIGAP-UseCaseDiagram.mermaid` | Butuh cek siapa boleh ngapain |
| `SIGAP-SequenceDiagram-RSVP.mermaid` | Implementasi endpoint RSVP — urutan request persis |
| `SIGAP-SequenceDiagram-Presensi.mermaid` | Implementasi endpoint presensi — urutan validasi persis |
| `SIGAP-SequenceDiagram-Evaluasi.mermaid` | Implementasi endpoint evaluasi (isi vs edit) |
| `SIGAP-StateDiagram-RSVP.mermaid` | Cek transisi status RSVP yang valid |
| `SIGAP-StateDiagram-Sesi.mermaid` | Cek transisi status Sesi & kaitannya ke RSVP/presensi/evaluasi |
| `design.md` | Kerja apa pun soal UI — token warna, tipografi, komponen, spek FullCalendar, struktur halaman |
| `SIGAP-API-Endpoints.md` | Butuh daftar route lengkap (method, path, request, role) |
| `SIGAP-Tutorial-Setup.md` | Mulai coding dari nol — migration, model, seeder, middleware, contoh modul Kegiatan+Kalender |
| `SIGAP-TaskBreakdown-Harian.md` | Butuh tau urutan kerja per hari + cut list kalau waktu mepet |
| `SIGAP_Timeline_PKL.xlsx` | Butuh lihat jadwal Gantt visual |

## Kalau Ada Instruksi yang Kontradiksi Skill Ini

Kalau di percakapan baru user minta sesuatu yang beda dari poin-poin di atas (misal "tambahin lagi mode approval RSVP" atau "bikin multi-tenant"), **itu valid sebagai instruksi baru** — user boleh mengubah keputusan kapan saja. Tapi update juga skill ini dan dokumen terkait (terutama `SRS.md` bagian Riwayat Revisi) supaya tetap jadi satu sumber kebenaran yang konsisten, bukan biarin skill ini jadi basi.
