<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Presensi;
use App\Models\Sesi;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        $props = $user->isPengurus()
            ? $this->pengurusProps()
            : $this->anggotaProps($user);

        return Inertia::render('dashboard', $props);
    }

    /**
     * Props untuk halaman dashboard Pengurus.
     */
    private function pengurusProps(): array
    {
        $totalKegiatan = Kegiatan::count();
        $totalAnggota = User::where('role', 'anggota')->count();
        $totalSesiSelesai = Sesi::whereDate('tanggal', '<', now())->count();

        // Sesi yang akan datang (terjadwal) dalam 30 hari ke depan
        $kegiatanMendatang = Sesi::with('kegiatan')
            ->whereDate('tanggal', '>=', now())
            ->whereDate('tanggal', '<=', now()->addDays(30))
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
            ]);

        return [
            'stats' => [
                'totalKegiatan' => $totalKegiatan,
                'totalAnggota' => $totalAnggota,
                'totalSesiSelesai' => $totalSesiSelesai,
            ],
            'kegiatanMendatang' => $kegiatanMendatang,
        ];
    }

    /**
     * Props untuk halaman dashboard Anggota.
     */
    private function anggotaProps(User $user): array
    {
        $totalKehadiranSaya = Presensi::where('user_id', $user->id)->count();

        $rsvpAktifSaya = $user->rsvp()
            ->where('status', 'terdaftar')
            ->count();

        // Sesi mendatang yang relevan untuk anggota (kegiatan wajib hadir + yang sudah RSVP)
        $rsvpKegiatanIds = $user->rsvp()
            ->where('status', 'terdaftar')
            ->pluck('kegiatan_id');

        $kegiatanMendatang = Sesi::with('kegiatan')
            ->whereDate('tanggal', '>=', now())
            ->whereDate('tanggal', '<=', now()->addDays(30))
            ->where(fn ($q) => $q
                ->whereHas('kegiatan', fn ($k) => $k->where('tipe', 'wajib_hadir'))
                ->orWhereHas('kegiatan', fn ($k) => $k->whereIn('id', $rsvpKegiatanIds))
            )
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
            ]);

        return [
            'stats' => [
                'totalKehadiran' => $totalKehadiranSaya,
                'rsvpAktif' => $rsvpAktifSaya,
            ],
            'kegiatanMendatang' => $kegiatanMendatang,
        ];
    }
}
