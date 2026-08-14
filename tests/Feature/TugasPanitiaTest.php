<?php

use App\Enums\TeamRole;
use App\Models\DivisiPanitia;
use App\Models\Kegiatan;
use App\Models\Team;
use App\Models\TugasPanitia;
use App\Models\User;

beforeEach(fn () => $this->withoutVite());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pengurusTP(Team $team): User
{
    $user = User::factory()->create(['role' => 'pengurus']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $user->switchTeam($team);

    return $user;
}

function anggotaTP(Team $team): User
{
    $user = User::factory()->create(['role' => 'anggota']);
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    $user->switchTeam($team);

    return $user;
}

function setupKegiatanDivisi(Team $team): array
{
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    $divisi = DivisiPanitia::factory()->create(['kegiatan_id' => $kegiatan->id]);

    return [$kegiatan, $divisi];
}

// ─── TC-1..7  Store ───────────────────────────────────────────────────────────

test('TC-1: pengurus assign member ke divisi, tersimpan dengan status belum', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);

    $this->actingAs($pengurus)
        ->post(route('pengurus.tugas.store', [$team->slug, $kegiatan->id, $divisi->id]), [
            'user_id' => $member->id,
            'deskripsi_tugas' => 'Booking venue',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tugas_panitia', [
        'divisi_id' => $divisi->id,
        'user_id' => $member->id,
        'deskripsi_tugas' => 'Booking venue',
        'status' => 'belum',
    ]);
});

test('TC-2: member tidak bisa POST store (403 middleware)', function () {
    $team = Team::factory()->create();
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);

    $this->actingAs($member)
        ->post(route('pengurus.tugas.store', [$team->slug, $kegiatan->id, $divisi->id]), [
            'user_id' => $member->id,
            'deskripsi_tugas' => 'Test',
        ])
        ->assertForbidden();
});

test('TC-3: pengurus tidak bisa assign ke divisi team lain (403 controller)', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $pengurus = pengurusTP($teamA);
    [$kegiatanB, $divisiB] = setupKegiatanDivisi($teamB);

    $this->actingAs($pengurus)
        ->post(route('pengurus.tugas.store', [$teamA->slug, $kegiatanB->id, $divisiB->id]), [
            'user_id' => $pengurus->id,
            'deskripsi_tugas' => 'Test',
        ])
        ->assertForbidden();
});

test('TC-4: assign user_id yang bukan member team gagal validasi', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $outsider = User::factory()->create();
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);

    $this->actingAs($pengurus)
        ->post(route('pengurus.tugas.store', [$team->slug, $kegiatan->id, $divisi->id]), [
            'user_id' => $outsider->id,
            'deskripsi_tugas' => 'Test',
        ])
        ->assertSessionHasErrors('user_id');
});

test('TC-5: deskripsi_tugas kosong gagal validasi', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);

    $this->actingAs($pengurus)
        ->post(route('pengurus.tugas.store', [$team->slug, $kegiatan->id, $divisi->id]), [
            'user_id' => $member->id,
            'deskripsi_tugas' => '',
        ])
        ->assertSessionHasErrors('deskripsi_tugas');
});

test('TC-6: deskripsi_tugas lebih dari 255 karakter gagal validasi', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);

    $this->actingAs($pengurus)
        ->post(route('pengurus.tugas.store', [$team->slug, $kegiatan->id, $divisi->id]), [
            'user_id' => $member->id,
            'deskripsi_tugas' => str_repeat('a', 256),
        ])
        ->assertSessionHasErrors('deskripsi_tugas');
});

test('TC-7: satu member boleh di-assign lebih dari sekali ke divisi yang sama', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);

    $payload = [
        'user_id' => $member->id,
        'deskripsi_tugas' => 'Tugas pertama',
    ];

    $this->actingAs($pengurus)
        ->post(route('pengurus.tugas.store', [$team->slug, $kegiatan->id, $divisi->id]), $payload)
        ->assertRedirect();

    $payload['deskripsi_tugas'] = 'Tugas kedua';

    $this->actingAs($pengurus)
        ->post(route('pengurus.tugas.store', [$team->slug, $kegiatan->id, $divisi->id]), $payload)
        ->assertRedirect();

    expect(TugasPanitia::where('user_id', $member->id)->where('divisi_id', $divisi->id)->count())->toBe(2);
});

// ─── TC-8..10  Destroy ────────────────────────────────────────────────────────

test('TC-8: pengurus hapus tugas milik team-nya berhasil', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create(['divisi_id' => $divisi->id, 'user_id' => $member->id]);

    $this->actingAs($pengurus)
        ->delete(route('pengurus.tugas.destroy', [$team->slug, $tugas->id]))
        ->assertRedirect();

    $this->assertDatabaseMissing('tugas_panitia', ['id' => $tugas->id]);
});

test('TC-9: pengurus tidak bisa hapus tugas dari team lain (403)', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $pengurus = pengurusTP($teamA);
    [$kegiatanB, $divisiB] = setupKegiatanDivisi($teamB);
    $tugas = TugasPanitia::factory()->create(['divisi_id' => $divisiB->id]);

    $this->actingAs($pengurus)
        ->delete(route('pengurus.tugas.destroy', [$teamA->slug, $tugas->id]))
        ->assertForbidden();

    $this->assertDatabaseHas('tugas_panitia', ['id' => $tugas->id]);
});

test('TC-10: member tidak bisa DELETE tugas (403 middleware)', function () {
    $team = Team::factory()->create();
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create(['divisi_id' => $divisi->id, 'user_id' => $member->id]);

    $this->actingAs($member)
        ->delete(route('pengurus.tugas.destroy', [$team->slug, $tugas->id]))
        ->assertForbidden();
});

// ─── TC-11..16  UpdateStatus ──────────────────────────────────────────────────

test('TC-11: member update status tugas sendiri ke sedang berhasil', function () {
    $team = Team::factory()->create();
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create([
        'divisi_id' => $divisi->id,
        'user_id' => $member->id,
        'status' => 'belum',
    ]);

    $this->actingAs($member)
        ->patch(route('tugas.updateStatus', [$team->slug, $tugas->id]), ['status' => 'sedang'])
        ->assertRedirect();

    $this->assertDatabaseHas('tugas_panitia', ['id' => $tugas->id, 'status' => 'sedang']);
});

test('TC-12: member bisa reverse status dari selesai ke belum', function () {
    $team = Team::factory()->create();
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create([
        'divisi_id' => $divisi->id,
        'user_id' => $member->id,
        'status' => 'selesai',
    ]);

    $this->actingAs($member)
        ->patch(route('tugas.updateStatus', [$team->slug, $tugas->id]), ['status' => 'belum'])
        ->assertRedirect();

    $this->assertDatabaseHas('tugas_panitia', ['id' => $tugas->id, 'status' => 'belum']);
});

test('TC-13: member tidak bisa update status tugas milik member lain (403)', function () {
    $team = Team::factory()->create();
    $memberA = anggotaTP($team);
    $memberB = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create([
        'divisi_id' => $divisi->id,
        'user_id' => $memberB->id,
        'status' => 'belum',
    ]);

    $this->actingAs($memberA)
        ->patch(route('tugas.updateStatus', [$team->slug, $tugas->id]), ['status' => 'sedang'])
        ->assertForbidden();
});

test('TC-14: pengurus tidak bisa PATCH updateStatus milik member (403 ownership)', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create([
        'divisi_id' => $divisi->id,
        'user_id' => $member->id,
        'status' => 'belum',
    ]);

    $this->actingAs($pengurus)
        ->patch(route('tugas.updateStatus', [$team->slug, $tugas->id]), ['status' => 'selesai'])
        ->assertForbidden();
});

test('TC-15: status tidak valid gagal validasi', function () {
    $team = Team::factory()->create();
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create(['divisi_id' => $divisi->id, 'user_id' => $member->id]);

    $this->actingAs($member)
        ->patch(route('tugas.updateStatus', [$team->slug, $tugas->id]), ['status' => 'invalid'])
        ->assertSessionHasErrors('status');
});

test('TC-16: field ekstra diabaikan, hanya status yang berubah', function () {
    $team = Team::factory()->create();
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);
    $tugas = TugasPanitia::factory()->create([
        'divisi_id' => $divisi->id,
        'user_id' => $member->id,
        'deskripsi_tugas' => 'Tugas asli',
        'status' => 'belum',
    ]);

    $this->actingAs($member)
        ->patch(route('tugas.updateStatus', [$team->slug, $tugas->id]), [
            'status' => 'sedang',
            'deskripsi_tugas' => 'Sudah diganti harusnya',
            'user_id' => 9999,
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('tugas_panitia', [
        'id' => $tugas->id,
        'status' => 'sedang',
        'deskripsi_tugas' => 'Tugas asli',
        'user_id' => $member->id,
    ]);
});

// ─── TC-17  Cascade DELETE ────────────────────────────────────────────────────

test('TC-17: hapus divisi otomatis hapus semua tugas di dalamnya', function () {
    $team = Team::factory()->create();
    $pengurus = pengurusTP($team);
    $member = anggotaTP($team);
    [$kegiatan, $divisi] = setupKegiatanDivisi($team);

    TugasPanitia::factory()->count(3)->create(['divisi_id' => $divisi->id, 'user_id' => $member->id]);

    $this->assertDatabaseCount('tugas_panitia', 3);

    $this->actingAs($pengurus)
        ->delete(route('pengurus.divisi.destroy', [$team->slug, $divisi->id]))
        ->assertRedirect();

    $this->assertDatabaseMissing('tugas_panitia', ['divisi_id' => $divisi->id]);
});
