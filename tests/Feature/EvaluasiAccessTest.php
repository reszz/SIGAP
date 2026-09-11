<?php

use App\Enums\TeamRole;
use App\Models\Evaluasi;
use App\Models\Kegiatan;
use App\Models\Team;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

use function Pest\Laravel\actingAs;

function makeTeamMember(Team $team): User
{
    $user = User::factory()->create();
    $team->members()->attach($user, ['role' => TeamRole::Member->value]);
    $user->switchTeam($team);

    return $user;
}

test('member dapat mengakses halaman evaluasi dan melihat kegiatan tim', function () {
    $team = Team::factory()->create();
    $user = makeTeamMember($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    actingAs($user)
        ->get(route('evaluasi.index', $team->slug))
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->component('pengurus/evaluasi/index')
                ->has('kegiatanList', 1)
                ->where('kegiatanList.0.id', $kegiatan->id)
        );
});

test('pengirim evaluasi ditampilkan sebagai anonim di halaman evaluasi', function () {
    $team = Team::factory()->create();
    $user = makeTeamMember($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    Evaluasi::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $user->id,
        'rating' => 5,
        'komentar' => 'Kegiatan sangat bagus.',
    ]);

    actingAs($user)
        ->get(route('evaluasi.index', $team->slug).'?kegiatan_id='.$kegiatan->id)
        ->assertOk()
        ->assertInertia(
            fn (Assert $page) => $page
                ->has('evaluasi', 1)
                ->where('evaluasi.0.user', 'Anonim')
        );
});

test('pengirim evaluasi ditampilkan sebagai anonim di detail kegiatan', function () {
    $team = Team::factory()->create();
    $user = makeTeamMember($team);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);
    Evaluasi::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $user->id,
        'rating' => 4,
        'komentar' => 'Kegiatan cukup baik.',
    ]);

    actingAs($user)
        ->getJson(route('kegiatan.show', [$team->slug, $kegiatan->id]))
        ->assertOk()
        ->assertJsonPath('evaluasi.0.user.name', 'Anonim');
});
