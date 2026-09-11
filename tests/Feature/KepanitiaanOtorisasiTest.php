<?php

use App\Enums\JabatanKepanitiaan;
use App\Enums\JabatanTugas;
use App\Enums\TeamRole;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Team;
use App\Models\Tugas;
use App\Models\User;
use App\Services\KegiatanAuthService;

beforeEach(fn () => $this->withoutVite());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pengurusKepanitiaan(Team $team): User
{
    $user = User::factory()->create(['role' => 'pengurus']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $user->switchTeam($team);

    return $user;
}

function anggotaKepanitiaan(Team $team): User
{
    $user = User::factory()->create(['role' => 'anggota']);
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    $user->switchTeam($team);

    return $user;
}

function kegiatanUntukTeam(Team $team): Kegiatan
{
    return Kegiatan::factory()->create(['team_id' => $team->id]);
}

function tugasUntukDivisi(Kegiatan $kegiatan, JabatanTugas $jabatan, User $pic): Tugas
{
    return Tugas::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => $jabatan->value,
        'pic_user_id' => $pic->id,
        'dibuat_oleh' => $pic->id,
    ]);
}

// ─── DivisiController ─────────────────────────────────────────────────────────

test('pengurus dapat assign anggota ke divisi', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    $this->actingAs($pengurus)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $anggota->id,
            'jabatan' => 'div_acara',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kepanitiaan', [
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $anggota->id,
        'jabatan' => 'div_acara',
    ]);
});

test('anggota biasa tidak dapat assign divisi (403)', function () {
    $team = Team::factory()->create();
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    $this->actingAs($anggota)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $anggota->id,
            'jabatan' => 'div_acara',
        ])
        ->assertForbidden();
});

test('jabatan tunggal tidak boleh diassign dua kali (ketua_pelaksana)', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $a1 = anggotaKepanitiaan($team);
    $a2 = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    // Assign pertama — berhasil
    $this->actingAs($pengurus)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $a1->id,
            'jabatan' => 'ketua_pelaksana',
        ])
        ->assertRedirect();

    // Assign kedua — harus ditolak dengan error
    $this->actingAs($pengurus)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $a2->id,
            'jabatan' => 'ketua_pelaksana',
        ])
        ->assertSessionHasErrors('jabatan');

    expect(Kepanitiaan::where('kegiatan_id', $kegiatan->id)->where('jabatan', 'ketua_pelaksana')->count())->toBe(1);
});

// ─── TugasController::store ───────────────────────────────────────────────────

test('pengurus dapat membuat tugas untuk divisi mana saja', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    // Anggota harus jadi anggota divisi terlebih dahulu (PIC validation)
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $anggota->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    $this->actingAs($pengurus)
        ->post(route('tugas.store', [$team->slug, $kegiatan->id]), [
            'jabatan' => 'div_acara',
            'pic_user_id' => $anggota->id,
            'deskripsi_tugas' => 'Siapkan dekorasi',
            'prioritas' => 'sedang',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tugas', [
        'kegiatan_id' => $kegiatan->id,
        'jabatan' => 'div_acara',
        'pic_user_id' => $anggota->id,
        'deskripsi_tugas' => 'Siapkan dekorasi',
        'status' => 'belum',
    ]);
});

test('anggota Div Acara TIDAK bisa membuat tugas untuk Div Humas', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $divAcara = anggotaKepanitiaan($team);
    $divHumas = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    // divAcara adalah anggota Div Acara
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $divAcara->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);
    // divHumas adalah anggota Div Humas
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $divHumas->id,
        'jabatan' => JabatanKepanitiaan::DivHumas->value,
    ]);

    KegiatanAuthService::flushCache();

    // Anggota Div Acara mencoba buat tugas untuk Div Humas — harus 403
    $this->actingAs($divAcara)
        ->post(route('tugas.store', [$team->slug, $kegiatan->id]), [
            'jabatan' => 'div_humas',
            'pic_user_id' => $divHumas->id,
            'deskripsi_tugas' => 'Siapkan press release',
            'prioritas' => 'sedang',
        ])
        ->assertForbidden();
});

test('anggota biasa Div Acara TIDAK bisa membuat tugas untuk Div Acara sendiri (harus koordinator)', function () {
    $team = Team::factory()->create();
    $divAcara = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $divAcara->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => false,  // anggota biasa
    ]);

    KegiatanAuthService::flushCache();

    $this->actingAs($divAcara)
        ->post(route('tugas.store', [$team->slug, $kegiatan->id]), [
            'jabatan' => 'div_acara',
            'pic_user_id' => $divAcara->id,
            'deskripsi_tugas' => 'Susun rundown',
            'prioritas' => 'tinggi',
        ])
        ->assertForbidden();  // anggota biasa TIDAK bisa create tugas
});

test('PIC harus anggota divisi yang sama — tolak jika bukan', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    // anggota hanya di Div Acara, bukan Div Humas
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $anggota->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    $this->actingAs($pengurus)
        ->post(route('tugas.store', [$team->slug, $kegiatan->id]), [
            'jabatan' => 'div_humas',
            'pic_user_id' => $anggota->id,  // bukan anggota Div Humas
            'deskripsi_tugas' => 'Test',
            'prioritas' => 'sedang',
        ])
        ->assertSessionHasErrors('pic_user_id');
});

// ─── TugasController::destroy ─────────────────────────────────────────────────

test('anggota Div Acara tidak bisa hapus tugas Div Humas', function () {
    $team = Team::factory()->create();
    $divAcara = anggotaKepanitiaan($team);
    $divHumas = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create(['kegiatan_id' => $kegiatan->id, 'user_id' => $divAcara->id, 'jabatan' => JabatanKepanitiaan::DivAcara->value]);
    Kepanitiaan::factory()->create(['kegiatan_id' => $kegiatan->id, 'user_id' => $divHumas->id, 'jabatan' => JabatanKepanitiaan::DivHumas->value]);

    $tugas = tugasUntukDivisi($kegiatan, JabatanTugas::DivHumas, $divHumas);

    KegiatanAuthService::flushCache();

    $this->actingAs($divAcara)
        ->delete(route('tugas.destroy', [$team->slug, $tugas->id]))
        ->assertForbidden();

    $this->assertDatabaseHas('tugas', ['id' => $tugas->id]);
});

test('pengurus dapat hapus tugas divisi manapun', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create(['kegiatan_id' => $kegiatan->id, 'user_id' => $anggota->id, 'jabatan' => JabatanKepanitiaan::DivHumas->value]);

    $tugas = tugasUntukDivisi($kegiatan, JabatanTugas::DivHumas, $anggota);

    $this->actingAs($pengurus)
        ->delete(route('tugas.destroy', [$team->slug, $tugas->id]))
        ->assertRedirect();

    $this->assertDatabaseMissing('tugas', ['id' => $tugas->id]);
});

// ─── Skenario akses halaman Panitia ──────────────────────────────────────────

test('anggota div_acara bisa akses halaman panitia', function () {
    $team = Team::factory()->create();
    $divAcara = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $divAcara->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    $this->actingAs($divAcara)
        ->get(route('panitia.index', [$team->slug]).'?kegiatan_id='.$kegiatan->id)
        ->assertOk();
});

test('anggota div_acara TIDAK bisa assign jabatan inti (ketua_pelaksana) — 403', function () {
    $team = Team::factory()->create();
    $divAcara = anggotaKepanitiaan($team);
    $target = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $divAcara->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    KegiatanAuthService::flushCache();

    // Div Acara mencoba assign Ketua Pelaksana — harus 403
    $this->actingAs($divAcara)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $target->id,
            'jabatan' => 'ketua_pelaksana',
        ])
        ->assertForbidden();
});

test('anggota div_acara TIDAK bisa assign Bendahara — 403', function () {
    $team = Team::factory()->create();
    $divAcara = anggotaKepanitiaan($team);
    $target = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $divAcara->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    KegiatanAuthService::flushCache();

    $this->actingAs($divAcara)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $target->id,
            'jabatan' => 'bendahara',
        ])
        ->assertForbidden();
});

test('anggota div_acara TIDAK bisa assign anggota ke divisi lain (div_humas)', function () {
    $team = Team::factory()->create();
    $divAcara = anggotaKepanitiaan($team);
    $target = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $divAcara->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    KegiatanAuthService::flushCache();

    // Div Acara mencoba assign ke Div Humas — harus 403
    $this->actingAs($divAcara)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $target->id,
            'jabatan' => 'div_humas',
        ])
        ->assertForbidden();
});

// ─── Ketua Pelaksana (role=anggota) bisa POST divisi.store ───────────────────

test('ketua_pelaksana dengan role anggota bisa assign anggota ke divisi', function () {
    $team = Team::factory()->create();
    $ketuaPelaksana = anggotaKepanitiaan($team);  // role = anggota
    $target = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    // Assign sebagai Ketua Pelaksana di kegiatan ini
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $ketuaPelaksana->id,
        'jabatan' => JabatanKepanitiaan::KetuaPelaksana->value,
    ]);

    KegiatanAuthService::flushCache();

    // Ketua Pelaksana (role=anggota) harus bisa assign anggota ke Divisi — sebelumnya di-block middleware
    $this->actingAs($ketuaPelaksana)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $target->id,
            'jabatan' => 'div_acara',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kepanitiaan', [
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $target->id,
        'jabatan' => 'div_acara',
    ]);
});

test('ketua_pelaksana dengan role anggota bisa hapus anggota dari divisi', function () {
    $team = Team::factory()->create();
    $ketua = anggotaKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $ketua->id,
        'jabatan' => JabatanKepanitiaan::KetuaPelaksana->value,
    ]);

    $kepanitiaan = Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $anggota->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    KegiatanAuthService::flushCache();

    $this->actingAs($ketua)
        ->delete(route('divisi.destroy', [$team->slug, $kepanitiaan->id]))
        ->assertRedirect();

    $this->assertDatabaseMissing('kepanitiaan', ['id' => $kepanitiaan->id]);
});

// ─── Koordinator Divisi ───────────────────────────────────────────────────────

test('koordinator Div Acara berhasil menambah anggota ke Div Acara', function () {
    $team = Team::factory()->create();
    $koordinator = anggotaKepanitiaan($team);
    $target = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $koordinator->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => true,
    ]);

    KegiatanAuthService::flushCache();

    $this->actingAs($koordinator)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $target->id,
            'jabatan' => 'div_acara',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kepanitiaan', [
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $target->id,
        'jabatan' => 'div_acara',
    ]);
});

test('koordinator Div Acara GAGAL menambah anggota ke Div Humas', function () {
    $team = Team::factory()->create();
    $koordinator = anggotaKepanitiaan($team);
    $target = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $koordinator->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => true,
    ]);

    KegiatanAuthService::flushCache();

    $this->actingAs($koordinator)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $target->id,
            'jabatan' => 'div_humas',
        ])
        ->assertForbidden();
});

test('koordinator TIDAK bisa assign koordinator baru (toggle koordinator harus 403)', function () {
    $team = Team::factory()->create();
    $koordinator = anggotaKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $koordinator->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => true,
    ]);

    $targetKepanitiaan = Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $anggota->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => false,
    ]);

    KegiatanAuthService::flushCache();

    $this->actingAs($koordinator)
        ->patch(route('divisi.koordinator', [$team->slug, $targetKepanitiaan->id]))
        ->assertForbidden();
});

test('koordinator Div Acara berhasil membuat tugas untuk Div Acara', function () {
    $team = Team::factory()->create();
    $koordinator = anggotaKepanitiaan($team);
    $pic = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $koordinator->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => true,
    ]);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $pic->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
    ]);

    KegiatanAuthService::flushCache();

    $this->actingAs($koordinator)
        ->post(route('tugas.store', [$team->slug, $kegiatan->id]), [
            'jabatan' => 'div_acara',
            'pic_user_id' => $pic->id,
            'deskripsi_tugas' => 'Dekorasi panggung',
            'prioritas' => 'sedang',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tugas', ['deskripsi_tugas' => 'Dekorasi panggung']);
});

test('pengurus tetap bisa override tambah anggota ke divisi manapun', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $target = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    $this->actingAs($pengurus)
        ->post(route('divisi.store', [$team->slug, $kegiatan->id]), [
            'user_id' => $target->id,
            'jabatan' => 'div_pdd',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('kepanitiaan', ['jabatan' => 'div_pdd', 'user_id' => $target->id]);
});

test('pengurus tetap bisa buat tugas untuk divisi manapun', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $anggota->id,
        'jabatan' => JabatanKepanitiaan::DivLogistik->value,
    ]);

    $this->actingAs($pengurus)
        ->post(route('tugas.store', [$team->slug, $kegiatan->id]), [
            'jabatan' => 'div_logistik',
            'pic_user_id' => $anggota->id,
            'deskripsi_tugas' => 'Sewa sound system',
            'prioritas' => 'tinggi',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tugas', ['deskripsi_tugas' => 'Sewa sound system']);
});

test('singularitas koordinator: assign koordinator baru otomatis melepas yang lama', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $koor1 = anggotaKepanitiaan($team);
    $koor2 = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    $kepanitiaan1 = Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $koor1->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => true,
    ]);

    $kepanitiaan2 = Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $koor2->id,
        'jabatan' => JabatanKepanitiaan::DivAcara->value,
        'is_koordinator' => false,
    ]);

    // Pengurus angkat koor2 jadi koordinator — harus otomatis lepas koor1
    $this->actingAs($pengurus)
        ->patch(route('divisi.koordinator', [$team->slug, $kepanitiaan2->id]))
        ->assertRedirect();

    $this->assertDatabaseHas('kepanitiaan', ['id' => $kepanitiaan1->id, 'is_koordinator' => false]);
    $this->assertDatabaseHas('kepanitiaan', ['id' => $kepanitiaan2->id, 'is_koordinator' => true]);
});

test('is_koordinator tidak boleh di-set ke jabatan inti (ketua_pelaksana)', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusKepanitiaan($team);
    $anggota = anggotaKepanitiaan($team);
    $kegiatan = kegiatanUntukTeam($team);

    $kepanitiaan = Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $anggota->id,
        'jabatan' => JabatanKepanitiaan::KetuaPelaksana->value,
    ]);

    $this->actingAs($pengurus)
        ->patch(route('divisi.koordinator', [$team->slug, $kepanitiaan->id]))
        ->assertSessionHasErrors('koordinator');

    $this->assertDatabaseHas('kepanitiaan', ['id' => $kepanitiaan->id, 'is_koordinator' => false]);
});
