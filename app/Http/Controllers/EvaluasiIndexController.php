<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Team;
use App\Services\KegiatanAuthService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EvaluasiIndexController extends Controller
{
    /**
     * GET /{team}/pengurus/evaluasi?kegiatan_id=
     *
     * Hanya Pengurus dan Ketua Pelaksana yang boleh lihat ringkasan evaluasi.
     * Tidak ada aksi tulis dari halaman ini.
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        $semuaKegiatan = Kegiatan::where('team_id', $team->id)
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna']);

        // Hanya Pengurus atau Ketua Pelaksana per Kegiatan yang muncul di list
        $kegiatanList = $semuaKegiatan->filter(
            fn ($k) => KegiatanAuthService::isPengurusAtauKetua($user, $k->id)
        )->values();

        $selectedKegiatanId = $request->integer('kegiatan_id') ?: $kegiatanList->first()?->id;
        $selectedKegiatan = $selectedKegiatanId
            ? $semuaKegiatan->firstWhere('id', $selectedKegiatanId)
            : null;

        $evaluasi = $selectedKegiatan
            ? $selectedKegiatan->evaluasi()->with('user:id,name')->orderByDesc('created_at')->get()
                ->map(fn ($e) => [
                    'id' => $e->id,
                    'rating' => $e->rating,
                    'komentar' => $e->komentar,
                    'user' => $e->user?->name ?? '[Anggota dihapus]',
                ])
            : collect();

        $rataRating = $evaluasi->count() > 0
            ? round($evaluasi->avg('rating'), 1)
            : null;

        return Inertia::render('pengurus/evaluasi/index', [
            'kegiatanList' => $kegiatanList,
            'selectedKegiatanId' => $selectedKegiatanId,
            'evaluasi' => $evaluasi->values(),
            'rataRating' => $rataRating,
            'jumlahEvaluasi' => $evaluasi->count(),
        ]);
    }
}
