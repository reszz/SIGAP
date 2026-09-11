<?php

namespace App\Http\Controllers;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DivisiController extends Controller
{
    /**
     * GET /{team}/pengurus/kegiatan/{kegiatan}/divisi
     */
    public function index(Request $request, string $currentTeam, Kegiatan $kegiatan): Response
    {
        $this->authorize('kepanitiaan.manage', $kegiatan);

        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        return Inertia::render('pengurus/panitia/index', [
            'kegiatan' => $kegiatan,
            'kepanitiaan' => $kegiatan->kepanitiaan()->with('user')->get(),
            'anggotaTeam' => $team->members()->get(['users.id', 'users.name']),
        ]);
    }

    /**
     * POST /{team}/pengurus/kegiatan/{kegiatan}/divisi
     * Assign user ke jabatan kepanitiaan. Pakai Kepanitiaan::assign() agar
     * constraint jabatan tunggal divalidasi oleh model (FR-28, NFR-03).
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $this->authorize('kepanitiaan.manage', $kegiatan);

        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'jabatan' => 'required|in:ketua_pelaksana,bendahara,sekretaris,div_acara,div_humas,div_pdd,div_logistik',
        ]);

        // Kepanitiaan::assign() menangani validasi jabatan tunggal (FR-28)
        try {
            Kepanitiaan::assign(
                $kegiatan->id,
                $validated['user_id'],
                JabatanKepanitiaan::from($validated['jabatan'])
            );
        } catch (\RuntimeException $e) {
            return back()->withErrors(['jabatan' => $e->getMessage()]);
        }

        return back()->with('success', 'Panitia berhasil ditambahkan.');
    }

    /**
     * PATCH /{team}/pengurus/divisi/{kepanitiaan}
     * Update user_id pada jabatan yang sudah ada (ganti orangnya, jabatan tetap).
     */
    public function update(Request $request, string $currentTeam, Kepanitiaan $kepanitiaan): RedirectResponse
    {
        $kepanitiaan->load('kegiatan');
        $this->authorize('kepanitiaan.manage', $kepanitiaan->kegiatan);

        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kepanitiaan->kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $kepanitiaan->update($validated);

        return back()->with('success', 'Panitia berhasil diperbarui.');
    }

    /**
     * DELETE /{team}/pengurus/divisi/{kepanitiaan}
     */
    public function destroy(string $currentTeam, Kepanitiaan $kepanitiaan): RedirectResponse
    {
        $kepanitiaan->load('kegiatan');
        $this->authorize('kepanitiaan.manage', $kepanitiaan->kegiatan);

        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kepanitiaan->kegiatan->team_id !== $team->id, 403);

        $kepanitiaan->delete();

        return back()->with('success', 'Panitia berhasil dihapus.');
    }
}
