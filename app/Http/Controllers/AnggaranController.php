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
     *
     * Bendahara: akses penuh (semua jenis & kategori).
     * Div Logistik: hanya boleh input pengeluaran — kategori bebas teks, tapi
     * hanya boleh akses endpoint ini via 'anggaran.manage-logistik'.
     * Per SRS §3.8/steering: pembatasan kategori logistik tidak di-enforce di level
     * Policy (Gate tidak bisa baca request body) — divalidasi manual di sini.
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        // Cek apakah user punya akses anggaran di level yang sesuai
        $isFull = $request->user()->can('anggaran.manage', $kegiatan);
        $isLogistik = ! $isFull && $request->user()->can('anggaran.manage-logistik', $kegiatan);

        abort_unless($isFull || $isLogistik, 403, 'Akses ditolak: tidak ada jabatan yang sesuai untuk kelola Anggaran.');

        $validated = $request->validate([
            'jenis' => 'required|in:pemasukan,pengeluaran',
            'sumber_kategori' => 'required|string|max:100',
            'estimasi' => 'required|numeric|min:0',
        ]);

        // Div Logistik hanya boleh pengeluaran (SRS §3.8 FR-36, steering pattern)
        if ($isLogistik && $validated['jenis'] !== 'pengeluaran') {
            abort(403, 'Divisi Logistik hanya dapat menambahkan baris pengeluaran.');
        }

        $kegiatan->anggaran()->create($validated);

        return redirect()->back()->with('success', 'Baris anggaran berhasil ditambahkan.');
    }

    /**
     * PATCH /{team}/pengurus/anggaran/{anggaran}
     */
    public function update(Request $request, string $currentTeam, Anggaran $anggaran): RedirectResponse
    {
        $anggaran->load('kegiatan');
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($anggaran->kegiatan->team_id !== $team->id, 403);

        $isFull = $request->user()->can('anggaran.manage', $anggaran->kegiatan);
        $isLogistik = ! $isFull && $request->user()->can('anggaran.manage-logistik', $anggaran->kegiatan);

        abort_unless($isFull || $isLogistik, 403, 'Akses ditolak.');

        $validated = $request->validate([
            'jenis' => 'sometimes|in:pemasukan,pengeluaran',
            'sumber_kategori' => 'sometimes|string|max:100',
            'estimasi' => 'sometimes|numeric|min:0',
            'realisasi' => 'nullable|numeric|min:0',
        ]);

        // Div Logistik tidak boleh mengubah jenis ke pemasukan
        if ($isLogistik && isset($validated['jenis']) && $validated['jenis'] !== 'pengeluaran') {
            abort(403, 'Divisi Logistik hanya dapat mengelola baris pengeluaran.');
        }

        $anggaran->update($validated);

        return redirect()->back()->with('success', 'Anggaran berhasil diperbarui.');
    }

    /**
     * DELETE /{team}/pengurus/anggaran/{anggaran}
     */
    public function destroy(Request $request, string $currentTeam, Anggaran $anggaran): RedirectResponse
    {
        $anggaran->load('kegiatan');
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($anggaran->kegiatan->team_id !== $team->id, 403);

        // Hanya yang punya akses penuh (bukan Logistik) yang boleh hapus
        $this->authorize('anggaran.manage', $anggaran->kegiatan);

        $anggaran->delete();

        return redirect()->back()->with('success', 'Baris anggaran berhasil dihapus.');
    }
}
