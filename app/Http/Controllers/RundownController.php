<?php

namespace App\Http\Controllers;

use App\Models\Sesi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class RundownController extends Controller
{
    /**
     * PUT /{current_team}/pengurus/sesi/{sesi}/rundown
     * Replace seluruh rundown satu sesi sekaligus (upsert pattern)
     *
     * @param  array{waktu: string, uraian_acara: string, urutan: int}[]  $rundown
     */
    public function upsert(Request $request, string $currentTeam, Sesi $sesi): RedirectResponse
    {
        $validated = $request->validate([
            'rundown' => 'required|array',
            'rundown.*.waktu' => 'required|date_format:H:i',
            'rundown.*.uraian_acara' => 'required|string|max:255',
            'rundown.*.urutan' => 'required|integer|min:1',
        ]);

        // Delete semua rundown lama dulu, lalu insert baru (replace semantics)
        $sesi->rundown()->delete();

        foreach ($validated['rundown'] as $item) {
            $sesi->rundown()->create($item);
        }

        return redirect()
            ->back()
            ->with('success', 'Rundown berhasil disimpan.');
    }
}
