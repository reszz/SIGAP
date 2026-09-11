<?php

namespace App\Http\Controllers;

use App\Models\Periode;
use App\Models\Team;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class PeriodeController extends Controller
{
    /**
     * Store a newly created periode in storage.
     */
    public function store(Request $request, string $currentTeam): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        Gate::authorize('periode.create');

        $validated = $request->validate([
            'nama' => 'required|string|max:100',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'required|date|after_or_equal:tanggal_mulai',
            'is_aktif' => 'nullable|boolean',
        ]);

        $isAktif = (bool) ($validated['is_aktif'] ?? false);

        if ($isAktif) {
            // Nonaktifkan periode aktif lain pada tim ini
            Periode::where('team_id', $team->id)->update(['is_aktif' => false]);
        }

        $periode = Periode::create([
            'team_id' => $team->id,
            'nama' => $validated['nama'],
            'tanggal_mulai' => $validated['tanggal_mulai'],
            'tanggal_selesai' => $validated['tanggal_selesai'],
            'is_aktif' => $isAktif,
            'created_by' => $user->id,
        ]);

        // Jika tim belum punya periode aktif atau periode ini diset aktif, arahkan user ke periode ini
        if ($isAktif || ! $user->current_periode_id) {
            $user->switchPeriode($periode);
        }

        return back()->with('success', "Periode {$periode->nama} berhasil dibuat.");
    }

    /**
     * Switch user active viewing period.
     */
    public function switch(Request $request, string $currentTeam, Periode $periode): RedirectResponse
    {
        $team = Team::where('slug', $currentTeam)->firstOrFail();
        $user = $request->user();

        abort_if($periode->team_id !== $team->id, 404, 'Periode tidak ditemukan pada tim ini.');

        $user->switchPeriode($periode);

        return back()->with('success', "Beralih ke periode {$periode->nama}.");
    }
}
