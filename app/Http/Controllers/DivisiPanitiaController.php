<?php

namespace App\Http\Controllers;

use App\Models\DivisiPanitia;
use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DivisiPanitiaController extends Controller
{
    /**
     * POST /{current_team}/pengurus/kegiatan/{kegiatan}/divisi
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'nama_divisi' => 'required|string|max:100',
        ]);

        $team = Team::where('slug', $currentTeam)->firstOrFail();

        abort_if($kegiatan->team_id !== $team->id, 403);

        $kegiatan->divisiPanitia()->create([
            'nama_divisi' => $validated['nama_divisi'],
        ]);

        return redirect()
            ->back()
            ->with('success', "Divisi \"{$validated['nama_divisi']}\" berhasil ditambahkan.");
    }

    /**
     * DELETE /{current_team}/pengurus/divisi/{divisi}
     */
    public function destroy(Request $request, string $currentTeam, DivisiPanitia $divisi): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $divisi->load('kegiatan');

        abort_if($divisi->kegiatan->team_id !== $team->id, 403);

        $divisi->delete();

        return redirect()
            ->back()
            ->with('success', 'Divisi berhasil dihapus.');
    }
}
