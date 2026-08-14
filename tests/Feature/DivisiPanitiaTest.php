<?php

use App\Enums\TeamRole;
use App\Models\DivisiPanitia;
use App\Models\Kegiatan;
use App\Models\Team;
use App\Models\TugasPanitia;
use App\Models\User;

beforeEach(fn () => $this->withoutVite());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pengurusDP(Team $team): User
{
    $user = User::factory()->create(['role' => 'pengurus']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $user->switchTeam($team);

    return $user;
}

function anggotaDP(Team $team): User
{
    $user = User::factory()->create(['role' => 'anggota']);
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    $user->switchTeam($team);

    return $user;
}

// ─── TC-1  Pengurus berhasil tambah Divisi ────────────────────────────────────

test('pengurus dapat menambah divisi ke kegiatan milik team-nya', function () {
    $team = Team::factory()->create();
    $user = pengurusDP($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    $this->actingAs($user)
        ->post(route('pengurus.divisi.store', [$team->slug, $kegiatan->id]), [
            'nama_divisi' => 'Acara',
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('divisi_panitia', [
        'nama_divisi' => 'Acara',
        'kegiatan_id' => $kegiatan->id,
    ]);
});

// ─── TC-2  Member tidak bisa tambah Divisi ────────────────────────────────────

test('member tidak bisa menambah divisi (403 dari middleware)', function () {
    $team = Team::factory()->create();
    $user = anggotaDP($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    $this->actingAs($user)
        ->post(route('pengurus.divisi.store', [$team->slug, $kegiatan->id]), [
            'nama_divisi' => 'Acara',
        ])
        ->assertForbidden();
});

// ─── TC-3  Pengurus tidak bisa tambah Divisi ke Kegiatan Team lain ────────────

test('pengurus tidak bisa menambah divisi ke kegiatan team lain (403)', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $user = pengurusDP($teamA);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $teamB->id]);

    $this->actingAs($user)
        ->post(route('pengurus.divisi.store', [$teamA->slug, $kegiatan->id]), [
            'nama_divisi' => 'Acara',
        ])
        ->assertForbidden();
});

// ─── TC-4  Validasi nama_divisi kosong ───────────────────────────────────────

test('validasi gagal jika nama_divisi kosong', function () {
    $team = Team::factory()->create();
    $user = pengurusDP($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    $this->actingAs($user)
        ->post(route('pengurus.divisi.store', [$team->slug, $kegiatan->id]), [
            'nama_divisi' => '',
        ])
        ->assertSessionHasErrors('nama_divisi');

    $this->assertDatabaseCount('divisi_panitia', 0);
});

// ─── TC-5  Validasi nama_divisi > 100 karakter ───────────────────────────────

test('validasi gagal jika nama_divisi melebihi 100 karakter', function () {
    $team = Team::factory()->create();
    $user = pengurusDP($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    $this->actingAs($user)
        ->post(route('pengurus.divisi.store', [$team->slug, $kegiatan->id]), [
            'nama_divisi' => str_repeat('a', 101),
        ])
        ->assertSessionHasErrors('nama_divisi');
});

// ─── TC-6  Pengurus berhasil hapus Divisi ────────────────────────────────────

test('pengurus dapat menghapus divisi milik team-nya', function () {
    $team = Team::factory()->create();
    $user = pengurusDP($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    $divisi = DivisiPanitia::factory()->create(['kegiatan_id' => $kegiatan->id]);

    $this->actingAs($user)
        ->delete(route('pengurus.divisi.destroy', [$team->slug, $divisi->id]))
        ->assertRedirect();

    $this->assertDatabaseMissing('divisi_panitia', ['id' => $divisi->id]);
});

// ─── TC-7  Pengurus tidak bisa hapus Divisi Team lain ────────────────────────

test('pengurus tidak bisa menghapus divisi dari team lain (403)', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $user = pengurusDP($teamA);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $teamB->id]);
    $divisi = DivisiPanitia::factory()->create(['kegiatan_id' => $kegiatan->id]);

    $this->actingAs($user)
        ->delete(route('pengurus.divisi.destroy', [$teamA->slug, $divisi->id]))
        ->assertForbidden();

    $this->assertDatabaseHas('divisi_panitia', ['id' => $divisi->id]);
});

// ─── TC-8  Hapus Divisi cascade-hapus TugasPanitia ───────────────────────────

test('menghapus divisi juga menghapus semua tugas panitia miliknya (cascade)', function () {
    $team = Team::factory()->create();
    $user = pengurusDP($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    $divisi = DivisiPanitia::factory()->create(['kegiatan_id' => $kegiatan->id]);

    TugasPanitia::factory()->count(2)->create(['divisi_id' => $divisi->id]);

    $this->assertDatabaseCount('tugas_panitia', 2);

    $this->actingAs($user)
        ->delete(route('pengurus.divisi.destroy', [$team->slug, $divisi->id]))
        ->assertRedirect();

    $this->assertDatabaseMissing('tugas_panitia', ['divisi_id' => $divisi->id]);
});
