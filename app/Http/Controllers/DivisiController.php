<?php

namespace App\Http\Controllers;

use App\Enums\JabatanKepanitiaan;
use App\Models\Kegiatan;
use App\Models\Kepanitiaan;
use App\Models\Team;
use App\Models\User;
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
     *
     * Assign user ke jabatan kepanitiaan. Untuk jabatan divisi, Koordinator Divisi
     * juga boleh menambah anggota ke divisinya sendiri (manageAnggotaDivisi).
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'jabatan' => 'required|in:ketua_pelaksana,bendahara,sekretaris,div_acara,div_humas,div_pdd,div_logistik',
        ]);

        $targetUser = User::findOrFail($validated['user_id']);
        if ($targetUser->isPembina()) {
            return back()->withErrors(['user_id' => 'Pembina tidak dapat ditugaskan ke dalam kepanitiaan kegiatan.']);
        }

        $jabatan = JabatanKepanitiaan::from($validated['jabatan']);

        // Jabatan inti: hanya Pengurus / Ketua Pelaksana
        if ($jabatan->isTunggal()) {
            $this->authorize('kepanitiaan.manage', $kegiatan);
        } else {
            // Jabatan divisi: Pengurus/Ketua ATAU Koordinator divisi yang sama
            $this->authorize('kepanitiaan.manageAnggotaDivisi', [$kegiatan, $jabatan, null]);
        }

        try {
            Kepanitiaan::assign($kegiatan->id, $validated['user_id'], $jabatan);
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
     *
     * Hapus anggota dari kepanitiaan. Koordinator divisi boleh hapus anggota biasa
     * di divisinya, tapi tidak boleh hapus sesama koordinator.
     */
    public function destroy(string $currentTeam, Kepanitiaan $kepanitiaan): RedirectResponse
    {
        $kepanitiaan->load('kegiatan');

        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kepanitiaan->kegiatan->team_id !== $team->id, 403);

        if ($kepanitiaan->jabatan->isTunggal()) {
            $this->authorize('kepanitiaan.manage', $kepanitiaan->kegiatan);
        } else {
            $this->authorize('kepanitiaan.manageAnggotaDivisi', [$kepanitiaan->kegiatan, $kepanitiaan->jabatan, $kepanitiaan]);
        }

        $kepanitiaan->delete();

        return back()->with('success', 'Panitia berhasil dihapus.');
    }

    /**
     * PATCH /{team}/pengurus/divisi/{kepanitiaan}/koordinator
     *
     * Toggle status koordinator divisi. Hanya Pengurus / Ketua Pelaksana.
     * Menerapkan aturan singularitas: satu koordinator per (kegiatan, jabatan divisi).
     */
    public function toggleKoordinator(Request $request, string $currentTeam, Kepanitiaan $kepanitiaan): RedirectResponse
    {
        $kepanitiaan->load('kegiatan');
        $this->authorize('kepanitiaan.setKoordinator', $kepanitiaan->kegiatan);

        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kepanitiaan->kegiatan->team_id !== $team->id, 403);

        if ($kepanitiaan->jabatan->isTunggal()) {
            return back()->withErrors(['koordinator' => 'Jabatan inti tidak dapat dijadikan koordinator divisi.']);
        }

        try {
            $kepanitiaan->setKoordinator(! $kepanitiaan->is_koordinator);
        } catch (\RuntimeException $e) {
            return back()->withErrors(['koordinator' => $e->getMessage()]);
        }

        $label = $kepanitiaan->is_koordinator ? 'diangkat sebagai' : 'dilepas dari';

        return back()->with('success', "Anggota berhasil {$label} Koordinator Divisi.");
    }
}
