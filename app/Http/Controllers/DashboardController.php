<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Presensi;
use App\Models\Sesi;
use App\Models\Team;
use App\Models\User;
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

        $props = $user->role === 'pengurus'
            ? $this->pengurusProps($team)
            : $this->anggotaProps($user, $team);

        return Inertia::render('dashboard', $props);
    }

    private function pengurusProps(Team $team): array
    {
        $totalKegiatan = Kegiatan::where('team_id', $team->id)->count();
        $totalAnggota = $team->members()->count();
        $totalSesiSelesai = Sesi::whereHas('kegiatan', fn($q) => $q->where('team_id', $team->id))
            ->whereDate('tanggal', '<', now())
            ->count();

        $kegiatanMendatang = Sesi::with('kegiatan')
            ->whereHas('kegiatan', fn($q) => $q->where('team_id', $team->id))
            ->whereDate('tanggal', '>=', now())
            ->whereDate('tanggal', '<=', now()->addDays(30))
            ->orderBy('tanggal')
            ->orderBy('waktu_mulai')
            ->limit(5)
            ->get()
            ->map(fn(Sesi $sesi) => [
                'id' => $sesi->id,
                'kegiatanId' => $sesi->kegiatan->id,
                'kegiatanNama' => $sesi->kegiatan->nama,
                'warna' => $sesi->kegiatan->warna,
                'tanggal' => $sesi->tanggal->format('Y-m-d'),
                'waktuMulai' => $sesi->waktu_mulai,
                'lokasi' => $sesi->lokasi,
                'status' => $sesi->status,
            ]);

        // Rekap kehadiran per Member (top 10, sorted by attendance)
        $rekapKehadiran = $team->members()
            ->orderBy('name')
            ->get(['users.id', 'users.name', 'users.nim'])
            ->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'nim' => $u->nim,
                'hadir' => Presensi::where('user_id', $u->id)
                    ->whereHas('sesi.kegiatan', fn($q) => $q->where('team_id', $team->id))
                    ->count(),
            ])
            ->sortByDesc('hadir')
            ->take(10)
            ->values();

        return [
            'stats' => [
                'totalKegiatan' => $totalKegiatan,
                'totalAnggota' => $totalAnggota,
                'totalSesiSelesai' => $totalSesiSelesai,
            ],
            'kegiatanMendatang' => $kegiatanMendatang,
            'rekapKehadiran' => $rekapKehadiran,
        ];
    }

    private function anggotaProps(User $user, Team $team): array
    {
        $totalKehadiran = Presensi::where('user_id', $user->id)
            ->whereHas('sesi.kegiatan', fn($q) => $q->where('team_id', $team->id))
            ->count();

        $rsvpAktif = $user->rsvp()
            ->whereHas('kegiatan', fn($q) => $q->where('team_id', $team->id))
            ->where('status', 'terdaftar')
            ->count();

        $kegiatanMendatang = Sesi::with([
            'kegiatan.rsvp' => fn($q) => $q->where('user_id', $user->id),
        ])
            ->whereHas('kegiatan', fn($q) => $q->where('team_id', $team->id))
            ->whereDate('tanggal', '>=', now())
            ->whereDate('tanggal', '<=', now()->addDays(30))
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
            ->whereHas('sesi.kegiatan', fn($q) => $q->where('team_id', $team->id))
            ->with('sesi.kegiatan:id,nama')
            ->orderByDesc('waktu_isi')
            ->limit(5)
            ->get()
            ->map(fn($p) => [
                'tipe' => 'presensi',
                'kegiatanNama' => $p->sesi->kegiatan->nama,
                'waktu' => $p->waktu_isi?->toIso8601String(),
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
