<?php

use App\Models\Team;
use App\Models\User;
use App\Models\Wish;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();
    RateLimiter::clear('wish_wall_submit:127.0.0.1');
});

function wishBuatUser(string $role, Team $team): User
{
    $user = User::factory()->create(['role' => $role]);
    $pivotRole = $role === 'pengurus' ? 'owner' : 'member';
    $team->members()->attach($user, ['role' => $pivotRole]);
    $user->switchTeam($team);

    return $user;
}

// ─── 1. Akses Publik & Tampilan Pesan ─────────────────────────────────────────

test('halaman wish wall dapat diakses publik dan hanya menampilkan wish berstatus tampil', function () {
    $team = Team::factory()->create();

    $wishTampil = Wish::factory()->create([
        'team_id' => $team->id,
        'nama_pengirim' => 'Budi Santoso',
        'pesan' => 'Semangat untuk pengurus baru HMIF!',
        'status' => 'tampil',
    ]);

    $wishHidden = Wish::factory()->disembunyikan()->create([
        'team_id' => $team->id,
        'pesan' => 'Pesan spam tersembunyi',
    ]);

    $response = $this->get('/wish-wall');
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('wish-wall/index')
            ->has('wishes.data', 1)
            ->where('wishes.data.0.pesan', 'Semangat untuk pengurus baru HMIF!')
            ->where('wishes.data.0.nama_tampil', 'Budi Santoso')
            ->missing('wishes.data.0.ip_address') // Pastikan IP address TIDAK bocor ke publik
        );
});

// ─── 2. Kirim Pesan Tanpa Login & Validasi ───────────────────────────────────

test('siapa saja bisa kirim wish tanpa login dan langsung tampil', function () {
    $team = Team::factory()->create();

    $response = $this->post('/wish-wall', [
        'nama_pengirim' => 'Mahasiswa TI 2026',
        'pesan' => 'Semoga program kerja tahun ini berjalan lancar dan sukses!',
    ]);

    $response->assertRedirect();

    $this->assertDatabaseHas('wish', [
        'nama_pengirim' => 'Mahasiswa TI 2026',
        'pesan' => 'Semoga program kerja tahun ini berjalan lancar dan sukses!',
        'status' => 'tampil',
        'jumlah_laporan' => 0,
    ]);
});

test('pengirim tanpa nama otomatis disimpan dan tampil sebagai Anonim', function () {
    $team = Team::factory()->create();

    $response = $this->post('/wish-wall', [
        'nama_pengirim' => '',
        'pesan' => 'Pesan dari pengirim anonim untuk HMIF.',
    ]);

    $response->assertRedirect();

    $wish = Wish::where('pesan', 'Pesan dari pengirim anonim untuk HMIF.')->first();
    expect($wish)->not->toBeNull();
    expect($wish->nama_pengirim)->toBeNull();
    expect($wish->nama_tampil)->toBe('Anonim');
});

test('pesan wajib diisi dan dibatasi maksimal 500 karakter', function () {
    $response = $this->post('/wish-wall', [
        'nama_pengirim' => 'Tester',
        'pesan' => '',
    ]);

    $response->assertSessionHasErrors('pesan');

    $longText = str_repeat('a', 501);
    $responseLong = $this->post('/wish-wall', [
        'nama_pengirim' => 'Tester',
        'pesan' => $longText,
    ]);

    $responseLong->assertSessionHasErrors('pesan');
});

// ─── 3. Proteksi Honeypot Anti-Bot ───────────────────────────────────────────

test('submit yang mengisi honeypot ditolak diam-diam tanpa menyimpan ke database', function () {
    $response = $this->post('/wish-wall', [
        'nama_pengirim' => 'Spam Bot',
        'pesan' => 'Buy cheap meds at http://spamsite.com',
        'website_url' => 'http://honeypot-trap.com', // Honeypot terisi (indikasi bot)
    ]);

    // Respon terlihat sukses ke bot (silent reject)
    $response->assertRedirect();

    $this->assertDatabaseMissing('wish', [
        'pesan' => 'Buy cheap meds at http://spamsite.com',
    ]);
});

// ─── 4. Rate Limiting (Maks 3 Pesan per 10 Menit per IP) ──────────────────────

test('rate limit menolak pengiriman lebih dari 3 pesan dalam 10 menit dari IP yang sama', function () {
    $ip = '192.168.1.100';

    // Submit ke-1, 2, 3 harus berhasil
    for ($i = 1; $i <= 3; $i++) {
        $res = $this->withServerVariables(['REMOTE_ADDR' => $ip])
            ->post('/wish-wall', [
                'pesan' => "Pesan ke-{$i} dari tester",
            ]);
        $res->assertRedirect();
        $res->assertSessionHasNoErrors();
    }

    // Submit ke-4 harus ditolak oleh rate limiter dengan pesan error yang jelas
    $res4 = $this->withServerVariables(['REMOTE_ADDR' => $ip])
        ->post('/wish-wall', [
            'pesan' => 'Pesan ke-4 yang melanggar batas rate limit',
        ]);

    $res4->assertSessionHasErrors('pesan');
    $errors = session('errors')->get('pesan');
    expect($errors[0])->toContain('Terlalu banyak pesan terkirim');

    $this->assertDatabaseMissing('wish', [
        'pesan' => 'Pesan ke-4 yang melanggar batas rate limit',
    ]);
});

// ─── 5. Mekanisme Pelaporan & Auto-Hide Cerdas ────────────────────────────────

test('pengunjung dapat melaporkan pesan dan otomatis disembunyikan setelah 3 laporan', function () {
    $team = Team::factory()->create();
    $wish = Wish::factory()->create([
        'team_id' => $team->id,
        'pesan' => 'Pesan provokatif yang tidak pantas',
        'status' => 'tampil',
        'jumlah_laporan' => 0,
    ]);

    // Laporan 1
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.1'])
        ->post("/wish-wall/{$wish->id}/report")
        ->assertRedirect();

    $wish->refresh();
    expect($wish->jumlah_laporan)->toBe(1);
    expect($wish->status)->toBe('tampil');

    // Laporan 2
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.2'])
        ->post("/wish-wall/{$wish->id}/report")
        ->assertRedirect();

    $wish->refresh();
    expect($wish->jumlah_laporan)->toBe(2);
    expect($wish->status)->toBe('tampil');

    // Laporan 3 (Mencapai ambang batas 3 laporan -> Auto Hide)
    $this->withServerVariables(['REMOTE_ADDR' => '10.0.0.3'])
        ->post("/wish-wall/{$wish->id}/report")
        ->assertRedirect();

    $wish->refresh();
    expect($wish->jumlah_laporan)->toBe(3);
    expect($wish->status)->toBe('disembunyikan');
});

// ─── 6. Panel Moderasi Pengurus ───────────────────────────────────────────────

test('pengurus dapat mengakses panel moderasi wish wall', function () {
    $team = Team::factory()->create();
    $pengurus = wishBuatUser('pengurus', $team);

    $this->actingAs($pengurus)
        ->get("/{$team->slug}/pengurus/wish-wall")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pengurus/wish-wall/index'));
});

test('anggota biasa tidak boleh mengakses panel moderasi wish wall', function () {
    $team = Team::factory()->create();
    $anggota = wishBuatUser('anggota', $team);

    $this->actingAs($anggota)
        ->get("/{$team->slug}/pengurus/wish-wall")
        ->assertForbidden();
});

test('pengurus dapat menyembunyikan dan memulihkan kembali wish', function () {
    $team = Team::factory()->create();
    $pengurus = wishBuatUser('pengurus', $team);
    $wish = Wish::factory()->create([
        'team_id' => $team->id,
        'status' => 'tampil',
        'jumlah_laporan' => 3,
    ]);

    // Sembunyikan
    $this->actingAs($pengurus)
        ->patch("/{$team->slug}/pengurus/wish-wall/{$wish->id}/toggle-status")
        ->assertRedirect();

    $wish->refresh();
    expect($wish->status)->toBe('disembunyikan');

    // Pulihkan kembali
    $this->actingAs($pengurus)
        ->patch("/{$team->slug}/pengurus/wish-wall/{$wish->id}/toggle-status")
        ->assertRedirect();

    $wish->refresh();
    expect($wish->status)->toBe('tampil');
    expect($wish->jumlah_laporan)->toBe(0); // Laporan di-reset saat dipulihkan
});

test('pengurus dapat menghapus wish secara permanen', function () {
    $team = Team::factory()->create();
    $pengurus = wishBuatUser('pengurus', $team);
    $wish = Wish::factory()->create(['team_id' => $team->id]);

    $this->actingAs($pengurus)
        ->delete("/{$team->slug}/pengurus/wish-wall/{$wish->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('wish', ['id' => $wish->id]);
});
