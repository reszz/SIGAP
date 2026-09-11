<?php

namespace App\Http\Controllers;

use App\Models\DivisiOrganisasi;
use App\Models\PengurusStruktur;
use App\Models\Periode;
use App\Models\Team;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PublicStrukturController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $team = Team::where('is_personal', false)->orderBy('id')->first();

        if (! $team) {
            return Inertia::render('keorganisasian/struktur', [
                'periodeList' => [],
                'selectedPeriode' => '2026/2027',
                'pengurusInti' => [],
                'divisiList' => [],
            ]);
        }

        // Ambil semua periode yang terdaftar di database dan struktur organisasi
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

        // Pengurus Inti (tanpa divisi)
        $pengurusInti = PengurusStruktur::where('team_id', $team->id)
            ->where('periode', $selectedPeriode)
            ->whereNull('divisi_organisasi_id')
            ->orderBy('urutan_tampil')
            ->orderBy('id')
            ->get();

        // Divisi beserta pengurusnya di periode tersebut
        $divisiList = DivisiOrganisasi::where('team_id', $team->id)
            ->with(['pengurus' => function ($q) use ($selectedPeriode) {
                $q->where('periode', $selectedPeriode)
                    ->orderBy('urutan_tampil')
                    ->orderBy('id');
            }])
            ->orderBy('urutan_tampil')
            ->orderBy('id')
            ->get();

        return Inertia::render('keorganisasian/struktur', [
            'periodeList' => $periodeList,
            'selectedPeriode' => $selectedPeriode,
            'pengurusInti' => $pengurusInti,
            'divisiList' => $divisiList,
        ]);
    }
}
