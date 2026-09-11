<?php

namespace App\Http\Controllers;

use App\Models\Sesi;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class PublicCalendarController extends Controller
{
    /**
     * Halaman kalender publik — tanpa auth, hanya membaca Sesi dari Team utama.
     *
     * Data yang dikembalikan ke frontend HANYA:
     * tanggal, nama_kegiatan, waktu_mulai, waktu_selesai, lokasi, warna, deskripsi (≤100 char).
     * TIDAK ada: rundown, panitia, anggaran, rsvp, evaluasi, dokumentasi, surat.
     */
    public function __invoke(Request $request): Response
    {
        // Tentukan bulan & tahun dari query param, default ke bulan saat ini
        $tahun = (int) $request->query('tahun', now()->year);
        $bulan = (int) $request->query('bulan', now()->month);

        // Clamp agar bulan valid (1–12)
        $bulan = max(1, min(12, $bulan));
        $tahun = max(2000, min(2100, $tahun));

        $start = Carbon::create($tahun, $bulan, 1)->startOfMonth()->toDateString();
        $end = Carbon::create($tahun, $bulan, 1)->endOfMonth()->toDateString();

        // Team utama = team non-personal dengan ID terkecil
        $team = Team::where('is_personal', false)->orderBy('id')->first();

        $sesi = collect();
        if ($team) {
            $sesi = Sesi::select(['id', 'kegiatan_id', 'tanggal', 'waktu_mulai', 'waktu_selesai', 'lokasi'])
                ->with(['kegiatan:id,nama,warna,deskripsi'])
                ->whereHas('kegiatan', fn ($q) => $q->where('team_id', $team->id)->whereNull('deleted_at'))
                ->whereBetween('tanggal', [$start, $end])
                ->whereNull('deleted_at')
                ->orderBy('tanggal')
                ->orderBy('waktu_mulai')
                ->get()
                ->map(fn (Sesi $s): array => [
                    'tanggal' => $s->tanggal->toDateString(),
                    'nama_kegiatan' => $s->kegiatan->nama,
                    'waktu_mulai' => substr($s->waktu_mulai, 0, 5),   // "HH:MM"
                    'waktu_selesai' => substr($s->waktu_selesai, 0, 5), // "HH:MM"
                    'lokasi' => $s->lokasi,
                    'warna' => $s->kegiatan->warna ?? '#4A5FD1',
                    'deskripsi' => $s->kegiatan->deskripsi
                        ? mb_substr($s->kegiatan->deskripsi, 0, 100)
                        : null,
                ]);
        }

        // Hitung selectedDate default: Sesi mendatang terdekat (tanggal >= hari ini) di bulan ini
        $today = now()->toDateString();
        $nearestUpcoming = $sesi
            ->filter(fn ($item) => $item['tanggal'] >= $today)
            ->first();

        $defaultDate = $nearestUpcoming ? $nearestUpcoming['tanggal'] : null;

        return Inertia::render('kalender-publik/index', [
            'sesi' => $sesi->values(),
            'bulan' => $bulan,
            'tahun' => $tahun,
            'defaultDate' => $defaultDate,
        ]);
    }
}
