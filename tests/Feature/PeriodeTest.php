<?php

use App\Enums\GlobalRole;
use App\Enums\TeamRole;
use App\Models\AnggotaPeriode;
use App\Models\Artikel;
use App\Models\Kegiatan;
use App\Models\Periode;
use App\Models\Team;
use App\Models\User;

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

    $this->anggota = User::factory()->create([
        'role' => GlobalRole::Anggota,
        'current_team_id' => $this->team->id,
    ]);
    $this->team->members()->attach($this->anggota->id, ['role' => TeamRole::Member->value]);

    $this->periode = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2026/2027',
        'is_aktif' => true,
        'created_by' => $this->superAdmin->id,
    ]);

    $this->pengurus->forceFill(['current_periode_id' => $this->periode->id])->save();
    $this->anggota->forceFill(['current_periode_id' => $this->periode->id])->save();

    AnggotaPeriode::create([
        'user_id' => $this->pengurus->id,
        'periode_id' => $this->periode->id,
        'status' => 'aktif',
    ]);
});

test('super admin can create a new periode', function () {
    $response = $this->actingAs($this->superAdmin)
        ->post("/{$this->team->slug}/periodes", [
            'nama' => '2027/2028',
            'tanggal_mulai' => '2027-01-01',
            'tanggal_selesai' => '2027-12-31',
            'is_aktif' => false,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('periodes', [
        'team_id' => $this->team->id,
        'nama' => '2027/2028',
    ]);
});

test('pembina can create a new periode', function () {
    $response = $this->actingAs($this->pembina)
        ->post("/{$this->team->slug}/periodes", [
            'nama' => '2027/2028',
            'tanggal_mulai' => '2027-01-01',
            'tanggal_selesai' => '2027-12-31',
            'is_aktif' => false,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('periodes', [
        'team_id' => $this->team->id,
        'nama' => '2027/2028',
    ]);
});

test('pengurus cannot create a new periode', function () {
    $response = $this->actingAs($this->pengurus)
        ->post("/{$this->team->slug}/periodes", [
            'nama' => '2027/2028',
            'tanggal_mulai' => '2027-01-01',
            'tanggal_selesai' => '2027-12-31',
        ]);

    $response->assertForbidden();
});

test('anggota cannot create a new periode', function () {
    $response = $this->actingAs($this->anggota)
        ->post("/{$this->team->slug}/periodes", [
            'nama' => '2027/2028',
            'tanggal_mulai' => '2027-01-01',
            'tanggal_selesai' => '2027-12-31',
        ]);

    $response->assertForbidden();
});

test('user can switch active viewing periode', function () {
    $periodeBaru = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2027/2028',
        'created_by' => $this->superAdmin->id,
    ]);

    $response = $this->actingAs($this->pengurus)
        ->patch("/{$this->team->slug}/switch-periode/{$periodeBaru->id}");

    $response->assertRedirect();
    expect($this->pengurus->fresh()->current_periode_id)->toEqual($periodeBaru->id);
});

test('pembina cannot write activities', function () {
    $response = $this->actingAs($this->pembina)
        ->post("/{$this->team->slug}/pengurus/kegiatan", [
            'nama' => 'Kegiatan Baru Pembina',
            'tipe' => 'tertutup',
            'sesi' => [
                [
                    'tanggal' => '2026-06-01',
                    'waktu_mulai' => '08:00',
                    'waktu_selesai' => '12:00',
                    'lokasi' => 'Aula',
                ],
            ],
        ]);

    $response->assertForbidden();
});

test('pembina cannot be assigned to kepanitiaan', function () {
    $kegiatan = Kegiatan::factory()->create([
        'team_id' => $this->team->id,
        'periode_id' => $this->periode->id,
    ]);

    $response = $this->actingAs($this->pengurus)
        ->post("/{$this->team->slug}/kegiatan/{$kegiatan->id}/divisi", [
            'user_id' => $this->pembina->id,
            'jabatan' => 'ketua_pelaksana',
        ]);

    $response->assertSessionHasErrors('user_id');
});

test('super admin and pembina are excluded from anggota index list', function () {
    $response = $this->actingAs($this->pengurus)
        ->get("/{$this->team->slug}/pengurus/anggota");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('pengurus/anggota/index')
        ->has('anggota')
        ->where('anggota', fn ($anggota) => collect($anggota)->pluck('id')->doesntContain($this->superAdmin->id) &&
            collect($anggota)->pluck('id')->doesntContain($this->pembina->id)
        )
    );
});

test('anggota store registers existing user to active period without duplicating user', function () {
    $existingUser = User::factory()->create([
        'name' => 'Alumni Kembali',
        'nim' => '240414999',
        'email' => 'kembali@hmif.com',
        'role' => GlobalRole::Anggota,
    ]);

    $initialUserCount = User::count();

    $response = $this->actingAs($this->pengurus)
        ->post("/{$this->team->slug}/pengurus/anggota", [
            'name' => 'Alumni Kembali',
            'nim' => '240414999',
            'email' => 'kembali@hmif.com',
            'jabatan' => 'Staff Humas',
        ]);

    $response->assertRedirect();
    expect(User::count())->toEqual($initialUserCount);

    $this->assertDatabaseHas('anggota_periode', [
        'user_id' => $existingUser->id,
        'periode_id' => $this->periode->id,
        'jabatan' => 'Staff Humas',
    ]);
});

test('pembina is forbidden when accessing create, edit, or destroy routes for kegiatan and artikel', function () {
    $kegiatan = Kegiatan::factory()->create([
        'team_id' => $this->team->id,
        'periode_id' => $this->periode->id,
    ]);

    $artikel = Artikel::create([
        'team_id' => $this->team->id,
        'author_id' => $this->pengurus->id,
        'judul' => 'Judul Uji',
        'slug' => 'judul-uji',
        'ringkasan' => 'Ringkasan uji',
        'konten' => 'Konten uji',
        'status' => 'draft',
    ]);

    // Kegiatan create & edit routes
    $this->actingAs($this->pembina)
        ->get("/{$this->team->slug}/pengurus/kegiatan/create")
        ->assertForbidden();

    $this->actingAs($this->pembina)
        ->get("/{$this->team->slug}/pengurus/kegiatan/{$kegiatan->id}/edit")
        ->assertForbidden();

    $this->actingAs($this->pembina)
        ->delete("/{$this->team->slug}/pengurus/kegiatan/{$kegiatan->id}")
        ->assertForbidden();

    // Artikel create & edit routes
    $this->actingAs($this->pembina)
        ->get("/{$this->team->slug}/pengurus/artikel/create")
        ->assertForbidden();

    $this->actingAs($this->pembina)
        ->get("/{$this->team->slug}/pengurus/artikel/{$artikel->id}/edit")
        ->assertForbidden();

    $this->actingAs($this->pembina)
        ->delete("/{$this->team->slug}/pengurus/artikel/{$artikel->id}")
        ->assertForbidden();
});

test('pengurus on archived past period cannot access create, edit, or destroy routes', function () {
    $periodeLama = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2024/2025',
        'is_aktif' => false,
        'created_by' => $this->superAdmin->id,
    ]);

    // Make sure $this->periode is the latest and active
    $this->periode->update(['is_aktif' => true]);

    $kegiatanLama = Kegiatan::factory()->create([
        'team_id' => $this->team->id,
        'periode_id' => $periodeLama->id,
    ]);

    // Switch pengurus to archived period
    $this->pengurus->forceFill(['current_periode_id' => $periodeLama->id])->save();

    // Accessing create and edit routes should be blocked directly with 403
    $this->actingAs($this->pengurus)
        ->get("/{$this->team->slug}/pengurus/kegiatan/create")
        ->assertForbidden();

    $this->actingAs($this->pengurus)
        ->get("/{$this->team->slug}/pengurus/kegiatan/{$kegiatanLama->id}/edit")
        ->assertForbidden();

    $this->actingAs($this->pengurus)
        ->delete("/{$this->team->slug}/pengurus/kegiatan/{$kegiatanLama->id}")
        ->assertForbidden();
});

test('periode baru dimulai dalam keadaan kosong tanpa auto-copy anggota dari periode sebelumnya', function () {
    // 1. Tambah anggota ke periode aktif yang sedang berjalan
    $anggota = User::factory()->create([
        'role' => GlobalRole::Anggota,
        'current_team_id' => $this->team->id,
        'current_periode_id' => $this->periode->id,
    ]);
    $this->team->members()->attach($anggota->id, ['role' => TeamRole::Member->value]);

    AnggotaPeriode::create([
        'user_id' => $anggota->id,
        'periode_id' => $this->periode->id,
        'jabatan' => 'Staff',
        'status' => 'aktif',
    ]);

    expect(AnggotaPeriode::where('periode_id', $this->periode->id)->count())->toBe(2);

    // 2. Buat periode baru lewat endpoint
    $response = $this->actingAs($this->superAdmin)
        ->post("/{$this->team->slug}/periodes", [
            'nama' => '2028/2029',
            'tanggal_mulai' => '2028-01-01',
            'tanggal_selesai' => '2028-12-31',
            'is_aktif' => true,
        ]);

    $response->assertRedirect();

    $periodeBaru = Periode::where('nama', '2028/2029')->first();
    expect($periodeBaru)->not->toBeNull();

    // 3. Pastikan tidak ada row anggota_periode yang disalin ke periode baru
    $anggotaPeriodeBaru = AnggotaPeriode::where('periode_id', $periodeBaru->id)->get();
    expect($anggotaPeriodeBaru)->toBeEmpty();

    // 4. Pastikan listing anggota di periode baru kosong
    $this->superAdmin->fresh()->switchPeriode($periodeBaru);

    $response = $this->actingAs($this->superAdmin)
        ->get("/{$this->team->slug}/pengurus/anggota");

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('pengurus/anggota/index')
        ->has('anggota', 0)
    );
});
