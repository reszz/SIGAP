<?php

use App\Enums\JabatanKepanitiaan;
use App\Enums\JabatanTugas;
use App\Enums\PrioritasTugas;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Tugas;
use App\Models\User;

// ─── TC-1: Buat Tugas dengan PIC valid berhasil (FR-31, FR-32) ───────────────

test('TC-1: buat tugas dengan PIC yang merupakan anggota divisi yang sama berhasil', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pembuat = User::factory()->create();
    $pic = User::factory()->create();

    // Daftarkan pic sebagai anggota div_acara
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    $tugas = Tugas::createWithValidation([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => JabatanTugas::DivAcara,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'deskripsi_tugas' => 'Booking venue untuk acara',
        'prioritas' => PrioritasTugas::Tinggi,
    ]);

    expect($tugas)->toBeInstanceOf(Tugas::class);

    $this->assertDatabaseHas('tugas', [
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => 'div_acara',
        'pic_user_id' => $pic->id,
        'status' => 'belum',
        'prioritas' => 'tinggi',
    ]);
});

// ─── TC-2: PIC bukan anggota divisi → exception (FR-32, NFR-04) ──────────────

test('TC-2: PIC yang bukan anggota divisi manapun pada kegiatan ini ditolak', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pembuat = User::factory()->create();
    $outsider = User::factory()->create(); // tidak ada baris Kepanitiaan untuk user ini

    expect(fn () => Tugas::createWithValidation([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => JabatanTugas::DivHumas,
        'pic_user_id' => $outsider->id,
        'dibuat_oleh' => $pembuat->id,
        'deskripsi_tugas' => 'Buat press release',
    ]))->toThrow(RuntimeException::class);

    $this->assertDatabaseCount('tugas', 0);
});

// ─── TC-3: PIC anggota divisi lain → exception (NFR-04) ──────────────────────

test('TC-3: PIC anggota div_pdd tidak bisa di-assign ke tugas div_humas', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create();
    $pembuat = User::factory()->create();

    // pic adalah anggota div_pdd
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivPdd->value,
    ]);

    // tapi tugas ini untuk div_humas
    expect(fn () => Tugas::createWithValidation([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => JabatanTugas::DivHumas,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'deskripsi_tugas' => 'Buat press release',
    ]))->toThrow(RuntimeException::class);

    $this->assertDatabaseCount('tugas', 0);
});

// ─── TC-4: PIC anggota divisi yang benar pada kegiatan lain → exception ───────

test('TC-4: PIC anggota divisi yang benar tapi untuk kegiatan lain tetap ditolak', function () {
    $kegiatanA = Kegiatan::factory()->create();
    $kegiatanB = Kegiatan::factory()->create();
    $pic = User::factory()->create();
    $pembuat = User::factory()->create();

    // pic adalah anggota div_logistik di kegiatanA
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatanA->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivLogistik->value,
    ]);

    // tapi tugas dibuat untuk kegiatanB
    expect(fn () => Tugas::createWithValidation([
        'kegiatan_id' => $kegiatanB->id,
        'jabatan' => JabatanTugas::DivLogistik,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'deskripsi_tugas' => 'Sewa sound system',
    ]))->toThrow(RuntimeException::class);
});

// ─── TC-5: Update status tugas (enum belum/sedang/selesai tetap sama) ─────────

test('TC-5: update status tugas dari belum ke selesai berhasil', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create();
    $pembuat = User::factory()->create();

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    $tugas = Tugas::createWithValidation([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => JabatanTugas::DivAcara,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'deskripsi_tugas' => 'Setup dekorasi',
    ]);

    $tugas->update(['status' => 'selesai']);

    $this->assertDatabaseHas('tugas', ['id' => $tugas->id, 'status' => 'selesai']);
});

// ─── TC-6: Cascade delete saat Kegiatan di-force-delete ──────────────────────

test('TC-6: tugas cascade-hapus saat kegiatan di-force-delete', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create();
    $pembuat = User::factory()->create();

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    // Buat tugas langsung (bypass validasi) untuk tes cascade
    Tugas::factory()->count(2)->create([
        'kegiatan_id' => $kegiatan->id,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'jabatan' => JabatanTugas::DivAcara->value,
    ]);

    $this->assertDatabaseCount('tugas', 2);

    $kegiatan->forceDelete();

    $this->assertDatabaseCount('tugas', 0);
});

// ─── TC-7: pic_user_id jadi null saat User PIC dihapus ───────────────────────

test('TC-7: pic_user_id di-set null saat user PIC di-force-delete', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create();
    $pembuat = User::factory()->create();

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivHumas->value,
    ]);

    $tugas = Tugas::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => JabatanTugas::DivHumas->value,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
    ]);

    $pic->forceDelete();

    $this->assertDatabaseHas('tugas', [
        'id' => $tugas->id,
        'pic_user_id' => null,
    ]);
});

// ─── TC-8: Default status dan prioritas ──────────────────────────────────────

test('TC-8: status default belum dan prioritas default sedang saat tidak diisi', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create();
    $pembuat = User::factory()->create();

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivLogistik->value,
    ]);

    $tugas = Tugas::createWithValidation([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => JabatanTugas::DivLogistik,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'deskripsi_tugas' => 'Cek inventaris meja',
        // tidak isi status dan prioritas
    ]);

    $this->assertDatabaseHas('tugas', [
        'id' => $tugas->id,
        'status' => 'belum',
        'prioritas' => 'sedang',
    ]);
});

// ─── TC-9: Deadline nullable ──────────────────────────────────────────────────

test('TC-9: deadline nullable — tugas tanpa deadline tersimpan dengan null', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create();
    $pembuat = User::factory()->create();

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivPdd->value,
    ]);

    $tugas = Tugas::createWithValidation([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => JabatanTugas::DivPdd,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'deskripsi_tugas' => 'Foto dokumentasi acara',
        'deadline' => null,
    ]);

    $this->assertDatabaseHas('tugas', [
        'id' => $tugas->id,
        'deadline' => null,
    ]);
});
