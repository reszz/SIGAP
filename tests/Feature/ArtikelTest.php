<?php

use App\Models\Artikel;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => $this->withoutVite());

function artikelBuatUser(string $role, Team $team): User
{
    $user = User::factory()->create(['role' => $role]);
    $pivotRole = $role === 'pengurus' ? 'owner' : 'member';
    $team->members()->attach($user, ['role' => $pivotRole]);
    $user->switchTeam($team);

    return $user;
}

// ─── 1. Otorisasi Pengurus vs Anggota ─────────────────────────────────────────

test('pengurus dapat mengakses halaman index kelola artikel', function () {
    $team = Team::factory()->create();
    $pengurus = artikelBuatUser('pengurus', $team);

    $this->actingAs($pengurus)
        ->get("/{$team->slug}/pengurus/artikel")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('pengurus/artikel/index'));
});

test('anggota tidak boleh mengakses panel kelola artikel pengurus', function () {
    $team = Team::factory()->create();
    $anggota = artikelBuatUser('anggota', $team);

    $this->actingAs($anggota)
        ->get("/{$team->slug}/pengurus/artikel")
        ->assertForbidden();
});

// ─── 2. Pembuatan Artikel (Draft & Terbit) ───────────────────────────────────

test('pengurus dapat membuat artikel berstatus draft', function () {
    $team = Team::factory()->create();
    $pengurus = artikelBuatUser('pengurus', $team);

    $response = $this->actingAs($pengurus)
        ->post("/{$team->slug}/pengurus/artikel", [
            'judul' => 'Kabar Gembira HMIF Baru',
            'ringkasan' => 'Ini adalah ringkasan kabar gembira.',
            'konten' => 'Isi lengkap artikel kabar gembira.',
            'status' => 'draft',
        ]);

    $response->assertRedirect("/{$team->slug}/pengurus/artikel");

    $this->assertDatabaseHas('artikel', [
        'team_id' => $team->id,
        'judul' => 'Kabar Gembira HMIF Baru',
        'slug' => 'kabar-gembira-hmif-baru',
        'status' => 'draft',
        'ditulis_oleh' => $pengurus->id,
    ]);
});

test('pengurus dapat membuat artikel langsung terbit dan waktu terbit terisi otomatis', function () {
    $team = Team::factory()->create();
    $pengurus = artikelBuatUser('pengurus', $team);

    $response = $this->actingAs($pengurus)
        ->post("/{$team->slug}/pengurus/artikel", [
            'judul' => 'Peluncuran Website Resmi SIGAP',
            'ringkasan' => 'Website resmi SIGAP telah diluncurkan.',
            'konten' => 'Berita peluncuran website resmi SIGAP dengan fitur lengkap.',
            'status' => 'terbit',
        ]);

    $response->assertRedirect("/{$team->slug}/pengurus/artikel");

    $artikel = Artikel::where('judul', 'Peluncuran Website Resmi SIGAP')->first();
    expect($artikel)->not->toBeNull();
    expect($artikel->status)->toBe('terbit');
    expect($artikel->diterbitkan_pada)->not->toBeNull();
});

// ─── 3. Auto Generate Unique Slug ─────────────────────────────────────────────

test('slug auto generate unik dan menambahkan angka jika terjadi duplikasi', function () {
    $team = Team::factory()->create();
    $pengurus = artikelBuatUser('pengurus', $team);

    // Artikel 1
    $this->actingAs($pengurus)->post("/{$team->slug}/pengurus/artikel", [
        'judul' => 'Seminar Teknologi Nasional',
        'ringkasan' => 'Ringkasan seminar 1',
        'konten' => 'Konten seminar 1',
        'status' => 'terbit',
    ]);

    // Artikel 2 dengan judul sama
    $this->actingAs($pengurus)->post("/{$team->slug}/pengurus/artikel", [
        'judul' => 'Seminar Teknologi Nasional',
        'ringkasan' => 'Ringkasan seminar 2',
        'konten' => 'Konten seminar 2',
        'status' => 'draft',
    ]);

    $artikel1 = Artikel::where('ringkasan', 'Ringkasan seminar 1')->first();
    $artikel2 = Artikel::where('ringkasan', 'Ringkasan seminar 2')->first();

    expect($artikel1->slug)->toBe('seminar-teknologi-nasional');
    expect($artikel2->slug)->toBe('seminar-teknologi-nasional-1');
});

// ─── 4. Upload & Delete Gambar Sampul ─────────────────────────────────────────

test('pengurus dapat mengunggah dan memperbarui gambar sampul artikel', function () {
    Storage::fake('public');

    $team = Team::factory()->create();
    $pengurus = artikelBuatUser('pengurus', $team);

    $file = UploadedFile::fake()->image('cover.jpg', 800, 600);

    $this->actingAs($pengurus)->post("/{$team->slug}/pengurus/artikel", [
        'judul' => 'Artikel Bergambar',
        'ringkasan' => 'Ringkasan artikel bergambar',
        'konten' => 'Konten artikel bergambar',
        'status' => 'terbit',
        'gambar_sampul' => $file,
    ]);

    $artikel = Artikel::where('judul', 'Artikel Bergambar')->first();
    expect($artikel->gambar_sampul)->not->toBeNull();
    Storage::disk('public')->assertExists($artikel->gambar_sampul);

    // Update artikel
    $newFile = UploadedFile::fake()->image('new_cover.png', 800, 600);
    $oldPath = $artikel->gambar_sampul;

    $this->actingAs($pengurus)->patch("/{$team->slug}/pengurus/artikel/{$artikel->id}", [
        'judul' => 'Artikel Bergambar Diperbarui',
        'ringkasan' => 'Ringkasan diperbarui',
        'konten' => 'Konten diperbarui',
        'status' => 'terbit',
        'gambar_sampul' => $newFile,
    ]);

    $artikel->refresh();
    expect($artikel->judul)->toBe('Artikel Bergambar Diperbarui');
    Storage::disk('public')->assertMissing($oldPath);
    Storage::disk('public')->assertExists($artikel->gambar_sampul);

    // Hapus artikel
    $currentPath = $artikel->gambar_sampul;
    $this->actingAs($pengurus)->delete("/{$team->slug}/pengurus/artikel/{$artikel->id}");

    $this->assertDatabaseMissing('artikel', ['id' => $artikel->id]);
    Storage::disk('public')->assertMissing($currentPath);
});

// ─── 5. Halaman Publik /blog dan Filter Status ────────────────────────────────

test('halaman publik /blog hanya menampilkan artikel berstatus terbit', function () {
    $team = Team::factory()->create();

    $artikelTerbit = Artikel::factory()->terbit()->create([
        'team_id' => $team->id,
        'judul' => 'Artikel Publik Yang Terbit',
    ]);

    $artikelDraft = Artikel::factory()->draft()->create([
        'team_id' => $team->id,
        'judul' => 'Artikel Rahasia Draft',
    ]);

    $response = $this->get('/blog');
    $response->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/index')
            ->has('articles.data', 1)
            ->where('articles.data.0.judul', 'Artikel Publik Yang Terbit')
        );
});

// ─── 6. Halaman Publik /blog/{slug} dan Keamanan Draft ────────────────────────

test('artikel terbit dapat diakses melalui slug di halaman publik', function () {
    $team = Team::factory()->create();

    $artikel = Artikel::factory()->terbit()->create([
        'team_id' => $team->id,
        'judul' => 'Liputan Workshop AI 2026',
        'slug' => 'liputan-workshop-ai-2026',
    ]);

    $this->get("/blog/{$artikel->slug}")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('blog/show')
            ->where('artikel.judul', 'Liputan Workshop AI 2026')
        );
});

test('artikel draft mengembalikan 404 jika diakses langsung lewat slug publik', function () {
    $team = Team::factory()->create();

    $artikelDraft = Artikel::factory()->draft()->create([
        'team_id' => $team->id,
        'judul' => 'Artikel Bocoran Draft',
        'slug' => 'artikel-bocoran-draft',
    ]);

    // TIDAK BOLEH membocorkan draft ke publik
    $this->get("/blog/{$artikelDraft->slug}")
        ->assertNotFound();
});

test('slug yang tidak ada mengembalikan 404', function () {
    $this->get('/blog/slug-yang-sama-sekali-tidak-ada')
        ->assertNotFound();
});
