<?php

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Team;
use App\Models\User;

// ─── TC-1: Assign jabatan tunggal berhasil ────────────────────────────────────

test('TC-1: assign jabatan ketua_pelaksana ke kegiatan berhasil', function () {
    $team = Team::factory()->create();
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    $user = User::factory()->create();

    $kepanitiaan = Kepanitiaan::assign(
        kegiatanId: $kegiatan->id,
        userId: $user->id,
        jabatan: JabatanKepanitiaan::KetuaPelaksana,
    );

    expect($kepanitiaan)->toBeInstanceOf(Kepanitiaan::class);

    $this->assertDatabaseHas('kepanitiaan', [
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $user->id,
        'jabatan' => 'ketua_pelaksana',
    ]);
});

test('TC-1b: assign jabatan bendahara dan sekretaris masing-masing berhasil', function () {
    $team = Team::factory()->create();
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    $userB = User::factory()->create();
    $userS = User::factory()->create();

    Kepanitiaan::assign($kegiatan->id, $userB->id, JabatanKepanitiaan::Bendahara);
    Kepanitiaan::assign($kegiatan->id, $userS->id, JabatanKepanitiaan::Sekretaris);

    $this->assertDatabaseCount('kepanitiaan', 2);
});

// ─── TC-2: Jabatan tunggal ganda harus ditolak (FR-28, NFR-03) ───────────────

test('TC-2: assign jabatan ketua_pelaksana kedua kali untuk kegiatan yang sama melempar exception', function () {
    $team = Team::factory()->create();
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    Kepanitiaan::assign($kegiatan->id, $user1->id, JabatanKepanitiaan::KetuaPelaksana);

    expect(fn () => Kepanitiaan::assign(
        $kegiatan->id,
        $user2->id,
        JabatanKepanitiaan::KetuaPelaksana,
    ))->toThrow(RuntimeException::class);

    // Memastikan tidak ada baris kedua yang tersimpan diam-diam
    $this->assertDatabaseCount('kepanitiaan', 1);
});

test('TC-2b: bendahara ganda juga ditolak', function () {
    $kegiatan = Kegiatan::factory()->create();
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();

    Kepanitiaan::assign($kegiatan->id, $user1->id, JabatanKepanitiaan::Bendahara);

    expect(fn () => Kepanitiaan::assign(
        $kegiatan->id,
        $user2->id,
        JabatanKepanitiaan::Bendahara,
    ))->toThrow(RuntimeException::class);
});

test('TC-2c: jabatan tunggal di kegiatan berbeda BOLEH diisi oleh user yang sama', function () {
    $kegiatanA = Kegiatan::factory()->create();
    $kegiatanB = Kegiatan::factory()->create();
    $user = User::factory()->create();

    Kepanitiaan::assign($kegiatanA->id, $user->id, JabatanKepanitiaan::KetuaPelaksana);
    Kepanitiaan::assign($kegiatanB->id, $user->id, JabatanKepanitiaan::KetuaPelaksana);

    $this->assertDatabaseCount('kepanitiaan', 2);
});

// ─── TC-3: Jabatan divisi boleh banyak baris (FR-27) ─────────────────────────

test('TC-3: div_acara boleh punya banyak anggota untuk kegiatan yang sama', function () {
    $kegiatan = Kegiatan::factory()->create();

    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $user3 = User::factory()->create();

    Kepanitiaan::assign($kegiatan->id, $user1->id, JabatanKepanitiaan::DivAcara);
    Kepanitiaan::assign($kegiatan->id, $user2->id, JabatanKepanitiaan::DivAcara);
    Kepanitiaan::assign($kegiatan->id, $user3->id, JabatanKepanitiaan::DivAcara);

    $this->assertDatabaseCount('kepanitiaan', 3);
});

test('TC-3b: semua 4 divisi bisa punya banyak anggota tanpa exception', function () {
    $kegiatan = Kegiatan::factory()->create();

    foreach (JabatanKepanitiaan::cases() as $jabatan) {
        if ($jabatan->isDivisi()) {
            Kepanitiaan::assign($kegiatan->id, User::factory()->create()->id, $jabatan);
            Kepanitiaan::assign($kegiatan->id, User::factory()->create()->id, $jabatan);
        }
    }

    // 4 divisi × 2 user = 8 baris
    $this->assertDatabaseCount('kepanitiaan', 8);
});

// ─── TC-4: Cascade delete saat Kegiatan dihapus ──────────────────────────────

test('TC-4: kepanitiaan cascade-hapus saat kegiatan dihapus', function () {
    $kegiatan = Kegiatan::factory()->create();
    Kepanitiaan::factory()->count(3)->create(['kegiatan_id' => $kegiatan->id]);

    $this->assertDatabaseCount('kepanitiaan', 3);

    // Force delete (bukan soft delete) untuk trigger FK cascade
    $kegiatan->forceDelete();

    $this->assertDatabaseCount('kepanitiaan', 0);
});

// ─── TC-5: Cascade delete saat User dihapus ──────────────────────────────────

test('TC-5: kepanitiaan cascade-hapus saat user di-hard-delete', function () {
    $user = User::factory()->create();
    Kepanitiaan::factory()->count(2)->create(['user_id' => $user->id]);

    $this->assertDatabaseCount('kepanitiaan', 2);

    $user->forceDelete();

    $this->assertDatabaseCount('kepanitiaan', 0);
});

// ─── TC-6: Enum helpers benar ─────────────────────────────────────────────────

test('TC-6: isTunggal() dan isDivisi() di JabatanKepanitiaan benar', function () {
    expect(JabatanKepanitiaan::KetuaPelaksana->isTunggal())->toBeTrue();
    expect(JabatanKepanitiaan::Bendahara->isTunggal())->toBeTrue();
    expect(JabatanKepanitiaan::Sekretaris->isTunggal())->toBeTrue();

    expect(JabatanKepanitiaan::DivAcara->isTunggal())->toBeFalse();
    expect(JabatanKepanitiaan::DivHumas->isTunggal())->toBeFalse();
    expect(JabatanKepanitiaan::DivPdd->isTunggal())->toBeFalse();
    expect(JabatanKepanitiaan::DivLogistik->isTunggal())->toBeFalse();

    expect(JabatanKepanitiaan::DivAcara->isDivisi())->toBeTrue();
    expect(JabatanKepanitiaan::KetuaPelaksana->isDivisi())->toBeFalse();
});

// ─── TC-7: Relasi Eloquent berfungsi ─────────────────────────────────────────

test('TC-7: relasi kegiatan->kepanitiaan() dan user->kepanitiaan() berfungsi', function () {
    $kegiatan = Kegiatan::factory()->create();
    $user = User::factory()->create();

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $user->id,
        'jabatan' => JabatanKepanitiaan::Sekretaris->value,
    ]);

    expect($kegiatan->kepanitiaan)->toHaveCount(1);
    expect($user->kepanitiaan)->toHaveCount(1);
    expect($kegiatan->kepanitiaan->first()->jabatan)->toBe(JabatanKepanitiaan::Sekretaris);
});
