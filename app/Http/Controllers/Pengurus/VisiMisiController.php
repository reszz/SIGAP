<?php

namespace App\Http\Controllers\Pengurus;

use App\Http\Controllers\Controller;
use App\Models\MisiPoin;
use App\Models\Periode;
use App\Models\Team;
use App\Models\VisiMisi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class VisiMisiController extends Controller
{
    /**
     * Tampilkan halaman kelola Visi & Misi di Panel Pengurus.
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        $currentPeriode = $user->currentPeriode
            ?? Periode::where('team_id', $team->id)->where('is_aktif', true)->first()
            ?? Periode::where('team_id', $team->id)->latest()->first();

        $isAktif = (bool) ($currentPeriode && $currentPeriode->is_aktif);
        $canManage = $isAktif && ($user->isSuperAdmin() || $user->isPengurus());
        $isReadOnly = ! $canManage;

        $readOnlyReason = null;
        if (! $isAktif) {
            $readOnlyReason = "Anda sedang melihat data periode '{$currentPeriode?->nama}' (Arsip). Perubahan Visi & Misi hanya dapat dilakukan pada periode yang sedang aktif.";
        } elseif ($user->isPembina()) {
            $readOnlyReason = 'Role Pembina memiliki akses baca (read-only) untuk modul Visi & Misi.';
        }

        $visiMisi = null;
        if ($currentPeriode) {
            $visiMisi = VisiMisi::with(['misiPoin' => fn ($q) => $q->orderBy('urutan')])
                ->where('periode_id', $currentPeriode->id)
                ->first();
        }

        return Inertia::render('pengurus/visi-misi/index', [
            'currentPeriode' => $currentPeriode ? [
                'id' => $currentPeriode->id,
                'nama' => $currentPeriode->nama,
                'is_aktif' => (bool) $currentPeriode->is_aktif,
                'is_latest' => $currentPeriode->isLatest(),
            ] : null,
            'visiMisi' => $visiMisi ? [
                'id' => $visiMisi->id,
                'visi' => $visiMisi->visi,
                'misi' => $visiMisi->misiPoin->map(fn ($m) => [
                    'id' => $m->id,
                    'isi' => $m->isi,
                    'urutan' => $m->urutan,
                ]),
            ] : null,
            'canManage' => $canManage,
            'isReadOnly' => $isReadOnly,
            'readOnlyReason' => $readOnlyReason,
        ]);
    }

    /**
     * Update paragraf visi organisasi pada periode aktif.
     */
    public function updateVisi(Request $request, string $currentTeam): RedirectResponse
    {
        $periode = $this->authorizeActivePeriod($request, $currentTeam);

        $validated = $request->validate([
            'visi' => ['required', 'string', 'max:1000'],
        ], [
            'visi.required' => 'Teks Visi wajib diisi.',
            'visi.max' => 'Teks Visi maksimal 1000 karakter.',
        ]);

        VisiMisi::updateOrCreate(
            ['periode_id' => $periode->id],
            ['visi' => trim($validated['visi'])]
        );

        return back()->with('success', 'Visi organisasi berhasil diperbarui.');
    }

    /**
     * Tambah poin misi baru ke periode aktif.
     */
    public function storeMisi(Request $request, string $currentTeam): RedirectResponse
    {
        $periode = $this->authorizeActivePeriod($request, $currentTeam);

        $validated = $request->validate([
            'isi' => ['required', 'string', 'max:500'],
        ], [
            'isi.required' => 'Teks poin misi wajib diisi.',
            'isi.max' => 'Teks poin misi maksimal 500 karakter.',
        ]);

        $visiMisi = VisiMisi::firstOrCreate(
            ['periode_id' => $periode->id],
            ['visi' => '']
        );

        $maxUrutan = (int) $visiMisi->misiPoin()->max('urutan');

        $visiMisi->misiPoin()->create([
            'isi' => trim($validated['isi']),
            'urutan' => $maxUrutan + 1,
        ]);

        return back()->with('success', 'Poin misi baru berhasil ditambahkan.');
    }

    /**
     * Edit teks poin misi.
     */
    public function updateMisi(Request $request, string $currentTeam, MisiPoin $misiPoin): RedirectResponse
    {
        $periode = $this->authorizeActivePeriod($request, $currentTeam);

        abort_if($misiPoin->visiMisi->periode_id !== $periode->id, 404);

        $validated = $request->validate([
            'isi' => ['required', 'string', 'max:500'],
        ], [
            'isi.required' => 'Teks poin misi wajib diisi.',
            'isi.max' => 'Teks poin misi maksimal 500 karakter.',
        ]);

        $misiPoin->update([
            'isi' => trim($validated['isi']),
        ]);

        return back()->with('success', 'Poin misi berhasil diperbarui.');
    }

    /**
     * Hapus poin misi dan urutkan kembali poin-poin yang tersisa.
     */
    public function destroyMisi(Request $request, string $currentTeam, MisiPoin $misiPoin): RedirectResponse
    {
        $periode = $this->authorizeActivePeriod($request, $currentTeam);

        abort_if($misiPoin->visiMisi->periode_id !== $periode->id, 404);

        $visiMisiId = $misiPoin->visi_misi_id;
        $misiPoin->delete();

        // Re-sequence urutan agar berurutan 1, 2, 3...
        $remaining = MisiPoin::where('visi_misi_id', $visiMisiId)
            ->orderBy('urutan')
            ->get();

        foreach ($remaining as $index => $item) {
            $item->update(['urutan' => $index + 1]);
        }

        return back()->with('success', 'Poin misi berhasil dihapus.');
    }

    /**
     * Reorder urutan poin-poin misi.
     */
    public function reorderMisi(Request $request, string $currentTeam): RedirectResponse
    {
        $periode = $this->authorizeActivePeriod($request, $currentTeam);

        $visiMisi = VisiMisi::where('periode_id', $periode->id)->firstOrFail();

        $validated = $request->validate([
            'poin_ids' => ['required', 'array', 'min:1'],
            'poin_ids.*' => ['integer', 'exists:misi_poin,id'],
        ]);

        $poinIds = $validated['poin_ids'];

        $existingCount = MisiPoin::where('visi_misi_id', $visiMisi->id)
            ->whereIn('id', $poinIds)
            ->count();

        abort_unless($existingCount === count($poinIds), 422, 'ID poin misi tidak valid.');

        foreach ($poinIds as $index => $id) {
            MisiPoin::where('id', $id)->update(['urutan' => $index + 1]);
        }

        return back()->with('success', 'Urutan poin misi berhasil diperbarui.');
    }

    /**
     * Helper otorisasi: Memastikan user memiliki hak kelola DAN periode yang dilihat adalah periode aktif.
     * Mengembalikan model Periode aktif yang valid.
     */
    protected function authorizeActivePeriod(Request $request, string $currentTeam): Periode
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $currentPeriode = $user->currentPeriode
            ?? Periode::where('team_id', $team->id)->where('is_aktif', true)->first();

        // Read-only check: Periode harus aktif (bahkan Super Admin tidak bisa ubah periode arsip)
        if (! $currentPeriode || ! $currentPeriode->is_aktif) {
            abort(403, 'Visi & Misi hanya dapat diubah pada periode yang sedang aktif (read-only).');
        }

        // Role check: Hanya Super Admin dan Pengurus yang boleh mengelola
        if (! ($user->isSuperAdmin() || $user->isPengurus())) {
            abort(403, 'Hanya Pengurus dan Super Admin yang memiliki hak akses untuk mengelola Visi & Misi.');
        }

        return $currentPeriode;
    }
}
