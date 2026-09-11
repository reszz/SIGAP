<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RundownIndexController extends Controller
{
    /**
     * GET /{team}/pengurus/rundown?kegiatan_id=&sesi_id=
     *
     * Selector: Kegiatan → Sesi → form kelola Rundown.
     * Otorisasi: RundownPolicy::manage (Pengurus, Ketua, Div Acara).
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        // Kegiatan yang user punya akses rundown.manage
        $semuaKegiatan = Kegiatan::where('team_id', $team->id)
            ->with('sesi:id,kegiatan_id,tanggal,waktu_mulai,waktu_selesai,lokasi')
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna']);

        $kegiatanList = $semuaKegiatan->filter(
            fn ($k) => Gate::forUser($user)->allows('rundown.manage', $k)
        )->values();

        $selectedKegiatanId = $request->integer('kegiatan_id') ?: $kegiatanList->first()?->id;
        $selectedKegiatan = $selectedKegiatanId
            ? $semuaKegiatan->firstWhere('id', $selectedKegiatanId)
            : null;

        $selectedSesiId = $request->integer('sesi_id')
            ?: $selectedKegiatan?->sesi->first()?->id;

        // Load rundown untuk sesi yang dipilih
        $rundownItems = collect();
        if ($selectedSesiId && $selectedKegiatan) {
            $sesi = $selectedKegiatan->sesi->firstWhere('id', $selectedSesiId);
            if ($sesi) {
                $sesi->load('rundown');
                $rundownItems = $sesi->rundown->sortBy('urutan')->map(fn ($r) => [
                    'id' => $r->id,
                    'waktu' => substr($r->waktu, 0, 5), // Format HH:mm (strip seconds)
                    'uraian_acara' => $r->uraian_acara,
                    'urutan' => $r->urutan,
                ])->values();
            }
        }

        return Inertia::render('pengurus/rundown/index', [
            'kegiatanList' => $kegiatanList->map(fn ($k) => [
                'id' => $k->id,
                'nama' => $k->nama,
                'warna' => $k->warna,
                'sesi' => $k->sesi->map(fn ($s) => [
                    'id' => $s->id,
                    'tanggal' => $s->tanggal?->format('Y-m-d'),
                    'waktu_mulai' => date('H:i', strtotime($s->waktu_mulai)),
                    'waktu_selesai' => date('H:i', strtotime($s->waktu_selesai)),
                    'lokasi' => $s->lokasi,
                ])->values(),
            ]),
            'selectedKegiatanId' => $selectedKegiatanId,
            'selectedSesiId' => $selectedSesiId,
            'rundown' => $rundownItems,
        ]);
    }
}
