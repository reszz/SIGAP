<?php

use App\Enums\TeamRole;
use App\Models\Kegiatan;
use App\Models\Team;
use App\Models\User;

beforeEach(fn () => $this->withoutVite());

// â”€â”€â”€ Helper â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function pengurusInTeam(Team $team): User
{
    $user = User::factory()->create(['role' => 'pengurus']);
    $team->members()->attach($user, ['role' => TeamRole::Owner->value]);
    $user->switchTeam($team);

    return $user;
}

function basePayload(array $sesiOverride = [], array $rundown = []): array
{
    $sesi = array_merge([
        'tanggal' => '2025-09-01',
        'waktu_mulai' => '08:00',
        'waktu_selesai' => '10:00',
        'lokasi' => 'Aula Utama',
        'rundown' => $rundown,
    ], $sesiOverride);

    return [
        'nama' => 'Rapat Pleno',
        'tipe' => 'wajib_hadir',
        'warna' => '#5B4FE9',
        'sesi' => [$sesi],
    ];
}

// â”€â”€â”€ 4.1  Happy path â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('kegiatan dengan sesi dan rundown tersimpan atomik dengan urutan yang benar', function () {
    $team = Team::factory()->create();
    $user = pengurusInTeam($team);

    $payload = basePayload(rundown: [
        ['waktu' => '08:00', 'uraian_acara' => 'Pembukaan'],
        ['waktu' => '08:30', 'uraian_acara' => 'Sambutan Ketua'],
    ]);

    $this->actingAs($user)
        ->post(route('pengurus.kegiatan.store', $team->slug), $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('kegiatan', ['nama' => 'Rapat Pleno', 'team_id' => $team->id]);

    $kegiatan = Kegiatan::where('nama', 'Rapat Pleno')->first();
    $sesi = $kegiatan->sesi()->first();

    expect($sesi->rundown()->count())->toBe(2);
    expect($sesi->rundown()->orderBy('urutan')->first()->urutan)->toBe(1);
    expect($sesi->rundown()->orderBy('urutan')->skip(1)->first()->urutan)->toBe(2);
    expect($sesi->rundown()->orderBy('urutan')->first()->uraian_acara)->toBe('Pembukaan');
});

// â”€â”€â”€ 4.2  Rundown opsional â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('kegiatan tanpa rundown berhasil disimpan', function () {
    $team = Team::factory()->create();
    $user = pengurusInTeam($team);

    $this->actingAs($user)
        ->post(route('pengurus.kegiatan.store', $team->slug), basePayload())
        ->assertRedirect();

    $kegiatan = Kegiatan::where('team_id', $team->id)->first();
    $sesi = $kegiatan->sesi()->first();

    expect($sesi->rundown()->count())->toBe(0);
});

// â”€â”€â”€ 4.3  Validasi â€” waktu format salah â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('validasi error saat waktu rundown bukan format H:i', function () {
    $team = Team::factory()->create();
    $user = pengurusInTeam($team);

    $payload = basePayload(rundown: [
        ['waktu' => 'bukan-waktu', 'uraian_acara' => 'Pembukaan'],
    ]);

    $this->actingAs($user)
        ->post(route('pengurus.kegiatan.store', $team->slug), $payload)
        ->assertSessionHasErrors('sesi.0.rundown.0.waktu');
});

// â”€â”€â”€ 4.4  Validasi â€” uraian_acara kosong â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('validasi error saat uraian_acara rundown kosong', function () {
    $team = Team::factory()->create();
    $user = pengurusInTeam($team);

    $payload = basePayload(rundown: [
        ['waktu' => '08:00', 'uraian_acara' => ''],
    ]);

    $this->actingAs($user)
        ->post(route('pengurus.kegiatan.store', $team->slug), $payload)
        ->assertSessionHasErrors('sesi.0.rundown.0.uraian_acara');
});

// â”€â”€â”€ 4.5  Validasi â€” uraian_acara > 255 karakter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('validasi error saat uraian_acara rundown melebihi 255 karakter', function () {
    $team = Team::factory()->create();
    $user = pengurusInTeam($team);

    $payload = basePayload(rundown: [
        ['waktu' => '08:00', 'uraian_acara' => str_repeat('a', 256)],
    ]);

    $this->actingAs($user)
        ->post(route('pengurus.kegiatan.store', $team->slug), $payload)
        ->assertSessionHasErrors('sesi.0.rundown.0.uraian_acara');
});

// â”€â”€â”€ 4.6  Multi-sesi â€” rundown hanya di sesi tertentu â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('rundown hanya tersimpan untuk sesi yang memilikinya pada multi-sesi', function () {
    $team = Team::factory()->create();
    $user = pengurusInTeam($team);

    $payload = [
        'nama' => 'Kegiatan Multi Sesi',
        'tipe' => 'wajib_hadir',
        'warna' => '#5B4FE9',
        'sesi' => [
            [
                'tanggal' => '2025-09-01',
                'waktu_mulai' => '08:00',
                'waktu_selesai' => '10:00',
                'lokasi' => 'Aula A',
                'rundown' => [
                    ['waktu' => '08:00', 'uraian_acara' => 'Sesi 1 Acara 1'],
                    ['waktu' => '08:30', 'uraian_acara' => 'Sesi 1 Acara 2'],
                    ['waktu' => '09:00', 'uraian_acara' => 'Sesi 1 Acara 3'],
                ],
            ],
            [
                'tanggal' => '2025-09-02',
                'waktu_mulai' => '13:00',
                'waktu_selesai' => '15:00',
                'lokasi' => 'Aula B',
                'rundown' => [],
            ],
        ],
    ];

    $this->actingAs($user)
        ->post(route('pengurus.kegiatan.store', $team->slug), $payload)
        ->assertRedirect();

    $kegiatan = Kegiatan::where('nama', 'Kegiatan Multi Sesi')->first();
    $sesiList = $kegiatan->sesi()->orderBy('tanggal')->get();

    expect($sesiList[0]->rundown()->count())->toBe(3);
    expect($sesiList[0]->rundown()->orderBy('urutan')->pluck('urutan')->toArray())->toBe([1, 2, 3]);
    expect($sesiList[1]->rundown()->count())->toBe(0);
});

// â”€â”€â”€ 4.7  Urutan recompute â€” hapus baris tengah â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

test('urutan yang tersimpan adalah 1 dan 2 ketika frontend mengirim array dengan 2 elemen setelah hapus baris tengah', function () {
    $team = Team::factory()->create();
    $user = pengurusInTeam($team);

    // Simulasi: frontend sudah hapus baris B, jadi array terkirim adalah [A, C]
    $payload = basePayload(rundown: [
        ['waktu' => '08:00', 'uraian_acara' => 'Acara A'],
        ['waktu' => '09:00', 'uraian_acara' => 'Acara C'],
    ]);

    $this->actingAs($user)
        ->post(route('pengurus.kegiatan.store', $team->slug), $payload)
        ->assertRedirect();

    $sesi = Kegiatan::where('team_id', $team->id)->first()->sesi()->first();
    $urutans = $sesi->rundown()->orderBy('urutan')->pluck('urutan')->toArray();

    // Harus 1, 2 â€” bukan 1, 3
    expect($urutans)->toBe([1, 2]);
});
