# Implementation Plan: Tambah Input Rundown ke Form Create Kegiatan (FR-10)

## Overview

Hanya 3 file yang dimodifikasi. Tidak ada migration, route, atau controller baru. `RundownController::upsert` tidak disentuh.

## Tasks

- [x] 1. Update `StoreKegiatanRequest` — tambah validasi rundown
  - Buka `app/Http/Requests/StoreKegiatanRequest.php`
  - Tambahkan rules berikut ke method `rules()`:
    - `'sesi.*.rundown' => 'nullable|array'`
    - `'sesi.*.rundown.*.waktu' => 'required_with:sesi.*.rundown.*|date_format:H:i'`
    - `'sesi.*.rundown.*.uraian_acara' => 'required_with:sesi.*.rundown.*|string|max:255'`
  - Field `urutan` TIDAK ditambahkan ke rules — backend yang menetapkan dari posisi array
  - Jalankan `vendor/bin/pint --dirty`
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2. Update `KegiatanController::store()` — transaction + simpan rundown
  - Buka `app/Http/Controllers/KegiatanController.php`
  - Tambahkan `use Illuminate\Support\Facades\DB;` di bagian import
  - Wrap seluruh isi method `store()` dalam `DB::transaction(function () use ($validated, $team, $currentTeam) { ... })`
  - Setelah `$kegiatan->sesi()->create($sesiData)`, tambahkan loop:
    ```php
    foreach ($sesiData['rundown'] ?? [] as $i => $rundownItem) {
        $sesi->rundown()->create([
            'waktu'        => $rundownItem['waktu'],
            'uraian_acara' => $rundownItem['uraian_acara'],
            'urutan'       => $i + 1,
        ]);
    }
    ```
  - Pastikan `$sesi = $kegiatan->sesi()->create(...)` menyimpan hasilnya ke variabel `$sesi`
  - Pastikan `sesi()->create()` hanya menerima field sesi (tanggal, waktu_mulai, waktu_selesai, lokasi) — bukan seluruh `$sesiData` yang sekarang berisi key `rundown`
  - Pindahkan `return redirect(...)` ke setelah closure DB::transaction
  - Jalankan `vendor/bin/pint --dirty`
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Update `create.tsx` — types, state helpers, dan UI rundown
  - [x] 3.1 Tambah type dan konstanta
    - Tambahkan type `RundownForm = { waktu: string; uraian_acara: string }`
    - Perluas type `SesiForm` dengan `rundown: RundownForm[]`
    - Perbarui `EMPTY_SESI` dengan `rundown: []`
    - _Requirements: 1.1_

  - [x] 3.2 Tambah state helper functions
    - Tambahkan `EMPTY_RUNDOWN: RundownForm = { waktu: '', uraian_acara: '' }`
    - Tambahkan fungsi `addRundown(sesiIdx: number)` — append `{ ...EMPTY_RUNDOWN }` ke `sesi[sesiIdx].rundown`
    - Tambahkan fungsi `removeRundown(sesiIdx: number, rundownIdx: number)` — filter baris, urutan recompute otomatis dari posisi (index+1) saat render
    - Tambahkan fungsi `updateRundown(sesiIdx: number, rundownIdx: number, field: keyof RundownForm, value: string)`
    - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3_

  - [x] 3.3 Tambah UI sub-bagian Rundown di dalam tiap Blok Sesi
    - Tempatkan sub-bagian ini di bawah field Lokasi, masih di dalam `<div className="grid gap-3 sm:grid-cols-2">`
    - Struktur: label "Rundown" + tombol kecil "Tambah Baris" (outline indigo, ikon Plus)
    - Jika `sesi.rundown.length === 0`: tampilkan teks "Belum ada baris rundown." (italic, neutral-400)
    - Jika ada baris: render tiap baris sebagai row horizontal berisi:
      - Nomor urut (index+1, w-5, text-xs neutral-400)
      - `<input type="time">` (w-28) untuk `waktu`
      - `<input type="text">` (flex-1) untuk `uraian_acara` + placeholder "Uraian acara"
      - Tombol hapus (`Trash2` icon, text-red-400)
    - `InputError` untuk `sesi.{idx}.rundown.{rIdx}.waktu` dan `sesi.{idx}.rundown.{rIdx}.uraian_acara`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 5.1, 5.2_

- [x] 4. Tulis feature tests
  - Buat file `tests/Feature/KegiatanStoreWithRundownTest.php` dengan `php artisan make:test --pest KegiatanStoreWithRundownTest`
  - Gunakan `beforeEach(fn () => $this->withoutVite())` di awal file
  - Buat helper `makePayload(array $overrides = [])` lokal yang menghasilkan payload valid dasar (1 kegiatan + 1 sesi + 1 rundown)
  - [x] 4.1 Happy path — sesi + rundown tersimpan, urutan benar
    - Assert: DB punya 1 record `kegiatan`, 1 record `sesi`, 2 record `rundown` (jika kirim 2 baris)
    - Assert: urutan baris pertama = 1, baris kedua = 2
    - _Requirements: 4.1, 4.3_
  - [x] 4.2 Rundown opsional — kegiatan tanpa rundown berhasil
    - Kirim sesi dengan `rundown: []` atau tanpa key rundown
    - Assert: redirect 302, tidak ada record di tabel `rundowns`
    - _Requirements: 3.2, 4.4_
  - [x] 4.3 Validasi error — `waktu` format salah
    - Kirim `sesi.0.rundown.0.waktu = "bukan-waktu"`
    - Assert: response 422, error key `sesi.0.rundown.0.waktu` ada
    - _Requirements: 3.3_
  - [x] 4.4 Validasi error — `uraian_acara` kosong
    - Kirim `sesi.0.rundown.0.uraian_acara = ""`
    - Assert: response 422, error key `sesi.0.rundown.0.uraian_acara` ada
    - _Requirements: 3.4_
  - [x] 4.5 Validasi error — `uraian_acara` > 255 karakter
    - Kirim `uraian_acara` sepanjang 256 karakter (`str_repeat('a', 256)`)
    - Assert: response 422 dengan key yang sesuai
    - _Requirements: 3.4_
  - [x] 4.6 Multi-sesi — rundown hanya di sesi tertentu
    - Kirim 2 sesi: sesi[0] punya 3 baris rundown, sesi[1] tanpa rundown
    - Assert: 3 Rundown tersimpan untuk sesi[0] dengan urutan 1,2,3; 0 Rundown untuk sesi[1]
    - _Requirements: 4.3, 4.4_
  - [x] 4.7 Urutan recompute — hapus baris tengah
    - Kirim array rundown `[{waktu:"08:00", uraian_acara:"A"}, {waktu:"09:00", uraian_acara:"C"}]` (simulasi frontend sudah hapus baris tengah)
    - Assert: urutan tersimpan adalah 1 dan 2 (bukan 1 dan 3)
    - _Requirements: 4.3_

- [x] 5. Jalankan tests dan pint final
  - Jalankan `php artisan test --compact --filter=KegiatanStoreWithRundownTest`
  - Pastikan semua 7 test pass
  - Jalankan `vendor/bin/pint --dirty` untuk semua file PHP yang dimodifikasi

## Notes

- Tidak ada PBT — semua test example-based
- `RundownController::upsert` tidak diubah
- Tidak ada migration atau route baru
- `Rundown` model sudah punya `$fillable` yang benar, tidak perlu diubah
- Saat loop rundown di controller, gunakan sisi server untuk urutan (`$i + 1`) — jangan percaya nilai urutan dari frontend

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2"] },
    { "id": 2, "tasks": ["3.1"] },
    { "id": 3, "tasks": ["3.2", "3.3"] },
    { "id": 4, "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7"] },
    { "id": 5, "tasks": ["5"] }
  ]
}
```