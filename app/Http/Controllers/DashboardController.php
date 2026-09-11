<?php

namespace App\Http\Controllers;

use App\Models\Artikel;
use App\Models\DivisiOrganisasi;
use App\Models\Kegiatan;
use App\Models\Presensi;
use App\Models\Rsvp;
use App\Models\Sesi;
use App\Models\Team;
use App\Models\User;
use App\Models\Wish;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        // Resolve Team aktif dari route param {current_team}
        $currentTeamSlug = $request->route('current_team');
        $team = $currentTeamSlug
            ? Team::where('slug', $currentTeamSlug)->firstOrFail()
            : $user->currentTeam;

        abort_if(! $team, 403, 'User tidak terdaftar di Team mana pun.');

        $props = ($user->isPengurus() || $user->isSuperAdmin() || $user->isPembina())
            ? $this->pengurusProps($team)
            : $this->anggotaProps($user, $team);

        return Inertia::render('dashboard', $props);
    }

    private function pengurusProps(Team $team): array
    {
        $totalKegiatan = Kegiatan::where('team_id', $team->id)->count();
        $totalAnggota = $team->members()->count();
        $totalPresensi = Presensi::whereHas(
            'sesi.kegiatan',
            fn ($q) => $q->where('team_id', $team->id),
        )->count();

        $now = now();
        $kegiatanAktif = Kegiatan::where('team_id', $team->id)
            ->whereHas('sesi', fn ($q) => $q
                ->whereRaw("CONCAT(tanggal, ' ', waktu_mulai) <= ?", [$now->format('Y-m-d H:i:s')])
                ->whereRaw("CONCAT(tanggal, ' ', waktu_selesai) >= ?", [$now->format('Y-m-d H:i:s')]))
            ->count();

        $kegiatanTerbaru = Kegiatan::where('team_id', $team->id)
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Kegiatan $k) => [
                'id' => $k->id,
                'nama' => $k->nama,
                'tipe' => $k->tipe,
                'warna' => $k->warna,
                'created_at' => $k->created_at?->toDateString(),
            ]);

        $kegiatanMendatang = Sesi::with('kegiatan')
            ->whereHas('kegiatan', fn ($q) => $q->where('team_id', $team->id))
            ->whereDate('tanggal', '>=', now())
            ->whereDate('tanggal', '<=', now()->addDays(365))
            ->orderBy('tanggal')
            ->orderBy('waktu_mulai')
            ->limit(5)
            ->get()
            ->map(fn (Sesi $sesi) => [
                'id' => $sesi->id,
                'kegiatanId' => $sesi->kegiatan->id,
                'kegiatanNama' => $sesi->kegiatan->nama,
                'warna' => $sesi->kegiatan->warna,
                'tanggal' => $sesi->tanggal->format('Y-m-d'),
                'waktuMulai' => $sesi->waktu_mulai,
                'lokasi' => $sesi->lokasi,
                'status' => $sesi->status,
                'kegiatanTipe' => $sesi->kegiatan->tipe,
                'rsvpStatus' => null,  // pengurus tidak RSVP
                'kuota' => $sesi->kegiatan->kuota,
                'kuotaTerpakai' => null,
            ]);

        // Rekap kehadiran: satu query aggregated, bukan N+1
        $hadirPerUser = Presensi::selectRaw('user_id, COUNT(*) as jumlah')
            ->whereHas('sesi.kegiatan', fn ($q) => $q->where('team_id', $team->id))
            ->groupBy('user_id')
            ->pluck('jumlah', 'user_id');

        $rekapKehadiran = $team->members()
            ->orderBy('name')
            ->get(['users.id', 'users.name', 'users.nim'])
            ->map(fn ($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'nim' => $u->nim,
                'hadir' => $hadirPerUser[$u->id] ?? 0,
            ])
            ->sortByDesc('hadir')
            ->take(10)
            ->values();

        // Artikel Terbaru
        $artikelTerbaru = Artikel::where('team_id', $team->id)
            ->with('penulis:id,name')
            ->latest()
            ->limit(5)
            ->get(['id', 'judul', 'slug', 'ringkasan', 'gambar_sampul', 'status', 'ditulis_oleh', 'diterbitkan_pada'])
            ->map(fn (Artikel $a) => [
                'id' => $a->id,
                'judul' => $a->judul,
                'slug' => $a->slug,
                'ringkasan' => $a->ringkasan,
                'gambar_sampul' => $a->gambar_sampul,
                'status' => $a->status,
                'penulis' => $a->penulis ? ['id' => $a->penulis->id, 'name' => $a->penulis->name] : null,
                'diterbitkan_pada' => $a->diterbitkan_pada?->toIso8601String(),
            ]);

        // Wishes Pending Moderasi
        $wishesPending = Wish::where('team_id', $team->id)
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get(['id', 'nama_pengirim', 'pesan', 'jumlah_laporan', 'created_at']);
        // nama_tampil & waktu_relatif auto-appended by model

        // Struktur Organisasi Preview
        $strukturOrganisasi = DivisiOrganisasi::where('team_id', $team->id)
            ->withCount('pengurus as jumlah_pengurus')
            ->orderBy('urutan_tampil')
            ->limit(5)
            ->get(['id', 'nama_divisi', 'deskripsi'])
            ->map(fn (DivisiOrganisasi $d) => [
                'id' => $d->id,
                'nama_divisi' => $d->nama_divisi,
                'deskripsi' => $d->deskripsi,
                'jumlah_pengurus' => $d->jumlah_pengurus ?? 0,
            ]);

        return [
            'stats' => [
                'totalKegiatan' => $totalKegiatan,
                'totalAnggota' => $totalAnggota,
                'totalPresensi' => $totalPresensi,
                'kegiatanAktif' => $kegiatanAktif,
                'totalArtikel' => Artikel::where('team_id', $team->id)->count(),
                'wishesPending' => Wish::where('team_id', $team->id)->where('status', 'pending')->count(),
                'totalDivisi' => DivisiOrganisasi::where('team_id', $team->id)->count(),
            ],
            'kegiatanMendatang' => $kegiatanMendatang,
            'kegiatanTerbaru' => $kegiatanTerbaru,
            'rekapKehadiran' => $rekapKehadiran,
            'artikelTerbaru' => $artikelTerbaru,
            'wishesPending' => $wishesPending,
            'strukturOrganisasi' => $strukturOrganisasi,
        ];
    }

    private function anggotaProps(User $user, Team $team): array
    {
        $totalKehadiran = Presensi::where('user_id', $user->id)
            ->whereHas('sesi.kegiatan', fn ($q) => $q->where('team_id', $team->id))
            ->count();

        $rsvpAktif = $user->rsvp()
            ->whereHas('kegiatan', fn ($q) => $q->where('team_id', $team->id))
            ->where('status', 'terdaftar')
            ->count();

        $kegiatanMendatang = Sesi::with([
            'kegiatan.rsvp' => fn ($q) => $q->where('user_id', $user->id),
        ])
            ->whereHas('kegiatan', fn ($q) => $q->where('team_id', $team->id))
            ->whereDate('tanggal', '>=', now())
            ->whereDate('tanggal', '<=', now()->addDays(60))
            // Filter yang salah dihapus total ­— tampilkan SEMUA tipe kegiatan
            ->orderBy('tanggal')
            ->orderBy('waktu_mulai')
            ->limit(5)
            ->get()
            ->map(function (Sesi $sesi) {
                $kegiatan = $sesi->kegiatan;
                $rsvpSaya = $kegiatan->rsvp->first(); // sudah di-eager-load, filtered ke user ini

                return [
                    'id' => $sesi->id,
                    'kegiatanId' => $kegiatan->id,
                    'kegiatanNama' => $kegiatan->nama,
                    'warna' => $kegiatan->warna,
                    'tanggal' => $sesi->tanggal->format('Y-m-d'),
                    'waktuMulai' => $sesi->waktu_mulai,
                    'lokasi' => $sesi->lokasi,
                    'status' => $sesi->status,
                    'kegiatanTipe' => $kegiatan->tipe,
                    'rsvpStatus' => $rsvpSaya?->status, // null | 'terdaftar' | 'dibatalkan'
                    'kuota' => $kegiatan->kuota,
                    'kuotaTerpakai' => $kegiatan->tipe === 'terbuka'
                        ? $kegiatan->rsvp()->where('status', 'terdaftar')->count()
                        : null,
                ];
            });

        // Aktivitas terbaru: presensi + RSVP milik user di team ini
        $aktivitasTerbaru = Presensi::where('user_id', $user->id)
            ->whereHas('sesi.kegiatan', fn ($q) => $q->where('team_id', $team->id))
            ->with('sesi.kegiatan:id,nama')
            ->orderByDesc('waktu_isi')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'tipe' => 'presensi',
                'kegiatanNama' => $p->sesi->kegiatan->nama,
                'waktu' => $p->waktu_isi?->toIso8601String(),
            ]);

        // Artikel Terbaru
        $artikelTerbaru = Artikel::where('team_id', $team->id)
            ->with('penulis:id,name')
            ->latest()
            ->limit(5)
            ->get(['id', 'judul', 'slug', 'ringkasan', 'gambar_sampul', 'status', 'ditulis_oleh', 'diterbitkan_pada'])
            ->map(fn (Artikel $a) => [
                'id' => $a->id,
                'judul' => $a->judul,
                'slug' => $a->slug,
                'ringkasan' => $a->ringkasan,
                'gambar_sampul' => $a->gambar_sampul,
                'status' => $a->status,
                'penulis' => $a->penulis ? ['id' => $a->penulis->id, 'name' => $a->penulis->name] : null,
                'diterbitkan_pada' => $a->diterbitkan_pada?->toIso8601String(),
            ]);

        // Wishes Pending Moderasi
        $wishesPending = Wish::where('team_id', $team->id)
            ->where('status', 'pending')
            ->latest()
            ->limit(5)
            ->get(['id', 'nama_pengirim', 'pesan', 'jumlah_laporan', 'created_at']);
        // nama_tampil & waktu_relatif auto-appended by model

        // Struktur Organisasi Preview
        $strukturOrganisasi = DivisiOrganisasi::where('team_id', $team->id)
            ->withCount('pengurus as jumlah_pengurus')
            ->orderBy('urutan_tampil')
            ->limit(5)
            ->get(['id', 'nama_divisi', 'deskripsi'])
            ->map(fn (DivisiOrganisasi $d) => [
                'id' => $d->id,
                'nama_divisi' => $d->nama_divisi,
                'deskripsi' => $d->deskripsi,
                'jumlah_pengurus' => $d->jumlah_pengurus ?? 0,
            ]);

        return [
            'stats' => [
                'totalKehadiran' => $totalKehadiran,
                'rsvpAktif' => $rsvpAktif,
            ],
            'kegiatanMendatang' => $kegiatanMendatang,
            'aktivitasTerbaru' => $aktivitasTerbaru,
        ];
    }
}
