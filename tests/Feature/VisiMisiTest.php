<?php

use App\Enums\GlobalRole;
use App\Enums\TeamRole;
use App\Models\AnggotaPeriode;
use App\Models\MisiPoin;
use App\Models\Periode;
use App\Models\Team;
use App\Models\User;
use App\Models\VisiMisi;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    $this->withoutVite();

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

    $this->anggota = User::factory()->create([
        'role' => GlobalRole::Anggota,
        'current_team_id' => $this->team->id,
    ]);
    $this->team->members()->attach($this->anggota->id, ['role' => TeamRole::Member->value]);

    // Periode 1: Periode Lama (Arsip)
    $this->periodeLama = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2025/2026',
        'tanggal_mulai' => '2025-01-01',
        'tanggal_selesai' => '2025-12-31',
        'is_aktif' => false,
        'created_by' => $this->superAdmin->id,
    ]);

    // Periode 2: Periode Aktif
    $this->periodeAktif = Periode::factory()->create([
        'team_id' => $this->team->id,
        'nama' => '2026/2027',
        'tanggal_mulai' => '2026-01-01',
        'tanggal_selesai' => '2026-12-31',
        'is_aktif' => true,
        'created_by' => $this->superAdmin->id,
    ]);

    $this->pengurus->update(['current_periode_id' => $this->periodeAktif->id]);
    $this->superAdmin->update(['current_periode_id' => $this->periodeAktif->id]);
    $this->pembina->update(['current_periode_id' => $this->periodeAktif->id]);
    $this->anggota->update(['current_periode_id' => $this->periodeAktif->id]);

    AnggotaPeriode::create([
        'user_id' => $this->pengurus->id,
        'periode_id' => $this->periodeAktif->id,
        'status' => 'aktif',
    ]);
});

// ─── 1. Endpoint Publik & Logika Fallback ──────────────────────────────────────

test('halaman visi & misi publik dapat diakses tanpa login dan memuat data periode aktif', function () {
    $visiMisi = VisiMisi::create([
        'periode_id' => $this->periodeAktif->id,
        'visi' => 'Menjadi himpunan mahasiswa yang unggul dan inovatif.',
    ]);

    MisiPoin::create([
        'visi_misi_id' => $visiMisi->id,
        'isi' => 'Meningkatkan kompetensi anggota.',
        'urutan' => 1,
    ]);

    $this->get('/profil/visi-misi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profil/visi-misi')
            ->has('visiMisi')
            ->where('visiMisi.visi', 'Menjadi himpunan mahasiswa yang unggul dan inovatif.')
            ->has('visiMisi.misi', 1)
            ->where('visiMisi.misi.0.isi', 'Meningkatkan kompetensi anggota.')
        );
});

test('logika fallback bekerja mundur ke periode sebelumnya jika periode aktif belum punya visi-misi', function () {
    // Buat data Visi & Misi hanya di periode lama
    $visiMisiLama = VisiMisi::create([
        'periode_id' => $this->periodeLama->id,
        'visi' => 'Visi dari periode kepengurusan lama.',
    ]);

    MisiPoin::create([
        'visi_misi_id' => $visiMisiLama->id,
        'isi' => 'Misi dari periode kepengurusan lama.',
        'urutan' => 1,
    ]);

    // Periode aktif sengaja belum memiliki visi_misi
    $this->assertDatabaseMissing('visi_misi', ['periode_id' => $this->periodeAktif->id]);

    $this->get('/profil/visi-misi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profil/visi-misi')
            ->has('visiMisi')
            ->where('visiMisi.visi', 'Visi dari periode kepengurusan lama.')
            ->where('visiMisi.periode.nama', '2025/2026')
            ->has('visiMisi.misi', 1)
            ->where('visiMisi.misi.0.isi', 'Misi dari periode kepengurusan lama.')
        );
});

test('halaman publik menampilkan null saat tidak ada periode yang memiliki data visi-misi', function () {
    VisiMisi::query()->delete();

    $this->get('/profil/visi-misi')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('profil/visi-misi')
            ->where('visiMisi', null)
        );
});

// ─── 2. Panel Pengurus: Hak Akses & Operasional Periode Aktif ──────────────────

test('pengurus dapat mengakses halaman kelola visi & misi pada periode aktif', function () {
    $this->actingAs($this->pengurus)
        ->get("/{$this->team->slug}/pengurus/visi-misi")
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('pengurus/visi-misi/index')
            ->where('canManage', true)
            ->where('isReadOnly', false)
            ->where('currentPeriode.nama', '2026/2027')
        );
});

test('pengurus dapat memperbarui teks visi pada periode aktif', function () {
    $response = $this->actingAs($this->pengurus)
        ->put("/{$this->team->slug}/pengurus/visi-misi", [
            'visi' => 'Rumusan visi baru untuk periode aktif 2026/2027.',
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('visi_misi', [
        'periode_id' => $this->periodeAktif->id,
        'visi' => 'Rumusan visi baru untuk periode aktif 2026/2027.',
    ]);
});

test('pengurus dapat menambah, mengedit, menghapus, dan mereorder poin misi pada periode aktif', function () {
    $visiMisi = VisiMisi::create([
        'periode_id' => $this->periodeAktif->id,
        'visi' => 'Visi aktif.',
    ]);

    // 1. Tambah poin misi
    $response = $this->actingAs($this->pengurus)
        ->post("/{$this->team->slug}/pengurus/visi-misi/misi", [
            'isi' => 'Poin misi nomor satu.',
        ]);
    $response->assertRedirect();

    $this->assertDatabaseHas('misi_poin', [
        'visi_misi_id' => $visiMisi->id,
        'isi' => 'Poin misi nomor satu.',
        'urutan' => 1,
    ]);

    $misi1 = MisiPoin::where('isi', 'Poin misi nomor satu.')->firstOrFail();

    // 2. Tambah poin misi kedua
    $this->actingAs($this->pengurus)
        ->post("/{$this->team->slug}/pengurus/visi-misi/misi", [
            'isi' => 'Poin misi nomor dua.',
        ])
        ->assertRedirect();

    $misi2 = MisiPoin::where('isi', 'Poin misi nomor dua.')->firstOrFail();
    expect($misi2->urutan)->toBe(2);

    // 3. Edit poin misi
    $this->actingAs($this->pengurus)
        ->patch("/{$this->team->slug}/pengurus/visi-misi/misi/{$misi1->id}", [
            'isi' => 'Poin misi nomor satu yang telah diedit.',
        ])
        ->assertRedirect();

    expect($misi1->fresh()->isi)->toBe('Poin misi nomor satu yang telah diedit.');

    // 4. Reorder poin misi
    $this->actingAs($this->pengurus)
        ->post("/{$this->team->slug}/pengurus/visi-misi/misi/reorder", [
            'poin_ids' => [$misi2->id, $misi1->id],
        ])
        ->assertRedirect();

    expect($misi2->fresh()->urutan)->toBe(1);
    expect($misi1->fresh()->urutan)->toBe(2);

    // 5. Hapus poin misi
    $this->actingAs($this->pengurus)
        ->delete("/{$this->team->slug}/pengurus/visi-misi/misi/{$misi2->id}")
        ->assertRedirect();

    $this->assertDatabaseMissing('misi_poin', ['id' => $misi2->id]);
    // Sisa poin misi otomatis di-resequence urutannya menjadi 1
    expect($misi1->fresh()->urutan)->toBe(1);
});

// ─── 3. Proteksi Read-Only Periode Arsip & Otorisasi Role ──────────────────────

test('mencoba update visi pada periode lampau (arsip) ditolak 403 bahkan untuk super admin', function () {
    // Switch super admin ke periode lama
    $this->superAdmin->update(['current_periode_id' => $this->periodeLama->id]);

    $response = $this->actingAs($this->superAdmin)
        ->put("/{$this->team->slug}/pengurus/visi-misi", [
            'visi' => 'Mencoba merubah arsip lama.',
        ]);

    $response->assertForbidden();
});

test('mencoba menambah poin misi pada periode lampau (arsip) ditolak 403 bahkan untuk super admin', function () {
    // Switch super admin ke periode lama
    $this->superAdmin->update(['current_periode_id' => $this->periodeLama->id]);

    $response = $this->actingAs($this->superAdmin)
        ->post("/{$this->team->slug}/pengurus/visi-misi/misi", [
            'isi' => 'Mencoba tambah poin misi pada periode lampau.',
        ]);

    $response->assertForbidden();
});

test('role pembina ditolak 403 saat mencoba mengubah visi atau misi (read-only)', function () {
    $this->actingAs($this->pembina)
        ->put("/{$this->team->slug}/pengurus/visi-misi", [
            'visi' => 'Upaya ubah oleh pembina.',
        ])
        ->assertForbidden();

    $this->actingAs($this->pembina)
        ->post("/{$this->team->slug}/pengurus/visi-misi/misi", [
            'isi' => 'Upaya tambah misi oleh pembina.',
        ])
        ->assertForbidden();
});

test('role anggota ditolak mengakses halaman kelola visi-misi', function () {
    $this->actingAs($this->anggota)
        ->get("/{$this->team->slug}/pengurus/visi-misi")
        ->assertForbidden();
});

test('validasi input menolak visi kosong dan teks poin misi kosong', function () {
    $this->actingAs($this->pengurus)
        ->put("/{$this->team->slug}/pengurus/visi-misi", [
            'visi' => '',
        ])
        ->assertSessionHasErrors('visi');

    $this->actingAs($this->pengurus)
        ->post("/{$this->team->slug}/pengurus/visi-misi/misi", [
            'isi' => '',
        ])
        ->assertSessionHasErrors('isi');
});
