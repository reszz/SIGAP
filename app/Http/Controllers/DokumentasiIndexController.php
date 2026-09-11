<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DokumentasiIndexController extends Controller
{
    /**
     * GET /{team}/pengurus/dokumentasi?kegiatan_id=
     *
     * Otorisasi: dokumentasi.upload-foto (Div PDD) ATAU upload-notulen (Sekretaris)
     * ATAU keduanya (Pengurus/Ketua).
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        $semuaKegiatan = Kegiatan::where('team_id', $team->id)
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna']);

        $kegiatanList = $semuaKegiatan->filter(
            fn ($k) => Gate::forUser($user)->allows('dokumentasi.upload-foto', $k)
                || Gate::forUser($user)->allows('dokumentasi.upload-notulen', $k)
        )->values();

        $selectedKegiatanId = $request->integer('kegiatan_id') ?: $kegiatanList->first()?->id;
        $selectedKegiatan = $selectedKegiatanId
            ? $semuaKegiatan->firstWhere('id', $selectedKegiatanId)
            : null;

        $canUploadFoto = $selectedKegiatan && Gate::forUser($user)->allows('dokumentasi.upload-foto', $selectedKegiatan);
        $canUploadNotulen = $selectedKegiatan && Gate::forUser($user)->allows('dokumentasi.upload-notulen', $selectedKegiatan);

        $dokumentasi = $selectedKegiatan
            ? $selectedKegiatan->dokumentasi()->with('uploadedBy:id,name')->orderByDesc('created_at')->get()
                ->map(fn ($d) => [
                    'id' => $d->id,
                    'tipe' => $d->tipe,
                    'file_path' => $d->file_path,
                    'filename' => basename($d->file_path),
                    'uploaded_by' => $d->uploadedBy?->name ?? '-',
                    'created_at' => $d->created_at?->toDateString(),
                ])
            : collect();

        return Inertia::render('pengurus/dokumentasi/index', [
            'kegiatanList' => $kegiatanList,
            'selectedKegiatanId' => $selectedKegiatanId,
            'dokumentasi' => $dokumentasi->values(),
            'canUploadFoto' => $canUploadFoto,
            'canUploadNotulen' => $canUploadNotulen,
        ]);
    }
}
