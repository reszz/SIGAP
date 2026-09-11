# SIGAP — Sistem Informasi Kegiatan, Absensi, dan Pelaporan

SIGAP adalah platform manajemen kegiatan berbasis web untuk **HMIF (Himpunan Mahasiswa Teknik Informatika)**, Institut Digital Ekonomi LPKIA Bandung. Dibangun sebagai project PKL (Praktik Kerja Lapangan) untuk membantu pengurus organisasi mengelola seluruh siklus kegiatan — dari perencanaan, kepanitiaan, RSVP, presensi, anggaran, dokumentasi, hingga evaluasi dan pelaporan — dalam satu sistem terpusat, menggantikan proses manual yang sebelumnya tersebar di berbagai platform (WhatsApp, Google Form, Excel, dsb).

## Latar Belakang

HMIF sebelumnya mengelola kegiatan organisasi secara manual dan tersebar, yang menyebabkan data sulit dilacak, presensi rawan manipulasi, dan pelaporan pasca-kegiatan memakan waktu lama. SIGAP dikembangkan untuk menjawab masalah ini dengan menyediakan satu sistem yang mencakup seluruh siklus hidup kegiatan organisasi, lengkap dengan kontrol akses berjenjang dan pemisahan data antar periode kepengurusan.

## Tech Stack

- **Backend:** Laravel 12, Laravel Fortify (autentikasi)
- **Frontend:** Inertia.js + React + TypeScript
- **Styling:** Tailwind CSS
- **Database:** MySQL

## Fitur Utama

### Manajemen Kegiatan
- Daftar, jadwal, dan rundown kegiatan
- Manajemen kepanitiaan & pembagian tugas
- Form pendaftaran / RSVP peserta
- Presensi online (kode/tautan unik)
- Manajemen anggaran (estimasi & realisasi)
- Upload & arsip dokumentasi kegiatan
- Form evaluasi pasca-kegiatan
- Export laporan gabungan (Excel/PDF)
- Surat-menyurat organisasi

### Manajemen Organisasi
- Kelola anggota & struktur organisasi (divisi dan susunan pengurus)
- CRUD Visi & Misi organisasi (tampil di halaman publik)
- Artikel & berita organisasi
- Wish Wall

### Halaman Publik
- Landing page organisasi
- Kalender kegiatan publik
- Halaman profil, struktur organisasi, visi & misi, dan artikel yang bisa diakses tanpa login

## Sistem Role & Periode

SIGAP menerapkan kontrol akses berjenjang dengan **4 tingkat role**:

| Role | Akses |
|---|---|
| `super_admin` | Akses penuh ke seluruh fitur; tidak termasuk dalam daftar Anggota HMIF |
| `pembina` | Read-only di seluruh fitur, kecuali membuat periode baru dan menambahkan anggota |
| `pengurus` | Akses penuh ke fitur operasional & manajemen kegiatan; tidak bisa membuat periode baru |
| `anggota` | RSVP, presensi, dan pengisian evaluasi |

Data operasional (kegiatan, anggaran, keanggotaan, struktur organisasi, dsb.) di-scope per **Periode kepengurusan** — setiap periode memiliki data sendiri yang terpisah dan bersifat read-only permanen setelah periode tersebut tidak aktif lagi. Hanya `super_admin` dan `pembina` yang dapat membuat periode baru.

## Instalasi & Setup

### Prasyarat
- PHP >= 8.2
- Composer
- Node.js & npm
- MySQL

### Langkah Instalasi

```bash
# Clone repository
git clone <repository-url> sigap
cd sigap

# Install dependency backend
composer install

# Install dependency frontend
npm install

# Salin file environment
cp .env.example .env
php artisan key:generate

# Konfigurasi database di file .env, lalu jalankan migration & seeder
php artisan migrate --seed

# Buat symbolic link untuk storage (upload dokumentasi, foto pengurus, dsb.)
php artisan storage:link
```

### Menjalankan Aplikasi (Development)

```bash
# Jalankan server backend
php artisan serve

# Di terminal terpisah, jalankan Vite untuk frontend
npm run dev
```

Aplikasi dapat diakses di `http://localhost:8000`.

### Menjalankan Test

```bash
php artisan test
```

## Struktur Direktori Penting

```
app/
├── Enums/              # Enum role, jabatan, prioritas tugas
├── Http/Controllers/   # Controller untuk halaman pengurus & publik
├── Http/Middleware/    # Middleware otorisasi (role, periode)
├── Models/              # Model Eloquent
├── Policies/            # Policy otorisasi per fitur
└── Services/            # Business logic (mis. KegiatanAuthService)

database/
├── factories/           # Factory untuk testing/seeding
├── migrations/          # Skema database
└── seeders/              # Seeder data awal

resources/js/
├── components/           # Komponen React yang dapat dipakai ulang
├── layouts/               # Layout halaman (app, auth, public)
├── pages/                  # Halaman Inertia per modul
└── types/                   # Definisi TypeScript

tests/
├── Feature/                # Test fitur (per modul)
└── Unit/                    # Test unit
```

## Dokumentasi Proyek

Dokumen analisis dan perancangan (SRS, ERD, Data Dictionary, Class/Use Case/Sequence Diagram) tersedia di direktori `.kiro/specs/` dan/atau `dokumen SIGAP/` sesuai versi terbaru.

## Kontributor

- **Salira Restu Gusti** — Frontend & Full-Stack Developer, Wakil Ketua HMIF — Teknik Informatika, Institut Digital Ekonomi LPKIA Bandung

## Lisensi

Project ini dikembangkan untuk keperluan internal HMIF dan sebagai bagian dari program PKL. Hubungi kontributor untuk informasi penggunaan lebih lanjut.
