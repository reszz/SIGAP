<?php

use App\Enums\GlobalRole;
use App\Enums\TeamRole;
use App\Models\DivisiOrganisasi;
use App\Models\Periode;
use App\Models\Team;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->team = Team::factory()->create(['name' => 'HMIF', 'slug' => 'hmif']);

    $this->superAdmin = User::factory()->create([
        'role' => GlobalRole::SuperAdmin,
        'current_team_id' => $this->team->id,
    ]);

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

    $this->periode1 = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2026/2027',
        'is_aktif' => true,
        'created_by' => $this->superAdmin->id,
    ]);

    $this->periode2 = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2027-2028',
        'is_aktif' => false,
        'created_by' => $this->superAdmin->id,
    ]);

    $this->divisi = DivisiOrganisasi::create([
        'team_id' => $this->team->id,
        'nama_divisi' => 'Divisi Kominfo',
        'urutan_tampil' => 1,
    ]);
});

test('struktur organisasi loads all existing periodes from periodes table', function () {
    $response = $this->actingAs($this->pengurus)
        ->get("/{$this->team->slug}/pengurus/struktur-organisasi");

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('pengurus/struktur-organisasi/index')
        ->has('periodeList')
        ->where('periodeList', fn ($list) => $list->contains('2026/2027') && $list->contains('2027-2028'))
    );
});

test('super admin bypasses all authorization checks and can access pengurus routes without explicit team membership', function () {
    $outsideTeam = Team::factory()->create(['name' => 'BEM', 'slug' => 'bem']);

    $response = $this->actingAs($this->superAdmin)
        ->get("/{$outsideTeam->slug}/pengurus/struktur-organisasi");

    $response->assertOk();
});

test('pembina can add a new anggota into the active periode', function () {
    $response = $this->actingAs($this->pembina)
        ->post("/{$this->team->slug}/pengurus/anggota", [
            'name' => 'Budi Santoso',
            'nim' => '12345678',
            'email' => 'budi@example.com',
            'jabatan' => 'Staff',
            'divisi_organisasi_id' => $this->divisi->id,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('users', [
        'email' => 'budi@example.com',
        'nim' => '12345678',
        'role' => 'anggota',
    ]);
});

test('pembina can update and assign role to an anggota', function () {
    $user = User::factory()->create([
        'role' => GlobalRole::Anggota,
        'current_team_id' => $this->team->id,
    ]);
    $this->team->members()->attach($user->id, ['role' => TeamRole::Member->value]);

    $response = $this->actingAs($this->pembina)
        ->patch("/{$this->team->slug}/pengurus/anggota/{$user->id}/role", [
            'role' => 'pengurus',
        ]);

    $response->assertRedirect();
    expect($user->fresh()->role->value)->toBe('pengurus');
});
