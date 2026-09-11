<?php

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Surat;
use App\Models\Team;
use App\Models\User;
use App\Services\KegiatanAuthService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function suratBuatUser(string $role, Team $team): User
{
    $user = User::factory()->create(['role' => $role]);
    $pivotRole = $role === 'pengurus' ? 'owner' : 'member';
    $team->members()->attach($user, ['role' => $pivotRole]);
    $user->switchTeam($team);

    return $user;
}

function suratAssignJabatan(User $user, Kegiatan $kegiatan, JabatanKepanitiaan $jabatan): void
{
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $user->id,
        'jabatan' => $jabatan->value,
    ]);
}

function suratPayload(string $tipe = 'masuk'): array
{
    return [
        'tipe' => $tipe,
        'nomor_surat' => '001/ORG/VIII/2026',
        'jenis_surat' => 'Undangan',
        'perihal' => 'Undangan Rapat Koordinasi',
        'tanggal_surat' => '2026-08-19',
        'pengirim_penerima' => 'PT Maju Bersama',
        'keterangan' => 'Rapat akan dilaksanakan pukul 09.00 WIB',
    ];
}

beforeEach(function () {
    KegiatanAuthService::flushCache();
    Storage::fake('local');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-1 (KRITIS): Div Humas submit surat tipe=masuk → HARUS 403
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-1 [KRITIS]: div_humas submit surat tipe=masuk ditolak 403', function () {
    $team = Team::factory()->create();
    $humas = suratBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    suratAssignJabatan($humas, $kegiatan, JabatanKepanitiaan::DivHumas);

    $this->actingAs($humas)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", suratPayload('masuk'))
        ->assertForbidden(); // 403

    $this->assertDatabaseCount('surat', 0);
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-2: Div Humas submit surat tipe=keluar → BERHASIL
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-2: div_humas submit surat tipe=keluar berhasil', function () {
    $team = Team::factory()->create();
    $humas = suratBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    suratAssignJabatan($humas, $kegiatan, JabatanKepanitiaan::DivHumas);

    $this->actingAs($humas)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", suratPayload('keluar'))
        ->assertRedirect();

    $this->assertDatabaseHas('surat', [
        'kegiatan_id' => $kegiatan->id,
        'tipe' => 'keluar',
        'dibuat_oleh' => $humas->id,
    ]);
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-3: Sekretaris submit tipe=masuk DAN tipe=keluar → dua-duanya berhasil
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-3a: sekretaris submit surat tipe=masuk berhasil', function () {
    $team = Team::factory()->create();
    $sekretaris = suratBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    suratAssignJabatan($sekretaris, $kegiatan, JabatanKepanitiaan::Sekretaris);

    $this->actingAs($sekretaris)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", suratPayload('masuk'))
        ->assertRedirect();

    $this->assertDatabaseHas('surat', ['tipe' => 'masuk', 'dibuat_oleh' => $sekretaris->id]);
});

test('TC-3b: sekretaris submit surat tipe=keluar berhasil', function () {
    $team = Team::factory()->create();
    $sekretaris = suratBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    suratAssignJabatan($sekretaris, $kegiatan, JabatanKepanitiaan::Sekretaris);

    $this->actingAs($sekretaris)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", suratPayload('keluar'))
        ->assertRedirect();

    $this->assertDatabaseHas('surat', ['tipe' => 'keluar', 'dibuat_oleh' => $sekretaris->id]);
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-4: Member tanpa jabatan → 403 untuk semua endpoint
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-4: member tanpa jabatan ditolak 403 untuk semua endpoint surat', function () {
    $team = Team::factory()->create();
    $member = suratBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    $surat = Surat::factory()->create(['kegiatan_id' => $kegiatan->id]);

    // store
    $this->actingAs($member)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", suratPayload('keluar'))
        ->assertForbidden();

    // update
    $this->actingAs($member)
        ->patch("/{$team->slug}/surat/{$surat->id}", ['perihal' => 'diubah'])
        ->assertForbidden();

    // destroy
    $this->actingAs($member)
        ->delete("/{$team->slug}/surat/{$surat->id}")
        ->assertForbidden();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-5: Data tidak bocor antar-kegiatan (scope test)
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-5: surat Kegiatan A tidak muncul saat query Kegiatan B', function () {
    $team = Team::factory()->create();
    $sekretaris = suratBuatUser('anggota', $team);
    $kegiatanA = Kegiatan::factory()->create(['team_id' => $team->id]);
    $kegiatanB = Kegiatan::factory()->create(['team_id' => $team->id]);

    suratAssignJabatan($sekretaris, $kegiatanA, JabatanKepanitiaan::Sekretaris);
    suratAssignJabatan($sekretaris, $kegiatanB, JabatanKepanitiaan::Sekretaris);

    // Buat 3 surat di kegiatanA, 0 di kegiatanB
    Surat::factory()->count(3)->create([
        'kegiatan_id' => $kegiatanA->id,
        'dibuat_oleh' => $sekretaris->id,
    ]);

    // Query dengan kegiatan_id=kegiatanB.id → harus 0 surat
    $response = $this->actingAs($sekretaris)
        ->get("/{$team->slug}/surat?kegiatan_id={$kegiatanB->id}")
        ->assertOk();

    // Inertia prop 'surat' harus kosong
    $response->assertInertia(fn ($page) => $page
        ->component('surat/index')
        ->has('surat', 0)
    );
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-6: Pengurus bisa akses semua endpoint
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-6: pengurus bisa store surat tipe=masuk maupun keluar', function () {
    $team = Team::factory()->create();
    $pengurus = suratBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    $this->actingAs($pengurus)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", suratPayload('masuk'))
        ->assertRedirect();

    $this->actingAs($pengurus)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", suratPayload('keluar'))
        ->assertRedirect();

    $this->assertDatabaseCount('surat', 2);
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-7: Div Humas tidak bisa update surat masuk menjadi apapun
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-7: div_humas tidak bisa update/delete surat masuk yang sudah ada', function () {
    $team = Team::factory()->create();
    $humas = suratBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    suratAssignJabatan($humas, $kegiatan, JabatanKepanitiaan::DivHumas);

    $suratMasuk = Surat::factory()->masuk()->create([
        'kegiatan_id' => $kegiatan->id,
        'dibuat_oleh' => $humas->id,
    ]);

    $this->actingAs($humas)
        ->patch("/{$team->slug}/surat/{$suratMasuk->id}", ['perihal' => 'diubah'])
        ->assertForbidden();

    $this->actingAs($humas)
        ->delete("/{$team->slug}/surat/{$suratMasuk->id}")
        ->assertForbidden();
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-8: Upload file opsional berfungsi
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-8: sekretaris bisa upload file PDF bersama surat', function () {
    $team = Team::factory()->create();
    $sekretaris = suratBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    suratAssignJabatan($sekretaris, $kegiatan, JabatanKepanitiaan::Sekretaris);

    $file = UploadedFile::fake()->create('surat_masuk.pdf', 500, 'application/pdf');

    $this->actingAs($sekretaris)
        ->post("/{$team->slug}/surat/{$kegiatan->id}", [
            ...suratPayload('masuk'),
            'file' => $file,
        ])
        ->assertRedirect();

    $surat = Surat::first();
    expect($surat->file_path)->not->toBeNull();
    Storage::disk('local')->assertExists($surat->file_path);
});

// ═══════════════════════════════════════════════════════════════════════════════
// TC-9: Sekretaris Kegiatan A tidak bisa akses Kegiatan B (NFR-02)
// ═══════════════════════════════════════════════════════════════════════════════

test('TC-9: sekretaris KegiatanA ditolak saat store ke KegiatanB via manipulasi ID', function () {
    $team = Team::factory()->create();
    $sekretaris = suratBuatUser('anggota', $team);
    $kegiatanA = Kegiatan::factory()->create(['team_id' => $team->id]);
    $kegiatanB = Kegiatan::factory()->create(['team_id' => $team->id]);

    // Sekretaris hanya di kegiatanA
    suratAssignJabatan($sekretaris, $kegiatanA, JabatanKepanitiaan::Sekretaris);

    // Coba manipulasi: kirim ke endpoint kegiatanB
    $this->actingAs($sekretaris)
        ->post("/{$team->slug}/surat/{$kegiatanB->id}", suratPayload('masuk'))
        ->assertForbidden();

    $this->assertDatabaseCount('surat', 0);
});
