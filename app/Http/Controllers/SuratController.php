<?php

namespace App\Http\Controllers;

use App\Models\Kegiatan;
use App\Models\Surat;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class SuratController extends Controller
{
    /**
     * GET /{team}/surat
     *
     * Tampilkan halaman surat dengan selector kegiatan.
     * Hanya kegiatan yang user punya akses surat.manage ATAU surat.manage-keluar
     * yang ditampilkan di selector.
     */
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        // Ambil semua kegiatan team, filter mana yang user punya akses
        $semuaKegiatan = Kegiatan::where('team_id', $team->id)
            ->orderByDesc('created_at')
            ->get(['id', 'nama', 'warna']);

        $kegiatanList = $semuaKegiatan->filter(
            fn ($k) => Gate::forUser($user)->allows('surat.manage', $k)
                || Gate::forUser($user)->allows('surat.manage-keluar', $k)
        )->values();

        // Tentukan kegiatan yang dipilih (dari query param atau pertama)
        $selectedKegiatanId = $request->integer('kegiatan_id') ?: $kegiatanList->first()?->id;
        $selectedKegiatan = $selectedKegiatanId
            ? $semuaKegiatan->firstWhere('id', $selectedKegiatanId)
            : null;

        // Flag otorisasi per tipe — menentukan apa yang ditampilkan di UI
        $canManageMasuk = $selectedKegiatan && Gate::forUser($user)->allows('surat.manage', $selectedKegiatan);
        $canManageKeluar = $selectedKegiatan && Gate::forUser($user)->allows('surat.manage-keluar', $selectedKegiatan);

        // Daftar surat untuk kegiatan yang dipilih
        $filterTipe = $request->input('tipe'); // 'masuk', 'keluar', atau null (semua)
        $surat = $selectedKegiatan
            ? Surat::where('kegiatan_id', $selectedKegiatan->id)
                ->when($filterTipe, fn ($q) => $q->where('tipe', $filterTipe))
                ->with('pembuat:id,name')
                ->orderByDesc('tanggal_surat')
                ->get()
            : collect();

        return Inertia::render('surat/index', [
            'kegiatanList' => $kegiatanList,
            'selectedKegiatanId' => $selectedKegiatanId,
            'surat' => $surat->map(fn (Surat $s) => [
                'id' => $s->id,
                'tipe' => $s->tipe,
                'nomor_surat' => $s->nomor_surat,
                'jenis_surat' => $s->jenis_surat,
                'perihal' => $s->perihal,
                'tanggal_surat' => $s->tanggal_surat?->format('Y-m-d'),
                'pengirim_penerima' => $s->pengirim_penerima,
                'keterangan' => $s->keterangan,
                'has_file' => ! is_null($s->file_path),
                'file_url' => $s->file_path
                    ? route('surat.download', [$currentTeam, $s->id])
                    : null,
                'dibuat_oleh' => $s->pembuat?->name,
            ]),
            'filterTipe' => $filterTipe,
            'canManageMasuk' => $canManageMasuk,
            'canManageKeluar' => $canManageKeluar,
        ]);
    }

    /**
     * POST /{team}/surat/{kegiatan}
     */
    public function store(Request $request, string $currentTeam, Kegiatan $kegiatan): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'tipe' => 'required|in:masuk,keluar',
            'nomor_surat' => 'required|string|max:100',
            'jenis_surat' => 'required|string|max:100',
            'perihal' => 'required|string|max:255',
            'tanggal_surat' => 'required|date',
            'pengirim_penerima' => 'required|string|max:255',
            'keterangan' => 'nullable|string|max:2000',
            'file' => 'nullable|file|mimes:pdf,doc,docx,odt|max:20480',
        ]);

        // Authorize berdasar tipe — paling kritis: Div Humas hanya boleh keluar
        if ($validated['tipe'] === 'masuk') {
            Gate::authorize('surat.manage', $kegiatan);
        } else {
            Gate::authorize('surat.manage-keluar', $kegiatan);
        }

        $filePath = null;
        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            $filePath = $request->file('file')->store(
                "surat/{$team->id}/{$kegiatan->id}",
                'local'
            );
        }

        $kegiatan->surat()->create([
            'tipe' => $validated['tipe'],
            'nomor_surat' => $validated['nomor_surat'],
            'jenis_surat' => $validated['jenis_surat'],
            'perihal' => $validated['perihal'],
            'tanggal_surat' => $validated['tanggal_surat'],
            'pengirim_penerima' => $validated['pengirim_penerima'],
            'keterangan' => $validated['keterangan'] ?? null,
            'file_path' => $filePath,
            'dibuat_oleh' => $request->user()->id,
        ]);

        return redirect()->back()->with('success', 'Surat berhasil disimpan.');
    }

    /**
     * PATCH /{team}/surat/{surat}
     */
    public function update(Request $request, string $currentTeam, Surat $surat): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $surat->load('kegiatan');
        abort_if($surat->kegiatan->team_id !== $team->id, 403);

        $validated = $request->validate([
            'tipe' => 'sometimes|in:masuk,keluar',
            'nomor_surat' => 'sometimes|string|max:100',
            'jenis_surat' => 'sometimes|string|max:100',
            'perihal' => 'sometimes|string|max:255',
            'tanggal_surat' => 'sometimes|date',
            'pengirim_penerima' => 'sometimes|string|max:255',
            'keterangan' => 'nullable|string|max:2000',
            'file' => 'nullable|file|mimes:pdf,doc,docx,odt|max:20480',
        ]);

        // Authorize berdasar tipe baru (atau tipe lama kalau tidak diubah)
        $tipeBaru = $validated['tipe'] ?? $surat->tipe;
        if ($tipeBaru === 'masuk') {
            Gate::authorize('surat.manage', $surat->kegiatan);
        } else {
            Gate::authorize('surat.manage-keluar', $surat->kegiatan);
        }

        if ($request->hasFile('file') && $request->file('file')->isValid()) {
            // Hapus file lama kalau ada
            if ($surat->file_path) {
                Storage::disk('local')->delete($surat->file_path);
            }
            $validated['file_path'] = $request->file('file')->store(
                "surat/{$team->id}/{$surat->kegiatan_id}",
                'local'
            );
        }

        unset($validated['file']);
        $surat->update($validated);

        return redirect()->back()->with('success', 'Surat berhasil diperbarui.');
    }

    /**
     * DELETE /{team}/surat/{surat}
     */
    public function destroy(Request $request, string $currentTeam, Surat $surat): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $surat->load('kegiatan');
        abort_if($surat->kegiatan->team_id !== $team->id, 403);

        // Authorize berdasar tipe surat yang akan dihapus
        if ($surat->tipe === 'masuk') {
            Gate::authorize('surat.manage', $surat->kegiatan);
        } else {
            Gate::authorize('surat.manage-keluar', $surat->kegiatan);
        }

        if ($surat->file_path) {
            Storage::disk('local')->delete($surat->file_path);
        }

        $surat->delete();

        return redirect()->back()->with('success', 'Surat berhasil dihapus.');
    }

    /**
     * GET /{team}/surat/{surat}/file
     * Serve file surat terproteksi — hanya member team yang sama.
     */
    public function download(Request $request, string $currentTeam, Surat $surat): BinaryFileResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $surat->load('kegiatan');

        abort_if($surat->kegiatan->team_id !== $team->id, 403);
        abort_if(! $request->user()->belongsToTeam($team), 403);
        abort_if(! $surat->file_path, 404);
        abort_if(! Storage::disk('local')->exists($surat->file_path), 404);

        return response()->file(
            Storage::disk('local')->path($surat->file_path),
            ['Content-Disposition' => 'inline']
        );
    }
}
