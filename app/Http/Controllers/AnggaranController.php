<?php

namespace App\Http\Controllers;

use App\Models\Anggaran;
use App\Models\Kegiatan;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class AnggaranController extends Controller
{
    /**
     * POST /{team}/pengurus/kegiatan/{kegiatan}/anggaran
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'jenis' => 'required|in:pemasukan,pengeluaran',
            'sumber_kategori' => 'required|string|max:100',
            'estimasi' => 'required|numeric|min:0',
        ]);

        $kegiatan->anggaran()->create($validated);

        return redirect()->back()->with('success', 'Baris anggaran berhasil ditambahkan.');
    }

    /**
     * PATCH /{team}/pengurus/anggaran/{anggaran}
     * Update estimasi dan/atau realisasi.
     */
    public function update(Request $request, string $currentTeam, Anggaran $anggaran): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($anggaran->kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'jenis' => 'sometimes|in:pemasukan,pengeluaran',
            'sumber_kategori' => 'sometimes|string|max:100',
            'estimasi' => 'sometimes|numeric|min:0',
            'realisasi' => 'nullable|numeric|min:0',
        ]);

        $anggaran->update($validated);

        return redirect()->back()->with('success', 'Anggaran berhasil diperbarui.');
    }

    /**
     * DELETE /{team}/pengurus/anggaran/{anggaran}
     */
    public function destroy(Request $request, string $currentTeam, Anggaran $anggaran): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($anggaran->kegiatan->team_id !== $team->id, 403);

        $anggaran->delete();

        return redirect()->back()->with('success', 'Baris anggaran berhasil dihapus.');
    }
}
