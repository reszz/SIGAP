# Implementation Plan: Manajemen Divisi Panitia per Kegiatan (FR-25)

## Overview

Menambahkan operasi store dan destroy Divisi Panitia ke halaman Detail Kegiatan. Tidak ada migrasi baru — infrastruktur database sudah lengkap. Urutan pengerjaan: backend (controller + route) → model tweak → frontend → tests.

## Tasks

- [x] 1. Tambah `HasFactory` trait ke model `DivisiPanitia`
  - Buka `app/Models/DivisiPanitia.php`, tambahkan `use HasFactory;` dan import-nya.
  - _Requirements: (prerequisite untuk TC-6, TC-7, TC-8)_

- [x] 2. Buat `DivisiPanitiaController`
  - [x] 2.1 Buat file `app/Http/Controllers/DivisiPanitiaController.php`
    - Buat class dengan metode `store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse`.
    - Validasi `nama_divisi`: required, string, max:100.
    - Resolve Team via `Team::where('slug', $currentTeam)->firstOrFail()`.
    - `abort_if($kegiatan->team_id !== $team->id, 403)`.
    - `$kegiatan->divisiPanitia()->create(['nama_divisi' => $validated['nama_divisi']])`.
    - `redirect()->back()->with('success', "Divisi \"{$validated['nama_divisi']}\" berhasil ditambahkan.")`.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_
  - [x] 2.2 Tambahkan metode `destroy(Request $request, string $currentTeam, DivisiPanitia $divisi): RedirectResponse`
    - Resolve Team dari slug.
    - `$divisi->load('kegiatan')`.
    - `abort_if($divisi->kegiatan->team_id !== $team->id, 403)`.
    - `$divisi->delete()`.
    - `redirect()->back()->with('success', 'Divisi berhasil dihapus.')`.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3. Daftarkan routes di `routes/web.php`
  - Di dalam grup `pengurus/` yang sudah ada, tambahkan:
    ```php
    Route::post('kegiatan/{kegiatan}/divisi', [DivisiPanitiaController::class, 'store'])->name('divisi.store');
    Route::delete('divisi/{divisi}', [DivisiPanitiaController::class, 'destroy'])->name('divisi.destroy');
    ```
  - Kedua route mewarisi middleware `EnsureUserHasRole:pengurus` dari grup induk.
  - Jalankan `php artisan wayfinder:generate` setelah route ditambahkan.
  - _Requirements: 4.1, 4.2_

- [x] 4. Checkpoint — Pastikan routing dan controller terdaftar benar
  - Jalankan `php artisan route:list --name=divisi` dan konfirmasi dua route muncul.
  - Jalankan `vendor/bin/pint --dirty` untuk format semua file PHP yang diubah.
  - Tanyakan ke user jika ada pertanyaan sebelum lanjut.

- [x] 5. Perbarui `KegiatanController::detail()` untuk kirim prop `canManage`
  - Buka `app/Http/Controllers/KegiatanController.php`, temukan metode `detail()`.
  - Tambahkan key `'canManage'` ke array Inertia render:
    ```php
    'canManage' => in_array($request->user()->teamRole($team), ['owner', 'admin']),
    ```
    (atau sesuaikan dengan cara project ini mengecek role pengurus — cek middleware `EnsureUserHasRole` untuk logika yang konsisten).
  - _Requirements: 4.3, 4.4_

- [x] 6. Perbarui `resources/js/pages/kegiatan/show.tsx`
  - [x] 6.1 Tambahkan prop `canManage: boolean` ke tipe `Props`
    - Destructure `canManage` dari props.
    - _Requirements: 4.3, 4.4_
  - [x] 6.2 Tambahkan form inline tambah Divisi (tampil hanya jika `canManage === true`)
    - Gunakan `useForm({ nama_divisi: '' })`.
    - Letakkan di atas daftar Divisi dalam seksi "Panitia dan Tugas".
    - Input text `nama_divisi` dengan `maxLength={100}`.
    - Tampilkan `form.errors.nama_divisi` di bawah input bila ada.
    - Submit ke `route('divisi.store', { current_team: currentTeam, kegiatan: kegiatan.id })`.
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
  - [x] 6.3 Tambahkan tombol hapus Divisi di tiap baris (tampil hanya jika `canManage === true`)
    - Gunakan `router.delete(route('divisi.destroy', { current_team: currentTeam, divisi: divisi.id }), { onBefore: () => window.confirm(...) })`.
    - _Requirements: 5.4, 5.5_

- [x] 7. Buat factories untuk test

  - [x] 7.1 Buat `database/factories/DivisiPanitiaFactory.php`
    - `kegiatan_id`: asosiasikan ke `Kegiatan::factory()`.
    - `nama_divisi`: `fake()->words(2, true)`.
    - _Requirements: (prerequisite test TC-1, TC-3, TC-6, TC-7, TC-8)_
  - [x] 7.2 Buat `database/factories/TugasPanitiaFactory.php`
    - Sesuaikan kolom dengan struktur tabel `tugas_panitia` yang ada.
    - `divisi_id`: asosiasikan ke `DivisiPanitia::factory()`.
    - _Requirements: (prerequisite test TC-8)_

- [x] 8. Tulis feature tests di `tests/Feature/DivisiPanitiaTest.php`
  - [x] 8.1 TC-1: Pengurus berhasil tambah Divisi ke Kegiatan milik Team-nya
    - Setup: Pengurus di Team A, Kegiatan milik Team A.
    - POST ke `divisi.store` dengan `nama_divisi = 'Acara'`.
    - Assert: `assertRedirect()`, `assertDatabaseHas('divisi_panitia', ['nama_divisi' => 'Acara', 'kegiatan_id' => $kegiatan->id])`.
    - _Requirements: 1.1, 1.4_
  - [x] 8.2 TC-2: Member tidak bisa tambah Divisi (403 dari middleware)
    - Setup: Member di Team A, Kegiatan milik Team A.
    - POST ke `divisi.store`.
    - Assert: `assertForbidden()`.
    - _Requirements: 4.1, 4.2_
  - [x] 8.3 TC-3: Pengurus tidak bisa tambah Divisi ke Kegiatan Team lain (403 dari controller)
    - Setup: Pengurus di Team A, Kegiatan milik Team B.
    - POST ke URL `/{team-a}/pengurus/kegiatan/{kegiatan-team-b}/divisi`.
    - Assert: `assertForbidden()`.
    - _Requirements: 1.2, 1.3_
  - [x] 8.4 TC-4: Validasi `nama_divisi` kosong
    - Setup: Pengurus, Team, Kegiatan milik Team.
    - POST dengan `nama_divisi = ''`.
    - Assert: `assertSessionHasErrors('nama_divisi')`, tidak ada record baru di DB.
    - _Requirements: 2.1, 2.3_
  - [x] 8.5 TC-5: Validasi `nama_divisi` > 100 karakter
    - POST dengan `nama_divisi = str_repeat('a', 101)`.
    - Assert: `assertSessionHasErrors('nama_divisi')`.
    - _Requirements: 2.2, 2.4_
  - [x] 8.6 TC-6: Pengurus berhasil hapus Divisi milik Team-nya
    - Setup: Pengurus, Team A, Kegiatan dan Divisi milik Team A.
    - DELETE ke `divisi.destroy`.
    - Assert: `assertRedirect()`, `assertDatabaseMissing('divisi_panitia', ['id' => $divisi->id])`.
    - _Requirements: 3.1, 3.4_
  - [x] 8.7 TC-7: Pengurus tidak bisa hapus Divisi dari Team lain (403)
    - Setup: Pengurus di Team A, Divisi milik Kegiatan Team B.
    - DELETE ke `/{team-a}/pengurus/divisi/{divisi-team-b}`.
    - Assert: `assertForbidden()`, record masih ada di DB.
    - _Requirements: 3.2, 3.3_
  - [x] 8.8 TC-8: Hapus Divisi cascade-hapus TugasPanitia
    - Setup: Divisi dengan 2 TugasPanitia.
    - DELETE ke `divisi.destroy`.
    - Assert: `assertDatabaseMissing('tugas_panitia', ['divisi_id' => $divisi->id])`.
    - _Requirements: 3.5_

- [x] 9. Checkpoint final — Jalankan semua tests
  - Jalankan `php artisan test --compact --filter=DivisiPanitia`.
  - Pastikan semua 8 test cases hijau.
  - Tanyakan ke user jika ada pertanyaan.

## Notes

- Tasks bertanda `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat.
- Tidak ada migrasi baru — skema sudah lengkap.
- Tidak ada PBT — semua test example-based sesuai design doc.
- Cascade delete `tugas_panitia` dikerjakan oleh FK database, bukan logika PHP.
- Setelah menambah route, jalankan `php artisan wayfinder:generate` agar TypeScript bindings ter-update.
- Jalankan `vendor/bin/pint --dirty` setelah setiap file PHP baru/dimodifikasi.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "7.1"] },
    { "id": 1, "tasks": ["2.2", "7.2"] },
    { "id": 2, "tasks": ["6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3"] },
    { "id": 4, "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8"] }
  ]
}
```
