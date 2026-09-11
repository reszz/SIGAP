<?php

namespace App\Http\Controllers\Pengurus;

use App\Http\Controllers\Controller;
use App\Models\DivisiOrganisasi;
use App\Models\PengurusStruktur;
use App\Models\Periode;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StrukturOrganisasiController extends Controller
{
    public function index(Request $request, string $currentTeam): Response
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $periodesFromTable = Periode::where('team_id', $team->id)
            ->orderByDesc('tanggal_mulai')
            ->orderByDesc('id')
            ->pluck('nama')
            ->all();

        $periodesFromStruktur = PengurusStruktur::where('team_id', $team->id)
            ->distinct()
            ->orderByDesc('periode')
            ->pluck('periode')
            ->all();

        $periodeList = array_values(array_unique(array_merge($periodesFromTable, $periodesFromStruktur)));

        $defaultPeriode = ! empty($periodeList) ? $periodeList[0] : '2026/2027';
        $activePeriode = Periode::where('team_id', $team->id)->where('is_aktif', true)->value('nama');
        if ($activePeriode && in_array($activePeriode, $periodeList, true)) {
            $defaultPeriode = $activePeriode;
        }

        $selectedPeriode = (string) $request->query('periode', $defaultPeriode);

        $divisi = DivisiOrganisasi::where('team_id', $team->id)
            ->withCount(['pengurus' => function ($q) use ($selectedPeriode) {
                $q->where('periode', $selectedPeriode);
            }])
            ->orderBy('urutan_tampil')
            ->orderBy('id')
            ->get();

        $pengurus = PengurusStruktur::where('team_id', $team->id)
            ->where('periode', $selectedPeriode)
            ->with('divisi:id,nama_divisi')
            ->orderBy('urutan_tampil')
            ->orderBy('id')
            ->get();

        $user = $request->user();
        $currentPeriode = $user->currentPeriode;
        $isPeriodeEditable = ! $currentPeriode || $currentPeriode->is_aktif || $currentPeriode->isLatest();
        $isReadOnly = ! $isPeriodeEditable && ! $user->isSuperAdmin();
        $canManage = ! $isReadOnly && ($user->isSuperAdmin() || $user->isPengurus() || $user->isPembina());

        return Inertia::render('pengurus/struktur-organisasi/index', [
            'divisi' => $divisi,
            'pengurus' => $pengurus,
            'periodeList' => $periodeList,
            'selectedPeriode' => $selectedPeriode,
            'canManage' => $canManage,
            'isReadOnly' => $isReadOnly,
        ]);
    }

    public function storeDivisi(Request $request, string $currentTeam): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $validated = $request->validate([
            'nama_divisi' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'urutan_tampil' => ['nullable', 'integer', 'min:0'],
        ]);

        $team->divisiOrganisasi()->create([
            'nama_divisi' => $validated['nama_divisi'],
            'deskripsi' => $validated['deskripsi'] ?? null,
            'urutan_tampil' => $validated['urutan_tampil'] ?? 0,
        ]);

        return back()->with('success', 'Divisi organisasi berhasil ditambahkan.');
    }

    public function updateDivisi(Request $request, string $currentTeam, DivisiOrganisasi $divisi): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($divisi->team_id !== $team->id, 403);

        $validated = $request->validate([
            'nama_divisi' => ['required', 'string', 'max:255'],
            'deskripsi' => ['nullable', 'string', 'max:1000'],
            'urutan_tampil' => ['nullable', 'integer', 'min:0'],
        ]);

        $divisi->update($validated);

        return back()->with('success', 'Divisi organisasi berhasil diperbarui.');
    }

    public function destroyDivisi(Request $request, string $currentTeam, DivisiOrganisasi $divisi): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($divisi->team_id !== $team->id, 403);

        $divisi->delete();

        return back()->with('success', 'Divisi organisasi berhasil dihapus.');
    }

    public function storePengurus(Request $request, string $currentTeam): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jabatan' => ['required', 'string', 'max:255'],
            'divisi_organisasi_id' => ['nullable', 'exists:divisi_organisasi,id'],
            'urutan_tampil' => ['nullable', 'integer', 'min:0'],
            'periode' => ['required', 'string', 'max:50'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        // Verifikasi divisi_organisasi_id milik team ini jika diisi
        if (! empty($validated['divisi_organisasi_id'])) {
            $divisiBelongs = DivisiOrganisasi::where('id', $validated['divisi_organisasi_id'])
                ->where('team_id', $team->id)
                ->exists();
            abort_if(! $divisiBelongs, 422, 'Divisi tidak valid.');
        }

        $fotoPath = null;
        if ($request->hasFile('foto')) {
            $fotoPath = $request->file('foto')->store('pengurus', 'public');
        }

        $team->pengurusStruktur()->create([
            'nama' => $validated['nama'],
            'jabatan' => $validated['jabatan'],
            'divisi_organisasi_id' => $validated['divisi_organisasi_id'] ?? null,
            'urutan_tampil' => $validated['urutan_tampil'] ?? 0,
            'periode' => $validated['periode'],
            'foto_path' => $fotoPath,
        ]);

        return back()->with('success', 'Anggota pengurus berhasil ditambahkan ke struktur.');
    }

    public function updatePengurus(Request $request, string $currentTeam, PengurusStruktur $pengurus): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($pengurus->team_id !== $team->id, 403);

        $validated = $request->validate([
            'nama' => ['required', 'string', 'max:255'],
            'jabatan' => ['required', 'string', 'max:255'],
            'divisi_organisasi_id' => ['nullable', 'exists:divisi_organisasi,id'],
            'urutan_tampil' => ['nullable', 'integer', 'min:0'],
            'periode' => ['required', 'string', 'max:50'],
            'foto' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if (! empty($validated['divisi_organisasi_id'])) {
            $divisiBelongs = DivisiOrganisasi::where('id', $validated['divisi_organisasi_id'])
                ->where('team_id', $team->id)
                ->exists();
            abort_if(! $divisiBelongs, 422, 'Divisi tidak valid.');
        }

        $data = [
            'nama' => $validated['nama'],
            'jabatan' => $validated['jabatan'],
            'divisi_organisasi_id' => $validated['divisi_organisasi_id'] ?? null,
            'urutan_tampil' => $validated['urutan_tampil'] ?? 0,
            'periode' => $validated['periode'],
        ];

        if ($request->hasFile('foto')) {
            if ($pengurus->foto_path && Storage::disk('public')->exists($pengurus->foto_path)) {
                Storage::disk('public')->delete($pengurus->foto_path);
            }
            $data['foto_path'] = $request->file('foto')->store('pengurus', 'public');
        }

        $pengurus->update($data);

        return back()->with('success', 'Data pengurus struktur berhasil diperbarui.');
    }

    public function destroyPengurus(Request $request, string $currentTeam, PengurusStruktur $pengurus): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        abort_if($pengurus->team_id !== $team->id, 403);

        if ($pengurus->foto_path && Storage::disk('public')->exists($pengurus->foto_path)) {
            Storage::disk('public')->delete($pengurus->foto_path);
        }

        $pengurus->delete();

        return back()->with('success', 'Data pengurus berhasil dihapus dari struktur.');
    }
}
