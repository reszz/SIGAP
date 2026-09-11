<?php

use App\Enums\GlobalRole;
use App\Enums\TeamRole;
use App\Models\AnggotaPeriode;
use App\Models\Periode;
use App\Models\Team;
use App\Models\User;

// ─── Setup bersama ────────────────────────────────────────────────────────────

beforeEach(function () {
    $this->team = Team::factory()->create(['name' => 'HMIF', 'slug' => 'hmif']);

    $this->superAdmin = User::factory()->create([
        'role' => GlobalRole::SuperAdmin,
        'current_team_id' => $this->team->id,
    ]);
    $this->team->members()->attach($this->superAdmin->id, ['role' => TeamRole::Owner->value]);

    $this->pembina = User::factory()->create([
        'role' => GlobalRole::Pembina,
        'current_team_id' => $this->team->id,
    ]);
    $this->team->members()->attach($this->pembina->id, ['role' => TeamRole::Admin->value]);

    $this->pengurus = User::factory()->create([
        'role' => GlobalRole::Pengurus,
        'current_team_id' => $this->team->id,
    ]);
    $this->team->members()->attach($this->pengurus->id, ['role' => TeamRole::Admin->value]);

    // Periode lama (non-aktif, bukan latest)
    $this->periodeLama = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2024/2025',
        'is_aktif' => false,
        'tanggal_mulai' => '2024-01-01',
        'tanggal_selesai' => '2024-12-31',
        'created_by' => $this->superAdmin->id,
    ]);

    // Periode aktif (latest)
    $this->periodeAktif = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2026/2027',
        'is_aktif' => true,
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-12-31',
        'created_by' => $this->superAdmin->id,
    ]);

    // Pengurus terdaftar di periode aktif dan sedang browsing periode aktif
    $this->pengurus->forceFill(['current_periode_id' => $this->periodeAktif->id])->save();

    AnggotaPeriode::create([
        'user_id' => $this->pengurus->id,
        'periode_id' => $this->periodeAktif->id,
        'jabatan' => 'Ketua',
        'status' => 'aktif',
    ]);
});

// ─── Helper: buat anggota yang terdaftar di kedua periode ────────────────────

function buatAnggotaDuaPeriodeHelper(Team $team, Periode $periodeLama, Periode $periodeAktif): User
{
    $anggota = User::factory()->create([
        'role' => GlobalRole::Anggota,
        'current_team_id' => $team->id,
        'current_periode_id' => $periodeAktif->id,
    ]);
    $team->members()->attach($anggota->id, ['role' => TeamRole::Member->value]);

    AnggotaPeriode::create([
        'user_id' => $anggota->id,
        'periode_id' => $periodeLama->id,
        'jabatan' => 'Staff',
        'status' => 'demisioner',
    ]);

    AnggotaPeriode::create([
        'user_id' => $anggota->id,
        'periode_id' => $periodeAktif->id,
        'jabatan' => 'Staff',
        'status' => 'aktif',
    ]);

    return $anggota;
}

// ─── TC-A: Bug utama — periode lama tidak ikut terhapus ──────────────────────

test('menghapus anggota di periode aktif tidak menghapus data keanggotaan periode lama', function () {
    $anggota = buatAnggotaDuaPeriodeHelper($this->team, $this->periodeLama, $this->periodeAktif);

    $response = $this->actingAs($this->pengurus)
        ->delete("/{$this->team->slug}/pengurus/anggota/{$anggota->id}");

    $response->assertRedirect();

    // Row anggota_periode di periode aktif sudah terhapus
    $this->assertDatabaseMissing('anggota_periode', [
        'user_id' => $anggota->id,
        'periode_id' => $this->periodeAktif->id,
    ]);

    // Row anggota_periode di periode LAMA masih ada dan tidak tersentuh
    $this->assertDatabaseHas('anggota_periode', [
        'user_id' => $anggota->id,
        'periode_id' => $this->periodeLama->id,
        'jabatan' => 'Staff',
        'status' => 'demisioner',
    ]);
});

// ─── TC-B: Akun User tidak ikut terhapus ─────────────────────────────────────

test('menghapus anggota dari periode tidak menghapus akun user', function () {
    $anggota = buatAnggotaDuaPeriodeHelper($this->team, $this->periodeLama, $this->periodeAktif);
    $anggotaId = $anggota->id;

    $this->actingAs($this->pengurus)
        ->delete("/{$this->team->slug}/pengurus/anggota/{$anggotaId}");

    // Akun User masih ada (tidak di-soft-delete)
    $this->assertDatabaseHas('users', ['id' => $anggotaId]);
    expect(User::find($anggotaId))->not->toBeNull();
});

// ─── TC-C: Hanya baris AnggotaPeriode periode aktif yang dihapus ─────────────

test('delete hanya menghapus tepat satu baris anggota_periode milik periode aktif', function () {
    $anggota = buatAnggotaDuaPeriodeHelper($this->team, $this->periodeLama, $this->periodeAktif);

    $jumlahSebelum = AnggotaPeriode::where('user_id', $anggota->id)->count();
    expect($jumlahSebelum)->toBe(2);

    $this->actingAs($this->pengurus)
        ->delete("/{$this->team->slug}/pengurus/anggota/{$anggota->id}");

    $jumlahSesudah = AnggotaPeriode::where('user_id', $anggota->id)->count();
    expect($jumlahSesudah)->toBe(1);

    // Yang tersisa adalah keanggotaan periode lama
    $sisanya = AnggotaPeriode::where('user_id', $anggota->id)->first();
    expect((int) $sisanya->periode_id)->toBe((int) $this->periodeLama->id);
});

// ─── TC-D: Browsing periode lama → 403 (middleware EnsurePeriodeEditable) ────

test('pengurus tidak dapat menghapus anggota saat sedang browsing periode lama', function () {
    $anggota = buatAnggotaDuaPeriodeHelper($this->team, $this->periodeLama, $this->periodeAktif);

    // Pengurus switch ke periode lama (bukan periode aktif)
    $this->pengurus->forceFill(['current_periode_id' => $this->periodeLama->id])->save();

    $response = $this->actingAs($this->pengurus)
        ->delete("/{$this->team->slug}/pengurus/anggota/{$anggota->id}");

    $response->assertForbidden();

    // Semua data periode lama tetap tidak tersentuh
    $this->assertDatabaseHas('anggota_periode', [
        'user_id' => $anggota->id,
        'periode_id' => $this->periodeLama->id,
    ]);
    $this->assertDatabaseHas('anggota_periode', [
        'user_id' => $anggota->id,
        'periode_id' => $this->periodeAktif->id,
    ]);
});

// ─── TC-E: Tidak bisa hapus keanggotaan sendiri ───────────────────────────────

test('pengurus tidak dapat menghapus keanggotaan periodenya sendiri', function () {
    $response = $this->actingAs($this->pengurus)
        ->delete("/{$this->team->slug}/pengurus/anggota/{$this->pengurus->id}");

    $response->assertForbidden();

    // Keanggotaan pengurus masih ada
    $this->assertDatabaseHas('anggota_periode', [
        'user_id' => $this->pengurus->id,
        'periode_id' => $this->periodeAktif->id,
    ]);
});

// ─── TC-F: Role anggota tidak bisa mengakses destroy ─────────────────────────

test('anggota biasa tidak dapat menghapus anggota lain dari periode', function () {
    $anggotaBiasa = User::factory()->create([
        'role' => GlobalRole::Anggota,
        'current_team_id' => $this->team->id,
        'current_periode_id' => $this->periodeAktif->id,
    ]);
    $this->team->members()->attach($anggotaBiasa->id, ['role' => TeamRole::Member->value]);

    $targetAnggota = buatAnggotaDuaPeriodeHelper($this->team, $this->periodeLama, $this->periodeAktif);

    // Role 'anggota' tidak punya akses ke prefix /pengurus/ (middleware EnsureUserHasRole)
    $response = $this->actingAs($anggotaBiasa)
        ->delete("/{$this->team->slug}/pengurus/anggota/{$targetAnggota->id}");

    $response->assertForbidden();
});

// ─── TC-G: Pembina BISA menghapus keanggotaan di periode aktif ───────────────

test('pembina dapat menghapus keanggotaan anggota dari periode aktif', function () {
    $anggota = buatAnggotaDuaPeriodeHelper($this->team, $this->periodeLama, $this->periodeAktif);

    $this->pembina->forceFill(['current_periode_id' => $this->periodeAktif->id])->save();

    $response = $this->actingAs($this->pembina)
        ->delete("/{$this->team->slug}/pengurus/anggota/{$anggota->id}");

    $response->assertRedirect();

    // Keanggotaan periode aktif terhapus
    $this->assertDatabaseMissing('anggota_periode', [
        'user_id' => $anggota->id,
        'periode_id' => $this->periodeAktif->id,
    ]);

    // Keanggotaan periode lama tetap ada
    $this->assertDatabaseHas('anggota_periode', [
        'user_id' => $anggota->id,
        'periode_id' => $this->periodeLama->id,
    ]);
});
