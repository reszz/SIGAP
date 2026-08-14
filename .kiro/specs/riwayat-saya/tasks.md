# Implementation Plan: Halaman Riwayat Saya (FR-41)

## Overview

Implementasi halaman read-only yang menampilkan riwayat keterlibatan personal User di Team aktif — mencakup RSVP, presensi per sesi, dan evaluasi. Urutan kerja mengikuti prasyarat: migration `team_id` di tabel `kegiatan` harus selesai sebelum controller dapat melakukan team-scoped query.

## Tasks

- [x] 1. Migration: tambah kolom `team_id` ke tabel `kegiatan`
  - Buat migration baru dengan `php artisan make:migration add_team_id_to_kegiatan_table --table=kegiatan`
  - Tambahkan kolom `$table->foreignId('team_id')->after('id')->constrained('teams')->cascadeOnDelete()`
  - Jalankan `php artisan migrate` untuk menerapkan migration
  - Jalankan `vendor/bin/pint --dirty` setelah file migration dibuat
  - _Requirements: 2.1, 2.4_

  - [x] 1.1 Update model `Kegiatan`: tambah relasi dan `$fillable`
    - Tambahkan `'team_id'` ke array `$fillable` di `app/Models/Kegiatan.php`
    - Tambahkan method relasi `public function team(): BelongsTo` yang mengarah ke `Team::class`
    - Tambahkan import `use Illuminate\Database\Eloquent\Relations\BelongsTo`
    - Jalankan `vendor/bin/pint --dirty` setelah file dimodifikasi
    - _Requirements: 2.1_

  - [x]* 1.2 Tambahkan kolom `team_id` ke `KegiatanFactory` jika ada, agar factory-based tests tidak gagal
    - Cek `database/factories/KegiatanFactory.php` — jika ada, tambahkan `'team_id' => Team::factory()` ke `definition()`
    - Jika factory belum ada, buat dengan `php artisan make:factory KegiatanFactory --model=Kegiatan`
    - _Requirements: 2.1_

- [x] 2. Route dan Controller
  - [x] 2.1 Daftarkan route `riwayat-saya.index` di `routes/web.php`
    - Tambahkan `use App\Http\Controllers\RiwayatSayaController` di bagian import
    - Tambahkan route berikut di dalam grup `/{current_team}` yang sudah ada, di bawah blok "Route bersama":
      ```php
      Route::get('riwayat-saya', [RiwayatSayaController::class, 'index'])
          ->name('riwayat-saya.index');
      ```
    - Tidak perlu middleware tambahan — grup `/{current_team}` sudah menggunakan `['auth', 'verified', EnsureTeamMembership::class]`
    - Setelah route terdaftar, jalankan `php artisan wayfinder:generate` untuk menghasilkan `resources/js/routes/riwayat-saya/index.ts`
    - _Requirements: 1.1, 1.3_

  - [x] 2.2 Buat `RiwayatSayaController` dengan tiga query eager-loaded
    - Buat file dengan `php artisan make:controller RiwayatSayaController`
    - Implementasikan method `index(Request $request): Response`
    - Ambil `$user = $request->user()` dan `$team = $user->currentTeam`
    - Tambahkan guard `abort_if(! $team, 403, 'User tidak terdaftar di Team mana pun.')`
    - **Query 1 — riwayatRsvp**: `Rsvp::with(['kegiatan:id,nama'])` → `where('user_id', $user->id)` → `whereHas('kegiatan', fn ($q) => $q->where('team_id', $team->id)->withoutTrashed())` → `orderByDesc('waktu_daftar')` → `limit(50)` → `get()` → `map()` ke shape `RiwayatRsvpItem`
    - **Query 2 — riwayatPresensi**: `Presensi::with(['sesi:id,kegiatan_id,tanggal', 'sesi.kegiatan:id,nama'])` → `where('user_id', $user->id)` → `whereHas('sesi.kegiatan', fn ($q) => $q->where('team_id', $team->id)->withoutTrashed())` → `orderByDesc('waktu_isi')` → `limit(50)` → `get()` → `map()` ke shape `RiwayatPresensiItem`
    - **Query 3 — riwayatEvaluasi**: `Evaluasi::with(['kegiatan:id,nama'])` → `where('user_id', $user->id)` → `whereHas('kegiatan', fn ($q) => $q->where('team_id', $team->id)->withoutTrashed())` → `orderByDesc('created_at')` → `limit(50)` → `get()` → `map()` ke shape `RiwayatEvaluasiItem`
    - Return `Inertia::render('riwayat-saya/index', ['riwayatRsvp' => ..., 'riwayatPresensi' => ..., 'riwayatEvaluasi' => ...])`
    - Jalankan `vendor/bin/pint --dirty` setelah controller dibuat
    - _Requirements: 1.1, 1.3, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.4, 5.1, 5.2, 5.5, 8.1, 8.2_

- [x] 3. React Page
  - [x] 3.1 Buat halaman `resources/js/pages/riwayat-saya/index.tsx` — scaffold dan types
    - Buat direktori `resources/js/pages/riwayat-saya/` jika belum ada
    - Definisikan TypeScript types: `RiwayatRsvpItem`, `RiwayatPresensiItem`, `RiwayatEvaluasiItem`, dan `Props`
    - Scaffold komponen utama `RiwayatSaya` yang menerima props dan merender `<Head title="Riwayat Saya" />`
    - Tambahkan `RiwayatSaya.layout` sebagai object breadcrumb mengikuti pola `dashboard.tsx`:
      ```typescript
      RiwayatSaya.layout = (props: { currentTeam?: { slug: string } | null }) => ({
          breadcrumbs: [{ title: 'Riwayat Saya', href: props.currentTeam ? `/${props.currentTeam.slug}/riwayat-saya` : '/riwayat-saya' }],
      });
      ```
    - Gunakan layout utama yang sama dengan halaman lain (`AppSidebarLayout` atau pola yang konsisten dengan sibling pages)
    - _Requirements: 7.1, 7.2_

  - [x] 3.2 Implementasikan helper functions dan komponen shared di halaman yang sama
    - Implementasikan `formatTanggal(iso: string): string` menggunakan `toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })`
    - Implementasikan `formatWaktu(iso: string): string` menggunakan `toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })`
    - Implementasikan `truncate(text: string, max = 200): string` yang menambahkan `'…'` jika `text.length > max`
    - Implementasikan komponen `EmptyState({ message }: { message: string })` dengan styling `py-6 text-center text-sm text-neutral-400`
    - Implementasikan komponen `Section({ title, icon, children })` mengikuti pola dari `kegiatan/show.tsx` (rounded-xl border, bg-white, shadow-sm)
    - _Requirements: 4.5, 5.3, 7.3_

  - [x] 3.3 Implementasikan section Riwayat RSVP
    - Implementasikan komponen `RsvpStatusBadge({ status })` dengan dua warna: `terdaftar` → `bg-green-100 text-green-700`, `dibatalkan` → `bg-neutral-100 text-neutral-500`
    - Render daftar card dari `riwayatRsvp` — setiap item menampilkan nama kegiatan, `RsvpStatusBadge`, dan tanggal daftar (diformat dengan `formatTanggal`)
    - Jika `riwayatRsvp.length === 0`, render `<EmptyState message="Belum ada riwayat RSVP di team ini." />`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 3.4 Implementasikan section Riwayat Presensi
    - Render daftar card dari `riwayatPresensi` — setiap item menampilkan nama kegiatan, tanggal sesi (`sesiTanggal ?? '-'`), dan waktu isi presensi (`waktuIsi` diformat dengan `formatWaktu`, atau `'-'` jika null)
    - Jika `riwayatPresensi.length === 0`, render `<EmptyState message="Belum ada riwayat presensi di team ini." />`
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [x] 3.5 Implementasikan section Riwayat Evaluasi
    - Render daftar card dari `riwayatEvaluasi` — setiap item menampilkan nama kegiatan, rating (tampilkan sebagai bintang atau angka "⭐ {rating}/5"), komentar truncated via `truncate(komentar, 200)` jika tidak null, dan tanggal evaluasi diformat dengan `formatTanggal`
    - Jika `riwayatEvaluasi.length === 0`, render `<EmptyState message="Belum ada riwayat evaluasi di team ini." />`
    - Pastikan tidak ada tombol, form input, atau link yang memicu mutasi data (halaman bersifat read-only)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 7.4_

- [x] 4. Checkpoint — Pastikan aplikasi dapat dijalankan
  - Pastikan semua tests pass, tanya user jika ada yang perlu dikonfirmasi sebelum lanjut ke task berikutnya.

- [x] 5. Feature Tests (Pest)
  - Buat file test dengan `php artisan make:test --pest RiwayatSayaTest`

  - [x] 5.1 Test access control: guest, semua team role, dan user bukan anggota team
    - `test('guest diarahkan ke halaman login saat mengakses riwayat-saya')` — akses tanpa auth, assert redirect ke route `login`
    - `test('member dapat mengakses halaman riwayat-saya')` — buat user dengan team role `member`, assert 200 + Inertia component `riwayat-saya/index`
    - `test('admin dapat mengakses halaman riwayat-saya')` — buat user dengan team role `admin`, assert 200
    - `test('owner dapat mengakses halaman riwayat-saya')` — buat user dengan team role `owner`, assert 200
    - `test('user yang bukan anggota team mendapat 403')` — buat user tanpa keanggotaan di team target, assert 403
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 5.2 Test isolasi data user dan scoping team
    - `test('riwayatRsvp hanya berisi data milik user aktif, bukan user lain dalam team yang sama')` — buat dua user di team yang sama, buat RSVP untuk keduanya, assert `has('riwayatRsvp', 1)` saat login sebagai user pertama
    - `test('riwayatPresensi tidak memuat data dari team lain yang juga diikuti user')` — buat dua team, buat presensi user di kedua team, assert hanya data team aktif yang muncul
    - `test('evaluasi untuk kegiatan yang soft-deleted tidak muncul di riwayatEvaluasi')` — buat evaluasi untuk kegiatan, soft-delete kegiatan tersebut, assert `has('riwayatEvaluasi', 0)`
    - _Requirements: 2.1, 2.2, 3.1, 5.5_

  - [x] 5.3 Test ordering dan limit
    - `test('riwayatRsvp diurutkan berdasarkan waktu_daftar descending')` — buat dua RSVP dengan `waktu_daftar` berbeda, assert item pertama adalah yang paling baru
    - `test('riwayatPresensi diurutkan berdasarkan waktu_isi descending')` — buat dua presensi dengan `waktu_isi` berbeda, assert urutan descending
    - `test('controller membatasi riwayatPresensi maksimal 50 record')` — buat 55 presensi, assert `has('riwayatPresensi', 50)`
    - _Requirements: 3.1, 4.1, 4.4, 8.1, 8.2_

  - [x] 5.4 Test empty state dan Inertia props shape
    - `test('halaman riwayat-saya merender tiga section kosong untuk user tanpa riwayat apapun')` — login sebagai user baru tanpa RSVP/presensi/evaluasi, assert `has('riwayatRsvp', 0)`, `has('riwayatPresensi', 0)`, `has('riwayatEvaluasi', 0)`
    - `test('halaman riwayat-saya merender komponen yang benar dengan props yang sesuai')` — buat satu data per section, assert Inertia component `riwayat-saya/index` dan verifikasi shape prop (kegiatanNama, status, waktuDaftar untuk RSVP; kegiatanNama, sesiTanggal, waktuIsi untuk presensi; kegiatanNama, rating, tanggal untuk evaluasi)
    - Pada salah satu test, gunakan `DB::enableQueryLog()` sebelum request dan `DB::getQueryLog()` sesudah untuk verifikasi jumlah query konstan (tidak N+1)
    - _Requirements: 6.1, 6.2, 7.2, 8.1_

- [x] 6. Final Checkpoint — Pastikan semua tests pass
  - Jalankan `php artisan test --compact --filter=RiwayatSayaTest` dan pastikan semua passing.
  - Jalankan `vendor/bin/pint --dirty` untuk memastikan semua file PHP yang dimodifikasi sesuai code style.

## Notes

- Tasks bertanda `*` bersifat opsional dan bisa dilewati untuk MVP yang lebih cepat.
- Tidak ada Property-Based Testing untuk fitur ini — design document secara eksplisit menyatakan PBT tidak sesuai untuk read-only data retrieval sederhana. Semua testing menggunakan example-based Pest feature tests.
- Task 1 (migration) adalah hard prerequisite untuk task 2.2 (controller). Task 1.1 (model) juga harus selesai sebelum controller dapat menggunakan relasi `team`.
- Controller tidak boleh mengikuti pola `DashboardController` yang tidak melakukan team scoping — gunakan `whereHas(..., fn ($q) => $q->where('team_id', $team->id))` secara eksplisit.
- `Presensi` tidak memiliki `timestamps` (`created_at`/`updated_at`), sehingga ordering menggunakan `waktu_isi`.
- Nilai `sesiTanggal` dan `waktuIsi` bisa null — React harus render `'-'` untuk nilai null (Req 4.5), bukan crash.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1"] },
    { "id": 2, "tasks": ["2.2"] },
    { "id": 3, "tasks": ["3.1"] },
    { "id": 4, "tasks": ["3.2"] },
    { "id": 5, "tasks": ["3.3", "3.4", "3.5"] },
    { "id": 6, "tasks": ["5.1", "5.2", "5.3", "5.4"] }
  ]
}
```
