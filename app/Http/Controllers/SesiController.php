<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Sesi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SesiController extends Controller
{
    /**
     * POST /{current_team}/pengurus/kegiatan/{kegiatan}/sesi
     * Tambah sesi baru ke kegiatan yang sudah ada (multi-hari)
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
            'lokasi' => 'required|string|max:200',
        ]);

        $kegiatan->sesi()->create($validated);

        return redirect()
            ->route('pengurus.kegiatan.edit', [
                'current_team' => $currentTeam,
                'kegiatan' => $kegiatan->id,
            ])
            ->with('success', 'Sesi berhasil ditambahkan.');
    }

    /**
     * PATCH /{current_team}/pengurus/sesi/{sesi}
     * Edit data satu sesi
     */
    public function update(Request $request, string $currentTeam, Sesi $sesi): RedirectResponse
    {
        $validated = $request->validate([
            'tanggal' => 'required|date',
            'waktu_mulai' => 'required|date_format:H:i',
            'waktu_selesai' => 'required|date_format:H:i|after:waktu_mulai',
            'lokasi' => 'required|string|max:200',
        ]);

        $sesi->update($validated);

        return redirect()
            ->back()
            ->with('success', 'Sesi berhasil diperbarui.');
    }

    /**
     * DELETE /{current_team}/pengurus/sesi/{sesi}
     * Hapus satu sesi — soft delete
     */
    public function destroy(Request $request, string $currentTeam, Sesi $sesi): RedirectResponse
    {
        $sesi->delete();

        return redirect()
            ->back()
            ->with('success', 'Sesi berhasil dihapus.');
    }
}
