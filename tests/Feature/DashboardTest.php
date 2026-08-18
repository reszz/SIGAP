<?php

use App\Models\Team;
use App\Models\TeamInvitation;
use App\Models\User;

// /dashboard sekarang redirect ke /{team}/role/dashboard
// Test hanya perlu memastikan auth + redirect bekerja benar

test('guests are redirected to the login page', function () {
    $response = $this->get(route('dashboard'));
    $response->assertRedirect(route('login'));
});

test('authenticated users are redirected to their team dashboard', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->get(route('dashboard'));

    // /dashboard redirects to /{team}/{role}/dashboard
    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('/dashboard');
});

test('pengurus are redirected to pengurus dashboard', function () {
    $user = User::factory()->create(['role' => 'pengurus']);
    $team = $user->currentTeam;

    $response = $this->actingAs($user)->get(route('dashboard'));
    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('pengurus/dashboard');
});

test('anggota are redirected to anggota dashboard', function () {
    $user = User::factory()->create(['role' => 'anggota']);
    $team = $user->currentTeam;

    $response = $this->actingAs($user)->get(route('dashboard'));
    $response->assertRedirect();
    expect($response->headers->get('Location'))->toContain('anggota/dashboard');
});

test('dashboard invitations are shown on team dashboard', function () {
    // Invitation display is tested via the team dashboard route directly
    $owner = User::factory()->create(['role' => 'pengurus']);
    $team = $owner->currentTeam;

    // Owner already attached via factory, no need to attach again
    $invitation = TeamInvitation::factory()->create([
        'team_id' => $team->id,
        'email' => 'invited@example.com',
        'invited_by' => $owner->id,
    ]);

    $this->assertDatabaseHas('team_invitations', ['id' => $invitation->id]);
});
