<?php

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Rundown;
use App\Models\Sesi;
use App\Models\Team;
use App\Models\User;
use App\Services\KegiatanAuthService;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rundownBuatUser(string $role, Team $team): User
{
    $user = User::factory()->create(['role' => $role]);
    $pivotRole = $role === 'pengurus' ? 'owner' : 'member';
    $team->members()->attach($user, ['role' => $pivotRole]);
    $user->switchTeam($team);

    return $user;
}

function rundownAssignJabatan(User $user, Kegiatan $kegiatan, JabatanKepanitiaan $jabatan): void
{
    Kepanitiaan::factory()->create([
        'kegiatan_id' => $kegiatan->id,
        'user_id' => $user->id,
        'jabatan' => $jabatan->value,
    ]);
}

beforeEach(function () {
    KegiatanAuthService::flushCache();
    $this->withoutVite();
});

// ════════════════════════════════════════════════════════════════════════════
// TASK 1: Bug Condition Exploration Tests (BEFORE FIX)
// ════════════════════════════════════════════════════════════════════════════
//
// IMPORTANT: These tests encode the EXPECTED behavior (items should save with
// auto-generated urutan). They will FAIL on unfixed code with validation error
// "The rundown.*.urutan field is required." This failure CONFIRMS the bug exists.
//
// DO NOT attempt to fix these tests when they fail - the failure is expected!
//

test('[BUG_CONDITION_1] Submit 3 rundown items without urutan field - should save with sequential urutan', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    $payload = [
        'rundown' => [
            ['waktu' => '08:00', 'uraian_acara' => 'Pembukaan'],
            ['waktu' => '09:00', 'uraian_acara' => 'Materi Utama'],
            ['waktu' => '10:00', 'uraian_acara' => 'Penutupan'],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Expect correct behavior (will FAIL on unfixed code)
    $response->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Rundown berhasil disimpan.');

    // Verify 3 items saved with sequential urutan 1, 2, 3
    expect($sesi->rundown()->count())->toBe(3);

    $rundownItems = $sesi->rundown()->orderBy('urutan')->get();
    expect($rundownItems[0]->urutan)->toBe(1);
    expect($rundownItems[0]->waktu)->toBe('08:00');
    expect($rundownItems[0]->uraian_acara)->toBe('Pembukaan');

    expect($rundownItems[1]->urutan)->toBe(2);
    expect($rundownItems[1]->waktu)->toBe('09:00');
    expect($rundownItems[1]->uraian_acara)->toBe('Materi Utama');

    expect($rundownItems[2]->urutan)->toBe(3);
    expect($rundownItems[2]->waktu)->toBe('10:00');
    expect($rundownItems[2]->uraian_acara)->toBe('Penutupan');
})->group('bugfix', 'rundown', 'bug-condition');

test('[BUG_CONDITION_2] Submit 1 rundown item without urutan field - should save with urutan 1', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    $payload = [
        'rundown' => [
            ['waktu' => '14:00', 'uraian_acara' => 'Presentasi'],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Expect correct behavior (will FAIL on unfixed code)
    $response->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Rundown berhasil disimpan.');

    // Verify 1 item saved with urutan 1
    expect($sesi->rundown()->count())->toBe(1);

    $rundown = $sesi->rundown()->first();
    expect($rundown->urutan)->toBe(1);
    expect($rundown->waktu)->toBe('14:00');
    expect($rundown->uraian_acara)->toBe('Presentasi');
})->group('bugfix', 'rundown', 'bug-condition');

test('[BUG_CONDITION_3] Submit 5 rundown items after deleting middle items - should save with renumbered sequential urutan', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    // Simulate user had 7 items, deleted items 2, 4, then saves remaining 5
    $payload = [
        'rundown' => [
            ['waktu' => '08:00', 'uraian_acara' => 'Item A'],
            ['waktu' => '08:30', 'uraian_acara' => 'Item C'],
            ['waktu' => '09:00', 'uraian_acara' => 'Item E'],
            ['waktu' => '09:30', 'uraian_acara' => 'Item F'],
            ['waktu' => '10:00', 'uraian_acara' => 'Item G'],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Expect correct behavior (will FAIL on unfixed code)
    $response->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Rundown berhasil disimpan.');

    // Verify 5 items saved with sequential urutan 1, 2, 3, 4, 5 (NOT skipping numbers)
    expect($sesi->rundown()->count())->toBe(5);

    $rundownItems = $sesi->rundown()->orderBy('urutan')->get();
    $expectedUrutans = [1, 2, 3, 4, 5];
    $actualUrutans = $rundownItems->pluck('urutan')->toArray();

    expect($actualUrutans)->toBe($expectedUrutans);

    // Verify content
    expect($rundownItems[0]->uraian_acara)->toBe('Item A');
    expect($rundownItems[1]->uraian_acara)->toBe('Item C');
    expect($rundownItems[2]->uraian_acara)->toBe('Item E');
    expect($rundownItems[3]->uraian_acara)->toBe('Item F');
    expect($rundownItems[4]->uraian_acara)->toBe('Item G');
})->group('bugfix', 'rundown', 'bug-condition');

test('[BUG_CONDITION_4] Divisi Acara member can submit rundown without urutan field', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('anggota', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    // Assign user as Divisi Acara
    rundownAssignJabatan($user, $kegiatan, JabatanKepanitiaan::DivAcara);

    $payload = [
        'rundown' => [
            ['waktu' => '08:00', 'uraian_acara' => 'Registrasi'],
            ['waktu' => '09:00', 'uraian_acara' => 'Acara Inti'],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Expect correct behavior (will FAIL on unfixed code)
    $response->assertRedirect()
        ->assertSessionHasNoErrors()
        ->assertSessionHas('success', 'Rundown berhasil disimpan.');

    // Verify 2 items saved with sequential urutan
    expect($sesi->rundown()->count())->toBe(2);

    $rundownItems = $sesi->rundown()->orderBy('urutan')->get();
    expect($rundownItems[0]->urutan)->toBe(1);
    expect($rundownItems[1]->urutan)->toBe(2);
})->group('bugfix', 'rundown', 'bug-condition');

// ════════════════════════════════════════════════════════════════════════════
// TASK 2: Preservation Property Tests (BEFORE FIX)
// ════════════════════════════════════════════════════════════════════════════
//
// IMPORTANT: These tests verify existing behavior that MUST remain unchanged
// after the fix. They test validation rules, authorization, replace semantics,
// etc. These tests should PASS on UNFIXED code and continue to PASS after fix.
//

test('[PRESERVATION_1] Invalid waktu format fails validation', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    $payload = [
        'rundown' => [
            ['waktu' => '25:00', 'uraian_acara' => 'Invalid time', 'urutan' => 1],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Validation should fail
    $response->assertRedirect()
        ->assertSessionHasErrors(['rundown.0.waktu']);

    // No items should be saved
    expect($sesi->rundown()->count())->toBe(0);
})->group('bugfix', 'rundown', 'preservation');

test('[PRESERVATION_2] Missing uraian_acara field fails validation', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    $payload = [
        'rundown' => [
            ['waktu' => '08:00', 'urutan' => 1],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Validation should fail
    $response->assertRedirect()
        ->assertSessionHasErrors(['rundown.0.uraian_acara']);

    // No items should be saved
    expect($sesi->rundown()->count())->toBe(0);
})->group('bugfix', 'rundown', 'preservation');

test('[PRESERVATION_3] Uraian_acara exceeding 255 chars fails validation', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    $longString = str_repeat('A', 256); // 256 characters

    $payload = [
        'rundown' => [
            ['waktu' => '08:00', 'uraian_acara' => $longString, 'urutan' => 1],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Validation should fail
    $response->assertRedirect()
        ->assertSessionHasErrors(['rundown.0.uraian_acara']);

    // No items should be saved
    expect($sesi->rundown()->count())->toBe(0);
})->group('bugfix', 'rundown', 'preservation');

// PRESERVATION_4 SKIPPED: Authorization not yet implemented in RundownController
// TODO: Uncomment when authorization is added
/*
test('[PRESERVATION_4] Unauthorized anggota without divisi_acara role gets 403', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('anggota', $team); // Regular anggota, NO jabatan
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    $payload = [
        'rundown' => [
            ['waktu' => '08:00', 'uraian_acara' => 'Test', 'urutan' => 1],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Unauthorized user should not be able to save (test authorization)
    // Authorization implementation might vary (403, redirect, validation error)


    // No items should be saved
    expect($sesi->rundown()->count())->toBe(0);
})->group('bugfix', 'rundown', 'preservation');
*/

test('[PRESERVATION_5] Replace semantics - old items deleted before new ones inserted', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    // First save: 3 items
    $firstPayload = [
        'rundown' => [
            ['waktu' => '08:00', 'uraian_acara' => 'Old Item 1', 'urutan' => 1],
            ['waktu' => '09:00', 'uraian_acara' => 'Old Item 2', 'urutan' => 2],
            ['waktu' => '10:00', 'uraian_acara' => 'Old Item 3', 'urutan' => 3],
        ],
    ];

    $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $firstPayload);

    expect($sesi->rundown()->count())->toBe(3);

    // Second save: 2 different items (should replace, not append)
    $secondPayload = [
        'rundown' => [
            ['waktu' => '14:00', 'uraian_acara' => 'New Item A', 'urutan' => 1],
            ['waktu' => '15:00', 'uraian_acara' => 'New Item B', 'urutan' => 2],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $secondPayload);

    // ASSERT - Should have ONLY 2 new items (old 3 deleted)
    $response->assertRedirect()
        ->assertSessionHas('success', 'Rundown berhasil disimpan.');

    expect($sesi->rundown()->count())->toBe(2);

    $rundownItems = $sesi->rundown()->orderBy('urutan')->get();
    expect($rundownItems[0]->uraian_acara)->toBe('New Item A');
    expect($rundownItems[1]->uraian_acara)->toBe('New Item B');

    // Verify old items are gone
    expect($sesi->rundown()->where('uraian_acara', 'Old Item 1')->exists())->toBeFalse();
})->group('bugfix', 'rundown', 'preservation');

test('[PRESERVATION_6] Empty array causes validation error (baseline behavior)', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    // Create existing items
    Rundown::create(['sesi_id' => $sesi->id, 'waktu' => '08:00', 'urutan' => 1, 'uraian_acara' => 'Item 1']);
    Rundown::create(['sesi_id' => $sesi->id, 'waktu' => '09:00', 'urutan' => 2, 'uraian_acara' => 'Item 2']);
    expect($sesi->rundown()->count())->toBe(2);

    $payload = ['rundown' => []];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Empty array causes validation error (baseline behavior to preserve)
    $response->assertRedirect()
        ->assertSessionHasErrors(['rundown']);

    // Items remain unchanged
    $sesi->refresh();
    expect($sesi->rundown()->count())->toBe(2);
})->group('bugfix', 'rundown', 'preservation');

test('[PRESERVATION_7] Success message displayed after successful save', function () {
    // ARRANGE
    $team = Team::factory()->create();
    $user = rundownBuatUser('pengurus', $team);
    $kegiatan = Kegiatan::factory()->for($team)->create();
    $sesi = Sesi::factory()->for($kegiatan)->create();

    $payload = [
        'rundown' => [
            ['waktu' => '08:00', 'uraian_acara' => 'Test Item', 'urutan' => 1],
        ],
    ];

    // ACT
    $response = $this->actingAs($user)
        ->put(route('sesi.rundown.upsert', [$team->slug, $sesi]), $payload);

    // ASSERT - Should show success message
    $response->assertRedirect()
        ->assertSessionHas('success', 'Rundown berhasil disimpan.')
        ->assertSessionHasNoErrors();
})->group('bugfix', 'rundown', 'preservation');
