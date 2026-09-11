<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AnggaranIndexController extends Controller
{
    /**
     * GET /{team}/pengurus/anggaran?kegiatan_id=
     *
     * Otorisasi: anggaran.manage (Bendahara/Pengurus/Ketua) ATAU anggaran.manage-logistik (Div Logistik).
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        $semuaKegiatan = Kegiatan::where('team_id', $team->id)
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna']);

        $kegiatanList = $semuaKegiatan->filter(
            fn ($k) => Gate::forUser($user)->allows('anggaran.manage', $k)
                || Gate::forUser($user)->allows('anggaran.manage-logistik', $k)
        )->values();

        $selectedKegiatanId = $request->integer('kegiatan_id') ?: $kegiatanList->first()?->id;
        $selectedKegiatan = $selectedKegiatanId
            ? $semuaKegiatan->firstWhere('id', $selectedKegiatanId)
            : null;

        $canManageFull = $selectedKegiatan && Gate::forUser($user)->allows('anggaran.manage', $selectedKegiatan);
        $canManageLogistik = ! $canManageFull && $selectedKegiatan && Gate::forUser($user)->allows('anggaran.manage-logistik', $selectedKegiatan);

        $anggaran = $selectedKegiatan
            ? $selectedKegiatan->anggaran()->orderBy('jenis')->orderByDesc('created_at')->get()
                ->map(fn ($a) => [
                    'id' => $a->id,
                    'jenis' => $a->jenis,
                    'sumber_kategori' => $a->sumber_kategori,
                    'estimasi' => $a->estimasi,
                    'realisasi' => $a->realisasi,
                    'selisih' => ($a->realisasi ?? 0) - $a->estimasi,
                ])
            : collect();

        return Inertia::render('pengurus/anggaran/index', [
            'kegiatanList' => $kegiatanList,
            'selectedKegiatanId' => $selectedKegiatanId,
            'anggaran' => $anggaran->values(),
            'canManageFull' => $canManageFull,
            'canManageLogistik' => $canManageLogistik,
        ]);
    }
}
