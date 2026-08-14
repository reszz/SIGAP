<?php

namespace App\Http\Controllers;

use App\Models\DivisiPanitia;
use App\Models\Kegiatan;
use App\Models\Team;
use App\Models\TugasPanitia;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TugasPanitiaController extends Controller
{
    /**
     * POST /{current_team}/pengurus/kegiatan/{kegiatan}/divisi/{divisi}/tugas
     */
    public function store(
        Request $request,
        string $currentTeam,
        Kegiatan $kegiatan,
        DivisiPanitia $divisi,
    ): RedirectResponse {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $divisi->load('kegiatan');

        abort_if($divisi->kegiatan->team_id !== $team->id, 403);
        abort_if($divisi->kegiatan_id !== $kegiatan->id, 403);

        $validated = $request->validate([
            'user_id' => [
                'required',
                'integer',
                Rule::exists('team_members', 'user_id')->where('team_id', $team->id),
            ],
            'deskripsi_tugas' => ['required', 'string', 'max:255'],
        ]);

        TugasPanitia::create([
            'divisi_id' => $divisi->id,
            'user_id' => $validated['user_id'],
            'deskripsi_tugas' => $validated['deskripsi_tugas'],
            'status' => 'belum',
        ]);

        return redirect()
            ->back()
            ->with('success', 'Tugas berhasil di-assign.');
    }

    /**
     * DELETE /{current_team}/pengurus/tugas/{tugas}
     */
    public function destroy(
        Request $request,
        string $currentTeam,
        TugasPanitia $tugas,
    ): RedirectResponse {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $tugas->load('divisiPanitia.kegiatan');

        abort_if(
            ! $tugas->divisiPanitia ||
            ! $tugas->divisiPanitia->kegiatan ||
            $tugas->divisiPanitia->kegiatan->team_id !== $team->id,
            403,
        );

        $tugas->delete();

        return redirect()
            ->back()
            ->with('success', 'Tugas berhasil dihapus.');
    }

    /**
     * PATCH /{current_team}/tugas/{tugas}/status
     * Hanya pemilik tugas (user_id === auth user) yang boleh.
     */
    public function updateStatus(
        Request $request,
        string $currentTeam,
        TugasPanitia $tugas,
    ): RedirectResponse {
        abort_if($tugas->user_id !== $request->user()->id, 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['belum', 'sedang', 'selesai'])],
        ]);

        $tugas->update(['status' => $validated['status']]);

        return redirect()
            ->back()
            ->with('success', 'Status tugas berhasil diperbarui.');
    }
}
