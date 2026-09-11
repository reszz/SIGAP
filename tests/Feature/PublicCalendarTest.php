<?php

use App\Models\Kegiatan;
use App\Models\Sesi;
use App\Models\Team;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(fn () => $this->withoutVite());

// ─── Helper: buat team non-personal (primary) ─────────────────────────────────

function primaryTeam(): Team
{
    return Team::factory()->create(['is_personal' => false]);
}

// ─── 1. Akses tanpa auth ──────────────────────────────────────────────────────

test('halaman kalender publik dapat diakses tanpa login', function () {
    $this->get(route('kalender.publik'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('kalender-publik/index'));
});

test('halaman kalender publik mengembalikan props yang diperlukan', function () {
    $this->get(route('kalender.publik'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('kalender-publik/index')
            ->has('sesi')
            ->has('bulan')
            ->has('tahun')
            ->has('defaultDate')
        );
});

// ─── 2. Data yang dikembalikan hanya field aman ───────────────────────────────

test('props sesi hanya berisi field yang diizinkan — tidak ada data sensitif', function () {
    $team = primaryTeam();
    $kegiatan = Kegiatan::factory()->for($team)->create([
        'nama' => 'Seminar Nasional',
        'deskripsi' => 'Deskripsi seminar yang sangat panjang dan informatif tentang topik tertentu.',
        'warna' => '#4A5FD1',
    ]);
    Sesi::factory()->for($kegiatan)->create([
        'tanggal' => now()->format('Y-m-d'),
        'waktu_mulai' => '08:00:00',
        'waktu_selesai' => '12:00:00',
        'lokasi' => 'Aula Utama',
    ]);

    $response = $this->get(route('kalender.publik', [
        'bulan' => now()->month,
        'tahun' => now()->year,
    ]));

    $response->assertOk();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('kalender-publik/index')
        ->has('sesi', 1, fn (Assert $item) => $item
            ->has('tanggal')
            ->has('nama_kegiatan')
            ->has('waktu_mulai')
            ->has('waktu_selesai')
            ->has('lokasi')
            ->has('warna')
            ->has('deskripsi')
            // Memastikan field sensitif TIDAK ada sama sekali
            ->missing('rundown')
            ->missing('panitia')
            ->missing('anggaran')
            ->missing('rsvp')
            ->missing('evaluasi')
            ->missing('dokumentasi')
            ->missing('surat')
            ->missing('kode_presensi')
            ->missing('id')
            ->missing('kegiatan_id')
        )
    );
});

// ─── 3. Navigasi bulan via query param ───────────────────────────────────────

test('navigasi bulan via query param berfungsi dengan benar', function () {
    $this->get('/kalender?bulan=6&tahun=2025')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('kalender-publik/index')
            ->where('bulan', 6)
            ->where('tahun', 2025)
        );
});

test('query param bulan di-clamp ke 1-12', function () {
    $this->get('/kalender?bulan=99&tahun=2025')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('bulan', 12)
        );

    $this->get('/kalender?bulan=-5&tahun=2025')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('bulan', 1)
        );
});

// ─── 4. Sesi hanya dari team utama ───────────────────────────────────────────

test('sesi yang ditampilkan hanya berasal dari team utama bukan team lain', function () {
    $primaryTeam = primaryTeam();
    $otherTeam = Team::factory()->create(['is_personal' => false]);

    $kegiatanPrimary = Kegiatan::factory()->for($primaryTeam)->create(['nama' => 'Kegiatan Primary']);
    $kegiatanOther = Kegiatan::factory()->for($otherTeam)->create(['nama' => 'Kegiatan Other']);

    Sesi::factory()->for($kegiatanPrimary)->create(['tanggal' => now()->format('Y-m-d')]);
    Sesi::factory()->for($kegiatanOther)->create(['tanggal' => now()->format('Y-m-d')]);

    $this->get(route('kalender.publik', ['bulan' => now()->month, 'tahun' => now()->year]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->has('sesi', 1)
            ->where('sesi.0.nama_kegiatan', 'Kegiatan Primary')
        );
});

// ─── 5. defaultDate: kegiatan mendatang terdekat ─────────────────────────────

test('defaultDate menunjuk kegiatan mendatang terdekat', function () {
    $team = primaryTeam();
    $kegiatan = Kegiatan::factory()->for($team)->create();

    // Gunakan awal bulan + 3 hari agar selalu di bulan yang sama,
    // lalu pastikan tanggal tersebut >= hari ini (kalau sudah lewat, pakai hari ini + 1 jika memungkinkan)
    $bulanIni = now()->month;
    $tahunIni = now()->year;
    $candidate = now()->startOfMonth()->addDays(3)->startOfDay();
    // Jika candidate sudah lewat (misal hari ini tanggal 10), geser ke besok jika masih dalam bulan
    if ($candidate->lt(now()) && $candidate->copy()->addDay()->month === $bulanIni) {
        $candidate = now()->addDay()->startOfDay();
    }
    // Jika masih dalam bulan, gunakan; jika tidak (ujung bulan), skip test
    if ($candidate->month !== $bulanIni) {
        $this->markTestSkipped('Tanggal mendatang tidak tersedia di bulan ini (end-of-month edge case).');
    }

    $futureDate = $candidate->format('Y-m-d');
    Sesi::factory()->for($kegiatan)->create([
        'tanggal' => $futureDate,
        'waktu_mulai' => '09:00:00',
        'waktu_selesai' => '11:00:00',
    ]);

    $this->get(route('kalender.publik', ['bulan' => $bulanIni, 'tahun' => $tahunIni]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('defaultDate', $futureDate)
        );
});

test('defaultDate null jika tidak ada sesi mendatang di bulan ini', function () {
    $team = primaryTeam();
    $kegiatan = Kegiatan::factory()->for($team)->create();

    // Sesi yang sudah lewat di bulan ini
    $pastDate = now()->subDays(10)->format('Y-m-d');
    Sesi::factory()->for($kegiatan)->create([
        'tanggal' => $pastDate,
    ]);

    $this->get(route('kalender.publik', ['bulan' => now()->month, 'tahun' => now()->year]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('defaultDate', null)
        );
});

// ─── 6. Deskripsi dipotong maks 100 karakter ─────────────────────────────────

test('deskripsi dipotong maksimal 100 karakter', function () {
    $team = primaryTeam();
    $longDesc = str_repeat('a', 200);
    $kegiatan = Kegiatan::factory()->for($team)->create(['deskripsi' => $longDesc]);
    Sesi::factory()->for($kegiatan)->create(['tanggal' => now()->format('Y-m-d')]);

    $this->get(route('kalender.publik', ['bulan' => now()->month, 'tahun' => now()->year]))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('sesi.0.deskripsi', str_repeat('a', 100))
        );
});
