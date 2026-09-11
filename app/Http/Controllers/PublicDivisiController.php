<?php

namespace App\Http\Controllers;

use App\Models\DivisiOrganisasi;
use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicDivisiController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $team = Team::where('is_personal', false)->orderBy('id')->first();

        $divisi = collect();
        if ($team) {
            $divisi = DivisiOrganisasi::where('team_id', $team->id)
                ->withCount('pengurus')
                ->orderBy('urutan_tampil')
                ->orderBy('id')
                ->get();
        }

        return Inertia::render('keorganisasian/divisi', [
            'divisi' => $divisi,
        ]);
    }
}
