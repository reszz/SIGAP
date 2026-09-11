<?php

use App\Enums\JabatanKepanitiaan;
use App\Enums\JabatanTugas;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Team;
use App\Models\Tugas;
use App\Models\User;
use App\Services\KegiatanAuthService;
use Illuminate\Support\Facades\Gate;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Buat Pengurus yang juga anggota Team. */
function buatPengurus(Team $team): User
{
    $user = User::factory()->create(['role' => 'pengurus']);
    $team->members()->attach($user, ['role' => 'owner']);
    $user->switchTeam($team);

    return $user;
}

/** Buat Anggota biasa yang juga anggota Team. */
function buatAnggota(Team $team): User
{
    $user = User::factory()->create(['role' => 'anggota']);
    $team->members()->attach($user, ['role' => 'member']);
    $user->switchTeam($team);

    return $user;
}

/** Assign jabatan kepanitiaan ke user untuk kegiatan tertentu. */
function assignJabatan(User $user, Kegiatan $kegiatan, JabatanKepanitiaan $jabatan): void
{
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $user->id,
        'jabatan' => $jabatan->value,
    ]);
}

// Reset KegiatanAuthService cache sebelum setiap test
beforeEach(function () {
    KegiatanAuthService::flushCache();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-1: Pengurus → akses SEMUA Kegiatan
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-1: pengurus dapat kelola semua kegiatan dalam team-nya', function () {
    $team = Team::factory()->create();
    $pengurus = buatPengurus($team);

    $kegiatanA = Kegiatan::factory()->create(['team_id' => $team->id]);
    $kegiatanB = Kegiatan::factory()->create(['team_id' => $team->id]);
    $kegiatanC = Kegiatan::factory()->create(['team_id' => $team->id]);

    // Pengurus bisa manage semua kegiatan tanpa perlu jabatan apapun
    expect(Gate::forUser($pengurus)->allows('manage', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($pengurus)->allows('manage', $kegiatanB))->toBeTrue();
    expect(Gate::forUser($pengurus)->allows('manage', $kegiatanC))->toBeTrue();

    // Dan semua modul
    expect(Gate::forUser($pengurus)->allows('anggaran.manage', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($pengurus)->allows('surat.manage', $kegiatanB))->toBeTrue();
    expect(Gate::forUser($pengurus)->allows('rundown.manage', $kegiatanC))->toBeTrue();
    expect(Gate::forUser($pengurus)->allows('dokumentasi.upload-foto', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($pengurus)->allows('dokumentasi.upload-notulen', $kegiatanA))->toBeTrue();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-2: Ketua Pelaksana → hanya KegiatanA, ditolak KegiatanB
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-2a: ketua_pelaksana KegiatanA dapat kelola KegiatanA', function () {
    $team = Team::factory()->create();
    $ketua = buatAnggota($team);
    $kegiatanA = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($ketua, $kegiatanA, JabatanKepanitiaan::KetuaPelaksana);

    expect(Gate::forUser($ketua)->allows('manage', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($ketua)->allows('kepanitiaan.manage', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($ketua)->allows('anggaran.manage', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($ketua)->allows('rundown.manage', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($ketua)->allows('surat.manage', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($ketua)->allows('dokumentasi.upload-foto', $kegiatanA))->toBeTrue();
    expect(Gate::forUser($ketua)->allows('dokumentasi.upload-notulen', $kegiatanA))->toBeTrue();
});

test('TC-2b: ketua_pelaksana KegiatanA DITOLAK untuk KegiatanB (akses per-kegiatan)', function () {
    $team = Team::factory()->create();
    $ketua = buatAnggota($team);
    $kegiatanA = Kegiatan::factory()->create(['team_id' => $team->id]);
    $kegiatanB = Kegiatan::factory()->create(['team_id' => $team->id]);

    // Ketua hanya di KegiatanA
    assignJabatan($ketua, $kegiatanA, JabatanKepanitiaan::KetuaPelaksana);

    // Semua ability untuk KegiatanB harus ditolak
    expect(Gate::forUser($ketua)->allows('manage', $kegiatanB))->toBeFalse();
    expect(Gate::forUser($ketua)->allows('kepanitiaan.manage', $kegiatanB))->toBeFalse();
    expect(Gate::forUser($ketua)->allows('anggaran.manage', $kegiatanB))->toBeFalse();
    expect(Gate::forUser($ketua)->allows('rundown.manage', $kegiatanB))->toBeFalse();
    expect(Gate::forUser($ketua)->allows('surat.manage', $kegiatanB))->toBeFalse();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-3: Bendahara → hanya Anggaran KegiatanA, bukan KegiatanB
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-3a: bendahara KegiatanA dapat manage Anggaran KegiatanA', function () {
    $team = Team::factory()->create();
    $bendahara = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($bendahara, $kegiatan, JabatanKepanitiaan::Bendahara);

    expect(Gate::forUser($bendahara)->allows('anggaran.manage', $kegiatan))->toBeTrue();
    // Bendahara juga bisa manageLogistik (karena manage() sudah true)
    expect(Gate::forUser($bendahara)->allows('anggaran.manage-logistik', $kegiatan))->toBeTrue();
});

test('TC-3b: bendahara KegiatanA DITOLAK untuk Anggaran KegiatanB', function () {
    $team = Team::factory()->create();
    $bendahara = buatAnggota($team);
    $kegiatanA = Kegiatan::factory()->create(['team_id' => $team->id]);
    $kegiatanB = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($bendahara, $kegiatanA, JabatanKepanitiaan::Bendahara);

    // Harus ditolak untuk KegiatanB
    expect(Gate::forUser($bendahara)->allows('anggaran.manage', $kegiatanB))->toBeFalse();
    expect(Gate::forUser($bendahara)->allows('anggaran.manage-logistik', $kegiatanB))->toBeFalse();
});

test('TC-3c: bendahara DITOLAK akses ke modul non-Anggaran', function () {
    $team = Team::factory()->create();
    $bendahara = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($bendahara, $kegiatan, JabatanKepanitiaan::Bendahara);

    // Bendahara tidak bisa kelola Kepanitiaan, Surat, Rundown, Dokumentasi
    expect(Gate::forUser($bendahara)->allows('kepanitiaan.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($bendahara)->allows('surat.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($bendahara)->allows('rundown.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($bendahara)->allows('dokumentasi.upload-foto', $kegiatan))->toBeFalse();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-4: Div Logistik → manageLogistik() boleh, manage() (penuh) tidak
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-4: div_logistik bisa manageLogistik tapi TIDAK bisa manage (akses penuh) Anggaran', function () {
    $team = Team::factory()->create();
    $logistik = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($logistik, $kegiatan, JabatanKepanitiaan::DivLogistik);

    // Bisa akses modul anggaran (lewat manageLogistik)
    expect(Gate::forUser($logistik)->allows('anggaran.manage-logistik', $kegiatan))->toBeTrue();

    // TIDAK bisa akses penuh (manage) — bendahara saja yang bisa
    expect(Gate::forUser($logistik)->allows('anggaran.manage', $kegiatan))->toBeFalse();

    // Dan tidak bisa modul lain
    expect(Gate::forUser($logistik)->allows('surat.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($logistik)->allows('rundown.manage', $kegiatan))->toBeFalse();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-5: Div Humas → manageSuratKeluar() boleh, manageSurat() (masuk) tidak
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-5: div_humas bisa manage-keluar tapi TIDAK bisa manage surat masuk', function () {
    $team = Team::factory()->create();
    $humas = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($humas, $kegiatan, JabatanKepanitiaan::DivHumas);

    // Bisa surat keluar
    expect(Gate::forUser($humas)->allows('surat.manage-keluar', $kegiatan))->toBeTrue();

    // TIDAK bisa semua tipe surat (masuk + keluar)
    expect(Gate::forUser($humas)->allows('surat.manage', $kegiatan))->toBeFalse();

    // Dan tidak bisa modul lain
    expect(Gate::forUser($humas)->allows('anggaran.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($humas)->allows('rundown.manage', $kegiatan))->toBeFalse();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-6: Div PDD → uploadFoto boleh, uploadNotulen tidak
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-6: div_pdd bisa upload-foto tapi TIDAK bisa upload-notulen', function () {
    $team = Team::factory()->create();
    $pdd = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($pdd, $kegiatan, JabatanKepanitiaan::DivPdd);

    expect(Gate::forUser($pdd)->allows('dokumentasi.upload-foto', $kegiatan))->toBeTrue();
    expect(Gate::forUser($pdd)->allows('dokumentasi.upload-notulen', $kegiatan))->toBeFalse();

    // Tidak bisa modul lain
    expect(Gate::forUser($pdd)->allows('anggaran.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($pdd)->allows('surat.manage', $kegiatan))->toBeFalse();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-7: Sekretaris → uploadNotulen + manageSurat boleh, uploadFoto tidak
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-7: sekretaris bisa upload-notulen dan manage-surat tapi TIDAK bisa upload-foto', function () {
    $team = Team::factory()->create();
    $sekretaris = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($sekretaris, $kegiatan, JabatanKepanitiaan::Sekretaris);

    // Yang boleh
    expect(Gate::forUser($sekretaris)->allows('dokumentasi.upload-notulen', $kegiatan))->toBeTrue();
    expect(Gate::forUser($sekretaris)->allows('surat.manage', $kegiatan))->toBeTrue();
    expect(Gate::forUser($sekretaris)->allows('surat.manage-keluar', $kegiatan))->toBeTrue(); // manage() ⊇ manage-keluar

    // Yang tidak boleh
    expect(Gate::forUser($sekretaris)->allows('dokumentasi.upload-foto', $kegiatan))->toBeFalse();
    expect(Gate::forUser($sekretaris)->allows('anggaran.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($sekretaris)->allows('rundown.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($sekretaris)->allows('kepanitiaan.manage', $kegiatan))->toBeFalse();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-8: Div Acara → manage Rundown boleh, modul lain tidak
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-8: div_acara bisa manage rundown tapi TIDAK bisa manage anggaran atau surat', function () {
    $team = Team::factory()->create();
    $acara = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    assignJabatan($acara, $kegiatan, JabatanKepanitiaan::DivAcara);

    expect(Gate::forUser($acara)->allows('rundown.manage', $kegiatan))->toBeTrue();

    expect(Gate::forUser($acara)->allows('anggaran.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($acara)->allows('anggaran.manage-logistik', $kegiatan))->toBeFalse();
    expect(Gate::forUser($acara)->allows('surat.manage', $kegiatan))->toBeFalse();
    expect(Gate::forUser($acara)->allows('dokumentasi.upload-foto', $kegiatan))->toBeFalse();
    expect(Gate::forUser($acara)->allows('kepanitiaan.manage', $kegiatan))->toBeFalse();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-9: Member biasa (tidak ada jabatan) → SEMUA ditolak
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-9: member biasa tanpa jabatan ditolak semua policy', function () {
    $team = Team::factory()->create();
    $member = buatAnggota($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    // Tidak ada assignment kepanitiaan sama sekali
    $abilities = [
        'manage',
        'kepanitiaan.manage',
        'anggaran.manage',
        'anggaran.manage-logistik',
        'dokumentasi.upload-foto',
        'dokumentasi.upload-notulen',
        'surat.manage',
        'surat.manage-keluar',
        'rundown.manage',
    ];

    foreach ($abilities as $ability) {
        expect(Gate::forUser($member)->allows($ability, $kegiatan))
            ->toBeFalse("Member tanpa jabatan seharusnya TIDAK bisa: {$ability}");
    }
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-10: KegiatanAuthService::jabatanDi() helper
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-10: jabatanDi() return null untuk user tanpa jabatan', function () {
    $user = User::factory()->create();
    $kegiatan = Kegiatan::factory()->create();

    expect(KegiatanAuthService::jabatanDi($user, $kegiatan))->toBeNull();
});

test('TC-10b: jabatanDi() return enum yang benar untuk user dengan jabatan', function () {
    $user = User::factory()->create();
    $kegiatan = Kegiatan::factory()->create();

    assignJabatan($user, $kegiatan, JabatanKepanitiaan::Bendahara);
    KegiatanAuthService::flushCache(); // reset cache setelah assign

    expect(KegiatanAuthService::jabatanDi($user, $kegiatan))->toBe(JabatanKepanitiaan::Bendahara);
});

test('TC-10c: jabatanDi() return null saat user punya jabatan di kegiatan lain', function () {
    $user = User::factory()->create();
    $kegiatanA = Kegiatan::factory()->create();
    $kegiatanB = Kegiatan::factory()->create();

    assignJabatan($user, $kegiatanA, JabatanKepanitiaan::Sekretaris);
    KegiatanAuthService::flushCache();

    // Untuk kegiatanB, harusnya null
    expect(KegiatanAuthService::jabatanDi($user, $kegiatanB))->toBeNull();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-11: Caching per-request KegiatanAuthService
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-11: jabatanDi() menggunakan cache, tidak query DB berulang untuk kombinasi yang sama', function () {
    $user = User::factory()->create();
    $kegiatan = Kegiatan::factory()->create();

    assignJabatan($user, $kegiatan, JabatanKepanitiaan::DivAcara);
    KegiatanAuthService::flushCache();

    $queryCount = 0;
    DB::listen(function ($query) use (&$queryCount) {
        if (str_contains($query->sql, 'kepanitiaan')) {
            $queryCount++;
        }
    });

    // Panggil 3x dengan kombinasi yang sama
    KegiatanAuthService::jabatanDi($user, $kegiatan);
    KegiatanAuthService::jabatanDi($user, $kegiatan);
    KegiatanAuthService::jabatanDi($user, $kegiatan);

    // Harusnya cuma 1 query ke DB meski dipanggil 3x
    expect($queryCount)->toBe(1, 'KegiatanAuthService seharusnya cache per-request, bukan query DB setiap panggilan');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-12: TugasPolicy — PIC boleh update status tugasnya sendiri
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-12: PIC Tugas (member biasa tanpa jabatan) boleh update status tugasnya sendiri', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create(['role' => 'anggota']);
    $pembuat = User::factory()->create();

    // Pastikan pic terdaftar di kepanitiaan untuk melewati validasi Tugas::createWithValidation
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    $tugas = Tugas::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'jabatan' => JabatanTugas::DivAcara->value,
    ]);

    expect(Gate::forUser($pic)->allows('updateStatus', $tugas))->toBeTrue();
});

test('TC-13: member biasa yang BUKAN PIC dari tugas tersebut DITOLAK update status', function () {
    $kegiatan = Kegiatan::factory()->create();
    $pic = User::factory()->create(['role' => 'anggota']);
    $orang_lain = User::factory()->create(['role' => 'anggota']);
    $pembuat = User::factory()->create();

    $tugas = Tugas::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pembuat->id,
        'jabatan' => JabatanTugas::DivAcara->value,
    ]);

    // orang_lain bukan PIC dan bukan pengurus/ketua
    expect(Gate::forUser($orang_lain)->allows('updateStatus', $tugas))->toBeFalse();
});

test('TC-14: pengurus boleh update status tugas siapapun', function () {
    $team = Team::factory()->create();
    $pengurus = buatPengurus($team);
    $pic = User::factory()->create(['role' => 'anggota']);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    $tugas = Tugas::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pengurus->id,
        'jabatan' => JabatanTugas::DivHumas->value,
    ]);

    expect(Gate::forUser($pengurus)->allows('updateStatus', $tugas))->toBeTrue();
});
