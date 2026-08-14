# Implementation Plan: Tugas Panitia (FR-26, FR-27, FR-28)

## Overview

Implementasi dibagi menjadi empat bagian berurutan: routes + controller backend,
penyesuaian `KegiatanController::detail()`, perubahan tipe dan komponen di
`show.tsx`, lalu feature tests. Tidak ada migration baru — schema `tugas_panitia`
sudah ada. Setiap langkah backend diakhiri dengan `vendor/bin/pint --dirty`.

## Tasks

- [ ] 1. Daftarkan 3 route baru di `routes/web.php`
  - Tambahkan `use App\Http\Controllers\TugasPanitiaController;` di blok import atas.
  - Di dalam grup `pengurus/` (setelah route `divisi.destroy`), tambahkan:
    ```
    POST  kegiatan/{kegiatan}/divisi/{divisi}/tugas  → store   → name: tugas.store
    DELETE tugas/{tugas}                             → destroy  → name: tugas.destroy
    ```
  - Di luar grup `pengurus/`, di dalam blok shared `{current_team}` (setelah route `kegiatan.detail`), tambahkan:
    ```
    PATCH tugas/{tugas}/status → updateStatus → name: tugas.updateStatus
    ```
  - Jalankan `php artisan wayfinder:generate` setelah route terdaftar.
  - Jalankan `vendor/bin/pint --dirty`.
  - _Requirements: 1.1, 3.1, 4.1_

- [ ] 2. Buat `TugasPanitiaController`
  - [ ] 2.1 Buat file `app/Http/Controllers/TugasPanitiaController.php` dengan method `store`
    - Resolve `$team` dari slug, load `$divisi->kegiatan`, lakukan double-check scope:
      `abort_if($divisi->kegiatan->team_id !== $team->id, 403)` dan
      `abort_if($divisi->kegiatan_id !== $kegiatan->id, 403)`.
    - Validasi `user_id` dengan `Rule::exists('team_members', 'user_id')->where('team_id', $team->id)`.
    - Validasi `deskripsi_tugas`: `required|string|max:255`.
    - `TugasPanitia::create([..., 'status' => 'belum'])`.
    - Return `redirect()->back()`.
    - Jalankan `vendor/bin/pint --dirty`.
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 6.1, 6.2_

  - [ ] 2.2 Tambahkan method `destroy` ke `TugasPanitiaController`
    - Load `$tugas->divisiPanitia->kegiatan` (ikuti pola `DivisiPanitiaController::destroy`).
    - `abort_if($tugas->divisiPanitia->kegiatan->team_id !== $team->id, 403)`.
    - `$tugas->delete()`, return `redirect()->back()`.
    - Jalankan `vendor/bin/pint --dirty`.
    - _Requirements: 3.1, 3.2, 6.1_

  - [ ] 2.3 Tambahkan method `updateStatus` ke `TugasPanitiaController`
    - `abort_if($tugas->user_id !== $request->user()->id, 403)` — ownership check.
    - Validasi `status`: `required|Rule::in(['belum', 'sedang', 'selesai'])`.
    - `$tugas->update(['status' => $validated['status']])` — array eksplisit, field lain diabaikan.
    - Return `redirect()->back()`.
    - Jalankan `vendor/bin/pint --dirty`.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 3. Perbarui `KegiatanController::detail()` — tambah props `anggotaTeam` dan `authUserId`
  - Resolve `$team` dari slug (ikuti pola `DivisiPanitiaController`):
    `$team = Team::where('slug', $currentTeam)->firstOrFail()`.
  - Tambahkan `abort_if($kegiatan->team_id !== $team->id, 403)` untuk scope guard.
  - Tambahkan ke array `Inertia::render`:
    ```php
    'anggotaTeam' => $team->members()
        ->get()
        ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name]),
    'authUserId'  => $request->user()->id,
    ```
  - Pastikan relasi `divisiPanitia.tugasPanitia.user` sudah ada di `load()` (sudah ada, tidak perlu diubah).
  - Jalankan `vendor/bin/pint --dirty`.
  - _Requirements: 1.7, 5.4_

- [ ] 4. Checkpoint — verifikasi backend sebelum lanjut ke frontend
  - Pastikan semua tests pass, tanya ke user jika ada pertanyaan.

- [ ] 5. Perbarui tipe TypeScript di `resources/js/pages/kegiatan/show.tsx`
  - Tambahkan `user_id: number` ke tipe `Tugas`.
  - Tambahkan tipe baru:
    ```ts
    type AnggotaTeamItem = { id: number; name: string };
    ```
  - Tambahkan ke tipe `Props`: `anggotaTeam: AnggotaTeamItem[]` dan `authUserId: number`.
  - Perbarui destructure di fungsi default export: `{ kegiatan, canManage, anggotaTeam, authUserId }`.
  - Perbarui signature `PanitiaSection` untuk menerima `anggotaTeam` dan `authUserId`.
  - _Requirements: 2.1, 5.1, 5.4_

- [ ] 6. Implementasi komponen frontend di `show.tsx`
  - [ ] 6.1 Tambahkan import Wayfinder untuk routes tugas
    - Import `tugas` dari `@/routes/tugas` (untuk `updateStatus`) dan dari `@/routes/pengurus/tugas` (untuk `store`, `destroy`).
    - _Requirements: 2.1, 3.4, 4.1_

  - [ ] 6.2 Buat sub-komponen `AssignForm` (isolated per-Divisi, di dalam `show.tsx`)
    - Props: `teamSlug`, `kegiatan`, `divisi`, `anggotaTeam`.
    - `useForm({ user_id: '', deskripsi_tugas: '' })`.
    - `form.post(tugasPengurus.store.url({...}), { preserveScroll: true, onSuccess: () => form.reset() })`.
    - Dropdown `<select>` berisi `anggotaTeam` (id + name), input teks deskripsi.
    - Tombol submit di-disable selama `form.processing`.
    - Tampilkan pesan error dari `form.errors.user_id` dan `form.errors.deskripsi_tugas`.
    - _Requirements: 2.1, 2.2, 2.3, 1.6_

  - [ ] 6.3 Buat sub-komponen `StatusControl` (per-tugas, di dalam `show.tsx`)
    - Props: `tugas`, `teamSlug`.
    - `useForm({ status: tugas.status })`.
    - `onChange`: `form.setData('status', newStatus)` lalu `form.patch(tugas.updateStatus.url({...}), { preserveScroll: true })`.
    - Dropdown/select di-disable selama `form.processing`.
    - _Requirements: 5.1, 5.3, 4.1_

  - [ ] 6.4 Perbarui render list tugas dalam `PanitiaSection` — tambah Progres_Divisi, hapus tugas, StatusControl
    - Di header tiap Divisi, tambahkan teks Progres_Divisi dihitung lokal:
      `"{selesai} dari {total} tugas selesai"` (filter `status === 'selesai'`).
    - Per baris tugas:
      - `[canManage]` Tampilkan tombol hapus dengan `window.confirm` → `router.delete(tugasPengurus.destroy.url({...}), { preserveScroll: true })`.
      - `[authUserId === tugas.user_id]` Render `<StatusControl>`.
      - `[lainnya]` Render `taskStatusLabel[tugas.status]` sebagai teks read-only.
    - `[canManage]` Render `<AssignForm>` di bawah daftar tugas tiap Divisi.
    - _Requirements: 2.1, 2.4, 2.5, 3.4, 5.1, 5.2_

- [ ] 7. Checkpoint — pastikan UI render benar
  - Pastikan semua tests pass dan tampilan sesuai, tanya ke user jika ada pertanyaan.

- [ ] 8. Buat `tests/Feature/TugasPanitiaTest.php`
  - [ ]* 8.1 Tulis test cases Store (TC-1 s.d. TC-7)
    - TC-1: Pengurus assign Member → record tersimpan dengan `status = 'belum'`, redirect back.
    - TC-2: Member (bukan Pengurus) POST store → 403 dari middleware `EnsureUserHasRole:pengurus`.
    - TC-3: Pengurus assign ke Divisi dari Team lain → 403 dari controller.
    - TC-4: Assign `user_id` yang bukan Member Team → validation error 422.
    - TC-5: `deskripsi_tugas` kosong → validation error 422.
    - TC-6: `deskripsi_tugas` > 255 karakter → validation error 422.
    - TC-7: Assign Member yang sudah punya tugas di Divisi yang sama → berhasil (no unique constraint).
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 6.2_

  - [ ]* 8.2 Tulis test cases Destroy (TC-8 s.d. TC-10)
    - TC-8: Pengurus hapus tugas milik Team-nya → record terhapus, redirect back.
    - TC-9: Pengurus hapus tugas dari Team lain → 403 dari controller.
    - TC-10: Member DELETE tugas miliknya sendiri → 403 dari middleware.
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 8.3 Tulis test cases UpdateStatus (TC-11 s.d. TC-16)
    - TC-11: Member update status tugas sendiri ke `sedang` → hanya kolom `status` berubah.
    - TC-12: Member reverse status dari `selesai` ke `belum` → berhasil (no order constraint).
    - TC-13: Member update status tugas milik Member lain → 403.
    - TC-14: Pengurus PATCH updateStatus tugas milik Member → 403 (ownership-only).
    - TC-15: `status` bukan nilai valid → validation error 422.
    - TC-16: Payload berisi `deskripsi_tugas` dan `user_id` ekstra → hanya `status` berubah.
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 8.4 Tulis test case Cascade DELETE (TC-17)
    - TC-17: Hapus Divisi → semua `tugas_panitia` dengan `divisi_id` tersebut terhapus otomatis.
    - _Requirements: 6.3_

- [ ] 9. Checkpoint akhir — jalankan seluruh test suite
  - Jalankan `php artisan test --compact --filter=TugasPanitia` dan pastikan semua pass.

## Notes

- Tasks bertanda `*` bersifat opsional dan bisa diskip untuk MVP yang lebih cepat.
- Tidak ada migration baru — schema `tugas_panitia` sudah ada.
- Tidak ada PBT — semua test bersifat example-based (design tidak punya Correctness Properties section yang butuh PBT).
- Route `updateStatus` ditempatkan di luar grup `pengurus/` agar Member (role anggota) bisa mengaksesnya.
- `AssignForm` dibuat sebagai komponen isolated agar setiap Divisi punya state `useForm` sendiri.
- Jalankan `php artisan wayfinder:generate` setiap kali ada perubahan route sebelum mengerjakan task frontend.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["3"] },
    { "id": 3, "tasks": ["5"] },
    { "id": 4, "tasks": ["6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4"] },
    { "id": 7, "tasks": ["8.1", "8.2", "8.3", "8.4"] }
  ]
}
```
