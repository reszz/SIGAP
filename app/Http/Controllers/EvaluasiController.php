<?php

namespace App\Http\Controllers;

use App\Models\Evaluasi;
use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EvaluasiController extends Controller
{
    /**
     * POST /{team}/kegiatan/{kegiatan}/evaluasi
     * Upsert: buat baru jika belum ada, update jika sudah ada.
     * Hanya Member (anggota) yang boleh — Pengurus tidak mengevaluasi kegiatannya sendiri.
     */
    public function upsert(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        // Pastikan semua sesi sudah selesai
        $semuaSelesai = $kegiatan->sesi->every(fn ($s) => $s->status === 'selesai');
        abort_if(! $semuaSelesai, 403, 'Kegiatan belum selesai.');

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'komentar' => 'nullable|string|max:1000',
        ]);

        Evaluasi::updateOrCreate(
            [
                'kegiatan_id' => $kegiatan->id,
                'user_id' => $request->user()->id,
            ],
            $validated
        );

        return redirect()->back()->with('success', 'Evaluasi berhasil disimpan.');
    }
}
