<?php

use App\Enums\TeamRole;
use App\Models\Evaluasi;
use App\Models\Kegiatan;
use App\Models\Presensi;
use App\Models\Rsvp;
use App\Models\Sesi;
use App\Models\Team;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

// Disable Vite manifest lookup
beforeEach(fn () => $this->withoutVite());
// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Create a user already attached to a team with the given role,
 * with that team set as their current team.
 */
function userInTeam(Team $team, TeamRole $role = TeamRole::Member): User
{
    $user = User::factory()->create();
    $team->members()->attach($user, ['role' => $role->value]);
    $user->switchTeam($team);

    return $user;
}

// ─── 5.1  Access control ──────────────────────────────────────────────────────

test('guest diarahkan ke halaman login saat mengakses riwayat-saya', function () {
    $team = Team::factory()->create();

    $this->get(route('riwayat-saya.index', $team->slug))
        ->assertRedirect(route('login'));
});

test('member dapat mengakses halaman riwayat-saya', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('riwayat-saya/index'));
});

test('admin dapat mengakses halaman riwayat-saya', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Admin);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertOk();
});

test('owner dapat mengakses halaman riwayat-saya', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Owner);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertOk();
});

test('user yang bukan anggota team mendapat 403', function () {
    $team = Team::factory()->create();
    $outsider = User::factory()->create();

    $this->actingAs($outsider)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertForbidden();
});

// ─── 5.2  Isolasi data user dan scoping team ──────────────────────────────────

test('riwayatRsvp hanya berisi data milik user aktif, bukan user lain dalam team yang sama', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);
    $other = userInTeam($team, TeamRole::Member);

    $kegiatan = Kegiatan::factory()->terbuka()->create(['team_id' => $team->id]);
    Rsvp::factory()->create(['user_id' => $user->id,  'kegiatan_id' => $kegiatan->id]);
    Rsvp::factory()->create(['user_id' => $other->id, 'kegiatan_id' => $kegiatan->id]);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->has('riwayatRsvp', 1)
            ->where('riwayatRsvp.0.kegiatanNama', $kegiatan->nama)
        );
});

test('riwayatPresensi tidak memuat data dari team lain yang juga diikuti user', function () {
    $teamA = Team::factory()->create();
    $teamB = Team::factory()->create();
    $user = userInTeam($teamA, TeamRole::Member);
    $teamB->members()->attach($user, ['role' => TeamRole::Member->value]);

    // Presensi di team A
    $kegiatanA = Kegiatan::factory()->create(['team_id' => $teamA->id]);
    $sesiA = Sesi::factory()->create(['kegiatan_id' => $kegiatanA->id]);
    Presensi::factory()->create(['user_id' => $user->id, 'sesi_id' => $sesiA->id]);

    // Presensi di team B
    $kegiatanB = Kegiatan::factory()->create(['team_id' => $teamB->id]);
    $sesiB = Sesi::factory()->create(['kegiatan_id' => $kegiatanB->id]);
    Presensi::factory()->create(['user_id' => $user->id, 'sesi_id' => $sesiB->id]);

    // current team = A, jadi hanya presensi teamA yang muncul
    $user->switchTeam($teamA);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $teamA->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->has('riwayatPresensi', 1)
            ->where('riwayatPresensi.0.kegiatanNama', $kegiatanA->nama)
        );
});

test('evaluasi untuk kegiatan yang soft-deleted tidak muncul di riwayatEvaluasi', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);
    $kegiatan = Kegiatan::factory()->create(['team_id' => $team->id]);

    Evaluasi::factory()->create(['user_id' => $user->id, 'kegiatan_id' => $kegiatan->id]);

    // Soft-delete the kegiatan
    $kegiatan->delete();

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertInertia(fn (Assert $page) => $page->has('riwayatEvaluasi', 0));
});

// ─── 5.3  Ordering dan limit ──────────────────────────────────────────────────

test('riwayatRsvp diurutkan berdasarkan waktu_daftar descending', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);
    $kegiatan = Kegiatan::factory()->terbuka()->create(['team_id' => $team->id]);

    $old = Kegiatan::factory()->terbuka()->create(['team_id' => $team->id]);
    $new = Kegiatan::factory()->terbuka()->create(['team_id' => $team->id]);

    Rsvp::factory()->create([
        'user_id' => $user->id,
        'kegiatan_id' => $old->id,
        'waktu_daftar' => now()->subDays(5),
    ]);
    Rsvp::factory()->create([
        'user_id' => $user->id,
        'kegiatan_id' => $new->id,
        'waktu_daftar' => now()->subDay(),
    ]);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->has('riwayatRsvp', 2)
            ->where('riwayatRsvp.0.kegiatanNama', $new->nama)
            ->where('riwayatRsvp.1.kegiatanNama', $old->nama)
        );
});

test('riwayatPresensi diurutkan berdasarkan waktu_isi descending', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);

    $keg = Kegiatan::factory()->create(['team_id' => $team->id]);
    $sesiA = Sesi::factory()->create(['kegiatan_id' => $keg->id]);
    $sesiB = Sesi::factory()->create(['kegiatan_id' => $keg->id]);

    Presensi::factory()->create(['user_id' => $user->id, 'sesi_id' => $sesiA->id, 'waktu_isi' => now()->subDays(3)]);
    Presensi::factory()->create(['user_id' => $user->id, 'sesi_id' => $sesiB->id, 'waktu_isi' => now()->subDay()]);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->has('riwayatPresensi', 2)
            ->where('riwayatPresensi.0.sesiTanggal', $sesiB->tanggal->format('Y-m-d'))
        );
});

test('controller membatasi riwayatPresensi maksimal 50 record', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);
    $keg = Kegiatan::factory()->create(['team_id' => $team->id]);

    // Create 55 unique sesi+presensi for this user
    Sesi::factory()->count(55)->create(['kegiatan_id' => $keg->id])
        ->each(fn (Sesi $sesi) => Presensi::factory()->create([
            'user_id' => $user->id,
            'sesi_id' => $sesi->id,
        ]));

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertInertia(fn (Assert $page) => $page->has('riwayatPresensi', 50));
});

// ─── 5.4  Empty state dan Inertia props shape ─────────────────────────────────

test('halaman riwayat-saya merender tiga section kosong untuk user tanpa riwayat', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->component('riwayat-saya/index')
            ->has('riwayatRsvp', 0)
            ->has('riwayatPresensi', 0)
            ->has('riwayatEvaluasi', 0)
        );
});

test('halaman riwayat-saya mengembalikan props dengan shape yang benar', function () {
    $team = Team::factory()->create();
    $user = userInTeam($team, TeamRole::Member);

    // One RSVP
    $kegRsvp = Kegiatan::factory()->terbuka()->create(['team_id' => $team->id]);
    $rsvp = Rsvp::factory()->create(['user_id' => $user->id, 'kegiatan_id' => $kegRsvp->id]);

    // One presensi
    $kegPre = Kegiatan::factory()->create(['team_id' => $team->id]);
    $sesi = Sesi::factory()->create(['kegiatan_id' => $kegPre->id]);
    Presensi::factory()->create(['user_id' => $user->id, 'sesi_id' => $sesi->id]);

    // One evaluasi
    $kegEval = Kegiatan::factory()->create(['team_id' => $team->id]);
    Evaluasi::factory()->create(['user_id' => $user->id, 'kegiatan_id' => $kegEval->id]);

    $this->actingAs($user)
        ->get(route('riwayat-saya.index', $team->slug))
        ->assertInertia(fn (Assert $page) => $page
            ->component('riwayat-saya/index')
            ->has('riwayatRsvp', 1)
            ->has('riwayatRsvp.0', fn (Assert $item) => $item
                ->has('id')
                ->has('kegiatanNama')
                ->has('kegiatanId')
                ->has('status')
                ->has('waktuDaftar')
            )
            ->has('riwayatPresensi', 1)
            ->has('riwayatPresensi.0', fn (Assert $item) => $item
                ->has('id')
                ->has('kegiatanNama')
                ->has('sesiTanggal')
                ->has('waktuIsi')
            )
            ->has('riwayatEvaluasi', 1)
            ->has('riwayatEvaluasi.0', fn (Assert $item) => $item
                ->has('id')
                ->has('kegiatanNama')
                ->has('kegiatanId')
                ->has('rating')
                ->has('komentar')
                ->has('tanggal')
            )
        );
});
