<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EvaluasiIndexController extends Controller
{
    /**
     * GET /{team}/evaluasi?kegiatan_id=
     *
     * Semua anggota tim dapat melihat ringkasan evaluasi kegiatan di timnya.
     * Tidak ada aksi tulis dari halaman ini.
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        $periodeId = $user->current_periode_id;
        $kegiatanQuery = Kegiatan::where('team_id', $team->id);
        if ($periodeId) {
            $kegiatanQuery->where(function ($q) use ($periodeId) {
                $q->where('periode_id', $periodeId)
                    ->orWhereNull('periode_id');
            });
        }

        $semuaKegiatan = $kegiatanQuery
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna']);

        // Semua anggota tim dapat melihat evaluasi kegiatan di tim yang sama.
        // Akses halaman ini sudah dijamin oleh middleware team membership; pengurusan
        // lebih bersifat untuk menampilkan daftar kegiatan yang relevan, bukan membatasi akses.
        $kegiatanList = $semuaKegiatan->values();

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
                    'user' => 'Anonim',
                ])
            : collect();

        $rataRating = $evaluasi->count() > 0
            ? round($evaluasi->avg('rating'), 1)
            : null;

        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = $user->isPembina() || (! $isPeriodeEditable && ! $user->isSuperAdmin());

        return Inertia::render('pengurus/evaluasi/index', [
            'kegiatanList' => $kegiatanList,
            'selectedKegiatanId' => $selectedKegiatanId,
            'evaluasi' => $evaluasi->values(),
            'rataRating' => $rataRating,
            'jumlahEvaluasi' => $evaluasi->count(),
            'isReadOnly' => $isReadOnly,
        ]);
    }
}
